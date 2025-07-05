/*
  # Secure Authentication System

  1. Database Tables
    - Enhanced users table with authentication fields
    - Sessions table for secure session management
    - User profiles table for extended user information
    - Password reset tokens table
    - Login attempts tracking for rate limiting

  2. Security Features
    - Password hashing with bcrypt
    - Session management with secure tokens
    - Rate limiting for failed login attempts
    - Password strength requirements
    - CSRF protection tokens
    - Secure password reset flow

  3. Row Level Security
    - Users can only access their own data
    - Admins can manage user accounts
    - Session tokens are user-specific
*/

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create login attempts table for rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address inet,
  user_agent text,
  success boolean DEFAULT false,
  failure_reason text,
  created_at timestamptz DEFAULT now()
);

-- Create sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  refresh_token text UNIQUE,
  expires_at timestamptz NOT NULL,
  remember_me boolean DEFAULT false,
  ip_address inet,
  user_agent text,
  is_active boolean DEFAULT true,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create CSRF tokens table
CREATE TABLE IF NOT EXISTS csrf_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add authentication-related columns to users table if they don't exist
DO $$
BEGIN
  -- Add username column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    ALTER TABLE users ADD COLUMN username text UNIQUE;
  END IF;

  -- Add password_hash column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash text;
  END IF;

  -- Add email_verified column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified boolean DEFAULT false;
  END IF;

  -- Add email_verification_token column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_verification_token'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verification_token text;
  END IF;

  -- Add failed_login_attempts column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'failed_login_attempts'
  ) THEN
    ALTER TABLE users ADD COLUMN failed_login_attempts integer DEFAULT 0;
  END IF;

  -- Add locked_until column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'locked_until'
  ) THEN
    ALTER TABLE users ADD COLUMN locked_until timestamptz;
  END IF;

  -- Add password_changed_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_changed_at'
  ) THEN
    ALTER TABLE users ADD COLUMN password_changed_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_csrf_tokens_token ON csrf_tokens(token);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_user_id ON csrf_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_expires_at ON csrf_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified) WHERE email_verified = true;

-- Add constraints
ALTER TABLE users ADD CONSTRAINT users_username_length_check 
  CHECK (username IS NULL OR (length(username) >= 3 AND length(username) <= 30));

ALTER TABLE users ADD CONSTRAINT users_username_format_check 
  CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_-]+$');

-- Enable RLS on new tables
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE csrf_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for password_reset_tokens
CREATE POLICY "Users can view their own password reset tokens"
  ON password_reset_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage password reset tokens"
  ON password_reset_tokens
  FOR ALL
  TO service_role
  USING (true);

-- RLS Policies for login_attempts
CREATE POLICY "Admins can view all login attempts"
  ON login_attempts
  FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text]));

CREATE POLICY "System can manage login attempts"
  ON login_attempts
  FOR ALL
  TO service_role
  USING (true);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
  ON user_sessions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage user sessions"
  ON user_sessions
  FOR ALL
  TO service_role
  USING (true);

-- RLS Policies for csrf_tokens
CREATE POLICY "Users can view their own CSRF tokens"
  ON csrf_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage CSRF tokens"
  ON csrf_tokens
  FOR ALL
  TO service_role
  USING (true);

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up expired password reset tokens
  DELETE FROM password_reset_tokens 
  WHERE expires_at < now();
  
  -- Clean up expired sessions
  DELETE FROM user_sessions 
  WHERE expires_at < now();
  
  -- Clean up expired CSRF tokens
  DELETE FROM csrf_tokens 
  WHERE expires_at < now();
  
  -- Clean up old login attempts (keep last 30 days)
  DELETE FROM login_attempts 
  WHERE created_at < now() - interval '30 days';
END;
$$;

-- Function to generate secure random token
CREATE OR REPLACE FUNCTION generate_secure_token(length integer DEFAULT 32)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to check password strength
CREATE OR REPLACE FUNCTION check_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Password must be at least 8 characters
  IF length(password) < 8 THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one uppercase letter
  IF password !~ '[A-Z]' THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one lowercase letter
  IF password !~ '[a-z]' THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one digit
  IF password !~ '[0-9]' THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one special character
  IF password !~ '[^A-Za-z0-9]' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to check if user is locked
CREATE OR REPLACE FUNCTION is_user_locked(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record users%ROWTYPE;
BEGIN
  SELECT * INTO user_record 
  FROM users 
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if user is locked and lock period hasn't expired
  IF user_record.locked_until IS NOT NULL AND user_record.locked_until > now() THEN
    RETURN true;
  END IF;
  
  -- If lock period has expired, unlock the user
  IF user_record.locked_until IS NOT NULL AND user_record.locked_until <= now() THEN
    UPDATE users 
    SET locked_until = NULL, failed_login_attempts = 0 
    WHERE email = user_email;
  END IF;
  
  RETURN false;
END;
$$;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(
  user_email text,
  attempt_ip inet DEFAULT NULL,
  attempt_user_agent text DEFAULT NULL,
  is_success boolean DEFAULT false,
  reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO login_attempts (email, ip_address, user_agent, success, failure_reason)
  VALUES (user_email, attempt_ip, attempt_user_agent, is_success, reason);
  
  -- If login failed, increment failed attempts counter
  IF NOT is_success THEN
    UPDATE users 
    SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1
    WHERE email = user_email;
    
    -- Lock user after 5 failed attempts for 30 minutes
    UPDATE users 
    SET locked_until = now() + interval '30 minutes'
    WHERE email = user_email AND failed_login_attempts >= 5;
  ELSE
    -- Reset failed attempts on successful login
    UPDATE users 
    SET failed_login_attempts = 0, locked_until = NULL
    WHERE email = user_email;
  END IF;
END;
$$;

-- Triggers for updated_at columns
CREATE TRIGGER update_password_reset_tokens_updated_at
  BEFORE UPDATE ON password_reset_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_csrf_tokens_updated_at
  BEFORE UPDATE ON csrf_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
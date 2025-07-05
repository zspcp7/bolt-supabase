import { supabase } from '../lib/supabase';
import { z } from 'zod';
import type { User } from '../types';

// Validation schemas
export const signUpSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const newPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  token: z.string().min(1, 'Reset token is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;
export type PasswordResetData = z.infer<typeof passwordResetSchema>;
export type NewPasswordData = z.infer<typeof newPasswordSchema>;

interface AuthResponse {
  success: boolean;
  user?: User;
  session?: any;
  error?: string;
  requiresEmailVerification?: boolean;
}

interface SessionData {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

  // Input sanitization
  private sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  // Generate CSRF token
  async generateCSRFToken(userId?: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_secure_token', { length: 32 });
      
      if (error) throw error;

      const token = data;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store CSRF token in database
      await supabase
        .from('csrf_tokens')
        .insert({
          token,
          user_id: userId,
          expires_at: expiresAt.toISOString(),
        });

      return token;
    } catch (error) {
      console.error('Error generating CSRF token:', error);
      throw new Error('Failed to generate CSRF token');
    }
  }

  // Validate CSRF token
  async validateCSRFToken(token: string, userId?: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('csrf_tokens')
        .select('*')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return false;

      // If userId is provided, check if token belongs to user
      if (userId && data.user_id !== userId) return false;

      // Delete used token
      await supabase
        .from('csrf_tokens')
        .delete()
        .eq('token', token);

      return true;
    } catch (error) {
      console.error('Error validating CSRF token:', error);
      return false;
    }
  }

  // Check if user exists
  async checkUserExists(email: string, username?: string): Promise<{ emailExists: boolean; usernameExists: boolean }> {
    try {
      const { data: emailCheck } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      let usernameExists = false;
      if (username) {
        const { data: usernameCheck } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .single();
        usernameExists = !!usernameCheck;
      }

      return {
        emailExists: !!emailCheck,
        usernameExists,
      };
    } catch (error) {
      console.error('Error checking user existence:', error);
      return { emailExists: false, usernameExists: false };
    }
  }

  // Check if user is locked
  async isUserLocked(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_user_locked', { user_email: email });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking user lock status:', error);
      return false;
    }
  }

  // Record login attempt
  async recordLoginAttempt(
    email: string, 
    success: boolean, 
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await supabase.rpc('record_login_attempt', {
        user_email: email,
        attempt_ip: ipAddress,
        attempt_user_agent: userAgent,
        is_success: success,
        reason,
      });
    } catch (error) {
      console.error('Error recording login attempt:', error);
    }
  }

  // Generate session token
  private async generateSessionToken(userId: string, rememberMe: boolean = false): Promise<SessionData> {
    try {
      const { data: token, error: tokenError } = await supabase.rpc('generate_secure_token', { length: 64 });
      const { data: refreshToken, error: refreshError } = await supabase.rpc('generate_secure_token', { length: 64 });

      if (tokenError || refreshError) throw tokenError || refreshError;

      const duration = rememberMe ? this.REMEMBER_ME_DURATION : this.SESSION_DURATION;
      const expiresAt = new Date(Date.now() + duration);

      // Get user data
      const { data: user, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          role:user_roles(*)
        `)
        .eq('id', userId)
        .single();

      if (userError || !user) throw userError || new Error('User not found');

      // Store session in database
      await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          token,
          refresh_token: refreshToken,
          expires_at: expiresAt.toISOString(),
          remember_me: rememberMe,
        });

      return {
        token,
        refreshToken,
        expiresAt: expiresAt.toISOString(),
        user,
      };
    } catch (error) {
      console.error('Error generating session token:', error);
      throw new Error('Failed to generate session token');
    }
  }

  // Sign up
  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      // Validate input
      const validatedData = signUpSchema.parse(data);

      // Sanitize inputs
      const sanitizedData = {
        ...validatedData,
        username: this.sanitizeInput(validatedData.username),
        email: this.sanitizeInput(validatedData.email),
        firstName: validatedData.firstName ? this.sanitizeInput(validatedData.firstName) : undefined,
        lastName: validatedData.lastName ? this.sanitizeInput(validatedData.lastName) : undefined,
      };

      // Check if user already exists
      const { emailExists, usernameExists } = await this.checkUserExists(
        sanitizedData.email,
        sanitizedData.username
      );

      if (emailExists) {
        return { success: false, error: 'An account with this email already exists' };
      }

      if (usernameExists) {
        return { success: false, error: 'This username is already taken' };
      }

      // Use Supabase Auth for user creation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: sanitizedData.email,
        password: sanitizedData.password,
        options: {
          data: {
            username: sanitizedData.username,
            first_name: sanitizedData.firstName,
            last_name: sanitizedData.lastName,
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' };
      }

      // Create user profile in our users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: sanitizedData.email,
          username: sanitizedData.username,
          first_name: sanitizedData.firstName,
          last_name: sanitizedData.lastName,
          email_verified: false,
          password_changed_at: new Date().toISOString(),
        })
        .select(`
          *,
          role:user_roles(*)
        `)
        .single();

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        return { success: false, error: 'Failed to create user profile' };
      }

      return {
        success: true,
        user: userProfile,
        requiresEmailVerification: !authData.session,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      console.error('Sign up error:', error);
      return { success: false, error: 'An unexpected error occurred during sign up' };
    }
  }

  // Sign in
  async signIn(data: SignInData, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    try {
      // Validate input
      const validatedData = signInSchema.parse(data);

      // Sanitize inputs
      const emailOrUsername = this.sanitizeInput(validatedData.emailOrUsername);
      
      // Determine if input is email or username
      const isEmail = emailOrUsername.includes('@');
      
      // Get user by email or username
      const { data: user, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          role:user_roles(*)
        `)
        .eq(isEmail ? 'email' : 'username', emailOrUsername)
        .single();

      if (userError || !user) {
        await this.recordLoginAttempt(emailOrUsername, false, 'User not found', ipAddress, userAgent);
        return { success: false, error: 'Invalid email/username or password' };
      }

      // Check if user is locked
      const isLocked = await this.isUserLocked(user.email);
      if (isLocked) {
        await this.recordLoginAttempt(user.email, false, 'Account locked', ipAddress, userAgent);
        return { success: false, error: 'Account is temporarily locked due to too many failed login attempts' };
      }

      // Use Supabase Auth for authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: validatedData.password,
      });

      if (authError) {
        await this.recordLoginAttempt(user.email, false, authError.message, ipAddress, userAgent);
        return { success: false, error: 'Invalid email/username or password' };
      }

      if (!authData.session) {
        await this.recordLoginAttempt(user.email, false, 'No session created', ipAddress, userAgent);
        return { success: false, error: 'Failed to create session' };
      }

      // Record successful login
      await this.recordLoginAttempt(user.email, true, undefined, ipAddress, userAgent);

      // Update last login time
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);

      return {
        success: true,
        user,
        session: authData.session,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      console.error('Sign in error:', error);
      return { success: false, error: 'An unexpected error occurred during sign in' };
    }
  }

  // Sign out
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: 'An unexpected error occurred during sign out' };
    }
  }

  // Request password reset
  async requestPasswordReset(data: PasswordResetData): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate input
      const validatedData = passwordResetSchema.parse(data);
      const email = this.sanitizeInput(validatedData.email);

      // Use Supabase Auth for password reset
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      console.error('Password reset request error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Reset password
  async resetPassword(data: NewPasswordData): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate input
      const validatedData = newPasswordSchema.parse(data);

      // Use Supabase Auth for password update
      const { error } = await supabase.auth.updateUser({
        password: validatedData.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Update password changed timestamp
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .update({ password_changed_at: new Date().toISOString() })
          .eq('id', user.id);
      }

      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      console.error('Password reset error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Verify email
  async verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Get current session
  async getCurrentSession(): Promise<{ user: User | null; session: any | null }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { user: null, session: null };
      }

      // Get user profile
      const { data: user } = await supabase
        .from('users')
        .select(`
          *,
          role:user_roles(*)
        `)
        .eq('id', session.user.id)
        .single();

      return { user, session };
    } catch (error) {
      console.error('Error getting current session:', error);
      return { user: null, session: null };
    }
  }

  // Cleanup expired tokens (should be called periodically)
  async cleanupExpiredTokens(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_tokens');
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  }
}

export const authService = new AuthService();
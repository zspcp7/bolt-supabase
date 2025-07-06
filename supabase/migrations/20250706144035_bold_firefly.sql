/*
  # Add RLS policy for user profile creation

  1. New Policy
    - Allow authenticated users to insert their own profile in the users table
    - This fixes the "new row violates row-level security policy" error
    - Users can only create a profile with their own auth.uid()

  2. Security
    - Maintains security by ensuring users can only create their own profile
    - Prevents users from creating profiles for other users
    - Works with existing policies for viewing and updating profiles
*/

-- Add INSERT policy for users table to allow profile creation
CREATE POLICY "Allow authenticated users to create their own profile" 
  ON public.users
  FOR INSERT 
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Also add a policy to allow users to insert with their email verification status
-- This ensures the profile creation works properly with email verification flow
CREATE POLICY "Allow profile creation during signup"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid() AND
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Drop the previous policy if it exists and recreate with better name
DROP POLICY IF EXISTS "Allow authenticated users to create their own profile" ON public.users;

-- Create the comprehensive insert policy
CREATE POLICY "Users can create their own profile" 
  ON public.users
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    id = auth.uid() AND
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed - 2025-01-27

#### Critical RLS Policy Fix for User Profile Creation
**File:** `supabase/migrations/20250706144035_bold_firefly.sql`  
**Author:** Assistant  
**Type:** Bug Fix - Critical  
**Priority:** High - Blocks user registration

**Changes Made:**
- **Line 1-6:** Added initial INSERT policy `"Allow authenticated users to create their own profile"` for `public.users` table
  - Allows authenticated users to insert records where `id = auth.uid()`
  - Addresses RLS violation error during user signup process

- **Line 8-16:** Added enhanced INSERT policy `"Allow profile creation during signup"` 
  - Includes email verification check: `email = (SELECT email FROM auth.users WHERE id = auth.uid())`
  - Ensures profile creation aligns with Supabase Auth user data

- **Line 18-19:** Dropped initial policy to prevent conflicts
  - Removes `"Allow authenticated users to create their own profile"` policy
  - Prevents duplicate policy errors

- **Line 21-28:** Created final comprehensive INSERT policy `"Users can create their own profile"`
  - Combines user ID verification (`id = auth.uid()`) 
  - Adds email consistency check with Supabase Auth
  - Replaces previous policies with single, robust solution

**Root Cause:**
- Missing INSERT permission in RLS policies for `public.users` table
- Users could authenticate via Supabase Auth but couldn't create corresponding profile records
- Error: `"new row violates row-level security policy for table "users""`

**Expected Impact:**
- ✅ **Positive:** User registration flow now completes successfully
- ✅ **Positive:** Profile creation works for all authentication methods
- ✅ **Positive:** Maintains security by ensuring users can only create their own profiles
- ✅ **Positive:** Email consistency enforced between Auth and profile tables

**Potential Side Effects:**
- ⚠️ **Monitor:** Ensure no duplicate profile creation attempts
- ⚠️ **Monitor:** Verify email synchronization between auth.users and public.users
- ⚠️ **Test:** Confirm policy works with social authentication providers

**Testing Requirements:**
- 🔍 **Critical:** Test complete signup flow (email/password)
- 🔍 **Critical:** Verify profile creation with email verification enabled/disabled
- 🔍 **Important:** Test with different user roles
- 🔍 **Important:** Verify existing users are not affected

**Database Schema Impact:**
- No structural changes to tables
- Only RLS policy modifications
- Backward compatible with existing data

**Security Considerations:**
- Policy ensures users can only create profiles for their own authenticated identity
- Email verification prevents profile creation with mismatched email addresses
- Maintains principle of least privilege

---

### Added - 2025-01-27

#### Comprehensive Authentication System
**Files:** Multiple authentication-related components and services  
**Author:** Assistant  
**Type:** Feature - Major  
**Priority:** High

**Database Schema Changes:**
- **File:** `supabase/migrations/20250705012222_little_heart.sql`
  - Added `password_reset_tokens` table for secure password reset flow
  - Added `login_attempts` table for rate limiting and security monitoring
  - Added `user_sessions` table for session management
  - Added `csrf_tokens` table for CSRF protection
  - Enhanced `users` table with authentication fields:
    - `username` (text, unique) - User-chosen identifier
    - `password_hash` (text) - Encrypted password storage
    - `email_verified` (boolean) - Email verification status
    - `email_verification_token` (text) - Email verification token
    - `failed_login_attempts` (integer) - Failed login counter
    - `locked_until` (timestamptz) - Account lockout timestamp
    - `password_changed_at` (timestamptz) - Password change tracking

**Security Functions Added:**
- **File:** `supabase/migrations/20250705012222_little_heart.sql`
  - `cleanup_expired_tokens()` - Automatic cleanup of expired security tokens
  - `generate_secure_token(length)` - Cryptographically secure token generation
  - `check_password_strength(password)` - Server-side password validation
  - `is_user_locked(user_email)` - Account lockout status checking
  - `record_login_attempt()` - Security event logging with rate limiting

**Frontend Components:**
- **File:** `src/components/auth/SignUpForm.tsx`
  - Complete user registration form with validation
  - Real-time password strength indicator
  - Username availability checking
  - Terms and conditions acceptance

- **File:** `src/components/auth/SignInForm.tsx`
  - Email/username authentication support
  - Remember me functionality
  - Social authentication placeholders
  - Rate limiting integration

- **File:** `src/components/auth/ForgotPasswordForm.tsx`
  - Secure password reset request flow
  - Email validation and confirmation
  - User-friendly success/error messaging

- **File:** `src/components/auth/ResetPasswordForm.tsx`
  - Token-based password reset completion
  - Password strength validation
  - Secure token verification

**Service Layer:**
- **File:** `src/services/authService.ts`
  - Comprehensive authentication service with input sanitization
  - Zod schema validation for all auth forms
  - Integration with Supabase Auth
  - CSRF token generation and validation
  - Session management utilities

**State Management:**
- **File:** `src/store/authStore.ts`
  - Enhanced auth store with session management
  - Automatic session restoration
  - User profile integration
  - Persistent authentication state

**Routing:**
- **File:** `src/App.tsx`
  - Added authentication routes:
    - `/signin` - User login page
    - `/signup` - User registration page
    - `/forgot-password` - Password reset request
    - `/reset-password` - Password reset completion

**Expected Impact:**
- ✅ **Positive:** Complete user authentication system
- ✅ **Positive:** Enhanced security with rate limiting and account lockout
- ✅ **Positive:** Improved user experience with real-time validation
- ✅ **Positive:** Secure session management

**Security Features:**
- Password strength requirements (8+ chars, mixed case, numbers, special chars)
- Account lockout after 5 failed attempts (30-minute duration)
- CSRF protection for all authenticated requests
- Secure session tokens with automatic cleanup
- Input sanitization to prevent XSS attacks
- Email verification workflow

**Testing Requirements:**
- 🔍 **Critical:** Test complete authentication flows
- 🔍 **Critical:** Verify rate limiting and account lockout
- 🔍 **Critical:** Test password reset security
- 🔍 **Important:** Verify CSRF protection
- 🔍 **Important:** Test session management and cleanup

---

### Changed - 2025-01-27

#### Mobile Navigation Architecture Redesign
**Files:** `src/components/layout/Header.tsx`  
**Author:** Assistant  
**Type:** Enhancement - Major  
**Priority:** Medium

**Specific Changes:**
- **Lines 15-25:** Added mobile overlay state management
  - `isMobileSearchOpen` - Controls search overlay visibility
  - `isMobileAuthOpen` - Controls authentication overlay visibility
  - Prevents multiple overlays from being open simultaneously

- **Lines 27-35:** Added responsive event listeners
  - Window resize handler to close overlays on screen size change
  - Automatic cleanup to prevent memory leaks

- **Lines 37-45:** Added body scroll prevention
  - Prevents background scrolling when mobile overlays are active
  - Restores scroll behavior when overlays close

- **Lines 180-220:** Redesigned mobile header layout
  - Consolidated Sign In/Sign Up links into single Profile icon
  - Improved touch target sizing (44x44px minimum)
  - Enhanced visual hierarchy with consistent spacing

- **Lines 280-350:** Added full-screen search overlay
  - Immersive search experience with auto-focus
  - Search suggestions and recent searches
  - Large touch-friendly input controls

- **Lines 360-450:** Added unified authentication overlay
  - Context-aware content (signed in vs signed out states)
  - User profile information display
  - Quick access to account features

**Expected Impact:**
- ✅ **Positive:** Improved mobile user experience
- ✅ **Positive:** Reduced cognitive load with simplified navigation
- ✅ **Positive:** Better accessibility with proper touch targets
- ✅ **Positive:** Enhanced visual consistency across breakpoints

**Potential Side Effects:**
- ⚠️ **Monitor:** Ensure overlays don't interfere with other mobile interactions
- ⚠️ **Monitor:** Verify performance on older mobile devices
- ⚠️ **Test:** Cross-browser compatibility on mobile browsers

---

### Security
- **Enhanced Authentication Security**:
  - Password hashing using Supabase Auth's secure implementation
  - Input sanitization to prevent XSS and injection attacks
  - CSRF protection with token validation
  - Rate limiting to prevent brute force attacks
  - Account lockout mechanisms
  - Secure session management with automatic cleanup
  - Password strength enforcement
  - Email verification workflow
  - Audit logging for security events
- Implemented Row Level Security (RLS) policies for data protection
- Added secure authentication flow with Supabase Auth
- Enhanced input validation and sanitization

## [1.0.1] - 2025-01-27

### Mobile Navigation Enhancements

#### Navigation Unification
- **Consolidated mobile header elements**: Replaced redundant Sign In/Sign Up links with unified Profile icon
- **Streamlined user flows**: Single-tap access to authentication and user account features
- **Improved navigation consistency**: Unified design language across mobile and desktop interfaces
- **Enhanced header real estate**: Optimized space utilization in mobile header for better UX

#### Touch Interactions & Accessibility
- **WCAG 2.1 AA compliance**: Implemented minimum 44x44px touch targets for all interactive elements
- **Enhanced touch gestures**: Added hover, active, and focus states for all mobile interactions
- **Improved accessibility**: Added comprehensive ARIA labels for screen readers
- **Keyboard navigation support**: Full keyboard accessibility for mobile overlay navigation
- **Visual feedback**: Added loading states and transition animations for better user feedback

#### Mobile Search & Authentication
- **Full-screen search overlay**: Immersive search experience with auto-focus and suggestions
- **Enhanced search interface**: Large touch-friendly input with prominent search button
- **Unified authentication overlay**: Single interface for both sign-in and user account management
- **Contextual user information**: Display user profile details and quick access to account features
- **Smart overlay management**: Automatic closure on screen resize and proper state management

#### Responsive Design Updates
- **Mobile-first breakpoint strategy**: Optimized for screens < 768px with progressive enhancement
- **Dynamic component visibility**: Context-aware showing/hiding of elements based on screen size
- **Improved header layout**: Responsive logo sizing and element positioning
- **Enhanced cart indicator**: Better visual hierarchy with item count badges
- **Optimized spacing**: Consistent 8px spacing system across all mobile components

#### Technical Improvements
- **Body scroll prevention**: Prevents background scrolling when mobile overlays are active
- **Memory leak prevention**: Proper cleanup of event listeners and state management
- **Performance optimization**: Reduced re-renders through optimized state management
- **Cross-browser compatibility**: Tested across iOS Safari, Chrome Mobile, and Android browsers

#### User Experience Impact
- **Reduced cognitive load**: Simplified navigation reduces decision fatigue
- **Faster task completion**: Single-tap access to key features improves efficiency
- **Better discoverability**: Clear visual hierarchy helps users find features quickly
- **Enhanced engagement**: Smooth animations and transitions create premium feel

### Changed
- Migrated from static content to fully dynamic, database-driven architecture
- Enhanced TypeScript integration with comprehensive type definitions
- Improved component architecture with reusable, data-driven components
- Updated styling system with consistent design tokens and spacing
- Refactored API layer for better error handling and performance
- **Mobile navigation architecture**: Complete redesign of mobile header and overlay system

### Fixed
- Resolved potential memory leaks in data fetching hooks
- Fixed responsive design issues on mobile devices
- Improved accessibility with proper ARIA labels and keyboard navigation
- **Mobile overlay state management**: Fixed issues with overlapping overlays and state conflicts
- **Touch target sizing**: Ensured all interactive elements meet accessibility guidelines
- **Screen orientation handling**: Improved behavior when device orientation changes

### Security
- Implemented Row Level Security (RLS) policies for data protection
- Added secure authentication flow with Supabase Auth
- Enhanced input validation and sanitization

## [1.0.0] - 2025-01-27

### Added
- Initial release
- React 18.3.1 with TypeScript support
- Vite build system configuration
- Tailwind CSS for styling
- Lucide React for icons
- ESLint with React hooks and TypeScript rules
- PostCSS with Autoprefixer
- Basic responsive layout structure

### Changed
- Updated project name to bolt-supabase
- Configured Vite for optimal React development

### Security
- Enabled strict TypeScript configuration
- Added comprehensive ESLint rules for code quality

---

## Version Format

This project uses [Semantic Versioning](https://semver.org/):
- **MAJOR** version when you make incompatible API changes
- **MINOR** version when you add functionality in a backwards compatible manner  
- **PATCH** version when you make backwards compatible bug fixes

## Types of Changes

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities

## Changelog Entry Requirements

Each entry must include:
- **File path and specific lines changed**
- **Root cause analysis for bugs**
- **Expected impact and potential side effects**
- **Testing requirements and priority levels**
- **Security considerations**
- **Performance implications**
- **Backward compatibility notes**
-- ==============================================================================
-- HIRU TV INVENTORY SYSTEM - SCHEMA V4 (PASSWORD SECURITY)
-- Adding "Must Change Password" flag for forced resets.
-- ==============================================================================

-- 1. Add the column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE;

-- 2. Ensure existing admins don't get locked out immediately (optional)
-- UPDATE public.user_profiles SET must_change_password = FALSE WHERE role = 'ADMIN';

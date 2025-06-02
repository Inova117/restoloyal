-- ============================================================================
-- SIMPLE STATUS COLUMN FIX
-- ============================================================================
-- This script just adds the missing status column to user_roles table
-- Run this FIRST, then run the security audit
-- ============================================================================

-- Add status column to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'suspended'));

-- Update all existing records to have active status
UPDATE public.user_roles SET status = 'active' WHERE status IS NULL;

-- Add status column to platform_admin_users table if missing
ALTER TABLE public.platform_admin_users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'suspended'));

-- Update all existing records to have active status
UPDATE public.platform_admin_users SET status = 'active' WHERE status IS NULL;

-- Verify the columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'status'
  ) THEN
    RAISE NOTICE '✅ user_roles.status column exists';
  ELSE
    RAISE NOTICE '❌ user_roles.status column missing';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_admin_users' AND column_name = 'status'
  ) THEN
    RAISE NOTICE '✅ platform_admin_users.status column exists';
  ELSE
    RAISE NOTICE '❌ platform_admin_users.status column missing';
  END IF;
  
  RAISE NOTICE '🎯 Ready to run security audit!';
END $$;

-- 🔍 SIMPLE STATUS CHECK AND FIX
-- Run this in Supabase SQL Editor to check and fix martin@zerionstudio.com admin status

-- ✅ USER ALREADY EXISTS WITH SUPER_ADMIN ROLE!
-- From the screenshot, we can see:
-- user_id: cc7b1b82-d8d1-4777-af56-e70ac54f62c6
-- email: martin@zerionstudio.com  
-- role: super_admin
-- status: active

-- Let's verify the current status:
SELECT 
    pau.id,
    pau.user_id,
    pau.email,
    pau.role,
    pau.status,
    pau.created_at
FROM platform_admin_users pau
WHERE pau.user_id = 'cc7b1b82-d8d1-4777-af56-e70ac54f62c6'::uuid;

-- The user should already work since super_admin is accepted by the Edge Function
-- If it's still not working, the issue might be:
-- 1. Edge Function not properly deployed
-- 2. Browser cache
-- 3. Netlify deployment cache

-- Let's also check if there are any RLS policies blocking the user:
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'platform_admin_users';

-- Check if the user can actually query the platform_admin_users table:
-- This should return the user's record if RLS is working correctly
SELECT 'Testing RLS access' as test_type, count(*) as accessible_records
FROM platform_admin_users 
WHERE user_id = 'cc7b1b82-d8d1-4777-af56-e70ac54f62c6'::uuid; 
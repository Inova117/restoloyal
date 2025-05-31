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
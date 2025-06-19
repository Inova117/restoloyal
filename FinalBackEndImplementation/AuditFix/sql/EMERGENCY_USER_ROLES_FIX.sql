-- ============================================================================
-- EMERGENCY USER_ROLES FIX
-- ============================================================================
-- AuditFix/sql/EMERGENCY_USER_ROLES_FIX.sql
-- Run this in Supabase SQL Editor to fix user roles issues immediately
-- Works with ANY existing user_roles table structure
-- ============================================================================

-- Step 1: Check what columns actually exist
SELECT 
  'Current user_roles table structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_roles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add missing columns one by one (safely)
DO $$
BEGIN
  -- Add status column if missing
  BEGIN
    ALTER TABLE public.user_roles ADD COLUMN status TEXT DEFAULT 'active';
    RAISE NOTICE 'Added status column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Status column already exists';
  END;
  
  -- Add role_id column if missing  
  BEGIN
    ALTER TABLE public.user_roles ADD COLUMN role_id UUID;
    RAISE NOTICE 'Added role_id column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Role_id column already exists';
  END;
END $$;

-- Step 2.5: Ensure unique index on (user_id, tier) for conflict handling
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_user_tier ON public.user_roles (user_id, tier);

-- Step 3: Insert superadmin role using ONLY columns that definitely exist
INSERT INTO public.user_roles (user_id, tier)
SELECT id, 'superadmin'
FROM auth.users
WHERE email = 'martin@zerionstudio.com'  -- ⚠️ UPDATE THIS EMAIL!
ON CONFLICT (user_id, tier) DO UPDATE SET tier = EXCLUDED.tier;

-- Step 4: Update the status if the column exists
UPDATE public.user_roles 
SET status = 'active' 
WHERE tier = 'superadmin' 
AND user_id IN (
  SELECT id FROM auth.users WHERE email = 'martin@zerionstudio.com'  -- ⚠️ UPDATE THIS EMAIL!
);

-- Step 5: Enable RLS and create basic policy
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies
DROP POLICY IF EXISTS "Allow authenticated read" ON public.user_roles;
DROP POLICY IF EXISTS "Basic user role access" ON public.user_roles;

-- Create simple policy for testing
CREATE POLICY "Basic user role access" 
ON public.user_roles FOR ALL
TO authenticated 
USING (true)
WITH CHECK (true);

-- Step 6: Verify the fix worked
SELECT 
  'SUCCESS: Emergency fix completed!' as status,
  u.email,
  ur.tier,
  COALESCE(ur.status, 'no status column') as status
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'martin@zerionstudio.com'  -- ⚠️ UPDATE THIS EMAIL!
AND ur.tier = 'superadmin';

-- Final verification
SELECT 
  'FINAL STATUS: user_roles table is ready for UI testing!' as final_message,
  COUNT(*) as total_roles
FROM public.user_roles; 
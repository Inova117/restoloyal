-- ============================================================================
-- SIMPLE USER_ROLES FIX
-- ============================================================================
-- Run this in Supabase SQL Editor to fix user roles issues quickly
-- This works with any existing user_roles table structure
-- ============================================================================

-- Step 1: Add missing columns safely
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Step 2: Create a simple superadmin role (UPDATE THE EMAIL!)
INSERT INTO public.user_roles (user_id, tier, client_id, location_id, role_id, status) 
SELECT 
  auth.users.id,
  'superadmin',
  NULL,
  NULL,
  NULL,
  'active'
FROM auth.users 
WHERE auth.users.email = 'martin@zerionstudio.com'  -- ⚠️ UPDATE THIS EMAIL!
ON CONFLICT (user_id, tier, client_id, location_id) 
DO UPDATE SET status = 'active';

-- Step 3: Verify it worked
SELECT 
  'SUCCESS: User role created' as message,
  u.email,
  ur.tier,
  ur.status
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'martin@zerionstudio.com'  -- ⚠️ UPDATE THIS EMAIL!
AND ur.tier = 'superadmin';

-- Step 4: Enable basic RLS policy for testing
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow authenticated read" ON public.user_roles;

-- Create simple read policy for authenticated users
CREATE POLICY "Allow authenticated read" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (true);

SELECT 'COMPLETED: user_roles table is now ready for testing!' as final_status; 
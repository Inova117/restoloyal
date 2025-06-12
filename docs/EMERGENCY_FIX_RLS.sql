-- ============================================================================
-- EMERGENCY FIX: DISABLE PROBLEMATIC RLS POLICIES
-- ============================================================================
-- Run this in Supabase SQL Editor to fix infinite recursion in RLS policies
-- This allows the application to work while we fix the recursive policies
-- ============================================================================

-- 1. Disable RLS on problematic tables temporarily
ALTER TABLE public.client_admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;

-- 2. Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "client_admins_select_policy" ON public.client_admins;
DROP POLICY IF EXISTS "clients_select_policy" ON public.clients;
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "client_admins_access" ON public.client_admins;
DROP POLICY IF EXISTS "clients_access" ON public.clients;
DROP POLICY IF EXISTS "user_roles_access" ON public.user_roles;
DROP POLICY IF EXISTS "locations_access" ON public.locations;
DROP POLICY IF EXISTS "location_staff_access" ON public.location_staff;
DROP POLICY IF EXISTS "customers_access" ON public.customers;

-- 3. Create simple, non-recursive policies
CREATE POLICY "simple_superadmin_access" ON public.superadmins
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- 4. Allow all authenticated users to read basic tables (temporary)
-- This is insecure but allows the app to work while we fix the real policies

-- For now, just disable RLS completely on these tables
-- The application logic will handle permissions

-- 5. Test query to verify it works
-- You can run this after: SELECT * FROM user_roles LIMIT 1;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to test if the fix worked:
SELECT 'RLS Status Check' as test_type, 
       tablename, 
       rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('client_admins', 'clients', 'user_roles', 'locations', 'location_staff', 'customers')
ORDER BY tablename;

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- 1. This is a TEMPORARY fix to get the application working
-- 2. This disables security on these tables - only use for development
-- 3. After this fix, the HTTP 500 errors should disappear
-- 4. We need to fix the recursive policies later for production
-- ============================================================================ 
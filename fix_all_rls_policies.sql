-- ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
-- 🚨🚨🚨 CRITICAL SECURITY WARNING - DEV/TESTING ONLY 🚨🚨🚨
-- ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
--
-- ❌ DO NOT RUN THIS IN PRODUCTION ❌
-- ❌ THIS DISABLES SECURITY ON CRITICAL TABLES ❌
-- ❌ ONLY FOR DEVELOPMENT/TESTING PURPOSES ❌
--
-- This script PERMANENTLY disables Row Level Security on:
-- - platform_admin_users (CRITICAL ADMIN TABLE)
-- - user_roles (CRITICAL PERMISSIONS TABLE)
--
-- After running this, ANYONE can read/write these tables!
-- This is a TEMPORARY FIX to resolve infinite recursion in RLS policies.
--
-- ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
-- 🚨🚨🚨 CRITICAL SECURITY WARNING - DEV/TESTING ONLY 🚨🚨🚨
-- ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️

-- ============================================================================
-- FIX ALL RLS POLICIES - COMPLETE SOLUTION
-- ============================================================================
-- This script fixes ALL infinite recursion issues in RLS policies

-- ============================================================================
-- STEP 1: DISABLE RLS TEMPORARILY ON PROBLEMATIC TABLES
-- ============================================================================

-- Disable RLS on tables causing recursion
ALTER TABLE platform_admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: DROP ALL PROBLEMATIC POLICIES
-- ============================================================================

-- Drop all policies from platform_admin_users
DROP POLICY IF EXISTS "authenticated_users_can_read_own_admin_record" ON platform_admin_users;
DROP POLICY IF EXISTS "platform_admins_can_manage_admin_records" ON platform_admin_users;
DROP POLICY IF EXISTS "service_role_full_access" ON platform_admin_users;
DROP POLICY IF EXISTS "platform_admin_users_select_policy" ON platform_admin_users;
DROP POLICY IF EXISTS "platform_admin_users_insert_policy" ON platform_admin_users;
DROP POLICY IF EXISTS "platform_admin_users_update_policy" ON platform_admin_users;
DROP POLICY IF EXISTS "platform_admin_users_delete_policy" ON platform_admin_users;

-- Drop all policies from user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Platform admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Client admins can manage client roles" ON user_roles;
DROP POLICY IF EXISTS "service_role_full_access" ON user_roles;

-- Drop all policies from platform_clients
DROP POLICY IF EXISTS "platform_clients_select_policy" ON platform_clients;
DROP POLICY IF EXISTS "platform_clients_insert_policy" ON platform_clients;
DROP POLICY IF EXISTS "platform_clients_update_policy" ON platform_clients;
DROP POLICY IF EXISTS "platform_clients_delete_policy" ON platform_clients;

-- ============================================================================
-- STEP 3: CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ============================================================================

-- Enable RLS on platform_clients only
ALTER TABLE platform_clients ENABLE ROW LEVEL SECURITY;

-- Create simple policies for platform_clients that allow everyone for now
CREATE POLICY "platform_clients_allow_all" ON platform_clients
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

-- Test query to see if platform_clients is accessible
SELECT COUNT(*) as client_count FROM platform_clients;

-- Show all your clients
SELECT id, name, contact_email, contact_phone, status, plan FROM platform_clients ORDER BY created_at DESC;

-- ============================================================================
-- ⚠️⚠️⚠️ SECURITY RESTORATION REQUIRED ⚠️⚠️⚠️
-- ============================================================================
-- 
-- TO RESTORE SECURITY AFTER TESTING, RUN THESE COMMANDS:
--
-- -- Re-enable RLS on critical tables
-- ALTER TABLE platform_admin_users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
--
-- -- Create proper, non-recursive policies
-- CREATE POLICY "platform_admin_users_basic_access" ON platform_admin_users
--     FOR ALL USING (auth.uid() = user_id);
--
-- CREATE POLICY "user_roles_basic_access" ON user_roles  
--     FOR ALL USING (auth.uid() = user_id);
--
-- -- Restrict platform_clients to authenticated users only
-- DROP POLICY "platform_clients_allow_all" ON platform_clients;
-- CREATE POLICY "platform_clients_authenticated_access" ON platform_clients
--     FOR ALL USING (auth.role() = 'authenticated');
--
-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. This temporarily allows full access to platform_clients
-- 2. platform_admin_users and user_roles have RLS disabled to stop recursion
-- 3. Once this works, we can add proper security back gradually
-- 4. This is a "get it working first" approach
-- 5. ⚠️ REMEMBER TO RESTORE SECURITY BEFORE PRODUCTION ⚠️
-- ============================================================================ 
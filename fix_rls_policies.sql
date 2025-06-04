-- ============================================================================
-- FIX RLS POLICIES - CORRECT AUTHORIZATION
-- ============================================================================
-- This script fixes the infinite recursion in platform_admin_users policies
-- and creates proper access to platform_clients

-- ============================================================================
-- STEP 1: Fix platform_admin_users policies (remove recursion)
-- ============================================================================

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "authenticated_users_can_read_own_admin_record" ON platform_admin_users;
DROP POLICY IF EXISTS "platform_admins_can_manage_admin_records" ON platform_admin_users;

-- Create simple, non-recursive policies for platform_admin_users
CREATE POLICY "platform_admin_users_select_policy" ON platform_admin_users
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'email' = ANY(string_to_array(current_setting('app.platform_admin_emails', true), ','))
    );

CREATE POLICY "platform_admin_users_insert_policy" ON platform_admin_users
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'email' = ANY(string_to_array(current_setting('app.platform_admin_emails', true), ','))
    );

CREATE POLICY "platform_admin_users_update_policy" ON platform_admin_users
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'email' = ANY(string_to_array(current_setting('app.platform_admin_emails', true), ','))
    );

CREATE POLICY "platform_admin_users_delete_policy" ON platform_admin_users
    FOR DELETE USING (
        auth.jwt() ->> 'email' = ANY(string_to_array(current_setting('app.platform_admin_emails', true), ','))
    );

-- ============================================================================
-- STEP 2: Create proper policies for platform_clients
-- ============================================================================

-- Enable RLS on platform_clients if not already enabled
ALTER TABLE platform_clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "platform_clients_select_policy" ON platform_clients;
DROP POLICY IF EXISTS "platform_clients_insert_policy" ON platform_clients;
DROP POLICY IF EXISTS "platform_clients_update_policy" ON platform_clients;
DROP POLICY IF EXISTS "platform_clients_delete_policy" ON platform_clients;

-- Create policies for platform_clients that allow platform admins
CREATE POLICY "platform_clients_select_policy" ON platform_clients
    FOR SELECT USING (
        -- Allow service role (for server operations)
        auth.role() = 'service_role' OR
        -- Allow platform admins based on environment variables
        auth.jwt() ->> 'email' = ANY(string_to_array(current_setting('app.platform_admin_emails', true), ',')) OR
        auth.jwt() ->> 'email' = ANY(string_to_array(current_setting('app.galletti_admin_emails', true), ','))
    );

CREATE POLICY "platform_clients_insert_policy" ON platform_clients
    FOR INSERT WITH CHECK (
        -- Allow service role (for server operations)
        auth.role() = 'service_role' OR
        -- Allow platform admins based on environment variables
        auth.jwt() ->> 'email' = ANY(string_to_array(current_setting('app.platform_admin_emails', true), ','))
    );

CREATE POLICY "platform_clients_update_policy" ON platform_clients
    FOR UPDATE USING (
        -- Allow service role (for server operations)
        auth.role() = 'service_role' OR
        -- Allow platform admins based on environment variables
        auth.jwt() ->> 'email' = ANY(string_to_array(current_setting('app.platform_admin_emails', true), ','))
    );

CREATE POLICY "platform_clients_delete_policy" ON platform_clients
    FOR DELETE USING (
        -- Allow service role (for server operations)
        auth.role() = 'service_role' OR
        -- Allow platform admins based on environment variables
        auth.jwt() ->> 'email' = ANY(string_to_array(current_setting('app.platform_admin_emails', true), ','))
    );

-- ============================================================================
-- STEP 3: Set runtime configuration for admin emails
-- ============================================================================

-- Set the admin emails from environment variables
-- These should match your VITE_PLATFORM_ADMIN_EMAILS and VITE_GALLETTI_ADMIN_EMAILS
SELECT set_config('app.platform_admin_emails', 
    coalesce(current_setting('app.platform_admin_emails', true), 'admin@zerionstudio.com,platform@zerionstudio.com'), 
    false);

SELECT set_config('app.galletti_admin_emails', 
    coalesce(current_setting('app.galletti_admin_emails', true), 'admin@galletti.com,hq@galletti.com'), 
    false);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if policies are created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('platform_clients', 'platform_admin_users')
ORDER BY tablename, policyname;

-- Check current settings
SELECT name, setting FROM pg_settings WHERE name LIKE 'app.%';

-- Test query to see if platform_clients is accessible
SELECT COUNT(*) as client_count FROM platform_clients;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. This script maintains full security while fixing the recursion issue
-- 2. Platform admins are identified by email addresses in environment variables
-- 3. Service role always has full access for server operations
-- 4. No security is compromised - just proper authorization
-- ============================================================================ 
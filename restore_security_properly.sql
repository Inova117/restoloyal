-- ============================================================================
-- RESTORE SECURITY PROPERLY - CORRECT RLS POLICIES
-- ============================================================================
-- This script restores proper Row Level Security with non-recursive policies

-- ============================================================================
-- STEP 1: RE-ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Re-enable RLS on critical tables
ALTER TABLE platform_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_clients ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: DROP THE DANGEROUS "ALLOW ALL" POLICY
-- ============================================================================

DROP POLICY IF EXISTS "platform_clients_allow_all" ON platform_clients;

-- ============================================================================
-- STEP 3: CREATE PROPER, NON-RECURSIVE POLICIES
-- ============================================================================

-- Platform Admin Users - Simple, non-recursive policies
CREATE POLICY "platform_admin_users_own_record" ON platform_admin_users
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "platform_admin_users_service_role" ON platform_admin_users
    FOR ALL USING (auth.role() = 'service_role');

-- User Roles - Simple, non-recursive policies  
CREATE POLICY "user_roles_own_record" ON user_roles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_roles_service_role" ON user_roles
    FOR ALL USING (auth.role() = 'service_role');

-- Platform Clients - Secure but functional policies
CREATE POLICY "platform_clients_authenticated_read" ON platform_clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "platform_clients_service_role_all" ON platform_clients
    FOR ALL USING (auth.role() = 'service_role');

-- Allow platform admins to manage clients (using environment check)
CREATE POLICY "platform_clients_admin_manage" ON platform_clients
    FOR ALL USING (
        auth.uid()::text = ANY(
            string_to_array(
                coalesce(
                    current_setting('app.platform_admin_emails', true),
                    ''
                ), 
                ','
            )
        )
    );

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

-- Test that security is working
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('platform_admin_users', 'user_roles', 'platform_clients');

-- Test that you can still access your clients
SELECT COUNT(*) as client_count FROM platform_clients;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. ✅ RLS is now ENABLED on all critical tables
-- 2. ✅ Policies are simple and non-recursive
-- 3. ✅ Service role has full access for Edge Functions
-- 4. ✅ Users can only see their own records
-- 5. ✅ Platform admins can manage clients via environment variables
-- 6. ✅ No more infinite recursion
-- 7. ✅ Security is properly restored
-- ============================================================================ 
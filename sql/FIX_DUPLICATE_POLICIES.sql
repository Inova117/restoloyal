-- ============================================================================
-- FIX DUPLICATE POLICIES SCRIPT
-- ============================================================================
-- Version: Production v2.1.1
-- Description: Safely remove and recreate policies that might be duplicated
-- 
-- Usage: Run this BEFORE the main SECURITY_POLICIES.sql if you get duplicate errors
-- ============================================================================

-- ============================================================================
-- STEP 1: SAFELY DROP EXISTING POLICIES
-- ============================================================================

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE 'Checking for existing policies that might conflict...';
    
    -- Drop specific policies that commonly cause conflicts
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname IN (
            'Client admins can manage their user roles',
            'Platform admins can manage all user roles',
            'Users can view own role',
            'Platform admins can manage all clients',
            'Client admins can view own client',
            'Platform admins can manage all restaurants',
            'Client admins can manage their restaurants',
            'Restaurant owners can manage own restaurants'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
        RAISE NOTICE 'Dropped policy: % on %', policy_record.policyname, policy_record.tablename;
    END LOOP;
    
    RAISE NOTICE 'Duplicate policy cleanup complete';
END $$;

-- ============================================================================
-- STEP 2: RECREATE USER ROLES POLICIES SAFELY
-- ============================================================================

-- User Roles Policies (Safe Recreation)
DO $$
BEGIN
    -- Platform admins can manage all user roles
    BEGIN
        CREATE POLICY "Platform admins can manage all user roles" ON user_roles
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM platform_admin_users pau
              WHERE pau.user_id = auth.uid()
              AND pau.status = 'active'
            )
          );
        RAISE NOTICE 'Created: Platform admins can manage all user roles';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists: Platform admins can manage all user roles';
    END;

    -- Client admins can manage their user roles
    BEGIN
        CREATE POLICY "Client admins can manage their user roles" ON user_roles
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM user_roles ur_manager
              WHERE ur_manager.user_id = auth.uid()
              AND ur_manager.client_id = user_roles.client_id
              AND ur_manager.role = 'client_admin'
              AND ur_manager.status = 'active'
            )
          );
        RAISE NOTICE 'Created: Client admins can manage their user roles';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists: Client admins can manage their user roles';
    END;

    -- Users can view own role
    BEGIN
        CREATE POLICY "Users can view own role" ON user_roles
          FOR SELECT
          USING (user_id = auth.uid());
        RAISE NOTICE 'Created: Users can view own role';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists: Users can view own role';
    END;
END $$;

-- ============================================================================
-- STEP 3: RECREATE PLATFORM CLIENT POLICIES SAFELY
-- ============================================================================

DO $$
BEGIN
    -- Platform admins can manage all clients
    BEGIN
        CREATE POLICY "Platform admins can manage all clients" ON platform_clients
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM platform_admin_users pau
              WHERE pau.user_id = auth.uid()
              AND pau.role IN ('platform_admin', 'super_admin')
              AND pau.status = 'active'
            )
          );
        RAISE NOTICE 'Created: Platform admins can manage all clients';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists: Platform admins can manage all clients';
    END;

    -- Client admins can view own client
    BEGIN
        CREATE POLICY "Client admins can view own client" ON platform_clients
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM user_roles ur
              WHERE ur.user_id = auth.uid()
              AND ur.client_id = platform_clients.id
              AND ur.role = 'client_admin'
              AND ur.status = 'active'
            )
          );
        RAISE NOTICE 'Created: Client admins can view own client';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists: Client admins can view own client';
    END;
END $$;

-- ============================================================================
-- STEP 4: VERIFY POLICIES EXIST
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('user_roles', 'platform_clients');
    
    RAISE NOTICE 'Total policies on user_roles and platform_clients: %', policy_count;
    
    -- List all policies for verification
    FOR policy_record IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('user_roles', 'platform_clients')
        ORDER BY tablename, policyname
    LOOP
        RAISE NOTICE 'Policy: % on %', policy_record.policyname, policy_record.tablename;
    END LOOP;
END $$;

-- ============================================================================
-- CLEANUP COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✅ DUPLICATE POLICY FIX COMPLETE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'All conflicting policies have been safely removed and recreated';
    RAISE NOTICE 'You can now run the main SECURITY_POLICIES.sql script';
    RAISE NOTICE '============================================================================';
END $$; 
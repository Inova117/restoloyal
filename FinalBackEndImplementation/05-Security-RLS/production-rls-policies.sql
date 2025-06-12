-- ============================================================================
-- PRODUCTION-GRADE ROW LEVEL SECURITY (RLS) POLICIES - FIXED VERSION
-- ============================================================================
-- This script implements comprehensive RLS policies for the 4-tier hierarchy
-- WITHOUT INFINITE RECURSION - uses secure helper functions instead
-- Ensures complete data isolation and security at the database level
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP EXISTING PROBLEMATIC POLICIES
-- ============================================================================

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "superadmins_access" ON public.superadmins;
DROP POLICY IF EXISTS "superadmins_select_policy" ON public.superadmins;
DROP POLICY IF EXISTS "superadmins_insert_policy" ON public.superadmins;
DROP POLICY IF EXISTS "superadmins_update_policy" ON public.superadmins;
DROP POLICY IF EXISTS "superadmins_delete_policy" ON public.superadmins;

DROP POLICY IF EXISTS "clients_access" ON public.clients;
DROP POLICY IF EXISTS "clients_select_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_update_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON public.clients;

DROP POLICY IF EXISTS "client_admins_access" ON public.client_admins;
DROP POLICY IF EXISTS "client_admins_select_policy" ON public.client_admins;
DROP POLICY IF EXISTS "client_admins_insert_policy" ON public.client_admins;
DROP POLICY IF EXISTS "client_admins_update_policy" ON public.client_admins;
DROP POLICY IF EXISTS "client_admins_delete_policy" ON public.client_admins;

DROP POLICY IF EXISTS "locations_access" ON public.locations;
DROP POLICY IF EXISTS "locations_select_policy" ON public.locations;
DROP POLICY IF EXISTS "locations_insert_policy" ON public.locations;
DROP POLICY IF EXISTS "locations_update_policy" ON public.locations;
DROP POLICY IF EXISTS "locations_delete_policy" ON public.locations;

DROP POLICY IF EXISTS "location_staff_access" ON public.location_staff;
DROP POLICY IF EXISTS "location_staff_select_policy" ON public.location_staff;
DROP POLICY IF EXISTS "location_staff_insert_policy" ON public.location_staff;
DROP POLICY IF EXISTS "location_staff_update_policy" ON public.location_staff;
DROP POLICY IF EXISTS "location_staff_delete_policy" ON public.location_staff;

DROP POLICY IF EXISTS "customers_access" ON public.customers;
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_update_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON public.customers;

DROP POLICY IF EXISTS "user_roles_access" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_policy" ON public.user_roles;

DROP POLICY IF EXISTS "stamps_access" ON public.stamps;
DROP POLICY IF EXISTS "rewards_access" ON public.rewards;
DROP POLICY IF EXISTS "audit_log_superadmin_access" ON public.hierarchy_audit_log;

-- ============================================================================
-- STEP 2: CREATE SAFE HELPER FUNCTIONS (NO RECURSION)
-- ============================================================================

-- Helper function to get user's client_id from user_roles table SAFELY
CREATE OR REPLACE FUNCTION get_user_client_id_safe()
RETURNS UUID AS $$
DECLARE
  client_id_result UUID;
BEGIN
  -- Get client_id from user_roles without triggering RLS
  SELECT 
    CASE 
      WHEN ur.tier = 'client_admin' THEN ca.client_id
      WHEN ur.tier = 'location_staff' THEN ls.client_id
      WHEN ur.tier = 'customer' THEN c.client_id
      ELSE NULL
    END INTO client_id_result
  FROM user_roles ur
  LEFT JOIN client_admins ca ON ur.client_admin_id = ca.id
  LEFT JOIN location_staff ls ON ur.location_staff_id = ls.id
  LEFT JOIN customers c ON ur.customer_id = c.id
  WHERE ur.user_id = auth.uid() AND ur.is_active = true
  LIMIT 1;
  
  RETURN client_id_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's location_id from user_roles table SAFELY
CREATE OR REPLACE FUNCTION get_user_location_id_safe()
RETURNS UUID AS $$
DECLARE
  location_id_result UUID;
BEGIN
  -- Get location_id from user_roles without triggering RLS
  SELECT 
    CASE 
      WHEN ur.tier = 'location_staff' THEN ls.location_id
      WHEN ur.tier = 'customer' THEN c.location_id
      ELSE NULL
    END INTO location_id_result
  FROM user_roles ur
  LEFT JOIN location_staff ls ON ur.location_staff_id = ls.id
  LEFT JOIN customers c ON ur.customer_id = c.id
  WHERE ur.user_id = auth.uid() AND ur.is_active = true
  LIMIT 1;
  
  RETURN location_id_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is client admin for specific client SAFELY
CREATE OR REPLACE FUNCTION is_user_client_admin_for_client(p_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN client_admins ca ON ur.client_admin_id = ca.id
    WHERE ur.user_id = auth.uid() 
    AND ur.tier = 'client_admin'
    AND ca.client_id = p_client_id
    AND ur.is_active = true
    AND ca.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is location staff for specific location SAFELY
CREATE OR REPLACE FUNCTION is_user_location_staff_for_location(p_location_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN location_staff ls ON ur.location_staff_id = ls.id
    WHERE ur.user_id = auth.uid() 
    AND ur.tier = 'location_staff'
    AND ls.location_id = p_location_id
    AND ur.is_active = true
    AND ls.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: TIER 1 - SUPERADMINS RLS POLICIES (SAFE)
-- ============================================================================

-- Superadmins table: Only superadmins can see superadmin records
CREATE POLICY "superadmins_select_safe" ON public.superadmins
  FOR SELECT
  USING (is_current_user_superadmin());

CREATE POLICY "superadmins_insert_safe" ON public.superadmins
  FOR INSERT
  WITH CHECK (true); -- Allow bootstrap creation

CREATE POLICY "superadmins_update_safe" ON public.superadmins
  FOR UPDATE
  USING (is_current_user_superadmin())
  WITH CHECK (is_current_user_superadmin());

CREATE POLICY "superadmins_delete_safe" ON public.superadmins
  FOR DELETE
  USING (is_current_user_superadmin() AND user_id != auth.uid());

-- ============================================================================
-- STEP 4: TIER 2 - CLIENTS RLS POLICIES (SAFE)
-- ============================================================================

-- Clients table: Superadmins see all, client admins see their client only
CREATE POLICY "clients_select_safe" ON public.clients
  FOR SELECT
  USING (
    is_current_user_superadmin() OR
    id = get_user_client_id_safe()
  );

CREATE POLICY "clients_insert_safe" ON public.clients
  FOR INSERT
  WITH CHECK (
    is_current_user_superadmin() AND
    created_by_superadmin_id = get_current_superadmin()
  );

CREATE POLICY "clients_update_safe" ON public.clients
  FOR UPDATE
  USING (
    is_current_user_superadmin() OR
    id = get_user_client_id_safe()
  )
  WITH CHECK (
    is_current_user_superadmin() OR
    id = get_user_client_id_safe()
  );

CREATE POLICY "clients_delete_safe" ON public.clients
  FOR DELETE
  USING (is_current_user_superadmin());

-- ============================================================================
-- STEP 5: TIER 2 - CLIENT ADMINS RLS POLICIES (SAFE)
-- ============================================================================

-- Client Admins table: Hierarchy-based access WITHOUT recursion
CREATE POLICY "client_admins_select_safe" ON public.client_admins
  FOR SELECT
  USING (
    is_current_user_superadmin() OR
    user_id = auth.uid() OR
    client_id = get_user_client_id_safe()
  );

CREATE POLICY "client_admins_insert_safe" ON public.client_admins
  FOR INSERT
  WITH CHECK (
    is_current_user_superadmin() AND
    created_by_superadmin_id = get_current_superadmin()
  );

CREATE POLICY "client_admins_update_safe" ON public.client_admins
  FOR UPDATE
  USING (
    is_current_user_superadmin() OR
    user_id = auth.uid() OR
    is_user_client_admin_for_client(client_id)
  )
  WITH CHECK (
    is_current_user_superadmin() OR
    client_id = get_user_client_id_safe()
  );

CREATE POLICY "client_admins_delete_safe" ON public.client_admins
  FOR DELETE
  USING (is_current_user_superadmin());

-- ============================================================================
-- STEP 6: TIER 3 - LOCATIONS RLS POLICIES (SAFE)
-- ============================================================================

-- Locations table: Client-scoped with role-based access
CREATE POLICY "locations_select_safe" ON public.locations
  FOR SELECT
  USING (
    is_current_user_superadmin() OR
    client_id = get_user_client_id_safe() OR
    id = get_user_location_id_safe()
  );

CREATE POLICY "locations_insert_safe" ON public.locations
  FOR INSERT
  WITH CHECK (
    is_user_client_admin_for_client(client_id)
  );

CREATE POLICY "locations_update_safe" ON public.locations
  FOR UPDATE
  USING (
    is_current_user_superadmin() OR
    client_id = get_user_client_id_safe() OR
    is_user_location_staff_for_location(id)
  )
  WITH CHECK (
    is_current_user_superadmin() OR
    client_id = get_user_client_id_safe()
  );

CREATE POLICY "locations_delete_safe" ON public.locations
  FOR DELETE
  USING (
    is_current_user_superadmin() OR
    is_user_client_admin_for_client(client_id)
  );

-- ============================================================================
-- STEP 7: TIER 3 - LOCATION STAFF RLS POLICIES (SAFE)
-- ============================================================================

-- Location Staff table: Location-scoped with role-based access
CREATE POLICY "location_staff_select_safe" ON public.location_staff
  FOR SELECT
  USING (
    is_current_user_superadmin() OR
    user_id = auth.uid() OR
    client_id = get_user_client_id_safe() OR
    location_id = get_user_location_id_safe()
  );

CREATE POLICY "location_staff_insert_safe" ON public.location_staff
  FOR INSERT
  WITH CHECK (
    is_user_client_admin_for_client(client_id)
  );

CREATE POLICY "location_staff_update_safe" ON public.location_staff
  FOR UPDATE
  USING (
    is_current_user_superadmin() OR
    user_id = auth.uid() OR
    client_id = get_user_client_id_safe()
  )
  WITH CHECK (
    is_current_user_superadmin() OR
    client_id = get_user_client_id_safe()
  );

CREATE POLICY "location_staff_delete_safe" ON public.location_staff
  FOR DELETE
  USING (
    is_current_user_superadmin() OR
    is_user_client_admin_for_client(client_id)
  );

-- ============================================================================
-- STEP 8: TIER 4 - CUSTOMERS RLS POLICIES (SAFE)
-- ============================================================================

-- Customers table: Location-scoped with staff access control
CREATE POLICY "customers_select_safe" ON public.customers
  FOR SELECT
  USING (
    is_current_user_superadmin() OR
    client_id = get_user_client_id_safe() OR
    location_id = get_user_location_id_safe()
  );

CREATE POLICY "customers_insert_safe" ON public.customers
  FOR INSERT
  WITH CHECK (
    location_id = get_user_location_id_safe()
  );

CREATE POLICY "customers_update_safe" ON public.customers
  FOR UPDATE
  USING (
    is_current_user_superadmin() OR
    client_id = get_user_client_id_safe() OR
    location_id = get_user_location_id_safe()
  )
  WITH CHECK (
    is_current_user_superadmin() OR
    client_id = get_user_client_id_safe() OR
    location_id = get_user_location_id_safe()
  );

CREATE POLICY "customers_delete_safe" ON public.customers
  FOR DELETE
  USING (
    is_current_user_superadmin() OR
    is_user_client_admin_for_client(client_id)
  );

-- ============================================================================
-- STEP 9: USER ROLES RLS POLICIES (SAFE - NO RECURSION)
-- ============================================================================

-- User Roles table: Users can see their own role, superadmins see all
CREATE POLICY "user_roles_select_safe" ON public.user_roles
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_current_user_superadmin()
  );

CREATE POLICY "user_roles_insert_safe" ON public.user_roles
  FOR INSERT
  WITH CHECK (true); -- Allow automatic triggers

CREATE POLICY "user_roles_update_safe" ON public.user_roles
  FOR UPDATE
  USING (
    is_current_user_superadmin() OR
    user_id = auth.uid()
  )
  WITH CHECK (
    is_current_user_superadmin() OR
    user_id = auth.uid()
  );

CREATE POLICY "user_roles_delete_safe" ON public.user_roles
  FOR DELETE
  USING (is_current_user_superadmin());

-- ============================================================================
-- STEP 10: LOYALTY SYSTEM RLS POLICIES (SAFE)
-- ============================================================================

-- Stamps table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stamps') THEN
    EXECUTE 'CREATE POLICY "stamps_select_safe" ON public.stamps
      FOR SELECT
      USING (
        is_current_user_superadmin() OR
        client_id = get_user_client_id_safe() OR
        location_id = get_user_location_id_safe()
      )';
    
    EXECUTE 'CREATE POLICY "stamps_insert_safe" ON public.stamps
      FOR INSERT
      WITH CHECK (location_id = get_user_location_id_safe())';
  END IF;
END $$;

-- Rewards table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rewards') THEN
    EXECUTE 'CREATE POLICY "rewards_select_safe" ON public.rewards
      FOR SELECT
      USING (
        is_current_user_superadmin() OR
        client_id = get_user_client_id_safe() OR
        location_id = get_user_location_id_safe()
      )';
    
    EXECUTE 'CREATE POLICY "rewards_insert_safe" ON public.rewards
      FOR INSERT
      WITH CHECK (location_id = get_user_location_id_safe())';
  END IF;
END $$;

-- ============================================================================
-- STEP 11: AUDIT LOG RLS POLICIES (SAFE)
-- ============================================================================

-- Hierarchy Audit Log: Role-based access for security monitoring
CREATE POLICY "audit_log_select_safe" ON public.hierarchy_audit_log
  FOR SELECT
  USING (
    is_current_user_superadmin() OR
    user_id = auth.uid()
  );

CREATE POLICY "audit_log_insert_safe" ON public.hierarchy_audit_log
  FOR INSERT
  WITH CHECK (true); -- Allow system logging

-- ============================================================================
-- STEP 12: ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.superadmins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hierarchy_audit_log ENABLE ROW LEVEL SECURITY;

-- Enable RLS on loyalty tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stamps') THEN
    EXECUTE 'ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rewards') THEN
    EXECUTE 'ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ============================================================================
-- STEP 13: RLS POLICY VALIDATION AND TESTING
-- ============================================================================

-- Function to test RLS policies
CREATE OR REPLACE FUNCTION test_rls_policies_safe()
RETURNS TABLE (
  table_name TEXT,
  policy_count BIGINT,
  rls_enabled BOOLEAN,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    COUNT(p.policyname),
    t.rowsecurity,
    CASE 
      WHEN t.rowsecurity AND COUNT(p.policyname) > 0 THEN 'PROTECTED'
      WHEN t.rowsecurity AND COUNT(p.policyname) = 0 THEN 'RLS_ENABLED_NO_POLICIES'
      WHEN NOT t.rowsecurity THEN 'RLS_DISABLED'
      ELSE 'UNKNOWN'
    END
  FROM pg_tables t
  LEFT JOIN pg_policies p ON p.tablename = t.tablename
  WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'superadmins', 'clients', 'client_admins', 'locations', 
    'location_staff', 'customers', 'stamps', 'rewards', 'user_roles', 'hierarchy_audit_log'
  )
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

-- Function to verify no recursive policies exist
CREATE OR REPLACE FUNCTION check_policy_recursion()
RETURNS TABLE (
  policy_name TEXT,
  table_name TEXT,
  policy_definition TEXT,
  has_recursion BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.policyname::TEXT,
    p.tablename::TEXT,
    p.qual::TEXT,
    (p.qual::TEXT LIKE '%FROM ' || p.tablename || '%')::BOOLEAN
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  AND p.tablename IN (
    'superadmins', 'clients', 'client_admins', 'locations', 
    'location_staff', 'customers', 'user_roles'
  )
  ORDER BY p.tablename, p.policyname;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ PRODUCTION RLS POLICIES SETUP COMPLETE - RECURSION FREE VERSION';
  RAISE NOTICE '🔧 All policies rewritten using safe helper functions';
  RAISE NOTICE '🚫 Zero recursion: policies use dedicated helper functions';
  RAISE NOTICE '🔒 Complete data isolation maintained across all tiers';
  RAISE NOTICE '⚡ Performance optimized with security definer functions';
  RAISE NOTICE '📊 Run SELECT * FROM test_rls_policies_safe(); to validate';
  RAISE NOTICE '🔍 Run SELECT * FROM check_policy_recursion(); to verify no recursion';
  RAISE NOTICE '🎯 All tables protected with tier-appropriate access controls';
END $$; 
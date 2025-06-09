-- ============================================================================
-- COMPLETE HIERARCHY VALIDATION TESTS
-- ============================================================================
-- This script tests the complete 4-tier hierarchy implementation
-- Validates that all constraints and security measures work correctly
-- ============================================================================

-- ============================================================================
-- STEP 1: COMPREHENSIVE SYSTEM VALIDATION
-- ============================================================================

-- Function to test complete system setup
CREATE OR REPLACE FUNCTION test_complete_hierarchy_setup()
RETURNS TABLE (
  tier TEXT,
  test_name TEXT,
  status TEXT,
  message TEXT
) AS $$
BEGIN
  -- TIER 1 TESTS
  RETURN QUERY
  SELECT 'TIER_1'::TEXT, t.test_name, t.status, t.message
  FROM test_superadmin_setup() t;
  
  -- TIER 2 TESTS
  RETURN QUERY
  SELECT 'TIER_2'::TEXT, t.test_name, t.status, t.message
  FROM test_client_tables_setup() t;
  
  -- TIER 3 TESTS
  RETURN QUERY
  SELECT 'TIER_3'::TEXT, t.test_name, t.status, t.message
  FROM test_location_tables_setup() t;
  
  -- TIER 4 TESTS
  RETURN QUERY
  SELECT 'TIER_4'::TEXT, t.test_name, t.status, t.message
  FROM test_customer_tables_setup() t;
  
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: HIERARCHY FLOW VALIDATION
-- ============================================================================

-- Function to test the complete hierarchy creation flow
CREATE OR REPLACE FUNCTION test_hierarchy_creation_flow(
  p_superadmin_email TEXT DEFAULT 'test-superadmin@example.com',
  p_superadmin_name TEXT DEFAULT 'Test Superadmin',
  p_client_name TEXT DEFAULT 'Test Restaurant Chain',
  p_location_name TEXT DEFAULT 'Test Location'
) RETURNS TABLE (
  step_number INTEGER,
  tier TEXT,
  action TEXT,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  v_superadmin_id UUID;
  v_client_id UUID;
  v_client_admin_id UUID;
  v_location_id UUID;
  v_staff_id UUID;
  v_customer_id UUID;
  v_error_message TEXT;
  v_user_id UUID;
BEGIN
  -- Reset any existing test data
  BEGIN
    DELETE FROM customers WHERE qr_code LIKE 'TEST_%';
    DELETE FROM location_staff WHERE email = 'test-staff@example.com';
    DELETE FROM locations WHERE name = p_location_name;
    DELETE FROM client_admins WHERE email = 'test-client-admin@example.com';
    DELETE FROM clients WHERE slug = 'test-restaurant-chain';
    DELETE FROM superadmins WHERE email = p_superadmin_email;
    DELETE FROM auth.users WHERE email = p_superadmin_email;
  EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore cleanup errors
  END;
  
  -- STEP 1: Create auth user for superadmin (simulated)
  BEGIN
    INSERT INTO auth.users (id, email) 
    VALUES (gen_random_uuid(), p_superadmin_email)
    RETURNING id INTO v_user_id;
    
    RETURN QUERY SELECT 
      1, 'TIER_1'::TEXT, 'create_auth_user'::TEXT, 'PASS'::TEXT, 
      'Auth user created: ' || v_user_id::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
      RETURN QUERY SELECT 
        1, 'TIER_1'::TEXT, 'create_auth_user'::TEXT, 'FAIL'::TEXT, 
        'Auth user creation failed: ' || v_error_message;
      RETURN;
  END;
  
  -- STEP 2: Bootstrap superadmin
  BEGIN
    SELECT superadmin_id INTO v_superadmin_id
    FROM bootstrap_superadmin(p_superadmin_email, p_superadmin_name);
    
    RETURN QUERY SELECT 
      2, 'TIER_1'::TEXT, 'bootstrap_superadmin'::TEXT, 'PASS'::TEXT,
      'Superadmin created: ' || v_superadmin_id::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
      RETURN QUERY SELECT 
        2, 'TIER_1'::TEXT, 'bootstrap_superadmin'::TEXT, 'FAIL'::TEXT,
        'Superadmin bootstrap failed: ' || v_error_message;
      RETURN;
  END;
  
  -- STEP 3: Create client (superadmin action)
  BEGIN
    INSERT INTO clients (
      name, slug, email, created_by_superadmin_id
    ) VALUES (
      p_client_name, 'test-restaurant-chain', 'admin@test-restaurant-chain.com', v_superadmin_id
    ) RETURNING id INTO v_client_id;
    
    RETURN QUERY SELECT 
      3, 'TIER_2'::TEXT, 'create_client'::TEXT, 'PASS'::TEXT,
      'Client created: ' || v_client_id::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
      RETURN QUERY SELECT 
        3, 'TIER_2'::TEXT, 'create_client'::TEXT, 'FAIL'::TEXT,
        'Client creation failed: ' || v_error_message;
      RETURN;
  END;
  
  -- STEP 4: Create auth user for client admin
  BEGIN
    INSERT INTO auth.users (id, email) 
    VALUES (gen_random_uuid(), 'test-client-admin@example.com')
    RETURNING id INTO v_user_id;
    
    RETURN QUERY SELECT 
      4, 'TIER_2'::TEXT, 'create_client_admin_auth'::TEXT, 'PASS'::TEXT,
      'Client admin auth user created: ' || v_user_id::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
      RETURN QUERY SELECT 
        4, 'TIER_2'::TEXT, 'create_client_admin_auth'::TEXT, 'FAIL'::TEXT,
        'Client admin auth creation failed: ' || v_error_message;
      RETURN;
  END;
  
  -- STEP 5: Create client admin (superadmin action)
  BEGIN
    INSERT INTO client_admins (
      user_id, client_id, email, name, created_by_superadmin_id
    ) VALUES (
      v_user_id, v_client_id, 'test-client-admin@example.com', 'Test Client Admin', v_superadmin_id
    ) RETURNING id INTO v_client_admin_id;
    
    RETURN QUERY SELECT 
      5, 'TIER_2'::TEXT, 'create_client_admin'::TEXT, 'PASS'::TEXT,
      'Client admin created: ' || v_client_admin_id::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
      RETURN QUERY SELECT 
        5, 'TIER_2'::TEXT, 'create_client_admin'::TEXT, 'FAIL'::TEXT,
        'Client admin creation failed: ' || v_error_message;
      RETURN;
  END;
  
  -- STEP 6: Create location (client admin action)
  BEGIN
    INSERT INTO locations (
      client_id, name, address, city, state, created_by_client_admin_id
    ) VALUES (
      v_client_id, p_location_name, '123 Test St', 'Test City', 'TS', v_client_admin_id
    ) RETURNING id INTO v_location_id;
    
    RETURN QUERY SELECT 
      6, 'TIER_3'::TEXT, 'create_location'::TEXT, 'PASS'::TEXT,
      'Location created: ' || v_location_id::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
      RETURN QUERY SELECT 
        6, 'TIER_3'::TEXT, 'create_location'::TEXT, 'FAIL'::TEXT,
        'Location creation failed: ' || v_error_message;
      RETURN;
  END;
  
  -- STEP 7: Create auth user for location staff
  BEGIN
    INSERT INTO auth.users (id, email) 
    VALUES (gen_random_uuid(), 'test-staff@example.com')
    RETURNING id INTO v_user_id;
    
    RETURN QUERY SELECT 
      7, 'TIER_3'::TEXT, 'create_staff_auth'::TEXT, 'PASS'::TEXT,
      'Staff auth user created: ' || v_user_id::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
      RETURN QUERY SELECT 
        7, 'TIER_3'::TEXT, 'create_staff_auth'::TEXT, 'FAIL'::TEXT,
        'Staff auth creation failed: ' || v_error_message;
      RETURN;
  END;
  
  -- STEP 8: Create location staff (client admin action)
  BEGIN
    INSERT INTO location_staff (
      user_id, location_id, client_id, email, name, created_by_client_admin_id
    ) VALUES (
      v_user_id, v_location_id, v_client_id, 'test-staff@example.com', 'Test Staff', v_client_admin_id
    ) RETURNING id INTO v_staff_id;
    
    RETURN QUERY SELECT 
      8, 'TIER_3'::TEXT, 'create_location_staff'::TEXT, 'PASS'::TEXT,
      'Location staff created: ' || v_staff_id::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
      RETURN QUERY SELECT 
        8, 'TIER_3'::TEXT, 'create_location_staff'::TEXT, 'FAIL'::TEXT,
        'Location staff creation failed: ' || v_error_message;
      RETURN;
  END;
  
  -- STEP 9: Create customer (location staff action)
  BEGIN
    INSERT INTO customers (
      client_id, location_id, name, qr_code, customer_number, created_by_staff_id
    ) VALUES (
      v_client_id, v_location_id, 'Test Customer', 'TEST_QR_123', 'TEST_CUST_123', v_staff_id
    ) RETURNING id INTO v_customer_id;
    
    RETURN QUERY SELECT 
      9, 'TIER_4'::TEXT, 'create_customer'::TEXT, 'PASS'::TEXT,
      'Customer created: ' || v_customer_id::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
      RETURN QUERY SELECT 
        9, 'TIER_4'::TEXT, 'create_customer'::TEXT, 'FAIL'::TEXT,
        'Customer creation failed: ' || v_error_message;
      RETURN;
  END;
  
  -- STEP 10: Test final hierarchy validation
  RETURN QUERY SELECT 
    10, 'VALIDATION'::TEXT, 'hierarchy_complete'::TEXT, 'PASS'::TEXT,
    'Complete 4-tier hierarchy created successfully!'::TEXT;
  
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: HIERARCHY VIOLATION TESTS
-- ============================================================================

-- Function to test that hierarchy violations are properly blocked
CREATE OR REPLACE FUNCTION test_hierarchy_violations()
RETURNS TABLE (
  violation_type TEXT,
  expected_result TEXT,
  actual_result TEXT,
  status TEXT
) AS $$
DECLARE
  v_error_occurred BOOLEAN;
  v_error_message TEXT;
BEGIN
  -- TEST 1: Try to create client without being superadmin
  v_error_occurred := false;
  BEGIN
    INSERT INTO clients (name, slug, email, created_by_superadmin_id)
    VALUES ('Illegal Client', 'illegal-client', 'illegal@example.com', gen_random_uuid());
  EXCEPTION
    WHEN OTHERS THEN
      v_error_occurred := true;
      GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
  END;
  
  RETURN QUERY SELECT 
    'client_creation_without_superadmin'::TEXT,
    'ERROR (blocked)'::TEXT,
    CASE WHEN v_error_occurred THEN 'ERROR (blocked)' ELSE 'SUCCESS (violation!)' END,
    CASE WHEN v_error_occurred THEN 'PASS' ELSE 'FAIL' END;
  
  -- TEST 2: Try to create location staff without being client admin
  v_error_occurred := false;
  BEGIN
    INSERT INTO location_staff (
      user_id, location_id, client_id, email, name, created_by_client_admin_id
    ) VALUES (
      gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
      'illegal-staff@example.com', 'Illegal Staff', gen_random_uuid()
    );
  EXCEPTION
    WHEN OTHERS THEN
      v_error_occurred := true;
  END;
  
  RETURN QUERY SELECT 
    'staff_creation_without_client_admin'::TEXT,
    'ERROR (blocked)'::TEXT,
    CASE WHEN v_error_occurred THEN 'ERROR (blocked)' ELSE 'SUCCESS (violation!)' END,
    CASE WHEN v_error_occurred THEN 'PASS' ELSE 'FAIL' END;
  
  -- TEST 3: Try to create customer without being location staff
  v_error_occurred := false;
  BEGIN
    INSERT INTO customers (
      client_id, location_id, name, qr_code, customer_number, created_by_staff_id
    ) VALUES (
      gen_random_uuid(), gen_random_uuid(), 'Illegal Customer',
      'ILLEGAL_QR', 'ILLEGAL_CUST', gen_random_uuid()
    );
  EXCEPTION
    WHEN OTHERS THEN
      v_error_occurred := true;
  END;
  
  RETURN QUERY SELECT 
    'customer_creation_without_staff'::TEXT,
    'ERROR (blocked)'::TEXT,
    CASE WHEN v_error_occurred THEN 'ERROR (blocked)' ELSE 'SUCCESS (violation!)' END,
    CASE WHEN v_error_occurred THEN 'PASS' ELSE 'FAIL' END;
  
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: SUMMARY TESTING FUNCTION
-- ============================================================================

-- Master test function that runs all validation tests
CREATE OR REPLACE FUNCTION run_complete_hierarchy_tests()
RETURNS TABLE (
  test_category TEXT,
  test_name TEXT,
  status TEXT,
  message TEXT
) AS $$
BEGIN
  -- Header
  RETURN QUERY SELECT 
    'HEADER'::TEXT, 'system_info'::TEXT, 'INFO'::TEXT,
    '🚀 Running Complete 4-Tier Hierarchy Validation Tests'::TEXT;
  
  -- System setup validation
  RETURN QUERY SELECT 
    'SETUP'::TEXT, tier || '_' || test_name, status, message
  FROM test_complete_hierarchy_setup();
  
  -- Hierarchy violations tests
  RETURN QUERY SELECT 
    'SECURITY'::TEXT, violation_type, status, 
    'Expected: ' || expected_result || ', Got: ' || actual_result
  FROM test_hierarchy_violations();
  
  -- Footer
  RETURN QUERY SELECT 
    'FOOTER'::TEXT, 'completion'::TEXT, 'INFO'::TEXT,
    '✅ All hierarchy validation tests completed'::TEXT;
  
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: QUICK VALIDATION FUNCTIONS
-- ============================================================================

-- Function to count entities at each tier
CREATE OR REPLACE FUNCTION get_hierarchy_entity_counts()
RETURNS TABLE (
  tier TEXT,
  entity_type TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY SELECT 'TIER_1'::TEXT, 'superadmins'::TEXT, count(*) FROM superadmins;
  RETURN QUERY SELECT 'TIER_2'::TEXT, 'clients'::TEXT, count(*) FROM clients;
  RETURN QUERY SELECT 'TIER_2'::TEXT, 'client_admins'::TEXT, count(*) FROM client_admins;
  RETURN QUERY SELECT 'TIER_3'::TEXT, 'locations'::TEXT, count(*) FROM locations;
  RETURN QUERY SELECT 'TIER_3'::TEXT, 'location_staff'::TEXT, count(*) FROM location_staff;
  RETURN QUERY SELECT 'TIER_4'::TEXT, 'customers'::TEXT, count(*) FROM customers;
  RETURN QUERY SELECT 'LOYALTY'::TEXT, 'stamps'::TEXT, count(*) FROM stamps;
  RETURN QUERY SELECT 'LOYALTY'::TEXT, 'rewards'::TEXT, count(*) FROM rewards;
END;
$$ LANGUAGE plpgsql;

-- Function to check RLS status on all tables
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN,
  policies_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity,
    count(p.policyname)
  FROM pg_tables t
  LEFT JOIN pg_policies p ON p.tablename = t.tablename
  WHERE t.schemaname = 'public'
  AND t.tablename IN ('superadmins', 'clients', 'client_admins', 'locations', 'location_staff', 'customers', 'stamps', 'rewards', 'user_roles')
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ HIERARCHY TESTING FRAMEWORK SETUP COMPLETE';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Available Test Functions:';
  RAISE NOTICE '   • SELECT * FROM run_complete_hierarchy_tests();';
  RAISE NOTICE '   • SELECT * FROM test_hierarchy_creation_flow();';
  RAISE NOTICE '   • SELECT * FROM test_hierarchy_violations();';
  RAISE NOTICE '   • SELECT * FROM get_hierarchy_entity_counts();';
  RAISE NOTICE '   • SELECT * FROM check_rls_status();';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Quick Status Check:';
  RAISE NOTICE '   • SELECT * FROM get_hierarchy_entity_counts();';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Run Full Test Suite:';
  RAISE NOTICE '   • SELECT * FROM run_complete_hierarchy_tests();';
END $$; 
-- ============================================================================
-- TIER ROLE TRACKING SYSTEM - USER ROLES TABLE
-- ============================================================================
-- Purpose: Central role tracking for all users across all 4 tiers
-- Dependencies: All previous tables (superadmins, clients, client_admins, locations, location_staff, customers)
-- Security: Complete hierarchy validation and audit trail
-- ============================================================================

-- ============================================================================
-- STEP 1: USER ROLES TABLE CREATION
-- ============================================================================

-- User Roles table - Central role tracking for all tiers
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.user_tier NOT NULL,
  
  -- Tier-specific references (only one should be filled per role)
  superadmin_id UUID REFERENCES public.superadmins(id) ON DELETE CASCADE,
  client_admin_id UUID REFERENCES public.client_admins(id) ON DELETE CASCADE,
  location_staff_id UUID REFERENCES public.location_staff(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Hierarchy enforcement - CRITICAL
  -- created_by tracks who created this user (must be upper tier)
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_by_tier public.user_tier,
  
  -- Status and metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  permissions JSONB DEFAULT '{}',
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints - Ensure only one tier reference per user
  -- NOTE: 'customer' tier not included as customers are QR-based without auth accounts
  CONSTRAINT user_roles_single_tier CHECK (
    (
      (tier = 'superadmin' AND superadmin_id IS NOT NULL AND client_admin_id IS NULL AND location_staff_id IS NULL AND customer_id IS NULL) OR
      (tier = 'client_admin' AND superadmin_id IS NULL AND client_admin_id IS NOT NULL AND location_staff_id IS NULL AND customer_id IS NULL) OR  
      (tier = 'location_staff' AND superadmin_id IS NULL AND client_admin_id IS NULL AND location_staff_id IS NOT NULL AND customer_id IS NULL)
    )
  ),
  
  -- Hierarchy creation validation
  -- NOTE: 'customer' tier not included as customers are QR-based without auth accounts
  CONSTRAINT user_roles_hierarchy_validation CHECK (
    (tier = 'superadmin' AND created_by_tier IS NULL) OR -- Superadmin is bootstrap
    (tier = 'client_admin' AND created_by_tier = 'superadmin') OR
    (tier = 'location_staff' AND created_by_tier = 'client_admin')
  ),
  
  UNIQUE(user_id)
);

-- ============================================================================
-- STEP 2: USER ROLE VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate user role creation
CREATE OR REPLACE FUNCTION validate_user_role_creation()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_tier public.user_tier;
  v_creator_exists BOOLEAN := false;
BEGIN
  -- Log the creation attempt
  INSERT INTO hierarchy_audit_log (
    violation_type, attempted_action, target_table, target_data
  ) VALUES (
    'user_role_creation', 'INSERT', 'user_roles', 
    jsonb_build_object('user_id', NEW.user_id, 'tier', NEW.tier)
  );
  
  IF TG_OP = 'INSERT' THEN
    -- For bootstrap superadmin, allow without creator validation
    IF NEW.tier = 'superadmin' AND NEW.created_by_user_id IS NULL THEN
      -- This is the bootstrap superadmin creation
      RETURN NEW;
    END IF;
    
    -- Validate creator exists and has proper tier
    IF NEW.created_by_user_id IS NOT NULL THEN
      SELECT tier INTO v_creator_tier 
      FROM user_roles 
      WHERE user_id = NEW.created_by_user_id 
      AND is_active = true;
      
      IF v_creator_tier IS NULL THEN
        RAISE EXCEPTION 'Creator user not found or inactive in user_roles table';
      END IF;
      
      -- Validate hierarchy creation rules
      -- NOTE: 'customer' tier not supported as customers are QR-based without auth accounts
      IF NOT (
        (NEW.tier = 'client_admin' AND v_creator_tier = 'superadmin') OR
        (NEW.tier = 'location_staff' AND v_creator_tier = 'client_admin')
      ) THEN
        RAISE EXCEPTION 'Invalid hierarchy: % cannot create %. Note: customer tier not supported (QR-based)', v_creator_tier, NEW.tier;
      END IF;
      
      -- Set the creator tier
      NEW.created_by_tier := v_creator_tier;
    END IF;
    
    -- Validate tier-specific reference exists
    CASE NEW.tier
      WHEN 'superadmin' THEN
        IF NEW.superadmin_id IS NULL THEN
          RAISE EXCEPTION 'superadmin_id is required for superadmin tier';
        END IF;
      WHEN 'client_admin' THEN
        IF NEW.client_admin_id IS NULL THEN
          RAISE EXCEPTION 'client_admin_id is required for client_admin tier';
        END IF;
      WHEN 'location_staff' THEN
        IF NEW.location_staff_id IS NULL THEN
          RAISE EXCEPTION 'location_staff_id is required for location_staff tier';
        END IF;
      WHEN 'customer' THEN
        RAISE EXCEPTION 'customer tier not supported - customers are QR-based without auth accounts';
    END CASE;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply user role validation trigger
DROP TRIGGER IF EXISTS user_role_creation_trigger ON public.user_roles;
CREATE TRIGGER user_role_creation_trigger
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_role_creation();

-- ============================================================================
-- STEP 3: USER ROLE HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user's tier
CREATE OR REPLACE FUNCTION get_current_user_tier()
RETURNS public.user_tier AS $$
DECLARE
  user_tier_result public.user_tier;
BEGIN
  SELECT tier INTO user_tier_result
  FROM user_roles 
  WHERE user_id = auth.uid() 
  AND is_active = true;
  
  RETURN user_tier_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role details
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TABLE (
  tier public.user_tier,
  superadmin_id UUID,
  client_admin_id UUID,
  location_staff_id UUID,
  customer_id UUID,
  permissions JSONB
) AS $$
BEGIN
  RETURN QUERY 
  SELECT ur.tier, ur.superadmin_id, ur.client_admin_id, ur.location_staff_id, ur.customer_id, ur.permissions
  FROM user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific tier
CREATE OR REPLACE FUNCTION user_has_tier(p_user_id UUID, p_tier public.user_tier)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = p_user_id 
    AND tier = p_tier 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user role entry
CREATE OR REPLACE FUNCTION create_user_role(
  p_user_id UUID,
  p_tier public.user_tier,
  p_superadmin_id UUID DEFAULT NULL,
  p_client_admin_id UUID DEFAULT NULL,
  p_location_staff_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_creator_user_id UUID DEFAULT NULL,
  p_permissions JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_user_role_id UUID;
BEGIN
  INSERT INTO user_roles (
    user_id, tier, superadmin_id, client_admin_id, 
    location_staff_id, customer_id, created_by_user_id, permissions
  ) VALUES (
    p_user_id, p_tier, p_superadmin_id, p_client_admin_id,
    p_location_staff_id, p_customer_id, p_creator_user_id, p_permissions
  ) RETURNING id INTO v_user_role_id;
  
  RETURN v_user_role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: AUTOMATIC USER ROLE CREATION TRIGGERS
-- ============================================================================

-- Function to auto-create user role when superadmin is created
CREATE OR REPLACE FUNCTION auto_create_superadmin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_roles (
      user_id, tier, superadmin_id, created_by_user_id, created_by_tier
    ) VALUES (
      NEW.user_id, 'superadmin', NEW.id, NULL, NULL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create user role when client admin is created
CREATE OR REPLACE FUNCTION auto_create_client_admin_role()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get creator's user_id from superadmin
    SELECT user_id INTO v_creator_user_id 
    FROM superadmins 
    WHERE id = NEW.created_by_superadmin_id;
    
    INSERT INTO user_roles (
      user_id, tier, client_admin_id, created_by_user_id, created_by_tier
    ) VALUES (
      NEW.user_id, 'client_admin', NEW.id, v_creator_user_id, 'superadmin'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create user role when location staff is created
CREATE OR REPLACE FUNCTION auto_create_location_staff_role()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get creator's user_id from client admin
    SELECT user_id INTO v_creator_user_id 
    FROM client_admins 
    WHERE id = NEW.created_by_client_admin_id;
    
    INSERT INTO user_roles (
      user_id, tier, location_staff_id, created_by_user_id, created_by_tier
    ) VALUES (
      NEW.user_id, 'location_staff', NEW.id, v_creator_user_id, 'client_admin'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create user role when customer is created
-- NOTE: Customers in this system are QR-code based without auth.users accounts
-- They are identified via QR codes and customer numbers, not login credentials
-- Therefore, no user_roles entry is created for customers
CREATE OR REPLACE FUNCTION auto_create_customer_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Customers are QR-based without auth accounts - no role creation needed
  -- This function exists for future compatibility if customer accounts are added
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic user role creation
DROP TRIGGER IF EXISTS auto_superadmin_role_trigger ON public.superadmins;
CREATE TRIGGER auto_superadmin_role_trigger
  AFTER INSERT ON public.superadmins
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_superadmin_role();

DROP TRIGGER IF EXISTS auto_client_admin_role_trigger ON public.client_admins;
CREATE TRIGGER auto_client_admin_role_trigger
  AFTER INSERT ON public.client_admins
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_client_admin_role();

DROP TRIGGER IF EXISTS auto_location_staff_role_trigger ON public.location_staff;
CREATE TRIGGER auto_location_staff_role_trigger
  AFTER INSERT ON public.location_staff
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_location_staff_role();

DROP TRIGGER IF EXISTS auto_customer_role_trigger ON public.customers;
CREATE TRIGGER auto_customer_role_trigger
  AFTER INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_customer_role();

-- ============================================================================
-- STEP 5: INDEXES FOR PERFORMANCE
-- ============================================================================

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tier ON public.user_roles(tier);
CREATE INDEX IF NOT EXISTS idx_user_roles_created_by ON public.user_roles(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_superadmin_id ON public.user_roles(superadmin_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_client_admin_id ON public.user_roles(client_admin_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_location_staff_id ON public.user_roles(location_staff_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_customer_id ON public.user_roles(customer_id);

-- ============================================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policy for user_roles
CREATE POLICY "user_roles_access" ON public.user_roles
  FOR ALL
  USING (
    -- Users can see their own role
    user_id = auth.uid() OR
    -- Superadmins can see all roles
    is_current_user_superadmin() OR
    -- Client admins can see roles within their business hierarchy
    (
      tier IN ('location_staff', 'customer') AND
      EXISTS (
        SELECT 1 FROM client_admins ca
        JOIN locations l ON (
          (tier = 'location_staff' AND l.id = (SELECT location_id FROM location_staff WHERE id = user_roles.location_staff_id)) OR
          (tier = 'customer' AND l.id = (SELECT location_id FROM customers WHERE id = user_roles.customer_id))
        )
        WHERE ca.user_id = auth.uid() 
        AND ca.client_id = l.client_id 
        AND ca.is_active = true
      )
    ) OR
    -- Location staff can see customer roles at their location
    (
      tier = 'customer' AND
      EXISTS (
        SELECT 1 FROM location_staff ls
        JOIN customers c ON c.id = user_roles.customer_id
        WHERE ls.user_id = auth.uid() 
        AND ls.location_id = c.location_id
        AND ls.is_active = true
      )
    )
  );

-- ============================================================================
-- STEP 7: TESTING FUNCTIONS
-- ============================================================================

-- Function to test user roles setup
CREATE OR REPLACE FUNCTION test_user_roles_setup()
RETURNS TABLE (
  test_name TEXT,
  status TEXT,
  message TEXT
) AS $$
BEGIN
  -- Test 1: Check if user_roles table exists
  RETURN QUERY SELECT 
    'user_roles_table_exists'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'user_roles' AND table_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'User roles table exists'::TEXT;
  
  -- Test 2: Check if tier enum is properly referenced
  RETURN QUERY SELECT 
    'tier_enum_constraint'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_roles' AND column_name = 'tier' 
      AND udt_name = 'user_tier'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Tier enum constraint exists'::TEXT;
  
  -- Test 3: Check helper functions exist
  RETURN QUERY SELECT 
    'helper_functions_exist'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'get_current_user_tier' AND routine_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Helper functions exist'::TEXT;
  
  -- Test 4: Check RLS enabled
  RETURN QUERY SELECT 
    'user_roles_rls_enabled'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'user_roles' AND rowsecurity = true
    ) THEN 'PASS' ELSE 'FAIL' END,
    'User roles RLS enabled'::TEXT;
  
  -- Test 5: Check automatic triggers exist
  RETURN QUERY SELECT 
    'auto_role_triggers'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'auto_superadmin_role_trigger'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Automatic role creation triggers exist'::TEXT;
    
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ USER ROLES TRACKING SYSTEM SETUP COMPLETE';
  RAISE NOTICE '🔧 Table created: user_roles';
  RAISE NOTICE '🎯 Functions created: get_current_user_tier, get_current_user_role, user_has_tier';
  RAISE NOTICE '🔒 RLS enabled with hierarchy-based access control';
  RAISE NOTICE '🛡️ Automatic role creation triggers for all user types';
  RAISE NOTICE '🏗️ Central role tracking for efficient tier lookups';
  RAISE NOTICE '📊 Run SELECT * FROM test_user_roles_setup(); to validate';
  RAISE NOTICE '⚡ Performance optimized with comprehensive indexing';
END $$; 
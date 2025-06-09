-- ============================================================================
-- TIER 3: LOCATION & LOCATION STAFF TABLES
-- ============================================================================
-- This script creates Tier 3 of the hierarchy: Locations and Location Staff
-- Enforces that only client admins can create these entities within their client
-- ============================================================================

-- ============================================================================
-- STEP 1: LOCATIONS TABLE (Tier 3 - Physical Stores)
-- ============================================================================

-- Locations table - Physical restaurant locations
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  phone TEXT,
  email TEXT,
  
  -- Location settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  timezone TEXT DEFAULT 'UTC',
  settings JSONB DEFAULT '{}',
  
  -- Hierarchy enforcement - CRITICAL  
  created_by_client_admin_id UUID NOT NULL REFERENCES public.client_admins(id) ON DELETE RESTRICT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT locations_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT locations_name_length CHECK (length(name) >= 2),
  CONSTRAINT locations_address_length CHECK (length(address) >= 5),
  CONSTRAINT locations_timezone_valid CHECK (timezone ~ '^[A-Za-z_/]+$'),
  UNIQUE(client_id, name)
);

-- ============================================================================
-- STEP 2: LOCATION STAFF TABLE (Tier 3 - Users)
-- ============================================================================

-- Location Staff table (Tier 3) - Store managers and POS users
CREATE TABLE IF NOT EXISTS public.location_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('manager', 'staff', 'cashier')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Hierarchy enforcement - CRITICAL
  created_by_client_admin_id UUID NOT NULL REFERENCES public.client_admins(id) ON DELETE RESTRICT,
  
  -- Staff permissions
  permissions JSONB DEFAULT '{
    "can_create_customers": true,
    "can_add_stamps": true,
    "can_redeem_rewards": true,
    "can_view_customer_data": true
  }',
  
  -- Metadata  
  hired_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT location_staff_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT location_staff_name_length CHECK (length(name) >= 2),
  CONSTRAINT location_staff_wage_positive CHECK (hourly_wage IS NULL OR hourly_wage > 0),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- ============================================================================
-- STEP 3: LOCATION VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate location creation
CREATE OR REPLACE FUNCTION validate_location_creation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Validate creator is active client admin for this client
    IF NOT EXISTS (
      SELECT 1 FROM client_admins ca 
      WHERE ca.id = NEW.created_by_client_admin_id 
      AND ca.client_id = NEW.client_id
      AND ca.is_active = true
    ) THEN
      RAISE EXCEPTION 'Location creator must belong to the same client';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate location staff creation
CREATE OR REPLACE FUNCTION validate_location_staff_creation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Validate creator is active client admin for this client
    IF NOT EXISTS (
      SELECT 1 FROM client_admins 
      WHERE id = NEW.created_by_client_admin_id 
      AND client_id = NEW.client_id
      AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Only active client admins can create location staff for their client';
    END IF;
    
    -- Validate location belongs to same client
    IF NOT EXISTS (
      SELECT 1 FROM locations 
      WHERE id = NEW.location_id 
      AND client_id = NEW.client_id
    ) THEN
      RAISE EXCEPTION 'Location staff must be assigned to location within same client';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation triggers
DROP TRIGGER IF EXISTS location_creation_trigger ON public.locations;
CREATE TRIGGER location_creation_trigger
  BEFORE INSERT ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION validate_location_creation();

DROP TRIGGER IF EXISTS location_staff_creation_trigger ON public.location_staff;
CREATE TRIGGER location_staff_creation_trigger
  BEFORE INSERT ON public.location_staff
  FOR EACH ROW
  EXECUTE FUNCTION validate_location_staff_creation();

-- ============================================================================
-- STEP 4: LOCATION HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user's location staff record
CREATE OR REPLACE FUNCTION get_current_location_staff()
RETURNS TABLE (
  id UUID,
  location_id UUID,
  client_id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT ls.id, ls.location_id, ls.client_id, ls.email, ls.name, ls.role, ls.permissions
  FROM location_staff ls
  WHERE ls.user_id = auth.uid() 
  AND ls.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is location staff for specific location
CREATE OR REPLACE FUNCTION is_current_user_location_staff(p_location_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM location_staff 
    WHERE user_id = auth.uid() 
    AND location_id = p_location_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get locations for current user (with permissions check)
CREATE OR REPLACE FUNCTION get_user_accessible_locations()
RETURNS TABLE (
  id UUID,
  client_id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  is_active BOOLEAN,
  access_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Superadmins see all locations
  SELECT l.id, l.client_id, l.name, l.address, l.city, l.state, l.is_active, 'superadmin'::TEXT
  FROM locations l
  WHERE is_current_user_superadmin()
  
  UNION ALL
  
  -- Client admins see their client's locations
  SELECT l.id, l.client_id, l.name, l.address, l.city, l.state, l.is_active, 'client_admin'::TEXT
  FROM locations l
  INNER JOIN client_admins ca ON ca.client_id = l.client_id
  WHERE ca.user_id = auth.uid() AND ca.is_active = true
  AND NOT is_current_user_superadmin()
  
  UNION ALL
  
  -- Location staff see their assigned location
  SELECT l.id, l.client_id, l.name, l.address, l.city, l.state, l.is_active, 'location_staff'::TEXT
  FROM locations l
  INNER JOIN location_staff ls ON ls.location_id = l.id
  WHERE ls.user_id = auth.uid() AND ls.is_active = true
  AND NOT is_current_user_superadmin()
  AND NOT EXISTS (
    SELECT 1 FROM client_admins ca 
    WHERE ca.user_id = auth.uid() AND ca.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get location details by ID (with permissions check)
CREATE OR REPLACE FUNCTION get_location_details(p_location_id UUID)
RETURNS TABLE (
  id UUID,
  client_id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN,
  settings JSONB,
  store_hours JSONB
) AS $$
BEGIN
  -- Check if current user has access to this location
  IF NOT (
    is_current_user_superadmin() OR 
    EXISTS (
      SELECT 1 FROM client_admins ca 
      INNER JOIN locations l ON l.client_id = ca.client_id
      WHERE ca.user_id = auth.uid() AND ca.is_active = true 
      AND l.id = p_location_id
    ) OR
    is_current_user_location_staff(p_location_id)
  ) THEN
    RAISE EXCEPTION 'Access denied to location %', p_location_id;
  END IF;
  
  RETURN QUERY
  SELECT l.id, l.client_id, l.name, l.address, l.city, l.state, l.phone, l.email, 
         l.is_active, l.settings, l.store_hours
  FROM locations l
  WHERE l.id = p_location_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Locations indexes
CREATE INDEX IF NOT EXISTS idx_locations_client_id ON public.locations(client_id);
CREATE INDEX IF NOT EXISTS idx_locations_created_by ON public.locations(created_by_client_admin_id);
CREATE INDEX IF NOT EXISTS idx_locations_active ON public.locations(is_active);
CREATE INDEX IF NOT EXISTS idx_locations_city_state ON public.locations(city, state);
CREATE INDEX IF NOT EXISTS idx_locations_name ON public.locations(name);

-- Location Staff indexes
CREATE INDEX IF NOT EXISTS idx_location_staff_user_id ON public.location_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_location_id ON public.location_staff(location_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_client_id ON public.location_staff(client_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_created_by ON public.location_staff(created_by_client_admin_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_email ON public.location_staff(email);
CREATE INDEX IF NOT EXISTS idx_location_staff_active ON public.location_staff(is_active);
CREATE INDEX IF NOT EXISTS idx_location_staff_role ON public.location_staff(role);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_location_staff_user_location ON public.location_staff(user_id, location_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_location_active ON public.location_staff(location_id, is_active);
CREATE INDEX IF NOT EXISTS idx_locations_client_active ON public.locations(client_id, is_active);

-- ============================================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on locations table
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on location_staff table
ALTER TABLE public.location_staff ENABLE ROW LEVEL SECURITY;

-- RLS Policy for locations: hierarchy-based access
CREATE POLICY "locations_access" ON public.locations
  FOR ALL
  USING (
    -- Superadmins can see all locations
    is_current_user_superadmin() OR
    -- Client admins can see their client's locations
    client_id IN (
      SELECT client_id FROM client_admins 
      WHERE user_id = auth.uid() AND is_active = true
    ) OR
    -- Location staff can see their assigned location
    id IN (
      SELECT location_id FROM location_staff 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policy for location staff: hierarchy-based access
CREATE POLICY "location_staff_access" ON public.location_staff
  FOR ALL
  USING (
    -- Superadmins can see all location staff
    is_current_user_superadmin() OR
    -- Client admins can see staff in their client's locations
    client_id IN (
      SELECT client_id FROM client_admins 
      WHERE user_id = auth.uid() AND is_active = true
    ) OR
    -- Location staff can see other staff at their location
    location_id IN (
      SELECT location_id FROM location_staff 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================================================
-- STEP 7: TESTING FUNCTIONS
-- ============================================================================

-- Function to test location tables setup
CREATE OR REPLACE FUNCTION test_location_tables_setup()
RETURNS TABLE (
  test_name TEXT,
  status TEXT,
  message TEXT
) AS $$
BEGIN
  -- Test 1: Check if locations table exists
  RETURN QUERY SELECT 
    'locations_table_exists'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'locations' AND table_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Locations table exists'::TEXT;
  
  -- Test 2: Check if location_staff table exists
  RETURN QUERY SELECT 
    'location_staff_table_exists'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'location_staff' AND table_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Location staff table exists'::TEXT;
  
  -- Test 3: Check foreign key constraints
  RETURN QUERY SELECT 
    'locations_fk_constraints'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      WHERE tc.table_name = 'locations' 
      AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Locations foreign key constraints exist'::TEXT;
    
  -- Test 4: Check location helper functions
  RETURN QUERY SELECT 
    'location_helper_functions'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'get_current_location_staff' AND routine_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Location helper functions exist'::TEXT;
  
  -- Test 5: Check RLS is enabled
  RETURN QUERY SELECT 
    'locations_rls_enabled'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'locations' AND rowsecurity = true
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Locations RLS enabled'::TEXT;
  
  -- Test 6: Check validation triggers exist
  RETURN QUERY SELECT 
    'location_validation_triggers'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'location_creation_trigger'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Location validation triggers exist'::TEXT;
    
  -- Test 7: Check hierarchy constraints
  RETURN QUERY SELECT 
    'location_hierarchy_constraints'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      WHERE tc.table_name = 'location_staff'
      AND tc.constraint_name LIKE '%client_id%'
      AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Location hierarchy constraints exist'::TEXT;
    
END;
$$ LANGUAGE plpgsql;

-- Function to test location creation (requires client admin)
CREATE OR REPLACE FUNCTION test_location_creation(
  p_location_name TEXT DEFAULT 'Test Location',
  p_client_id UUID DEFAULT NULL
) RETURNS TABLE (
  step TEXT,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  v_client_admin_record RECORD;
  v_location_id UUID;
  v_error_message TEXT;
  v_test_client_id UUID := p_client_id;
BEGIN
  -- Step 1: Check if current user is client admin
  SELECT * INTO v_client_admin_record 
  FROM get_current_client_admin() 
  LIMIT 1;
  
  IF v_client_admin_record.id IS NULL THEN
    RETURN QUERY SELECT 
      'client_admin_check'::TEXT,
      'FAIL'::TEXT,
      'Current user is not a client admin'::TEXT;
    RETURN;
  END IF;
  
  -- Use the client from current user if not specified
  IF v_test_client_id IS NULL THEN
    v_test_client_id := v_client_admin_record.client_id;
  END IF;
  
  RETURN QUERY SELECT 
    'client_admin_check'::TEXT,
    'PASS'::TEXT,
    'Current user is client admin for client: ' || v_test_client_id::TEXT;
  
  -- Step 2: Try to create a test location
  BEGIN
    INSERT INTO locations (
      client_id, name, address, city, state, created_by_client_admin_id
    ) VALUES (
      v_test_client_id, p_location_name, '123 Test St', 'Test City', 'TS', v_client_admin_record.id
    ) RETURNING id INTO v_location_id;
    
    RETURN QUERY SELECT 
      'location_creation'::TEXT,
      'PASS'::TEXT,
      'Location created successfully: ' || v_location_id::TEXT;
      
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
      RETURN QUERY SELECT 
        'location_creation'::TEXT,
        'FAIL'::TEXT,
        'Location creation failed: ' || v_error_message;
      RETURN;
  END;
  
  -- Step 3: Verify location exists
  IF EXISTS (SELECT 1 FROM locations WHERE id = v_location_id) THEN
    RETURN QUERY SELECT 
      'location_verification'::TEXT,
      'PASS'::TEXT,
      'Location exists in database'::TEXT;
  ELSE
    RETURN QUERY SELECT 
      'location_verification'::TEXT,
      'FAIL'::TEXT,
      'Location not found in database'::TEXT;
  END IF;
  
  -- Step 4: Clean up (delete test location)
  DELETE FROM locations WHERE id = v_location_id;
  
  RETURN QUERY SELECT 
    'cleanup'::TEXT,
    'PASS'::TEXT,
    'Test location cleaned up'::TEXT;
    
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ TIER 3 LOCATION TABLES SETUP COMPLETE';
  RAISE NOTICE '🔧 Tables created: locations, location_staff';
  RAISE NOTICE '🎯 Functions created: get_current_location_staff, is_current_user_location_staff, get_user_accessible_locations';
  RAISE NOTICE '🔒 RLS enabled with hierarchy-based policies';
  RAISE NOTICE '🛡️ Validation triggers ensure only client admins can create locations within their client';
  RAISE NOTICE '📊 Run SELECT * FROM test_location_tables_setup(); to validate';
  RAISE NOTICE '🧪 Run SELECT * FROM test_location_creation(); to test (requires client admin)';
END $$; 
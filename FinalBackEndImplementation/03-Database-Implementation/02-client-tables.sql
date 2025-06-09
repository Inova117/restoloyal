-- ============================================================================
-- TIER 2: CLIENT & CLIENT ADMIN TABLES
-- ============================================================================
-- This script creates Tier 2 of the hierarchy: Clients (businesses) and Client Admins
-- Enforces that only superadmins can create these entities
-- ============================================================================

-- ============================================================================
-- STEP 1: CLIENTS TABLE (Tier 2 - Businesses)
-- ============================================================================

-- Clients table (Tier 2) - Restaurant chains/businesses
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  
  -- Business details
  business_type TEXT DEFAULT 'restaurant_chain' CHECK (business_type IN ('restaurant_chain', 'single_restaurant', 'franchise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Hierarchy enforcement - CRITICAL
  created_by_superadmin_id UUID NOT NULL REFERENCES public.superadmins(id) ON DELETE RESTRICT,
  
  -- Business settings
  settings JSONB DEFAULT '{
    "stamps_required_for_reward": 10,
    "allow_cross_location_stamps": true,
    "auto_expire_stamps_days": 365,
    "customer_can_view_history": true
  }',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT clients_slug_format CHECK (slug ~ '^[a-z0-9\-]+$'),
  CONSTRAINT clients_slug_length CHECK (length(slug) >= 3 AND length(slug) <= 50),
  CONSTRAINT clients_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT clients_name_length CHECK (length(name) >= 2)
);

-- ============================================================================
-- STEP 2: CLIENT ADMINS TABLE (Tier 2 - Users)
-- ============================================================================

-- Client Admins table - Users who manage Tier 2 businesses
CREATE TABLE IF NOT EXISTS public.client_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'manager')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Hierarchy enforcement - CRITICAL
  created_by_superadmin_id UUID NOT NULL REFERENCES public.superadmins(id) ON DELETE RESTRICT,
  
  -- Client admin permissions
  permissions JSONB DEFAULT '{
    "can_create_locations": true,
    "can_create_staff": true,
    "can_view_analytics": true,
    "can_manage_settings": true,
    "can_manage_rewards": true,
    "can_export_data": true
  }',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT client_admins_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT client_admins_name_length CHECK (length(name) >= 2),
  UNIQUE(user_id, client_id),
  UNIQUE(email)
);

-- ============================================================================
-- STEP 3: CLIENT VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate client creation
CREATE OR REPLACE FUNCTION validate_client_creation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Log the creation attempt
    PERFORM log_hierarchy_violation(
      'client_creation',
      'INSERT',
      auth.uid(),
      'clients',
      jsonb_build_object('name', NEW.name, 'slug', NEW.slug, 'created_by', NEW.created_by_superadmin_id),
      'Client creation attempt'
    );
    
    -- Validate creator is active superadmin
    IF NOT EXISTS (
      SELECT 1 FROM superadmins 
      WHERE id = NEW.created_by_superadmin_id 
      AND is_active = true
    ) THEN
      PERFORM log_hierarchy_violation(
        'hierarchy_violation',
        'client_creation_invalid_creator',
        auth.uid(),
        'clients',
        jsonb_build_object('invalid_creator_id', NEW.created_by_superadmin_id),
        'Invalid superadmin creator for client'
      );
      RAISE EXCEPTION 'Only active superadmins can create clients';
    END IF;
    
    -- Validate slug uniqueness (additional check)
    IF EXISTS (SELECT 1 FROM clients WHERE slug = NEW.slug AND id != NEW.id) THEN
      RAISE EXCEPTION 'Client slug % already exists', NEW.slug;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate client admin creation
CREATE OR REPLACE FUNCTION validate_client_admin_creation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Log the creation attempt
    PERFORM log_hierarchy_violation(
      'client_admin_creation',
      'INSERT',
      auth.uid(),
      'client_admins',
      jsonb_build_object('email', NEW.email, 'name', NEW.name, 'client_id', NEW.client_id),
      'Client admin creation attempt'
    );
    
    -- Validate creator is active superadmin
    IF NOT EXISTS (
      SELECT 1 FROM superadmins 
      WHERE id = NEW.created_by_superadmin_id 
      AND is_active = true
    ) THEN
      PERFORM log_hierarchy_violation(
        'hierarchy_violation',
        'client_admin_creation_invalid_creator',
        auth.uid(),
        'client_admins',
        jsonb_build_object('invalid_creator_id', NEW.created_by_superadmin_id),
        'Invalid superadmin creator for client admin'
      );
      RAISE EXCEPTION 'Only active superadmins can create client admins';
    END IF;
    
    -- Validate client exists and belongs to same superadmin
    IF NOT EXISTS (
      SELECT 1 FROM clients 
      WHERE id = NEW.client_id 
      AND created_by_superadmin_id = NEW.created_by_superadmin_id
      AND status = 'active'
    ) THEN
      PERFORM log_hierarchy_violation(
        'hierarchy_violation',
        'client_admin_creation_client_mismatch',
        auth.uid(),
        'client_admins',
        jsonb_build_object('client_id', NEW.client_id, 'creator_id', NEW.created_by_superadmin_id),
        'Client admin must be created by the same superadmin who created the client'
      );
      RAISE EXCEPTION 'Client admin must be created by the same superadmin who created the client';
    END IF;
    
    -- Ensure user is not already a client admin for this client
    IF EXISTS (
      SELECT 1 FROM client_admins 
      WHERE user_id = NEW.user_id 
      AND client_id = NEW.client_id 
      AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'User is already a client admin for this client';
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation triggers
DROP TRIGGER IF EXISTS client_creation_trigger ON public.clients;
CREATE TRIGGER client_creation_trigger
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION validate_client_creation();

DROP TRIGGER IF EXISTS client_admin_creation_trigger ON public.client_admins;  
CREATE TRIGGER client_admin_creation_trigger
  BEFORE INSERT ON public.client_admins
  FOR EACH ROW
  EXECUTE FUNCTION validate_client_admin_creation();

-- ============================================================================
-- STEP 4: CLIENT HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user's client admin record
CREATE OR REPLACE FUNCTION get_current_client_admin()
RETURNS TABLE (
  id UUID,
  client_id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT ca.id, ca.client_id, ca.email, ca.name, ca.role, ca.permissions
  FROM client_admins ca
  WHERE ca.user_id = auth.uid() 
  AND ca.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is client admin for specific client
CREATE OR REPLACE FUNCTION is_current_user_client_admin(p_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM client_admins 
    WHERE user_id = auth.uid() 
    AND client_id = p_client_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get client details by ID (with permissions check)
CREATE OR REPLACE FUNCTION get_client_details(p_client_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  email TEXT,
  business_type TEXT,
  status TEXT,
  settings JSONB
) AS $$
BEGIN
  -- Check if current user has access to this client
  IF NOT (
    is_current_user_superadmin() OR 
    is_current_user_client_admin(p_client_id)
  ) THEN
    RAISE EXCEPTION 'Access denied to client %', p_client_id;
  END IF;
  
  RETURN QUERY
  SELECT c.id, c.name, c.slug, c.email, c.business_type, c.status, c.settings
  FROM clients c
  WHERE c.id = p_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Clients indexes  
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by_superadmin_id);
CREATE INDEX IF NOT EXISTS idx_clients_slug ON public.clients(slug);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_business_type ON public.clients(business_type);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);

-- Client Admins indexes
CREATE INDEX IF NOT EXISTS idx_client_admins_user_id ON public.client_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_client_admins_client_id ON public.client_admins(client_id);
CREATE INDEX IF NOT EXISTS idx_client_admins_created_by ON public.client_admins(created_by_superadmin_id);
CREATE INDEX IF NOT EXISTS idx_client_admins_email ON public.client_admins(email);
CREATE INDEX IF NOT EXISTS idx_client_admins_active ON public.client_admins(is_active);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_client_admins_user_client ON public.client_admins(user_id, client_id);
CREATE INDEX IF NOT EXISTS idx_clients_superadmin_status ON public.clients(created_by_superadmin_id, status);

-- ============================================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Enable RLS on client_admins table
ALTER TABLE public.client_admins ENABLE ROW LEVEL SECURITY;

-- RLS Policy for clients: superadmins see all, client admins see their own
CREATE POLICY "clients_access" ON public.clients
  FOR ALL
  USING (
    -- Superadmins can see all clients
    is_current_user_superadmin() OR
    -- Client admins can see their client
    id IN (
      SELECT client_id FROM client_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policy for client admins: superadmins see all, client admins see within their client
CREATE POLICY "client_admins_access" ON public.client_admins
  FOR ALL
  USING (
    -- Superadmins can see all client admins
    is_current_user_superadmin() OR
    -- Client admins can see other admins in their client
    client_id IN (
      SELECT client_id FROM client_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================================================
-- STEP 7: TESTING FUNCTIONS
-- ============================================================================

-- Function to test client tables setup
CREATE OR REPLACE FUNCTION test_client_tables_setup()
RETURNS TABLE (
  test_name TEXT,
  status TEXT,
  message TEXT
) AS $$
BEGIN
  -- Test 1: Check if clients table exists
  RETURN QUERY SELECT 
    'clients_table_exists'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'clients' AND table_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Clients table exists'::TEXT;
  
  -- Test 2: Check if client_admins table exists
  RETURN QUERY SELECT 
    'client_admins_table_exists'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'client_admins' AND table_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Client admins table exists'::TEXT;
  
  -- Test 3: Check foreign key constraints
  RETURN QUERY SELECT 
    'clients_fk_constraints'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      WHERE tc.table_name = 'clients' 
      AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Clients foreign key constraints exist'::TEXT;
    
  -- Test 4: Check client admin helper functions
  RETURN QUERY SELECT 
    'client_helper_functions'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'get_current_client_admin' AND routine_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Client helper functions exist'::TEXT;
  
  -- Test 5: Check RLS is enabled
  RETURN QUERY SELECT 
    'clients_rls_enabled'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'clients' AND rowsecurity = true
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Clients RLS enabled'::TEXT;
  
  -- Test 6: Check validation triggers exist
  RETURN QUERY SELECT 
    'client_validation_triggers'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'client_creation_trigger'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Client validation triggers exist'::TEXT;
    
END;
$$ LANGUAGE plpgsql;

-- Function to test client creation (requires superadmin)
CREATE OR REPLACE FUNCTION test_client_creation(
  p_client_name TEXT DEFAULT 'Test Restaurant Chain',
  p_client_slug TEXT DEFAULT 'test-restaurant-chain'
) RETURNS TABLE (
  step TEXT,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  v_superadmin_id UUID;
  v_client_id UUID;
  v_error_message TEXT;
BEGIN
  -- Step 1: Check if current user is superadmin
  SELECT get_current_superadmin() INTO v_superadmin_id;
  
  IF v_superadmin_id IS NULL THEN
    RETURN QUERY SELECT 
      'superadmin_check'::TEXT,
      'FAIL'::TEXT,
      'Current user is not a superadmin'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    'superadmin_check'::TEXT,
    'PASS'::TEXT,
    'Current user is superadmin: ' || v_superadmin_id::TEXT;
  
  -- Step 2: Try to create a test client
  BEGIN
    INSERT INTO clients (
      name, slug, email, created_by_superadmin_id
    ) VALUES (
      p_client_name, p_client_slug, 'test@' || p_client_slug || '.com', v_superadmin_id
    ) RETURNING id INTO v_client_id;
    
    RETURN QUERY SELECT 
      'client_creation'::TEXT,
      'PASS'::TEXT,
      'Client created successfully: ' || v_client_id::TEXT;
      
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
      RETURN QUERY SELECT 
        'client_creation'::TEXT,
        'FAIL'::TEXT,
        'Client creation failed: ' || v_error_message;
      RETURN;
  END;
  
  -- Step 3: Verify client exists
  IF EXISTS (SELECT 1 FROM clients WHERE id = v_client_id) THEN
    RETURN QUERY SELECT 
      'client_verification'::TEXT,
      'PASS'::TEXT,
      'Client exists in database'::TEXT;
  ELSE
    RETURN QUERY SELECT 
      'client_verification'::TEXT,
      'FAIL'::TEXT,
      'Client not found in database'::TEXT;
  END IF;
  
  -- Step 4: Clean up (delete test client)
  DELETE FROM clients WHERE id = v_client_id;
  
  RETURN QUERY SELECT 
    'cleanup'::TEXT,
    'PASS'::TEXT,
    'Test client cleaned up'::TEXT;
    
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ TIER 2 CLIENT TABLES SETUP COMPLETE';
  RAISE NOTICE '🔧 Tables created: clients, client_admins';
  RAISE NOTICE '🎯 Functions created: get_current_client_admin, is_current_user_client_admin, get_client_details';
  RAISE NOTICE '🔒 RLS enabled with hierarchy-based policies';
  RAISE NOTICE '🛡️ Validation triggers ensure only superadmins can create clients';
  RAISE NOTICE '📊 Run SELECT * FROM test_client_tables_setup(); to validate';
  RAISE NOTICE '🧪 Run SELECT * FROM test_client_creation(); to test (requires superadmin)';
END $$; 
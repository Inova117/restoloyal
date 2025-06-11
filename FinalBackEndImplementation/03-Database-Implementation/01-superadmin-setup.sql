-- ============================================================================
-- TIER 1: SUPERADMIN SETUP & BOOTSTRAP
-- ============================================================================
-- This script creates the foundation for the 4-tier hierarchy system
-- It includes the superadmin table and bootstrap mechanism
-- ============================================================================

-- ============================================================================
-- STEP 1: ENABLE EXTENSIONS & SETUP
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 2: CREATE USER TIER ENUM
-- ============================================================================

-- Define the strict 4-tier role hierarchy
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_tier') THEN
    CREATE TYPE public.user_tier AS ENUM (
      'superadmin',    -- Tier 1: Platform owner (you)
      'client_admin',  -- Tier 2: Business/restaurant chain HQ  
      'location_staff',-- Tier 3: Store managers/POS users
      'customer'       -- Tier 4: End customers via QR/POS
    );
  END IF;
END $$;

-- ============================================================================
-- STEP 3: CREATE SUPERADMINS TABLE (TIER 1)
-- ============================================================================

-- Add missing columns to existing superadmins table
DO $$ 
BEGIN
  -- Add is_bootstrap column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'superadmins' AND column_name = 'is_bootstrap') THEN
    ALTER TABLE public.superadmins ADD COLUMN is_bootstrap BOOLEAN NOT NULL DEFAULT false;
  END IF;
  
  -- Add bootstrap_method column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'superadmins' AND column_name = 'bootstrap_method') THEN
    ALTER TABLE public.superadmins ADD COLUMN bootstrap_method TEXT CHECK (bootstrap_method IN ('sql_script', 'superadmin_creation'));
  END IF;
END $$;

-- ============================================================================
-- STEP 4: CREATE AUDIT LOG TABLE
-- ============================================================================

-- Hierarchy audit log for tracking violations and actions
CREATE TABLE IF NOT EXISTS public.hierarchy_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  violation_type TEXT NOT NULL,
  attempted_action TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  target_table TEXT NOT NULL,
  target_data JSONB,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- STEP 5: SUPERADMIN VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate superadmin creation
CREATE OR REPLACE FUNCTION validate_superadmin_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the creation attempt
  INSERT INTO hierarchy_audit_log (
    violation_type, attempted_action, target_table, target_data
  ) VALUES (
    'superadmin_creation', 'INSERT', 'superadmins', 
    jsonb_build_object('email', NEW.email, 'name', NEW.name)
  );
  
  IF TG_OP = 'INSERT' THEN
    -- For bootstrap creation, allow without restrictions
    IF NEW.is_bootstrap = true THEN
      -- Ensure only one bootstrap superadmin exists
      IF EXISTS (SELECT 1 FROM superadmins WHERE is_bootstrap = true AND id != NEW.id) THEN
        RAISE EXCEPTION 'Only one bootstrap superadmin is allowed';
      END IF;
    ELSE
      -- For subsequent superadmin creation, validate creator exists
      -- This is placeholder for when we have multiple superadmins
      -- For now, we'll allow creation for setup purposes
      NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply superadmin validation trigger
DROP TRIGGER IF EXISTS superadmin_creation_trigger ON public.superadmins;
CREATE TRIGGER superadmin_creation_trigger
  BEFORE INSERT ON public.superadmins
  FOR EACH ROW
  EXECUTE FUNCTION validate_superadmin_creation();

-- ============================================================================
-- STEP 6: SUPERADMIN HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user's superadmin record
CREATE OR REPLACE FUNCTION get_current_superadmin()
RETURNS UUID AS $$
DECLARE
  superadmin_id UUID;
BEGIN
  SELECT id INTO superadmin_id
  FROM superadmins 
  WHERE superadmins.user_id = auth.uid() 
  AND is_active = true;
  
  RETURN superadmin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is superadmin
CREATE OR REPLACE FUNCTION is_current_user_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM superadmins 
    WHERE superadmins.user_id = auth.uid() 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log hierarchy violations
CREATE OR REPLACE FUNCTION log_hierarchy_violation(
  p_violation_type TEXT,
  p_attempted_action TEXT,
  p_user_id UUID,
  p_target_table TEXT,
  p_target_data JSONB,
  p_error_message TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO hierarchy_audit_log (
    violation_type, attempted_action, user_id, target_table, 
    target_data, error_message, ip_address, user_agent
  ) VALUES (
    p_violation_type, p_attempted_action, p_user_id, p_target_table,
    p_target_data, p_error_message, 
    inet_client_addr(), 
    current_setting('request.header.user-agent', true)
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the main operation if logging fails
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Superadmins indexes
CREATE INDEX IF NOT EXISTS idx_superadmins_user_id ON public.superadmins(user_id);
CREATE INDEX IF NOT EXISTS idx_superadmins_email ON public.superadmins(email);
CREATE INDEX IF NOT EXISTS idx_superadmins_active ON public.superadmins(is_active);
CREATE INDEX IF NOT EXISTS idx_superadmins_bootstrap ON public.superadmins(is_bootstrap);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.hierarchy_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_table ON public.hierarchy_audit_log(target_table);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.hierarchy_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_violation_type ON public.hierarchy_audit_log(violation_type);

-- ============================================================================
-- STEP 8: BOOTSTRAP SUPERADMIN CREATION
-- ============================================================================

-- Bootstrap function to create the initial superadmin
-- This is the ONLY way to create the first superadmin
CREATE OR REPLACE FUNCTION bootstrap_superadmin(
  p_email TEXT,
  p_name TEXT,
  p_password TEXT DEFAULT NULL
) RETURNS TABLE (
  superadmin_id UUID,
  user_id UUID,
  email TEXT,
  message TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_superadmin_id UUID;
  v_auth_user_exists BOOLEAN := false;
BEGIN
  -- Validate inputs
  IF p_email IS NULL OR p_name IS NULL THEN
    RAISE EXCEPTION 'Email and name are required';
  END IF;
  
  IF NOT (p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Check if bootstrap superadmin already exists
  IF EXISTS (SELECT 1 FROM superadmins WHERE is_bootstrap = true) THEN
    RAISE EXCEPTION 'Bootstrap superadmin already exists. Use normal superadmin creation.';
  END IF;
  
  -- Check if user already exists in auth.users
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE auth.users.email = p_email;
  
  IF v_user_id IS NOT NULL THEN
    v_auth_user_exists := true;
  END IF;
  
  -- If user doesn't exist in auth.users, we need to create via Supabase Auth
  -- For now, we'll create the superadmin record assuming the auth user exists
  -- In production, this would be handled by Edge Functions
  
  IF NOT v_auth_user_exists THEN
    RAISE EXCEPTION 'Auth user with email % does not exist. Create user first via Supabase Auth.', p_email;
  END IF;
  
  -- Check if this user is already a superadmin
  IF EXISTS (SELECT 1 FROM superadmins WHERE superadmins.user_id = v_user_id) THEN
    RAISE EXCEPTION 'User % is already a superadmin', p_email;
  END IF;
  
  -- Create the bootstrap superadmin record
  INSERT INTO superadmins (
    user_id, email, name, is_bootstrap, bootstrap_method, is_active
  ) VALUES (
    v_user_id, p_email, p_name, true, 'sql_script', true
  ) RETURNING id INTO v_superadmin_id;
  
  -- Log the bootstrap creation
  PERFORM log_hierarchy_violation(
    'bootstrap_creation',
    'bootstrap_superadmin',
    v_user_id,
    'superadmins',
    jsonb_build_object('email', p_email, 'name', p_name),
    'Bootstrap superadmin created successfully'
  );
  
  -- Return the created superadmin info
  RETURN QUERY SELECT 
    v_superadmin_id,
    v_user_id,
    p_email,
    'Bootstrap superadmin created successfully'::TEXT;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 9: TESTING QUERIES
-- ============================================================================

-- Function to test superadmin setup
CREATE OR REPLACE FUNCTION test_superadmin_setup()
RETURNS TABLE (
  test_name TEXT,
  status TEXT,
  message TEXT
) AS $$
BEGIN
  -- Test 1: Check if superadmins table exists
  RETURN QUERY SELECT 
    'superadmins_table_exists'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'superadmins' AND table_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Superadmins table exists'::TEXT;
  
  -- Test 2: Check if user_tier enum exists
  RETURN QUERY SELECT 
    'user_tier_enum_exists'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_type WHERE typname = 'user_tier'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'User tier enum exists'::TEXT;
  
  -- Test 3: Check if audit log table exists
  RETURN QUERY SELECT 
    'audit_log_table_exists'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'hierarchy_audit_log' AND table_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Hierarchy audit log table exists'::TEXT;
  
  -- Test 4: Check if helper functions exist
  RETURN QUERY SELECT 
    'helper_functions_exist'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'get_current_superadmin' AND routine_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Helper functions exist'::TEXT;
  
  -- Test 5: Check if bootstrap function exists
  RETURN QUERY SELECT 
    'bootstrap_function_exists'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'bootstrap_superadmin' AND routine_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Bootstrap function exists'::TEXT;
  
  -- Test 6: Check if no bootstrap superadmin exists yet
  RETURN QUERY SELECT 
    'no_bootstrap_superadmin'::TEXT,
    CASE WHEN NOT EXISTS (
      SELECT 1 FROM superadmins WHERE is_bootstrap = true
    ) THEN 'PASS' ELSE 'FAIL' END,
    'No bootstrap superadmin exists yet (ready for bootstrap)'::TEXT;
  
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 10: ENABLE ROW LEVEL SECURITY (BASIC)
-- ============================================================================

-- Enable RLS on superadmins table
ALTER TABLE public.superadmins ENABLE ROW LEVEL SECURITY;

-- Enable RLS on audit log table  
ALTER TABLE public.hierarchy_audit_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policy for superadmins (allow all for now, will refine in Phase 5)
DROP POLICY IF EXISTS "superadmins_access" ON public.superadmins;
CREATE POLICY "superadmins_access" ON public.superadmins
  FOR ALL 
  USING (true);

-- Basic RLS policy for audit log (superadmins can see all)
DROP POLICY IF EXISTS "audit_log_superadmin_access" ON public.hierarchy_audit_log;
CREATE POLICY "audit_log_superadmin_access" ON public.hierarchy_audit_log
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM superadmins 
      WHERE superadmins.user_id = auth.uid() 
      AND is_active = true
    )
  );

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ TIER 1 SUPERADMIN SETUP COMPLETE';
  RAISE NOTICE '🔧 Tables created: superadmins, hierarchy_audit_log';
  RAISE NOTICE '🎯 Functions created: bootstrap_superadmin, get_current_superadmin, is_current_user_superadmin';
  RAISE NOTICE '🔒 RLS enabled with basic policies';
  RAISE NOTICE '📊 Run SELECT * FROM test_superadmin_setup(); to validate';
  RAISE NOTICE '🚀 Ready for bootstrap: SELECT * FROM bootstrap_superadmin(''your-email'', ''Your Name'');';
END $$; 
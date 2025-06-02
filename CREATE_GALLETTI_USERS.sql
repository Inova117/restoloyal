-- ============================================================================
-- GALLETTI TIER 2 USER CREATION SCRIPT
-- ============================================================================
-- This script creates users for Galletti with tier 2 access (client_admin role)
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Verify Galletti client exists
DO $$
DECLARE
  galletti_client_id UUID;
  client_exists BOOLEAN;
BEGIN
  -- Check if Galletti client exists
  SELECT EXISTS(SELECT 1 FROM platform_clients WHERE slug = 'galletti') INTO client_exists;
  
  IF NOT client_exists THEN
    -- Create Galletti client if it doesn't exist
    INSERT INTO platform_clients (
      name, 
      slug, 
      type, 
      status, 
      plan, 
      contact_email,
      contact_phone
    ) VALUES (
      'Galletti Foods',
      'galletti',
      'restaurant_chain',
      'active',
      'business',
      'admin@galletti.com',
      '+1-555-GALLETTI'
    );
    
    RAISE NOTICE '✓ Created Galletti client';
  ELSE
    RAISE NOTICE '✓ Galletti client already exists';
  END IF;
  
  -- Get the client ID for reference
  SELECT id INTO galletti_client_id FROM platform_clients WHERE slug = 'galletti';
  RAISE NOTICE 'Galletti Client ID: %', galletti_client_id;
END $$;

-- Step 2: Create platform_admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS platform_admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'support')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Step 3: Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client_admin', 'restaurant_admin', 'location_staff')),
  client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_id)
);

-- Step 4: Enable RLS on tables
ALTER TABLE platform_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Client admins can manage client staff" ON user_roles;
CREATE POLICY "Client admins can manage client staff" ON user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = user_roles.client_id
      AND ur.role = 'client_admin'
      AND ur.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Platform admins can manage all roles" ON user_roles;
CREATE POLICY "Platform admins can manage all roles" ON user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin_users pau
      WHERE pau.user_id = auth.uid()
      AND pau.role IN ('super_admin', 'admin')
      AND pau.status = 'active'
    )
  );

-- Step 6: Grant necessary permissions
GRANT ALL ON user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE ON user_roles TO authenticated;
GRANT ALL ON platform_admin_users TO service_role;
GRANT SELECT ON platform_admin_users TO authenticated;

-- Step 7: Create function to assign user to Galletti with tier 2 access
CREATE OR REPLACE FUNCTION assign_galletti_tier2_user(
  user_email TEXT,
  user_full_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  galletti_client_id UUID;
  target_user_id UUID;
  result JSON;
BEGIN
  -- Get Galletti client ID
  SELECT id INTO galletti_client_id 
  FROM platform_clients 
  WHERE slug = 'galletti';
  
  IF galletti_client_id IS NULL THEN
    RETURN JSON_BUILD_OBJECT(
      'success', false,
      'error', 'Galletti client not found'
    );
  END IF;
  
  -- Get user ID from auth.users by email
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RETURN JSON_BUILD_OBJECT(
      'success', false,
      'error', 'User not found. Please ensure the user has signed up first.'
    );
  END IF;
  
  -- Check if user already has a role for Galletti
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = target_user_id 
    AND client_id = galletti_client_id
  ) THEN
    RETURN JSON_BUILD_OBJECT(
      'success', false,
      'error', 'User already has a role assigned for Galletti'
    );
  END IF;
  
  -- Assign client_admin role for Galletti (Tier 2 access)
  INSERT INTO user_roles (
    user_id,
    role,
    client_id,
    status,
    created_by
  ) VALUES (
    target_user_id,
    'client_admin',
    galletti_client_id,
    'active',
    target_user_id  -- Self-assigned for this demo
  );
  
  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'message', 'Successfully assigned tier 2 access to ' || user_email,
    'user_id', target_user_id,
    'client_id', galletti_client_id,
    'role', 'client_admin'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN JSON_BUILD_OBJECT(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Example 1: Assign existing user to Galletti tier 2
-- SELECT assign_galletti_tier2_user('manager@galletti.com', 'Sarah Johnson');

-- Example 2: Check current Galletti staff
-- SELECT 
--   ur.role,
--   ur.status,
--   au.email,
--   au.user_metadata->>'full_name' as full_name,
--   ur.created_at
-- FROM user_roles ur
-- JOIN auth.users au ON ur.user_id = au.id
-- JOIN platform_clients pc ON ur.client_id = pc.id
-- WHERE pc.slug = 'galletti'
-- ORDER BY ur.created_at DESC;

-- ============================================================================
-- MANUAL ASSIGNMENT (Alternative Method)
-- ============================================================================

-- If you prefer to manually assign users, follow these steps:

-- 1. First, get the Galletti client ID:
-- SELECT id as galletti_client_id FROM platform_clients WHERE slug = 'galletti';

-- 2. Get the user ID for the email you want to assign:
-- SELECT id as user_id, email FROM auth.users WHERE email = 'your_user@galletti.com';

-- 3. Insert the role assignment:
-- INSERT INTO user_roles (user_id, role, client_id, status)
-- VALUES (
--   'USER_ID_FROM_STEP_2',    -- Replace with actual user ID
--   'client_admin',           -- Tier 2 role
--   'CLIENT_ID_FROM_STEP_1',  -- Replace with Galletti client ID
--   'active'
-- );

-- Final setup completion message
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'GALLETTI TIER 2 USER SETUP COMPLETE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'To assign a user to Galletti with tier 2 access, run:';
  RAISE NOTICE 'SELECT assign_galletti_tier2_user(''user@galletti.com'', ''Full Name'');';
  RAISE NOTICE '============================================================================';
END $$; 
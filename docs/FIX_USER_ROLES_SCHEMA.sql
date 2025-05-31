-- ============================================================================
-- FIX USER_ROLES TABLE SCHEMA
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to add missing columns to user_roles table
-- This fixes the "column ur.status does not exist" error
-- ============================================================================

-- Add missing columns to user_roles table if they don't exist
DO $$ 
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'status'
  ) THEN
    ALTER TABLE user_roles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending'));
    RAISE NOTICE 'Added status column to user_roles table';
  ELSE
    RAISE NOTICE 'Status column already exists in user_roles table';
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE user_roles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE 'Added updated_at column to user_roles table';
  ELSE
    RAISE NOTICE 'Updated_at column already exists in user_roles table';
  END IF;
  
  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE user_roles ADD COLUMN created_by UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Added created_by column to user_roles table';
  ELSE
    RAISE NOTICE 'Created_by column already exists in user_roles table';
  END IF;
END $$;

-- Update existing user_roles records to have active status if they don't have one
UPDATE user_roles SET status = 'active' WHERE status IS NULL;

-- Enable RLS on user_roles table (if not already enabled)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "staff_manager_select_policy" ON user_roles;
DROP POLICY IF EXISTS "staff_manager_insert_policy" ON user_roles;
DROP POLICY IF EXISTS "staff_manager_update_policy" ON user_roles;
DROP POLICY IF EXISTS "staff_manager_delete_policy" ON user_roles;

-- Policy for SELECT: Client admins can view staff for their client, platform admins can view all
CREATE POLICY "staff_manager_select_policy" ON user_roles
FOR SELECT
USING (
  -- Platform admins can view all staff
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can view staff for their client
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = user_roles.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
);

-- Policy for INSERT: Only client admins can invite staff for their client
CREATE POLICY "staff_manager_insert_policy" ON user_roles
FOR INSERT
WITH CHECK (
  -- Platform admins can invite staff for any client
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can invite staff for their client
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = user_roles.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
);

-- Policy for UPDATE: Only client admins can update staff for their client
CREATE POLICY "staff_manager_update_policy" ON user_roles
FOR UPDATE
USING (
  -- Platform admins can update all staff
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can update staff for their client
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = user_roles.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
)
WITH CHECK (
  -- Platform admins can update all staff
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can update staff for their client
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = user_roles.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
);

-- Policy for DELETE: Only client admins can remove staff for their client
CREATE POLICY "staff_manager_delete_policy" ON user_roles
FOR DELETE
USING (
  -- Platform admins can delete all staff
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can delete staff for their client
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = user_roles.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_client_admin_lookup 
ON user_roles (user_id, client_id, role, status) 
WHERE role = 'client_admin';

CREATE INDEX IF NOT EXISTS idx_user_roles_client_staff_lookup 
ON user_roles (client_id, role, status);

CREATE INDEX IF NOT EXISTS idx_user_roles_restaurant_staff_lookup 
ON user_roles (restaurant_id, role, status) 
WHERE restaurant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_roles_location_staff_lookup 
ON user_roles (location_id, role, status) 
WHERE location_id IS NOT NULL;

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_roles_updated_at ON user_roles;
CREATE TRIGGER trigger_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
ORDER BY ordinal_position;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully updated user_roles table schema!';
  RAISE NOTICE '✅ Added missing columns: status, updated_at, created_by';
  RAISE NOTICE '✅ Created RLS policies for staff management';
  RAISE NOTICE '✅ Added performance indexes';
  RAISE NOTICE '✅ Created updated_at trigger';
END $$; 
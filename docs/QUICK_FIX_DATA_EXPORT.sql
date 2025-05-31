-- Quick Fix for Data Export Role Issues
-- Run this in your Supabase SQL Editor to fix role-related problems

-- 1. Check current app_role enum values
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE 'Current app_role enum values:';
  FOR rec IN 
    SELECT enumlabel 
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    ORDER BY enumsortorder
  LOOP
    RAISE NOTICE '  - %', rec.enumlabel;
  END LOOP;
END $$;

-- 2. Add missing enum values (run each separately if needed)
-- Add zerion_admin if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    AND enumlabel = 'zerion_admin'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'zerion_admin';
    RAISE NOTICE 'Added zerion_admin to app_role enum';
  ELSE
    RAISE NOTICE 'zerion_admin already exists in app_role enum';
  END IF;
END $$;

-- Add platform_admin if it doesn't exist (for backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    AND enumlabel = 'platform_admin'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'platform_admin';
    RAISE NOTICE 'Added platform_admin to app_role enum';
  ELSE
    RAISE NOTICE 'platform_admin already exists in app_role enum';
  END IF;
END $$;

-- 3. Ensure audit_logs table exists with correct structure
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  details JSONB,
  client_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_id ON audit_logs (client_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);

-- 5. Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Client admins can view client audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Platform admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can insert own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

-- 7. Create updated RLS policies (using existing enum values only)
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Client admins can view client audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = audit_logs.client_id
      AND ur.role = 'client_admin'
    )
  );

CREATE POLICY "Platform admins can view all audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('zerion_admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM platform_admin_users pau
      WHERE pau.user_id = auth.uid()
      AND pau.role IN ('super_admin', 'admin')
      AND pau.status = 'active'
    )
  );

CREATE POLICY "Users can insert own audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- 8. Grant necessary permissions
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO service_role;

-- 9. Verify the setup
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE 'Data export setup verification:';
  
  -- Check if audit_logs table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    RAISE NOTICE '✓ audit_logs table exists';
  ELSE
    RAISE NOTICE '✗ audit_logs table missing';
  END IF;
  
  -- Check if RLS is enabled
  IF EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'audit_logs' AND c.relrowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS enabled on audit_logs';
  ELSE
    RAISE NOTICE '✗ RLS not enabled on audit_logs';
  END IF;
  
  -- Check policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' AND policyname = 'Users can view own audit logs'
  ) THEN
    RAISE NOTICE '✓ Basic RLS policies created';
  ELSE
    RAISE NOTICE '✗ RLS policies missing';
  END IF;
  
  -- Show current enum values
  RAISE NOTICE 'Current app_role enum values:';
  FOR rec IN 
    SELECT enumlabel 
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    ORDER BY enumsortorder
  LOOP
    RAISE NOTICE '  - %', rec.enumlabel;
  END LOOP;
  
  RAISE NOTICE 'Setup complete! You can now test data export functionality.';
END $$; 
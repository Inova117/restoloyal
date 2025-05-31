-- Simple Data Export Fix (No Enum Changes Required)
-- Run this in your Supabase SQL Editor to fix data export issues

-- 1. Check what enum values currently exist
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

-- 2. Create audit_logs table for data export logging
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

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_id ON audit_logs (client_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);

-- 4. Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Client admins can view client audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Platform admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can insert own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

-- 6. Create RLS policies using only existing enum values
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
      AND ur.role = 'zerion_admin'
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

-- 7. Grant necessary permissions
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO service_role;

-- 8. Verify the setup
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== Data Export Setup Verification ===';
  
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
    RAISE NOTICE '✓ RLS policies created';
  ELSE
    RAISE NOTICE '✗ RLS policies missing';
  END IF;
  
  -- Show current enum values
  RAISE NOTICE '=== Available Role Values ===';
  FOR rec IN 
    SELECT enumlabel 
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    ORDER BY enumsortorder
  LOOP
    RAISE NOTICE '  - %', rec.enumlabel;
  END LOOP;
  
  RAISE NOTICE '=== Setup Complete ===';
  RAISE NOTICE 'Data export system is ready!';
  RAISE NOTICE 'Make sure to test in mock mode first (MOCK_MODE = true)';
END $$; 
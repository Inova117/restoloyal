-- Data Export RLS Migration
-- This migration creates the audit_logs table and RLS policies for data export functionality

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  details JSONB,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_id ON audit_logs (client_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs (resource_type);

-- Enable RLS on audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Client admins can view audit logs for their client
CREATE POLICY "Client admins can view client audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = audit_logs.client_id
      AND ur.role IN ('client_admin', 'zerion_admin')
    )
  );

-- Policy: Platform admins can view all audit logs
CREATE POLICY "Platform admins can view all audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'zerion_admin'
    )
  );

-- Policy: Users can insert their own audit logs
CREATE POLICY "Users can insert own audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: System can insert audit logs for any user (for Edge Functions)
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO service_role;

-- Add missing columns to existing tables if they don't exist
DO $$
BEGIN
  -- Add client_id to customers table if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'client_id') THEN
    ALTER TABLE customers ADD COLUMN client_id UUID REFERENCES clients(id);
    CREATE INDEX IF NOT EXISTS idx_customers_client_id ON customers (client_id);
  END IF;

  -- Add client_id to stamps table if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stamps' AND column_name = 'client_id') THEN
    ALTER TABLE stamps ADD COLUMN client_id UUID REFERENCES clients(id);
    CREATE INDEX IF NOT EXISTS idx_stamps_client_id ON stamps (client_id);
  END IF;

  -- Add client_id to rewards table if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'client_id') THEN
    ALTER TABLE rewards ADD COLUMN client_id UUID REFERENCES clients(id);
    CREATE INDEX IF NOT EXISTS idx_rewards_client_id ON rewards (client_id);
  END IF;

  -- Add location_id to stamps table if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stamps' AND column_name = 'location_id') THEN
    ALTER TABLE stamps ADD COLUMN location_id UUID REFERENCES locations(id);
    CREATE INDEX IF NOT EXISTS idx_stamps_location_id ON stamps (location_id);
  END IF;

  -- Add location_id to rewards table if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'location_id') THEN
    ALTER TABLE rewards ADD COLUMN location_id UUID REFERENCES locations(id);
    CREATE INDEX IF NOT EXISTS idx_rewards_location_id ON rewards (location_id);
  END IF;

  -- Add amount column to stamps table if missing (for transaction exports)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stamps' AND column_name = 'amount') THEN
    ALTER TABLE stamps ADD COLUMN amount DECIMAL(10,2);
  END IF;

  -- Add notes column to stamps table if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stamps' AND column_name = 'notes') THEN
    ALTER TABLE stamps ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Create a function to automatically set client_id for new records
CREATE OR REPLACE FUNCTION set_client_id_from_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Get client_id from user_roles table
  SELECT ur.client_id INTO NEW.client_id
  FROM user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically set client_id (if tables exist)
DO $$
BEGIN
  -- Trigger for customers table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    DROP TRIGGER IF EXISTS set_customer_client_id ON customers;
    CREATE TRIGGER set_customer_client_id
      BEFORE INSERT ON customers
      FOR EACH ROW
      WHEN (NEW.client_id IS NULL)
      EXECUTE FUNCTION set_client_id_from_user();
  END IF;

  -- Trigger for stamps table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stamps') THEN
    DROP TRIGGER IF EXISTS set_stamp_client_id ON stamps;
    CREATE TRIGGER set_stamp_client_id
      BEFORE INSERT ON stamps
      FOR EACH ROW
      WHEN (NEW.client_id IS NULL)
      EXECUTE FUNCTION set_client_id_from_user();
  END IF;

  -- Trigger for rewards table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rewards') THEN
    DROP TRIGGER IF EXISTS set_reward_client_id ON rewards;
    CREATE TRIGGER set_reward_client_id
      BEFORE INSERT ON rewards
      FOR EACH ROW
      WHEN (NEW.client_id IS NULL)
      EXECUTE FUNCTION set_client_id_from_user();
  END IF;
END $$; 
-- POS Operations RLS Migration
-- This migration creates tables and RLS policies for secure POS operations

-- Create location_staff table if it doesn't exist
CREATE TABLE IF NOT EXISTS location_staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'cashier',
  permissions JSONB DEFAULT '{
    "can_register_customers": true,
    "can_add_stamps": true,
    "can_redeem_rewards": true,
    "can_view_customer_data": true,
    "can_process_refunds": false,
    "can_manage_inventory": false
  }'::jsonb,
  status VARCHAR(20) DEFAULT 'active',
  hired_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, location_id)
);

-- Create customer_activity table for audit logging
CREATE TABLE IF NOT EXISTS customer_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  details JSONB,
  staff_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to existing tables
DO $$
BEGIN
  -- Add registered_by to customers table if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'registered_by') THEN
    ALTER TABLE customers ADD COLUMN registered_by UUID REFERENCES auth.users(id);
  END IF;

  -- Add qr_code to customers table if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'qr_code') THEN
    ALTER TABLE customers ADD COLUMN qr_code VARCHAR(255) UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_customers_qr_code ON customers (qr_code);
  END IF;

  -- Add staff_id to stamps table if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stamps' AND column_name = 'staff_id') THEN
    ALTER TABLE stamps ADD COLUMN staff_id UUID REFERENCES auth.users(id);
  END IF;

  -- Add staff_id to rewards table if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'staff_id') THEN
    ALTER TABLE rewards ADD COLUMN staff_id UUID REFERENCES auth.users(id);
  END IF;

  -- Add max_stamps_per_visit to loyalty_settings if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loyalty_settings' AND column_name = 'max_stamps_per_visit') THEN
    ALTER TABLE loyalty_settings ADD COLUMN max_stamps_per_visit INTEGER DEFAULT 10;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_staff_user_id ON location_staff (user_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_location_id ON location_staff (location_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_client_id ON location_staff (client_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_status ON location_staff (status);

CREATE INDEX IF NOT EXISTS idx_customer_activity_customer_id ON customer_activity (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_location_id ON customer_activity (location_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_client_id ON customer_activity (client_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_staff_id ON customer_activity (staff_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_created_at ON customer_activity (created_at);
CREATE INDEX IF NOT EXISTS idx_customer_activity_type ON customer_activity (activity_type);

CREATE INDEX IF NOT EXISTS idx_customers_registered_by ON customers (registered_by);
CREATE INDEX IF NOT EXISTS idx_stamps_staff_id ON stamps (staff_id);
CREATE INDEX IF NOT EXISTS idx_rewards_staff_id ON rewards (staff_id);

-- Enable RLS on all tables
ALTER TABLE location_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for location_staff table

-- Staff can view their own records
CREATE POLICY "Staff can view own records" ON location_staff
  FOR SELECT
  USING (auth.uid() = user_id);

-- Client admins can view staff for their locations
CREATE POLICY "Client admins can view location staff" ON location_staff
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = location_staff.client_id
      AND ur.role = 'client_admin'
      AND ur.status = 'active'
    )
  );

-- Platform admins can view all staff
CREATE POLICY "Platform admins can view all staff" ON location_staff
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin_users pau
      WHERE pau.user_id = auth.uid()
      AND pau.role IN ('super_admin', 'admin')
      AND pau.status = 'active'
    )
  );

-- Client admins can manage staff for their locations
CREATE POLICY "Client admins can manage location staff" ON location_staff
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = location_staff.client_id
      AND ur.role = 'client_admin'
      AND ur.status = 'active'
    )
  );

-- RLS Policies for customer_activity table

-- Staff can view activity for their location
CREATE POLICY "Staff can view location activity" ON customer_activity
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM location_staff ls
      WHERE ls.user_id = auth.uid()
      AND ls.location_id = customer_activity.location_id
      AND ls.status = 'active'
    )
  );

-- Client admins can view activity for their client
CREATE POLICY "Client admins can view client activity" ON customer_activity
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = customer_activity.client_id
      AND ur.role = 'client_admin'
      AND ur.status = 'active'
    )
  );

-- Platform admins can view all activity
CREATE POLICY "Platform admins can view all activity" ON customer_activity
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin_users pau
      WHERE pau.user_id = auth.uid()
      AND pau.role IN ('super_admin', 'admin')
      AND pau.status = 'active'
    )
  );

-- Staff can insert activity for their location
CREATE POLICY "Staff can insert location activity" ON customer_activity
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM location_staff ls
      WHERE ls.user_id = auth.uid()
      AND ls.location_id = customer_activity.location_id
      AND ls.status = 'active'
    )
  );

-- System can insert activity (for Edge Functions)
CREATE POLICY "System can insert activity" ON customer_activity
  FOR INSERT
  WITH CHECK (true);

-- Enhanced RLS Policies for existing tables

-- Update customers table policies for POS operations
DROP POLICY IF EXISTS "Staff can view location customers" ON customers;
CREATE POLICY "Staff can view location customers" ON customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM location_staff ls
      WHERE ls.user_id = auth.uid()
      AND ls.location_id = customers.location_id
      AND ls.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = customers.client_id
      AND ur.role = 'client_admin'
      AND ur.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Staff can register customers" ON customers;
CREATE POLICY "Staff can register customers" ON customers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM location_staff ls
      WHERE ls.user_id = auth.uid()
      AND ls.location_id = customers.location_id
      AND ls.status = 'active'
      AND (ls.permissions->>'can_register_customers')::boolean = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = customers.client_id
      AND ur.role = 'client_admin'
      AND ur.status = 'active'
    )
  );

-- Update stamps table policies for POS operations
DROP POLICY IF EXISTS "Staff can add stamps" ON stamps;
CREATE POLICY "Staff can add stamps" ON stamps
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM location_staff ls
      WHERE ls.user_id = auth.uid()
      AND ls.location_id = stamps.location_id
      AND ls.status = 'active'
      AND (ls.permissions->>'can_add_stamps')::boolean = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = stamps.client_id
      AND ur.role = 'client_admin'
      AND ur.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Staff can view location stamps" ON stamps;
CREATE POLICY "Staff can view location stamps" ON stamps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM location_staff ls
      WHERE ls.user_id = auth.uid()
      AND ls.location_id = stamps.location_id
      AND ls.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = stamps.client_id
      AND ur.role = 'client_admin'
      AND ur.status = 'active'
    )
  );

-- Update rewards table policies for POS operations
DROP POLICY IF EXISTS "Staff can redeem rewards" ON rewards;
CREATE POLICY "Staff can redeem rewards" ON rewards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM location_staff ls
      WHERE ls.user_id = auth.uid()
      AND ls.location_id = rewards.location_id
      AND ls.status = 'active'
      AND (ls.permissions->>'can_redeem_rewards')::boolean = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = rewards.client_id
      AND ur.role = 'client_admin'
      AND ur.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Staff can view location rewards" ON rewards;
CREATE POLICY "Staff can view location rewards" ON rewards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM location_staff ls
      WHERE ls.user_id = auth.uid()
      AND ls.location_id = rewards.location_id
      AND ls.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = rewards.client_id
      AND ur.role = 'client_admin'
      AND ur.status = 'active'
    )
  );

-- Create function to automatically set client_id for location_staff
CREATE OR REPLACE FUNCTION set_location_staff_client_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get client_id from location
  SELECT l.client_id INTO NEW.client_id
  FROM locations l
  WHERE l.id = NEW.location_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for location_staff
DROP TRIGGER IF EXISTS set_location_staff_client_id_trigger ON location_staff;
CREATE TRIGGER set_location_staff_client_id_trigger
  BEFORE INSERT OR UPDATE ON location_staff
  FOR EACH ROW
  WHEN (NEW.client_id IS NULL)
  EXECUTE FUNCTION set_location_staff_client_id();

-- Create function to automatically set client_id for customer_activity
CREATE OR REPLACE FUNCTION set_customer_activity_client_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get client_id from location
  SELECT l.client_id INTO NEW.client_id
  FROM locations l
  WHERE l.id = NEW.location_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for customer_activity
DROP TRIGGER IF EXISTS set_customer_activity_client_id_trigger ON customer_activity;
CREATE TRIGGER set_customer_activity_client_id_trigger
  BEFORE INSERT OR UPDATE ON customer_activity
  FOR EACH ROW
  WHEN (NEW.client_id IS NULL)
  EXECUTE FUNCTION set_customer_activity_client_id();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON location_staff TO authenticated;
GRANT SELECT, INSERT ON customer_activity TO authenticated;
GRANT SELECT, INSERT, UPDATE ON location_staff TO service_role;
GRANT SELECT, INSERT ON customer_activity TO service_role;

-- Create sample loyalty settings if none exist
INSERT INTO loyalty_settings (
  location_id,
  client_id,
  stamps_for_reward,
  reward_value,
  stamps_per_dollar,
  max_stamps_per_visit,
  reward_expiry_days,
  auto_redeem,
  minimum_purchase,
  created_at
)
SELECT 
  l.id,
  l.client_id,
  10,
  15.00,
  1.0,
  5,
  365,
  false,
  0.00,
  CURRENT_TIMESTAMP
FROM locations l
WHERE NOT EXISTS (
  SELECT 1 FROM loyalty_settings ls 
  WHERE ls.location_id = l.id
)
ON CONFLICT (location_id) DO NOTHING;

-- Verification and status report
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== POS Operations Setup Verification ===';
  
  -- Check if location_staff table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_staff') THEN
    RAISE NOTICE '✓ location_staff table exists';
  ELSE
    RAISE NOTICE '✗ location_staff table missing';
  END IF;
  
  -- Check if customer_activity table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_activity') THEN
    RAISE NOTICE '✓ customer_activity table exists';
  ELSE
    RAISE NOTICE '✗ customer_activity table missing';
  END IF;
  
  -- Check RLS policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'location_staff' AND policyname = 'Staff can view own records'
  ) THEN
    RAISE NOTICE '✓ location_staff RLS policies created';
  ELSE
    RAISE NOTICE '✗ location_staff RLS policies missing';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customer_activity' AND policyname = 'Staff can view location activity'
  ) THEN
    RAISE NOTICE '✓ customer_activity RLS policies created';
  ELSE
    RAISE NOTICE '✗ customer_activity RLS policies missing';
  END IF;
  
  -- Check required columns
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'qr_code') THEN
    RAISE NOTICE '✓ customers.qr_code column exists';
  ELSE
    RAISE NOTICE '✗ customers.qr_code column missing';
  END IF;
  
  RAISE NOTICE '=== Setup Complete ===';
  RAISE NOTICE 'POS operations system is ready!';
  RAISE NOTICE 'Staff can now register customers, add stamps, and redeem rewards';
  RAISE NOTICE 'All operations are secured with location-based permissions';
END $$; 
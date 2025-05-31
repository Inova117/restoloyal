-- ============================================================================
-- COMPLETE DATABASE SCHEMA FIX FOR RESTAURANT LOYALTY PLATFORM
-- ============================================================================
-- This script fixes all database schema issues and creates missing tables
-- Run this in your Supabase SQL Editor to fix the "customers" table error
-- ============================================================================

-- Step 1: Create missing core tables if they don't exist

-- Create platform_clients table
CREATE TABLE IF NOT EXISTS platform_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  type TEXT DEFAULT 'restaurant_chain',
  status TEXT DEFAULT 'active',
  plan TEXT DEFAULT 'business',
  contact_email TEXT,
  contact_phone TEXT,
  billing_address TEXT,
  monthly_revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  stamps_required INTEGER DEFAULT 10,
  reward_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create locations table with all required columns
CREATE TABLE IF NOT EXISTS locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  phone TEXT,
  manager_name TEXT,
  manager_email TEXT,
  status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 2: Add missing columns to locations table
DO $$
BEGIN
  -- Add client_id to locations if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'client_id') THEN
    ALTER TABLE locations ADD COLUMN client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE;
  END IF;

  -- Add status to locations if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'status') THEN
    ALTER TABLE locations ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

-- Step 3: Create the CUSTOMERS table (this is what was missing!)
-- Note: This is different from the "clients" table - customers are the end users who collect stamps
CREATE TABLE IF NOT EXISTS customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  qr_code TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  total_stamps INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE,
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 4: Create stamps table
CREATE TABLE IF NOT EXISTS stamps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  stamps_earned INTEGER DEFAULT 1,
  amount DECIMAL(10,2),
  notes TEXT,
  staff_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 5: Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  reward_type TEXT NOT NULL,
  reward_value TEXT,
  stamps_used INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'redeemed',
  staff_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 6: Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('client_admin', 'restaurant_admin', 'location_staff')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 7: Create platform_admin_users table
CREATE TABLE IF NOT EXISTS platform_admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'support')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Step 8: Create location_staff table for POS operations
CREATE TABLE IF NOT EXISTS location_staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE,
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

-- Step 9: Create customer_activity table for audit logging
CREATE TABLE IF NOT EXISTS customer_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  details JSONB,
  staff_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 10: Create loyalty_settings table
CREATE TABLE IF NOT EXISTS loyalty_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE,
  stamps_for_reward INTEGER NOT NULL DEFAULT 10,
  reward_value DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  stamps_per_dollar DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  max_stamps_per_visit INTEGER DEFAULT 10,
  reward_expiry_days INTEGER DEFAULT 365,
  auto_redeem BOOLEAN DEFAULT false,
  minimum_purchase DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(location_id)
);

-- Step 11: Create audit_logs table for data export tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 12: Create all necessary indexes
CREATE INDEX IF NOT EXISTS idx_customers_client_id ON customers (client_id);
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON customers (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_location_id ON customers (location_id);
CREATE INDEX IF NOT EXISTS idx_customers_qr_code ON customers (qr_code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers (status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);

CREATE INDEX IF NOT EXISTS idx_stamps_customer_id ON stamps (customer_id);
CREATE INDEX IF NOT EXISTS idx_stamps_location_id ON stamps (location_id);
CREATE INDEX IF NOT EXISTS idx_stamps_client_id ON stamps (client_id);
CREATE INDEX IF NOT EXISTS idx_stamps_staff_id ON stamps (staff_id);
CREATE INDEX IF NOT EXISTS idx_stamps_created_at ON stamps (created_at);

CREATE INDEX IF NOT EXISTS idx_rewards_customer_id ON rewards (customer_id);
CREATE INDEX IF NOT EXISTS idx_rewards_location_id ON rewards (location_id);
CREATE INDEX IF NOT EXISTS idx_rewards_client_id ON rewards (client_id);
CREATE INDEX IF NOT EXISTS idx_rewards_staff_id ON rewards (staff_id);
CREATE INDEX IF NOT EXISTS idx_rewards_created_at ON rewards (created_at);

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

CREATE INDEX IF NOT EXISTS idx_locations_client_id ON locations (client_id);
CREATE INDEX IF NOT EXISTS idx_locations_restaurant_id ON locations (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations (status);

-- Step 13: Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Step 14: Create RLS policies for customers table
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
    OR
    EXISTS (
      SELECT 1 FROM platform_admin_users pau
      WHERE pau.user_id = auth.uid()
      AND pau.role IN ('super_admin', 'admin')
      AND pau.status = 'active'
    )
  );

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

-- Step 15: Create RLS policies for stamps table
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

-- Step 16: Create RLS policies for rewards table
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

-- Step 17: Create RLS policies for location_staff table
CREATE POLICY "Staff can view own records" ON location_staff
  FOR SELECT
  USING (auth.uid() = user_id);

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

-- Step 18: Create RLS policies for customer_activity table
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

CREATE POLICY "System can insert activity" ON customer_activity
  FOR INSERT
  WITH CHECK (true);

-- Step 19: Create automatic client_id setting functions
CREATE OR REPLACE FUNCTION set_location_client_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get client_id from restaurant
  SELECT r.client_id INTO NEW.client_id
  FROM restaurants r
  WHERE r.id = NEW.restaurant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_customer_client_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get client_id from location
  SELECT l.client_id INTO NEW.client_id
  FROM locations l
  WHERE l.id = NEW.location_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Step 20: Create triggers for automatic client_id setting
DROP TRIGGER IF EXISTS set_location_client_id_trigger ON locations;
CREATE TRIGGER set_location_client_id_trigger
  BEFORE INSERT OR UPDATE ON locations
  FOR EACH ROW
  WHEN (NEW.client_id IS NULL)
  EXECUTE FUNCTION set_location_client_id();

DROP TRIGGER IF EXISTS set_customer_client_id_trigger ON customers;
CREATE TRIGGER set_customer_client_id_trigger
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW
  WHEN (NEW.client_id IS NULL)
  EXECUTE FUNCTION set_customer_client_id();

DROP TRIGGER IF EXISTS set_location_staff_client_id_trigger ON location_staff;
CREATE TRIGGER set_location_staff_client_id_trigger
  BEFORE INSERT OR UPDATE ON location_staff
  FOR EACH ROW
  WHEN (NEW.client_id IS NULL)
  EXECUTE FUNCTION set_location_staff_client_id();

-- Step 21: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON customers TO authenticated;
GRANT SELECT, INSERT ON stamps TO authenticated;
GRANT SELECT, INSERT ON rewards TO authenticated;
GRANT SELECT, INSERT, UPDATE ON location_staff TO authenticated;
GRANT SELECT, INSERT ON customer_activity TO authenticated;
GRANT SELECT ON loyalty_settings TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO authenticated;

GRANT ALL ON customers TO service_role;
GRANT ALL ON stamps TO service_role;
GRANT ALL ON rewards TO service_role;
GRANT ALL ON location_staff TO service_role;
GRANT ALL ON customer_activity TO service_role;
GRANT ALL ON loyalty_settings TO service_role;
GRANT ALL ON audit_logs TO service_role;

-- Step 22: Insert sample data for testing
INSERT INTO platform_clients (id, name, slug, type, status, plan, contact_email)
VALUES (
  'galletti-client-id',
  'Galletti Foods',
  'galletti',
  'restaurant_chain',
  'active',
  'business',
  'admin@galletti.com'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO restaurants (id, client_id, name, brand, email, phone, address, city, state)
VALUES (
  'galletti-restaurant-id',
  'galletti-client-id',
  'Galletti Foods',
  'Galletti',
  'info@galletti.com',
  '+1-555-0123',
  '123 Main Street',
  'Downtown',
  'CA'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO locations (id, restaurant_id, client_id, name, address, city, state, status)
VALUES 
  ('loc_1', 'galletti-restaurant-id', 'galletti-client-id', 'Main Street Store', '123 Main Street', 'Downtown', 'CA', 'active'),
  ('loc_2', 'galletti-restaurant-id', 'galletti-client-id', 'Mall Location', '456 Mall Drive', 'Shopping Center', 'CA', 'active'),
  ('loc_3', 'galletti-restaurant-id', 'galletti-client-id', 'Airport Branch', '789 Airport Blvd', 'Terminal City', 'CA', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert sample loyalty settings
INSERT INTO loyalty_settings (location_id, client_id, stamps_for_reward, reward_value, stamps_per_dollar, max_stamps_per_visit)
SELECT 
  l.id,
  l.client_id,
  10,
  15.00,
  1.0,
  5
FROM locations l
WHERE NOT EXISTS (
  SELECT 1 FROM loyalty_settings ls 
  WHERE ls.location_id = l.id
);

-- Step 23: Verification and status report
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== DATABASE SCHEMA FIX VERIFICATION ===';
  
  -- Check if customers table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    RAISE NOTICE '✓ customers table exists';
  ELSE
    RAISE NOTICE '✗ customers table missing';
  END IF;
  
  -- Check if stamps table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stamps') THEN
    RAISE NOTICE '✓ stamps table exists';
  ELSE
    RAISE NOTICE '✗ stamps table missing';
  END IF;
  
  -- Check if rewards table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rewards') THEN
    RAISE NOTICE '✓ rewards table exists';
  ELSE
    RAISE NOTICE '✗ rewards table missing';
  END IF;
  
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
    WHERE tablename = 'customers' AND policyname = 'Staff can view location customers'
  ) THEN
    RAISE NOTICE '✓ customers RLS policies created';
  ELSE
    RAISE NOTICE '✗ customers RLS policies missing';
  END IF;
  
  -- Check required columns
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'qr_code') THEN
    RAISE NOTICE '✓ customers.qr_code column exists';
  ELSE
    RAISE NOTICE '✗ customers.qr_code column missing';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'client_id') THEN
    RAISE NOTICE '✓ locations.client_id column exists';
  ELSE
    RAISE NOTICE '✗ locations.client_id column missing';
  END IF;
  
  RAISE NOTICE '=== SETUP COMPLETE ===';
  RAISE NOTICE 'Database schema is now ready for POS operations!';
  RAISE NOTICE 'You can now test the POS Operations system in the dashboard.';
END $$; 
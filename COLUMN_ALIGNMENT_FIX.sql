-- ============================================================================
-- COLUMN ALIGNMENT FIX FOR POS OPERATIONS
-- ============================================================================
-- This script fixes the column naming mismatch between existing schema and POS operations
-- The existing schema uses "client_id" but POS operations expects "customer_id"
-- ============================================================================

-- Step 1: Check current table structure and fix column naming
DO $$
BEGIN
  RAISE NOTICE '=== COLUMN ALIGNMENT FIX STARTING ===';
  
  -- Check if customers table exists, if not create it as an alias/view to clients
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    RAISE NOTICE 'Creating customers table as a proper table...';
    
    -- Create customers table with proper structure for POS operations
    CREATE TABLE customers (
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
    
    -- Copy existing clients data to customers table if clients table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
      INSERT INTO customers (
        client_id, restaurant_id, location_id, name, email, phone, qr_code, 
        status, total_stamps, total_visits, last_visit, created_at, updated_at
      )
      SELECT 
        (SELECT id FROM platform_clients LIMIT 1), -- Default client_id
        restaurant_id, 
        location_id, 
        name, 
        email, 
        phone, 
        qr_code,
        COALESCE(customer_status, 'active'),
        COALESCE(stamps, 0),
        COALESCE(total_visits, 0),
        last_visit,
        created_at,
        updated_at
      FROM clients
      WHERE qr_code IS NOT NULL;
    END IF;
    
    RAISE NOTICE '✓ customers table created and populated';
  ELSE
    RAISE NOTICE '✓ customers table already exists';
  END IF;
  
  -- Step 2: Fix stamps table to work with both client_id and customer_id
  -- Add customer_id column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stamps' AND column_name = 'customer_id') THEN
    ALTER TABLE stamps ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added customer_id column to stamps table';
    
    -- Populate customer_id from existing client_id relationships
    UPDATE stamps 
    SET customer_id = (
      SELECT c.id 
      FROM customers c 
      JOIN clients cl ON cl.qr_code = c.qr_code 
      WHERE cl.id = stamps.client_id
      LIMIT 1
    )
    WHERE customer_id IS NULL AND client_id IS NOT NULL;
    
  ELSE
    RAISE NOTICE '✓ customer_id column already exists in stamps table';
  END IF;
  
  -- Add stamps_earned column if missing (POS operations expects this instead of amount)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stamps' AND column_name = 'stamps_earned') THEN
    ALTER TABLE stamps ADD COLUMN stamps_earned INTEGER DEFAULT 1;
    RAISE NOTICE 'Added stamps_earned column to stamps table';
    
    -- Populate from existing amount column
    UPDATE stamps SET stamps_earned = COALESCE(amount, 1) WHERE stamps_earned IS NULL;
  ELSE
    RAISE NOTICE '✓ stamps_earned column already exists in stamps table';
  END IF;
  
  -- Step 3: Fix rewards table to work with customer_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'customer_id') THEN
    ALTER TABLE rewards ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added customer_id column to rewards table';
    
    -- Populate customer_id from existing client_id relationships
    UPDATE rewards 
    SET customer_id = (
      SELECT c.id 
      FROM customers c 
      JOIN clients cl ON cl.qr_code = c.qr_code 
      WHERE cl.id = rewards.client_id
      LIMIT 1
    )
    WHERE customer_id IS NULL AND client_id IS NOT NULL;
    
  ELSE
    RAISE NOTICE '✓ customer_id column already exists in rewards table';
  END IF;
  
  -- Add reward_type column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'reward_type') THEN
    ALTER TABLE rewards ADD COLUMN reward_type TEXT DEFAULT 'Free Item';
    RAISE NOTICE 'Added reward_type column to rewards table';
  ELSE
    RAISE NOTICE '✓ reward_type column already exists in rewards table';
  END IF;
  
  -- Add reward_value column if missing (as TEXT to match POS operations)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'reward_value') THEN
    ALTER TABLE rewards ADD COLUMN reward_value TEXT DEFAULT '$15.00';
    RAISE NOTICE 'Added reward_value column to rewards table';
  ELSE
    RAISE NOTICE '✓ reward_value column already exists in rewards table';
  END IF;
  
  -- Add staff_id columns if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stamps' AND column_name = 'staff_id') THEN
    ALTER TABLE stamps ADD COLUMN staff_id UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Added staff_id column to stamps table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'staff_id') THEN
    ALTER TABLE rewards ADD COLUMN staff_id UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Added staff_id column to rewards table';
  END IF;
  
END $$;

-- Step 4: Create missing tables for POS operations
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

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_client_id ON customers (client_id);
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON customers (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_location_id ON customers (location_id);
CREATE INDEX IF NOT EXISTS idx_customers_qr_code ON customers (qr_code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers (status);

CREATE INDEX IF NOT EXISTS idx_stamps_customer_id ON stamps (customer_id);
CREATE INDEX IF NOT EXISTS idx_stamps_staff_id ON stamps (staff_id);
CREATE INDEX IF NOT EXISTS idx_rewards_customer_id ON rewards (customer_id);
CREATE INDEX IF NOT EXISTS idx_rewards_staff_id ON rewards (staff_id);

CREATE INDEX IF NOT EXISTS idx_location_staff_user_id ON location_staff (user_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_location_id ON location_staff (location_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_customer_id ON customer_activity (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_location_id ON customer_activity (location_id);

-- Step 6: Enable RLS on new tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_activity ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for customers table
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
    OR
    EXISTS (
      SELECT 1 FROM platform_admin_users pau
      WHERE pau.user_id = auth.uid()
      AND pau.role IN ('super_admin', 'admin')
      AND pau.status = 'active'
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

-- Step 8: Update stamps table policies to work with customer_id
DROP POLICY IF EXISTS "Staff can add stamps customer_id" ON stamps;
CREATE POLICY "Staff can add stamps customer_id" ON stamps
  FOR INSERT
  WITH CHECK (
    customer_id IS NOT NULL AND (
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
    )
  );

DROP POLICY IF EXISTS "Staff can view stamps customer_id" ON stamps;
CREATE POLICY "Staff can view stamps customer_id" ON stamps
  FOR SELECT
  USING (
    customer_id IS NOT NULL AND (
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
    )
  );

-- Step 9: Update rewards table policies to work with customer_id
DROP POLICY IF EXISTS "Staff can redeem rewards customer_id" ON rewards;
CREATE POLICY "Staff can redeem rewards customer_id" ON rewards
  FOR INSERT
  WITH CHECK (
    customer_id IS NOT NULL AND (
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
    )
  );

DROP POLICY IF EXISTS "Staff can view rewards customer_id" ON rewards;
CREATE POLICY "Staff can view rewards customer_id" ON rewards
  FOR SELECT
  USING (
    customer_id IS NOT NULL AND (
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
    )
  );

-- Step 10: Create location_staff policies
DROP POLICY IF EXISTS "Staff can view own records" ON location_staff;
CREATE POLICY "Staff can view own records" ON location_staff
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Client admins can manage location staff" ON location_staff;
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

-- Step 11: Create customer_activity policies
DROP POLICY IF EXISTS "Staff can view location activity" ON customer_activity;
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

DROP POLICY IF EXISTS "Staff can insert location activity" ON customer_activity;
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

DROP POLICY IF EXISTS "System can insert activity" ON customer_activity;
CREATE POLICY "System can insert activity" ON customer_activity
  FOR INSERT
  WITH CHECK (true);

-- Step 12: Grant permissions
GRANT SELECT, INSERT, UPDATE ON customers TO authenticated;
GRANT SELECT, INSERT ON stamps TO authenticated;
GRANT SELECT, INSERT ON rewards TO authenticated;
GRANT SELECT, INSERT, UPDATE ON location_staff TO authenticated;
GRANT SELECT, INSERT ON customer_activity TO authenticated;

GRANT ALL ON customers TO service_role;
GRANT ALL ON stamps TO service_role;
GRANT ALL ON rewards TO service_role;
GRANT ALL ON location_staff TO service_role;
GRANT ALL ON customer_activity TO service_role;

-- Step 13: Insert sample data for testing (using proper UUIDs)
DO $$
DECLARE
  galletti_client_uuid UUID := gen_random_uuid();
  galletti_restaurant_uuid UUID := gen_random_uuid();
  loc1_uuid UUID := gen_random_uuid();
  loc2_uuid UUID := gen_random_uuid();
  loc3_uuid UUID := gen_random_uuid();
  client_exists BOOLEAN := false;
BEGIN
  -- Create platform_clients table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_clients') THEN
    RAISE NOTICE 'Creating platform_clients table...';
    CREATE TABLE platform_clients (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      type TEXT DEFAULT 'restaurant_chain',
      status TEXT DEFAULT 'active',
      plan TEXT DEFAULT 'business',
      contact_email TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Enable RLS
    ALTER TABLE platform_clients ENABLE ROW LEVEL SECURITY;
    
    -- Create permissive RLS policy for service role
    CREATE POLICY "Service role can manage platform clients" ON platform_clients
      FOR ALL USING (true) WITH CHECK (true);
      
    -- Grant permissions
    GRANT ALL ON platform_clients TO service_role;
    GRANT SELECT, INSERT, UPDATE ON platform_clients TO authenticated;
      
    RAISE NOTICE '✓ platform_clients table created';
  END IF;

  -- Check if client already exists by slug
  SELECT EXISTS(SELECT 1 FROM platform_clients WHERE slug = 'galletti') INTO client_exists;
  
  IF client_exists THEN
    -- Get existing client UUID
    SELECT id INTO galletti_client_uuid FROM platform_clients WHERE slug = 'galletti' LIMIT 1;
    RAISE NOTICE 'Using existing Galletti client with ID: %', galletti_client_uuid;
  ELSE
    -- Insert new platform client
    BEGIN
      INSERT INTO platform_clients (id, name, slug, type, status, plan, contact_email)
      VALUES (
        galletti_client_uuid,
        'Galletti Foods',
        'galletti',
        'restaurant_chain',
        'active',
        'business',
        'admin@galletti.com'
      );
      RAISE NOTICE 'Created new Galletti client with ID: %', galletti_client_uuid;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error inserting platform client: %', SQLERRM;
      -- Try to get existing client if insert failed
      SELECT id INTO galletti_client_uuid FROM platform_clients WHERE slug = 'galletti' LIMIT 1;
      IF galletti_client_uuid IS NULL THEN
        RAISE EXCEPTION 'Failed to create or find platform client';
      END IF;
    END;
  END IF;

  -- Verify client exists before proceeding
  SELECT EXISTS(SELECT 1 FROM platform_clients WHERE id = galletti_client_uuid) INTO client_exists;
  IF NOT client_exists THEN
    RAISE EXCEPTION 'Platform client % does not exist in table', galletti_client_uuid;
  END IF;

  -- Create restaurants table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurants') THEN
    RAISE NOTICE 'Creating restaurants table...';
    CREATE TABLE restaurants (
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
    
    -- Enable RLS
    ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
    
    -- Create permissive RLS policy for service role
    CREATE POLICY "Service role can manage restaurants" ON restaurants
      FOR ALL USING (true) WITH CHECK (true);
      
    -- Grant permissions
    GRANT ALL ON restaurants TO service_role;
    GRANT SELECT, INSERT, UPDATE ON restaurants TO authenticated;
      
    RAISE NOTICE '✓ restaurants table created';
  END IF;

  -- Insert restaurant with verification
  BEGIN
    INSERT INTO restaurants (id, client_id, name, brand, email, phone, address, city, state)
    VALUES (
      galletti_restaurant_uuid,
      galletti_client_uuid,
      'Galletti Foods',
      'Galletti',
      'info@galletti.com',
      '+1-555-0123',
      '123 Main Street',
      'Downtown',
      'CA'
    ) ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'Created restaurant with ID: %', galletti_restaurant_uuid;
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE EXCEPTION 'Foreign key violation: client_id % not found in platform_clients', galletti_client_uuid;
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting restaurant: %', SQLERRM;
    RAISE;
  END;

  -- Create locations table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
    RAISE NOTICE 'Creating locations table...';
    CREATE TABLE locations (
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
    
    -- Enable RLS
    ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
    
    -- Create permissive RLS policy for service role
    CREATE POLICY "Service role can manage locations" ON locations
      FOR ALL USING (true) WITH CHECK (true);
      
    -- Grant permissions
    GRANT ALL ON locations TO service_role;
    GRANT SELECT, INSERT, UPDATE ON locations TO authenticated;
      
    RAISE NOTICE '✓ locations table created';
  ELSE
    -- Ensure locations have client_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'client_id') THEN
      ALTER TABLE locations ADD COLUMN client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added client_id column to existing locations table';
    END IF;
    
    -- Ensure locations have status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'status') THEN
      ALTER TABLE locations ADD COLUMN status TEXT DEFAULT 'active';
      RAISE NOTICE 'Added status column to existing locations table';
    END IF;
  END IF;

  -- Insert locations with verification
  BEGIN
    INSERT INTO locations (id, restaurant_id, client_id, name, address, city, state, status)
    VALUES 
      (loc1_uuid, galletti_restaurant_uuid, galletti_client_uuid, 'Main Street Store', '123 Main Street', 'Downtown', 'CA', 'active'),
      (loc2_uuid, galletti_restaurant_uuid, galletti_client_uuid, 'Mall Location', '456 Mall Drive', 'Shopping Center', 'CA', 'active'),
      (loc3_uuid, galletti_restaurant_uuid, galletti_client_uuid, 'Airport Branch', '789 Airport Blvd', 'Terminal City', 'CA', 'active')
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'Created locations with IDs: %, %, %', loc1_uuid, loc2_uuid, loc3_uuid;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting locations: %', SQLERRM;
    RAISE;
  END;

  RAISE NOTICE '=== SAMPLE DATA INSERTION COMPLETE ===';
  RAISE NOTICE 'Client ID: %', galletti_client_uuid;
  RAISE NOTICE 'Restaurant ID: %', galletti_restaurant_uuid;
  RAISE NOTICE 'Location IDs: %, %, %', loc1_uuid, loc2_uuid, loc3_uuid;
END $$;

-- Step 14: Verification
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== COLUMN ALIGNMENT FIX VERIFICATION ===';
  
  -- Check customers table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    RAISE NOTICE '✓ customers table exists';
  ELSE
    RAISE NOTICE '✗ customers table missing';
  END IF;
  
  -- Check customer_id column in stamps
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stamps' AND column_name = 'customer_id') THEN
    RAISE NOTICE '✓ stamps.customer_id column exists';
  ELSE
    RAISE NOTICE '✗ stamps.customer_id column missing';
  END IF;
  
  -- Check customer_id column in rewards
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'customer_id') THEN
    RAISE NOTICE '✓ rewards.customer_id column exists';
  ELSE
    RAISE NOTICE '✗ rewards.customer_id column missing';
  END IF;
  
  -- Check stamps_earned column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stamps' AND column_name = 'stamps_earned') THEN
    RAISE NOTICE '✓ stamps.stamps_earned column exists';
  ELSE
    RAISE NOTICE '✗ stamps.stamps_earned column missing';
  END IF;
  
  RAISE NOTICE '=== COLUMN ALIGNMENT COMPLETE ===';
  RAISE NOTICE 'Database is now compatible with POS operations!';
  RAISE NOTICE 'Both client_id and customer_id columns are available for compatibility.';
END $$; 
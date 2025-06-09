-- ============================================================================
-- TIER 4: CUSTOMER & LOYALTY SYSTEM TABLES
-- ============================================================================
-- This script creates Tier 4 of the hierarchy: Customers and Loyalty System
-- Enforces that only location staff can create customers via QR/POS
-- ============================================================================

-- ============================================================================
-- STEP 1: CUSTOMERS TABLE (Tier 4)
-- ============================================================================

-- Customers table (Tier 4) - End customers created via QR/POS
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Customer identification
  qr_code TEXT NOT NULL UNIQUE,
  customer_number TEXT NOT NULL,
  
  -- Loyalty stats
  total_stamps INTEGER NOT NULL DEFAULT 0,
  total_visits INTEGER NOT NULL DEFAULT 0,
  total_rewards INTEGER NOT NULL DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE,
  
  -- Customer status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Hierarchy enforcement - CRITICAL
  created_by_staff_id UUID NOT NULL REFERENCES public.location_staff(id) ON DELETE RESTRICT,
  
  -- POS integration metadata
  creation_method TEXT NOT NULL DEFAULT 'pos' CHECK (creation_method IN ('pos', 'qr_scan', 'manual')),
  pos_metadata JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT customers_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT customers_phone_format CHECK (phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$'),
  CONSTRAINT customers_stats_positive CHECK (total_stamps >= 0 AND total_visits >= 0 AND total_rewards >= 0),
  UNIQUE(client_id, customer_number)
);

-- ============================================================================
-- STEP 2: LOYALTY SYSTEM TABLES
-- ============================================================================

-- Stamps table - Customer loyalty points/stamps
CREATE TABLE IF NOT EXISTS public.stamps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Stamp details
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes TEXT,
  
  -- Transaction details
  transaction_reference TEXT,
  purchase_amount DECIMAL(10,2),
  
  -- Hierarchy enforcement - CRITICAL
  created_by_staff_id UUID NOT NULL REFERENCES public.location_staff(id) ON DELETE RESTRICT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT stamps_quantity_positive CHECK (quantity > 0)
);

-- Rewards table - Customer reward redemptions
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Reward details
  reward_type TEXT NOT NULL DEFAULT 'free_item',
  reward_description TEXT NOT NULL,
  stamps_used INTEGER NOT NULL CHECK (stamps_used > 0),
  value_amount DECIMAL(10,2),
  
  -- Transaction details
  transaction_reference TEXT,
  status TEXT NOT NULL DEFAULT 'redeemed' CHECK (status IN ('redeemed', 'cancelled', 'expired')),
  
  -- Hierarchy enforcement - CRITICAL
  created_by_staff_id UUID NOT NULL REFERENCES public.location_staff(id) ON DELETE RESTRICT,
  
  -- Metadata
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT rewards_stamps_positive CHECK (stamps_used > 0)
);

-- ============================================================================
-- STEP 3: VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate customer creation
CREATE OR REPLACE FUNCTION validate_customer_creation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Validate creator is active location staff for this location
    IF NOT EXISTS (
      SELECT 1 FROM location_staff 
      WHERE id = NEW.created_by_staff_id 
      AND location_id = NEW.location_id
      AND client_id = NEW.client_id
      AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Only active location staff can create customers for their location';
    END IF;
    
    -- Validate location belongs to client
    IF NOT EXISTS (
      SELECT 1 FROM locations 
      WHERE id = NEW.location_id 
      AND client_id = NEW.client_id
    ) THEN
      RAISE EXCEPTION 'Customer location must belong to customer client';
    END IF;
    
    -- Generate QR code if not provided
    IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
      NEW.qr_code := 'QR_' || replace(NEW.id::TEXT, '-', '');
    END IF;
    
    -- Generate customer number if not provided
    IF NEW.customer_number IS NULL OR NEW.customer_number = '' THEN
      NEW.customer_number := 'CUST_' || extract(epoch from now())::INTEGER::TEXT || '_' || (random() * 1000)::INTEGER::TEXT;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate stamp creation
CREATE OR REPLACE FUNCTION validate_stamp_creation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Validate all entities belong to same client
    IF NOT EXISTS (
      SELECT 1 FROM customers c, locations l, location_staff ls
      WHERE c.id = NEW.customer_id 
      AND l.id = NEW.location_id 
      AND ls.id = NEW.created_by_staff_id
      AND c.client_id = NEW.client_id
      AND l.client_id = NEW.client_id  
      AND ls.client_id = NEW.client_id
      AND c.location_id = NEW.location_id
      AND ls.location_id = NEW.location_id
    ) THEN
      RAISE EXCEPTION 'Stamp customer, location, and staff must all belong to same client and location';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate reward creation
CREATE OR REPLACE FUNCTION validate_reward_creation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Validate all entities belong to same client
    IF NOT EXISTS (
      SELECT 1 FROM customers c, locations l, location_staff ls
      WHERE c.id = NEW.customer_id 
      AND l.id = NEW.location_id 
      AND ls.id = NEW.created_by_staff_id
      AND c.client_id = NEW.client_id
      AND l.client_id = NEW.client_id
      AND ls.client_id = NEW.client_id
      AND c.location_id = NEW.location_id
      AND ls.location_id = NEW.location_id
    ) THEN
      RAISE EXCEPTION 'Reward customer, location, and staff must all belong to same client and location';
    END IF;
    
    -- Validate customer has enough stamps
    IF (SELECT total_stamps FROM customers WHERE id = NEW.customer_id) < NEW.stamps_used THEN
      RAISE EXCEPTION 'Customer does not have enough stamps for this reward';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation triggers
DROP TRIGGER IF EXISTS customer_creation_trigger ON public.customers;
CREATE TRIGGER customer_creation_trigger
  BEFORE INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION validate_customer_creation();

DROP TRIGGER IF EXISTS stamp_creation_trigger ON public.stamps;
CREATE TRIGGER stamp_creation_trigger
  BEFORE INSERT ON public.stamps
  FOR EACH ROW
  EXECUTE FUNCTION validate_stamp_creation();

DROP TRIGGER IF EXISTS reward_creation_trigger ON public.rewards;
CREATE TRIGGER reward_creation_trigger
  BEFORE INSERT ON public.rewards
  FOR EACH ROW
  EXECUTE FUNCTION validate_reward_creation();

-- ============================================================================
-- STEP 4: LOYALTY SYSTEM FUNCTIONS
-- ============================================================================

-- Function to update customer stats after stamp insertion
CREATE OR REPLACE FUNCTION update_customer_stats_on_stamp()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE customers 
    SET 
      total_stamps = total_stamps + NEW.quantity,
      total_visits = total_visits + 1,
      last_visit = NEW.created_at,
      updated_at = now()
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer stats after reward redemption
CREATE OR REPLACE FUNCTION update_customer_stats_on_reward()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE customers 
    SET 
      total_stamps = total_stamps - NEW.stamps_used,
      total_rewards = total_rewards + 1,
      updated_at = now()
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply stat update triggers
DROP TRIGGER IF EXISTS stamp_stats_trigger ON public.stamps;
CREATE TRIGGER stamp_stats_trigger
  AFTER INSERT ON public.stamps
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats_on_stamp();

DROP TRIGGER IF EXISTS reward_stats_trigger ON public.rewards;
CREATE TRIGGER reward_stats_trigger
  AFTER INSERT ON public.rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats_on_reward();

-- ============================================================================
-- STEP 5: CUSTOMER HELPER FUNCTIONS
-- ============================================================================

-- Function to create customer via POS (main creation method)
CREATE OR REPLACE FUNCTION create_customer_via_pos(
  p_name TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_location_id UUID DEFAULT NULL
) RETURNS TABLE (
  customer_id UUID,
  qr_code TEXT,
  customer_number TEXT,
  message TEXT
) AS $$
DECLARE
  v_staff_record RECORD;
  v_customer_id UUID;
  v_qr_code TEXT;
  v_customer_number TEXT;
BEGIN
  -- Get current staff member's details
  SELECT * INTO v_staff_record 
  FROM get_current_location_staff() 
  LIMIT 1;
  
  IF v_staff_record.id IS NULL THEN
    RAISE EXCEPTION 'Only location staff can create customers via POS';
  END IF;
  
  -- Use staff's location if not specified
  IF p_location_id IS NULL THEN
    p_location_id := v_staff_record.location_id;
  ELSIF p_location_id != v_staff_record.location_id THEN
    RAISE EXCEPTION 'Staff can only create customers for their assigned location';
  END IF;
  
  -- Generate unique identifiers
  v_qr_code := 'QR_' || replace(gen_random_uuid()::TEXT, '-', '');
  v_customer_number := 'CUST_' || extract(epoch from now())::INTEGER::TEXT || '_' || (random() * 1000)::INTEGER::TEXT;
  
  -- Create the customer
  INSERT INTO customers (
    client_id, location_id, name, email, phone,
    qr_code, customer_number, created_by_staff_id, creation_method
  ) VALUES (
    v_staff_record.client_id, p_location_id, p_name, p_email, p_phone,
    v_qr_code, v_customer_number, v_staff_record.id, 'pos'
  ) RETURNING id INTO v_customer_id;
  
  -- Return customer details
  RETURN QUERY SELECT 
    v_customer_id,
    v_qr_code,
    v_customer_number,
    'Customer created successfully via POS'::TEXT;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add stamps to customer
CREATE OR REPLACE FUNCTION add_stamps_to_customer(
  p_customer_id UUID,
  p_quantity INTEGER DEFAULT 1,
  p_notes TEXT DEFAULT NULL,
  p_transaction_reference TEXT DEFAULT NULL,
  p_purchase_amount DECIMAL DEFAULT NULL
) RETURNS TABLE (
  stamp_id UUID,
  new_total_stamps INTEGER,
  message TEXT
) AS $$
DECLARE
  v_staff_record RECORD;
  v_stamp_id UUID;
  v_new_total INTEGER;
BEGIN
  -- Get current staff member's details
  SELECT * INTO v_staff_record 
  FROM get_current_location_staff() 
  LIMIT 1;
  
  IF v_staff_record.id IS NULL THEN
    RAISE EXCEPTION 'Only location staff can add stamps';
  END IF;
  
  -- Validate customer belongs to staff's location
  IF NOT EXISTS (
    SELECT 1 FROM customers 
    WHERE id = p_customer_id 
    AND location_id = v_staff_record.location_id
    AND client_id = v_staff_record.client_id
  ) THEN
    RAISE EXCEPTION 'Customer must belong to staff member''s location';
  END IF;
  
  -- Add stamps
  INSERT INTO stamps (
    customer_id, location_id, client_id, quantity, notes,
    transaction_reference, purchase_amount, created_by_staff_id
  ) VALUES (
    p_customer_id, v_staff_record.location_id, v_staff_record.client_id,
    p_quantity, p_notes, p_transaction_reference, p_purchase_amount, v_staff_record.id
  ) RETURNING id INTO v_stamp_id;
  
  -- Get new total
  SELECT total_stamps INTO v_new_total 
  FROM customers 
  WHERE id = p_customer_id;
  
  -- Return result
  RETURN QUERY SELECT 
    v_stamp_id,
    v_new_total,
    format('Added %s stamps. New total: %s', p_quantity, v_new_total);
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_client_id ON public.customers(client_id);
CREATE INDEX IF NOT EXISTS idx_customers_location_id ON public.customers(location_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON public.customers(created_by_staff_id);
CREATE INDEX IF NOT EXISTS idx_customers_qr_code ON public.customers(qr_code);
CREATE INDEX IF NOT EXISTS idx_customers_customer_number ON public.customers(customer_number);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- Stamps indexes
CREATE INDEX IF NOT EXISTS idx_stamps_customer_id ON public.stamps(customer_id);
CREATE INDEX IF NOT EXISTS idx_stamps_location_id ON public.stamps(location_id);
CREATE INDEX IF NOT EXISTS idx_stamps_client_id ON public.stamps(client_id);
CREATE INDEX IF NOT EXISTS idx_stamps_created_by ON public.stamps(created_by_staff_id);
CREATE INDEX IF NOT EXISTS idx_stamps_created_at ON public.stamps(created_at);

-- Rewards indexes
CREATE INDEX IF NOT EXISTS idx_rewards_customer_id ON public.rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_rewards_location_id ON public.rewards(location_id);
CREATE INDEX IF NOT EXISTS idx_rewards_client_id ON public.rewards(client_id);
CREATE INDEX IF NOT EXISTS idx_rewards_created_by ON public.rewards(created_by_staff_id);
CREATE INDEX IF NOT EXISTS idx_rewards_created_at ON public.rewards(created_at);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON public.rewards(status);

-- ============================================================================
-- STEP 7: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all customer tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policy for customers
CREATE POLICY "customers_access" ON public.customers
  FOR ALL
  USING (
    -- Superadmins can see all customers
    is_current_user_superadmin() OR
    -- Client admins can see their client's customers
    client_id IN (
      SELECT client_id FROM client_admins 
      WHERE user_id = auth.uid() AND is_active = true
    ) OR
    -- Location staff can see customers at their location
    location_id IN (
      SELECT location_id FROM location_staff 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policy for stamps
CREATE POLICY "stamps_access" ON public.stamps
  FOR ALL
  USING (
    -- Superadmins can see all stamps
    is_current_user_superadmin() OR
    -- Client admins can see their client's stamps
    client_id IN (
      SELECT client_id FROM client_admins 
      WHERE user_id = auth.uid() AND is_active = true
    ) OR
    -- Location staff can see stamps at their location
    location_id IN (
      SELECT location_id FROM location_staff 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policy for rewards
CREATE POLICY "rewards_access" ON public.rewards
  FOR ALL
  USING (
    -- Superadmins can see all rewards
    is_current_user_superadmin() OR
    -- Client admins can see their client's rewards
    client_id IN (
      SELECT client_id FROM client_admins 
      WHERE user_id = auth.uid() AND is_active = true
    ) OR
    -- Location staff can see rewards at their location
    location_id IN (
      SELECT location_id FROM location_staff 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================================================
-- STEP 8: TESTING FUNCTIONS
-- ============================================================================

-- Function to test customer tables setup
CREATE OR REPLACE FUNCTION test_customer_tables_setup()
RETURNS TABLE (
  test_name TEXT,
  status TEXT,
  message TEXT
) AS $$
BEGIN
  -- Test 1: Check if customers table exists
  RETURN QUERY SELECT 
    'customers_table_exists'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'customers' AND table_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Customers table exists'::TEXT;
  
  -- Test 2: Check if stamps table exists
  RETURN QUERY SELECT 
    'stamps_table_exists'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'stamps' AND table_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Stamps table exists'::TEXT;
  
  -- Test 3: Check if rewards table exists
  RETURN QUERY SELECT 
    'rewards_table_exists'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'rewards' AND table_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Rewards table exists'::TEXT;
  
  -- Test 4: Check POS functions exist
  RETURN QUERY SELECT 
    'pos_functions_exist'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'create_customer_via_pos' AND routine_schema = 'public'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'POS functions exist'::TEXT;
  
  -- Test 5: Check RLS enabled
  RETURN QUERY SELECT 
    'customers_rls_enabled'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'customers' AND rowsecurity = true
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Customers RLS enabled'::TEXT;
  
  -- Test 6: Check validation triggers
  RETURN QUERY SELECT 
    'customer_validation_triggers'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'customer_creation_trigger'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Customer validation triggers exist'::TEXT;
    
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ TIER 4 CUSTOMER & LOYALTY TABLES SETUP COMPLETE';
  RAISE NOTICE '🔧 Tables created: customers, stamps, rewards';
  RAISE NOTICE '🎯 Functions created: create_customer_via_pos, add_stamps_to_customer';
  RAISE NOTICE '🔒 RLS enabled with hierarchy-based policies';
  RAISE NOTICE '🛡️ Validation triggers ensure only location staff can create customers';
  RAISE NOTICE '📊 Run SELECT * FROM test_customer_tables_setup(); to validate';
  RAISE NOTICE '🏪 POS-ready: Use create_customer_via_pos() for customer creation';
END $$; 
-- ============================================================================
-- 👤 CUSTOMER MANAGEMENT TABLES - Day 2 Implementation  
-- Creates/updates customer loyalty system compatible with existing schema
-- FIXED: Uses location_id instead of restaurant_id to match existing schema
-- ============================================================================

-- 👤 CUSTOMERS TABLE - Core customer data
-- This table may already exist, we'll add missing columns if needed
DO $$ 
BEGIN
    -- Create customers table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='customers' AND table_schema='public') THEN
        CREATE TABLE public.customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
          location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          qr_code TEXT UNIQUE NOT NULL,
          customer_number TEXT NOT NULL,
          total_stamps INTEGER DEFAULT 0,
          total_visits INTEGER DEFAULT 0,
          total_rewards INTEGER DEFAULT 0,
          last_visit TIMESTAMPTZ,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
          preferences JSONB DEFAULT '{}',
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(client_id, customer_number)
        );
    END IF;

    -- Add missing columns to customers if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='total_stamps') THEN
        ALTER TABLE public.customers ADD COLUMN total_stamps INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='total_visits') THEN
        ALTER TABLE public.customers ADD COLUMN total_visits INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='total_rewards') THEN
        ALTER TABLE public.customers ADD COLUMN total_rewards INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='last_visit') THEN
        ALTER TABLE public.customers ADD COLUMN last_visit TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='preferences') THEN
        ALTER TABLE public.customers ADD COLUMN preferences JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='notes') THEN
        ALTER TABLE public.customers ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='qr_code') THEN
        ALTER TABLE public.customers ADD COLUMN qr_code TEXT UNIQUE;
        -- Generate QR codes for existing customers
        UPDATE public.customers SET qr_code = 'QR_' || replace(id::TEXT, '-', '') WHERE qr_code IS NULL;
        ALTER TABLE public.customers ALTER COLUMN qr_code SET NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='customer_number') THEN
        ALTER TABLE public.customers ADD COLUMN customer_number TEXT;
        -- Generate customer numbers for existing customers
        UPDATE public.customers SET customer_number = 'CUST_' || extract(epoch from created_at)::INTEGER::TEXT || '_' || (random() * 1000)::INTEGER::TEXT WHERE customer_number IS NULL;
        ALTER TABLE public.customers ALTER COLUMN customer_number SET NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='status') THEN
        ALTER TABLE public.customers ADD COLUMN status TEXT DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'blocked'));
    END IF;
END $$;

-- 🎫 STAMPS TABLE - Loyalty stamps/points
CREATE TABLE IF NOT EXISTS public.stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  notes TEXT,
  transaction_reference TEXT,
  purchase_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🎁 REWARDS TABLE - Redeemed rewards
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  reward_type TEXT DEFAULT 'free_item',
  reward_description TEXT NOT NULL,
  stamps_used INTEGER CHECK (stamps_used > 0),
  value_amount DECIMAL(10,2),
  transaction_reference TEXT,
  status TEXT DEFAULT 'redeemed' CHECK (status IN ('redeemed', 'cancelled', 'expired')),
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 📧 CUSTOMER NOTIFICATIONS TABLE - Push notifications and messages
CREATE TABLE IF NOT EXISTS public.customer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'promotion', 'reward', 'reminder', 'welcome')),
  channel TEXT DEFAULT 'app' CHECK (channel IN ('app', 'email', 'sms', 'push')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🔍 INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_customers_client_id ON public.customers(client_id);
CREATE INDEX IF NOT EXISTS idx_customers_location_id ON public.customers(location_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_qr_code ON public.customers(qr_code);
CREATE INDEX IF NOT EXISTS idx_customers_customer_number ON public.customers(customer_number);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON public.customers(last_visit);

CREATE INDEX IF NOT EXISTS idx_stamps_customer_id ON public.stamps(customer_id);
CREATE INDEX IF NOT EXISTS idx_stamps_location_id ON public.stamps(location_id);
CREATE INDEX IF NOT EXISTS idx_stamps_client_id ON public.stamps(client_id);
CREATE INDEX IF NOT EXISTS idx_stamps_created_at ON public.stamps(created_at);
CREATE INDEX IF NOT EXISTS idx_stamps_transaction_ref ON public.stamps(transaction_reference);

CREATE INDEX IF NOT EXISTS idx_rewards_customer_id ON public.rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_rewards_location_id ON public.rewards(location_id);
CREATE INDEX IF NOT EXISTS idx_rewards_client_id ON public.rewards(client_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON public.rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_created_at ON public.rewards(created_at);

CREATE INDEX IF NOT EXISTS idx_customer_notifications_customer_id ON public.customer_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_client_id ON public.customer_notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_status ON public.customer_notifications(status);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_type ON public.customer_notifications(type);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_scheduled_for ON public.customer_notifications(scheduled_for);

-- 🔄 TRIGGERS for updated_at
DO $$
BEGIN
    -- Add trigger for customers if updated_at column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='customers' AND column_name='updated_at') THEN
        DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
        CREATE TRIGGER update_customers_updated_at
          BEFORE UPDATE ON public.customers
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 🔄 BUSINESS LOGIC TRIGGERS

-- Trigger to update customer stats when stamps are added
CREATE OR REPLACE FUNCTION update_customer_stats_on_stamp()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.customers 
    SET 
      total_stamps = total_stamps + NEW.quantity,
      total_visits = total_visits + 1,
      last_visit = NEW.created_at,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_stats_on_stamp ON public.stamps;
CREATE TRIGGER trigger_update_customer_stats_on_stamp
  AFTER INSERT ON public.stamps
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats_on_stamp();

-- Trigger to update customer stats when rewards are redeemed
CREATE OR REPLACE FUNCTION update_customer_stats_on_reward()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.customers 
    SET 
      total_stamps = total_stamps - NEW.stamps_used,
      total_rewards = total_rewards + 1,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_stats_on_reward ON public.rewards;
CREATE TRIGGER trigger_update_customer_stats_on_reward
  AFTER INSERT ON public.rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats_on_reward();

-- Trigger to validate customer data consistency
CREATE OR REPLACE FUNCTION validate_customer_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that customer location belongs to customer client
  IF NOT EXISTS (
    SELECT 1 FROM public.locations l 
    WHERE l.id = NEW.location_id 
      AND l.client_id = NEW.client_id
  ) THEN
    RAISE EXCEPTION 'Customer location must belong to customer client';
  END IF;
  
  -- Generate QR code if not provided
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := 'QR_' || replace(NEW.id::TEXT, '-', '');
  END IF;
  
  -- Generate customer number if not provided
  IF NEW.customer_number IS NULL OR NEW.customer_number = '' THEN
    NEW.customer_number := 'CUST_' || extract(epoch from NOW())::INTEGER::TEXT || '_' || (random() * 1000)::INTEGER::TEXT;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_customer_data ON public.customers;
CREATE TRIGGER trigger_validate_customer_data
  BEFORE INSERT OR UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION validate_customer_data();

-- Trigger to validate stamp/reward relationships
CREATE OR REPLACE FUNCTION validate_stamp_reward_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that all entities belong to same client
  IF NOT EXISTS (
    SELECT 1 FROM public.customers c, public.locations l
    WHERE c.id = NEW.customer_id 
      AND l.id = NEW.location_id 
      AND c.client_id = NEW.client_id
      AND l.client_id = NEW.client_id
      AND c.location_id = NEW.location_id
  ) THEN
    RAISE EXCEPTION 'Customer, location, and client must all be related';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_stamp_data ON public.stamps;
CREATE TRIGGER trigger_validate_stamp_data
  BEFORE INSERT ON public.stamps
  FOR EACH ROW
  EXECUTE FUNCTION validate_stamp_reward_data();

DROP TRIGGER IF EXISTS trigger_validate_reward_data ON public.rewards;
CREATE TRIGGER trigger_validate_reward_data
  BEFORE INSERT ON public.rewards
  FOR EACH ROW
  EXECUTE FUNCTION validate_stamp_reward_data();

-- 🔒 ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers table
DROP POLICY IF EXISTS "Users can view customers in their scope" ON public.customers;
CREATE POLICY "Users can view customers in their scope" ON public.customers
  FOR SELECT USING (
    -- Superadmins can see all customers
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'superadmin'
        AND ur.status = 'active'
    ) OR
    -- Client admins can see customers in their client
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'client_admin'
        AND ur.client_id = customers.client_id
        AND ur.status = 'active'
    ) OR
    -- Location staff can see customers at their location
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'location_staff'
        AND ur.location_id = customers.location_id
        AND ur.status = 'active'
    )
  );

-- RLS Policies for stamps table
DROP POLICY IF EXISTS "Users can view stamps in their scope" ON public.stamps;
CREATE POLICY "Users can view stamps in their scope" ON public.stamps
  FOR SELECT USING (
    -- Superadmins can see all stamps
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'superadmin'
        AND ur.status = 'active'
    ) OR
    -- Client admins can see stamps in their client
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'client_admin'
        AND ur.client_id = stamps.client_id
        AND ur.status = 'active'
    ) OR
    -- Location staff can see stamps at their location
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'location_staff'
        AND ur.location_id = stamps.location_id
        AND ur.status = 'active'
    )
  );

-- RLS Policies for rewards table
DROP POLICY IF EXISTS "Users can view rewards in their scope" ON public.rewards;
CREATE POLICY "Users can view rewards in their scope" ON public.rewards
  FOR SELECT USING (
    -- Superadmins can see all rewards
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'superadmin'
        AND ur.status = 'active'
    ) OR
    -- Client admins can see rewards in their client
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'client_admin'
        AND ur.client_id = rewards.client_id
        AND ur.status = 'active'
    ) OR
    -- Location staff can see rewards at their location
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'location_staff'
        AND ur.location_id = rewards.location_id
        AND ur.status = 'active'
    )
  );

-- RLS Policies for customer_notifications table
DROP POLICY IF EXISTS "Users can view notifications in their scope" ON public.customer_notifications;
CREATE POLICY "Users can view notifications in their scope" ON public.customer_notifications
  FOR SELECT USING (
    -- Superadmins can see all notifications
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'superadmin'
        AND ur.status = 'active'
    ) OR
    -- Client admins can see notifications in their client
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'client_admin'
        AND ur.client_id = customer_notifications.client_id
        AND ur.status = 'active'
    ) OR
    -- Location staff can see notifications at their location
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'location_staff'
        AND ur.location_id = customer_notifications.location_id
        AND ur.status = 'active'
    )
  );

-- 📝 COMMENTS for documentation
COMMENT ON TABLE public.customers IS 'Core customer data and loyalty tracking';
COMMENT ON TABLE public.stamps IS 'Individual loyalty stamps/points earned by customers';
COMMENT ON TABLE public.rewards IS 'Rewards redeemed by customers using stamps';
COMMENT ON TABLE public.customer_notifications IS 'Notifications sent to customers';

COMMENT ON COLUMN public.customers.qr_code IS 'Unique QR code for customer identification';
COMMENT ON COLUMN public.customers.customer_number IS 'Human-readable customer number';
COMMENT ON COLUMN public.customers.preferences IS 'Customer preferences and settings';
COMMENT ON COLUMN public.stamps.quantity IS 'Number of stamps earned in this transaction';
COMMENT ON COLUMN public.rewards.stamps_used IS 'Number of stamps used to redeem this reward';
COMMENT ON COLUMN public.customer_notifications.metadata IS 'Additional notification data and tracking';

-- ✅ SUCCESS
SELECT 'Customer management tables created/updated successfully!' as status; 
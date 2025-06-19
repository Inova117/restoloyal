-- ============================================================================
-- 🚀 MASTER SETUP SCRIPT - Day 2 Implementation
-- Runs all SQL scripts in the correct order to set up the complete system
-- FIXED: Works with existing schema (clients, locations, user_roles, location_staff)
-- ============================================================================

-- ⚡ STEP 0: Ensure required function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 📊 STEP 1: Base Hierarchy Tables (Clients → Locations)
-- This adds missing columns to existing tables and creates sample data
DO $$
BEGIN
  RAISE NOTICE '🏢 Setting up base hierarchy tables...';
END $$;

-- 🏢 CLIENTS TABLE - Add missing columns to existing table
DO $$ 
BEGIN
    -- Create clients table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='clients' AND table_schema='public') THEN
        CREATE TABLE public.clients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          address TEXT,
          website TEXT,
          business_type TEXT,
          subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise')),
          subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created clients table';
    ELSE
        RAISE NOTICE '✅ Clients table already exists, adding missing columns...';
    END IF;

    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='subscription_status') THEN
        ALTER TABLE public.clients ADD COLUMN subscription_status TEXT DEFAULT 'active' 
        CHECK (subscription_status IN ('active', 'suspended', 'cancelled'));
        RAISE NOTICE '✅ Added subscription_status column to clients';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='subscription_plan') THEN
        ALTER TABLE public.clients ADD COLUMN subscription_plan TEXT DEFAULT 'basic' 
        CHECK (subscription_plan IN ('basic', 'premium', 'enterprise'));
        RAISE NOTICE '✅ Added subscription_plan column to clients';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='settings') THEN
        ALTER TABLE public.clients ADD COLUMN settings JSONB DEFAULT '{}';
        RAISE NOTICE '✅ Added settings column to clients';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='website') THEN
        ALTER TABLE public.clients ADD COLUMN website TEXT;
        RAISE NOTICE '✅ Added website column to clients';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='business_type') THEN
        ALTER TABLE public.clients ADD COLUMN business_type TEXT;
        RAISE NOTICE '✅ Added business_type column to clients';
    END IF;
END $$;

-- 📍 LOCATIONS TABLE - Add missing columns to existing table
DO $$ 
BEGIN
    -- Create locations table if it doesn't exist (it should exist)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='locations' AND table_schema='public') THEN
        CREATE TABLE public.locations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          city TEXT NOT NULL,
          state TEXT,
          postal_code TEXT,
          country TEXT DEFAULT 'US',
          phone TEXT,
          email TEXT,
          coordinates POINT,
          business_hours JSONB DEFAULT '{}',
          features JSONB DEFAULT '{}',
          pos_settings JSONB DEFAULT '{}',
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created locations table';
    ELSE
        RAISE NOTICE '✅ Locations table already exists, adding missing columns...';
    END IF;

    -- Add missing columns to locations if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='locations' AND column_name='features') THEN
        ALTER TABLE public.locations ADD COLUMN features JSONB DEFAULT '{}';
        RAISE NOTICE '✅ Added features column to locations';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='locations' AND column_name='pos_settings') THEN
        ALTER TABLE public.locations ADD COLUMN pos_settings JSONB DEFAULT '{}';
        RAISE NOTICE '✅ Added pos_settings column to locations';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='locations' AND column_name='business_hours') THEN
        ALTER TABLE public.locations ADD COLUMN business_hours JSONB DEFAULT '{}';
        RAISE NOTICE '✅ Added business_hours column to locations';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='locations' AND column_name='coordinates') THEN
        ALTER TABLE public.locations ADD COLUMN coordinates POINT;
        RAISE NOTICE '✅ Added coordinates column to locations';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='locations' AND column_name='status') THEN
        ALTER TABLE public.locations ADD COLUMN status TEXT DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'maintenance'));
        RAISE NOTICE '✅ Added status column to locations';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='locations' AND column_name='postal_code') THEN
        ALTER TABLE public.locations ADD COLUMN postal_code TEXT;
        RAISE NOTICE '✅ Added postal_code column to locations';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='locations' AND column_name='country') THEN
        ALTER TABLE public.locations ADD COLUMN country TEXT DEFAULT 'US';
        RAISE NOTICE '✅ Added country column to locations';
    END IF;
END $$;

-- 📊 STEP 2: Staff Management Tables
DO $$
BEGIN
  RAISE NOTICE '👥 Setting up staff management tables...';
END $$;

-- 👥 USER_ROLES TABLE - Add missing columns to existing table
DO $$ 
BEGIN
    -- Create user_roles table if it doesn't exist (it should exist)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_roles' AND table_schema='public') THEN
        CREATE TABLE public.user_roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
          location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('superadmin', 'client_admin', 'restaurant_admin', 'location_staff')),
          permissions JSONB DEFAULT '[]',
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, client_id, location_id)
        );
        RAISE NOTICE '✅ Created user_roles table';
    ELSE
        RAISE NOTICE '✅ User_roles table already exists, adding missing columns...';
    END IF;

    -- Add missing columns to user_roles if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_roles' AND column_name='permissions') THEN
        ALTER TABLE public.user_roles ADD COLUMN permissions JSONB DEFAULT '[]';
        RAISE NOTICE '✅ Added permissions column to user_roles';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_roles' AND column_name='status') THEN
        ALTER TABLE public.user_roles ADD COLUMN status TEXT DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'pending'));
        RAISE NOTICE '✅ Added status column to user_roles';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_roles' AND column_name='updated_at') THEN
        ALTER TABLE public.user_roles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column to user_roles';
    END IF;
END $$;

-- 📧 STAFF INVITATIONS TABLE - New table
CREATE TABLE IF NOT EXISTS public.staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client_admin', 'restaurant_admin', 'location_staff')),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '[]',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 📊 STAFF ACTIVITY LOG TABLE - New table
CREATE TABLE IF NOT EXISTS public.staff_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🔐 STAFF SESSIONS TABLE - New table
CREATE TABLE IF NOT EXISTS public.staff_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 📊 STEP 3: Customer Management Tables
DO $$
BEGIN
  RAISE NOTICE '👤 Setting up customer management tables...';
END $$;

-- 👤 CUSTOMERS TABLE - Add missing columns to existing table
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
        RAISE NOTICE '✅ Created customers table';
    ELSE
        RAISE NOTICE '✅ Customers table already exists, adding missing columns...';
    END IF;

    -- Add missing columns to customers if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='total_stamps') THEN
        ALTER TABLE public.customers ADD COLUMN total_stamps INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added total_stamps column to customers';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='total_visits') THEN
        ALTER TABLE public.customers ADD COLUMN total_visits INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added total_visits column to customers';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='total_rewards') THEN
        ALTER TABLE public.customers ADD COLUMN total_rewards INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added total_rewards column to customers';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='last_visit') THEN
        ALTER TABLE public.customers ADD COLUMN last_visit TIMESTAMPTZ;
        RAISE NOTICE '✅ Added last_visit column to customers';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='preferences') THEN
        ALTER TABLE public.customers ADD COLUMN preferences JSONB DEFAULT '{}';
        RAISE NOTICE '✅ Added preferences column to customers';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='notes') THEN
        ALTER TABLE public.customers ADD COLUMN notes TEXT;
        RAISE NOTICE '✅ Added notes column to customers';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='qr_code') THEN
        ALTER TABLE public.customers ADD COLUMN qr_code TEXT UNIQUE;
        -- Generate QR codes for existing customers
        UPDATE public.customers SET qr_code = 'QR_' || replace(id::TEXT, '-', '') WHERE qr_code IS NULL;
        ALTER TABLE public.customers ALTER COLUMN qr_code SET NOT NULL;
        RAISE NOTICE '✅ Added qr_code column to customers';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='customer_number') THEN
        ALTER TABLE public.customers ADD COLUMN customer_number TEXT;
        -- Generate customer numbers for existing customers
        UPDATE public.customers SET customer_number = 'CUST_' || extract(epoch from created_at)::INTEGER::TEXT || '_' || (random() * 1000)::INTEGER::TEXT WHERE customer_number IS NULL;
        ALTER TABLE public.customers ALTER COLUMN customer_number SET NOT NULL;
        RAISE NOTICE '✅ Added customer_number column to customers';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='status') THEN
        ALTER TABLE public.customers ADD COLUMN status TEXT DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'blocked'));
        RAISE NOTICE '✅ Added status column to customers';
    END IF;
END $$;

-- 🎫 STAMPS TABLE - New table
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

-- 🎁 REWARDS TABLE - New table
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

-- 📧 CUSTOMER NOTIFICATIONS TABLE - New table
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

-- 📊 STEP 4: Create Indexes
DO $$
BEGIN
  RAISE NOTICE '🔍 Creating performance indexes...';
END $$;

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_subscription_status ON public.clients(subscription_status);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);

-- Locations indexes
CREATE INDEX IF NOT EXISTS idx_locations_client_id ON public.locations(client_id);
CREATE INDEX IF NOT EXISTS idx_locations_name ON public.locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_city ON public.locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_status ON public.locations(status);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_client_id ON public.user_roles(client_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_location_id ON public.user_roles(location_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_status ON public.user_roles(status);

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_client_id ON public.customers(client_id);
CREATE INDEX IF NOT EXISTS idx_customers_location_id ON public.customers(location_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_qr_code ON public.customers(qr_code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);

-- Stamps indexes
CREATE INDEX IF NOT EXISTS idx_stamps_customer_id ON public.stamps(customer_id);
CREATE INDEX IF NOT EXISTS idx_stamps_location_id ON public.stamps(location_id);
CREATE INDEX IF NOT EXISTS idx_stamps_client_id ON public.stamps(client_id);
CREATE INDEX IF NOT EXISTS idx_stamps_created_at ON public.stamps(created_at);

-- Rewards indexes
CREATE INDEX IF NOT EXISTS idx_rewards_customer_id ON public.rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_rewards_location_id ON public.rewards(location_id);
CREATE INDEX IF NOT EXISTS idx_rewards_client_id ON public.rewards(client_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON public.rewards(status);

-- 📊 STEP 5: Add Sample Data
DO $$
BEGIN
  RAISE NOTICE '📊 Adding sample data...';
END $$;

-- Insert sample clients if they don't exist
INSERT INTO public.clients (id, name, email, phone, business_type, subscription_plan) 
SELECT '550e8400-e29b-41d4-a716-446655440000', 'Galletti Restaurant Group', 'admin@galletti.com', '+1-555-0123', 'Restaurant Chain', 'premium'
WHERE NOT EXISTS (SELECT 1 FROM public.clients WHERE id = '550e8400-e29b-41d4-a716-446655440000');

INSERT INTO public.clients (id, name, email, phone, business_type, subscription_plan) 
SELECT '550e8400-e29b-41d4-a716-446655440001', 'Downtown Eats LLC', 'contact@downtowneats.com', '+1-555-0124', 'Restaurant Group', 'basic'
WHERE NOT EXISTS (SELECT 1 FROM public.clients WHERE id = '550e8400-e29b-41d4-a716-446655440001');

-- Insert sample locations if they don't exist
INSERT INTO public.locations (id, client_id, name, address, city, state, postal_code) 
SELECT '770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Main Street Store', '123 Main St', 'Downtown', 'CA', '90210'
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = '770e8400-e29b-41d4-a716-446655440000');

INSERT INTO public.locations (id, client_id, name, address, city, state, postal_code) 
SELECT '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Mall Location', '456 Mall Ave', 'Shopping Center', 'CA', '90211'
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = '770e8400-e29b-41d4-a716-446655440001');

-- 📊 STEP 6: Final Verification
DO $$
DECLARE
  table_count INTEGER;
  client_count INTEGER;
  location_count INTEGER;
BEGIN
  RAISE NOTICE '✅ Running final verification...';
  
  -- Count tables created
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('clients', 'locations', 'user_roles', 'customers', 'stamps', 'rewards', 'staff_invitations', 'staff_activity_log', 'staff_sessions', 'customer_notifications');
  
  -- Count sample data
  SELECT COUNT(*) INTO client_count FROM public.clients;
  SELECT COUNT(*) INTO location_count FROM public.locations;
  
  RAISE NOTICE '📊 SETUP COMPLETE!';
  RAISE NOTICE '   Tables created/updated: %', table_count;
  RAISE NOTICE '   Sample clients: %', client_count;
  RAISE NOTICE '   Sample locations: %', location_count;
  RAISE NOTICE '🚀 Database is ready for Edge Functions!';
END $$;

-- ✅ SUCCESS
SELECT 'All database setup completed successfully!' as status; 
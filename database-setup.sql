-- ============================================================================
-- ZERIONCORE RESTAURANT LOYALTY PLATFORM - DATABASE SETUP SCRIPT
-- ============================================================================
-- This script sets up the complete database schema for the multi-client restaurant loyalty platform.
-- ZerionCore is the platform provider, Galletti is the first client.
-- Run this in your Supabase SQL Editor to ensure proper setup.
-- ============================================================================

-- Step 1: Create platform_clients table (for managing restaurant chains/groups)
CREATE TABLE IF NOT EXISTS platform_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE, -- e.g., 'galletti', 'pizza_palace'
  type TEXT DEFAULT 'restaurant_chain', -- 'restaurant_chain' or 'single_restaurant'
  status TEXT DEFAULT 'active', -- 'active', 'trial', 'suspended'
  plan TEXT DEFAULT 'business', -- 'business', 'trial', 'enterprise'
  contact_email TEXT,
  contact_phone TEXT,
  billing_address TEXT,
  monthly_revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 1b: Add additional columns to platform_clients if they don't exist
DO $$
BEGIN
    -- Add columns one by one, ignoring errors if they already exist
    BEGIN
        ALTER TABLE platform_clients ADD COLUMN logo VARCHAR(255);
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE platform_clients ADD COLUMN restaurant_count INTEGER DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE platform_clients ADD COLUMN location_count INTEGER DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE platform_clients ADD COLUMN customer_count INTEGER DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE platform_clients ADD COLUMN growth_rate DECIMAL(5,2) DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE platform_clients ADD COLUMN join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE platform_clients ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- Step 2: Create app_role enum (updated for new structure)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    DROP TYPE public.app_role CASCADE;
  END IF;
  CREATE TYPE public.app_role AS ENUM ('zerion_admin', 'client_admin', 'restaurant_admin', 'location_staff');
END $$;

-- Step 3: Create restaurants table (updated with client_id)
DROP TABLE IF EXISTS public.restaurants CASCADE;
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT, -- e.g., 'Pizza Palace', 'Burger Kingdom' for Galletti
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

-- Step 4: Create locations table (for multi-location restaurants)
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  phone TEXT,
  manager_name TEXT,
  manager_email TEXT,
  is_active BOOLEAN DEFAULT true,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 5: Create clients table (updated with location support)
DROP TABLE IF EXISTS public.clients CASCADE;
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  qr_code TEXT UNIQUE NOT NULL,
  stamps INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE,
  customer_status TEXT DEFAULT 'active', -- 'active', 'inactive', 'blocked'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 6: Create stamps table (updated)
DROP TABLE IF EXISTS public.stamps CASCADE;
CREATE TABLE public.stamps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  added_by UUID REFERENCES auth.users(id) NOT NULL,
  amount INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 7: Create rewards table (updated)
DROP TABLE IF EXISTS public.rewards CASCADE;
CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  redeemed_by UUID REFERENCES auth.users(id) NOT NULL,
  stamps_used INTEGER NOT NULL,
  description TEXT,
  value DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 8: Create user_roles table (updated)
DROP TABLE IF EXISTS public.user_roles CASCADE;
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  client_id UUID REFERENCES public.platform_clients(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 9: Insert initial platform data with proper UUIDs
DO $$
DECLARE
  galletti_client_id UUID := gen_random_uuid();
  demo_pizza_id UUID := gen_random_uuid();
  test_burgers_id UUID := gen_random_uuid();
  
  pizza_palace_id UUID := gen_random_uuid();
  burger_kingdom_id UUID := gen_random_uuid();
  taco_fiesta_id UUID := gen_random_uuid();
  sushi_express_id UUID := gen_random_uuid();
  coffee_corner_id UUID := gen_random_uuid();
  healthy_bowls_id UUID := gen_random_uuid();
BEGIN
  -- No sample data inserted - ready for real testing
  NULL;
END $$;

-- Step 10: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_platform_clients_slug ON public.platform_clients(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_client_id ON public.restaurants(client_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON public.restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_restaurant_id ON public.locations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_clients_restaurant_id ON public.clients(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_clients_location_id ON public.clients(location_id);
CREATE INDEX IF NOT EXISTS idx_clients_qr_code ON public.clients(qr_code);
CREATE INDEX IF NOT EXISTS idx_stamps_client_id ON public.stamps(client_id);
CREATE INDEX IF NOT EXISTS idx_stamps_restaurant_id ON public.stamps(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_stamps_location_id ON public.stamps(location_id);
CREATE INDEX IF NOT EXISTS idx_rewards_client_id ON public.rewards(client_id);
CREATE INDEX IF NOT EXISTS idx_rewards_restaurant_id ON public.rewards(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Step 11: Enable RLS on all tables
ALTER TABLE public.platform_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 12: Create RLS Policies for platform_clients table
DROP POLICY IF EXISTS "ZerionCore admins can view all clients" ON public.platform_clients;
CREATE POLICY "ZerionCore admins can view all clients" 
  ON public.platform_clients 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('admin@zerioncore.com', 'platform@zerioncore.com', 'owner@zerioncore.com', 'martin@zerionstudio.com')
    )
  );

DROP POLICY IF EXISTS "Client admins can view their own client" ON public.platform_clients;
CREATE POLICY "Client admins can view their own client" 
  ON public.platform_clients 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.email IN ('admin@galletti.com', 'corporate@galletti.com', 'hq@galletti.com') AND slug = 'galletti')
      )
    )
  );

-- Step 13: Create RLS Policies for restaurants table
DROP POLICY IF EXISTS "ZerionCore admins can view all restaurants" ON public.restaurants;
CREATE POLICY "ZerionCore admins can view all restaurants" 
  ON public.restaurants 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('admin@zerioncore.com', 'platform@zerioncore.com', 'owner@zerioncore.com', 'martin@zerionstudio.com')
    )
  );

DROP POLICY IF EXISTS "Galletti HQ can view their restaurants" ON public.restaurants;
CREATE POLICY "Galletti HQ can view their restaurants" 
  ON public.restaurants 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users, public.platform_clients
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('admin@galletti.com', 'corporate@galletti.com', 'hq@galletti.com')
      AND platform_clients.id = restaurants.client_id
      AND platform_clients.slug = 'galletti'
    )
  );

DROP POLICY IF EXISTS "Restaurant owners can view their own restaurants" ON public.restaurants;
CREATE POLICY "Restaurant owners can view their own restaurants" 
  ON public.restaurants 
  FOR ALL
  USING (auth.uid() = user_id);

-- Step 14: Create RLS Policies for locations table
DROP POLICY IF EXISTS "ZerionCore admins can view all locations" ON public.locations;
CREATE POLICY "ZerionCore admins can view all locations" 
  ON public.locations 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('admin@zerioncore.com', 'platform@zerioncore.com', 'owner@zerioncore.com', 'martin@zerionstudio.com')
    )
  );

DROP POLICY IF EXISTS "Galletti HQ can view their locations" ON public.locations;
CREATE POLICY "Galletti HQ can view their locations" 
  ON public.locations 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users, public.restaurants, public.platform_clients
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('admin@galletti.com', 'corporate@galletti.com', 'hq@galletti.com')
      AND restaurants.id = locations.restaurant_id
      AND platform_clients.id = restaurants.client_id
      AND platform_clients.slug = 'galletti'
    )
  );

DROP POLICY IF EXISTS "Restaurant owners can view their locations" ON public.locations;
CREATE POLICY "Restaurant owners can view their locations" 
  ON public.locations 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = locations.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- Step 15: Create RLS Policies for clients table
DROP POLICY IF EXISTS "ZerionCore admins can view all clients" ON public.clients;
CREATE POLICY "ZerionCore admins can view all clients" 
  ON public.clients 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('admin@zerioncore.com', 'platform@zerioncore.com', 'owner@zerioncore.com', 'martin@zerionstudio.com')
    )
  );

DROP POLICY IF EXISTS "Galletti HQ can view their clients" ON public.clients;
CREATE POLICY "Galletti HQ can view their clients" 
  ON public.clients 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users, public.restaurants, public.platform_clients
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('admin@galletti.com', 'corporate@galletti.com', 'hq@galletti.com')
      AND restaurants.id = clients.restaurant_id
      AND platform_clients.id = restaurants.client_id
      AND platform_clients.slug = 'galletti'
    )
  );

DROP POLICY IF EXISTS "Restaurant owners can manage their clients" ON public.clients;
CREATE POLICY "Restaurant owners can manage their clients" 
  ON public.clients 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = clients.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- Step 16: Create RLS Policies for stamps table
DROP POLICY IF EXISTS "ZerionCore admins can view all stamps" ON public.stamps;
CREATE POLICY "ZerionCore admins can view all stamps" 
  ON public.stamps 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('admin@zerioncore.com', 'platform@zerioncore.com', 'owner@zerioncore.com', 'martin@zerionstudio.com')
    )
  );

DROP POLICY IF EXISTS "Galletti HQ can view their stamps" ON public.stamps;
CREATE POLICY "Galletti HQ can view their stamps" 
  ON public.stamps 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users, public.restaurants, public.platform_clients
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('admin@galletti.com', 'corporate@galletti.com', 'hq@galletti.com')
      AND restaurants.id = stamps.restaurant_id
      AND platform_clients.id = restaurants.client_id
      AND platform_clients.slug = 'galletti'
    )
  );

DROP POLICY IF EXISTS "Restaurant owners can manage their stamps" ON public.stamps;
CREATE POLICY "Restaurant owners can manage their stamps" 
  ON public.stamps 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = stamps.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- Step 17: Create RLS Policies for rewards table
DROP POLICY IF EXISTS "ZerionCore admins can view all rewards" ON public.rewards;
CREATE POLICY "ZerionCore admins can view all rewards" 
  ON public.rewards 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('admin@zerioncore.com', 'platform@zerioncore.com', 'owner@zerioncore.com', 'martin@zerionstudio.com')
    )
  );

DROP POLICY IF EXISTS "Galletti HQ can view their rewards" ON public.rewards;
CREATE POLICY "Galletti HQ can view their rewards" 
  ON public.rewards 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users, public.restaurants, public.platform_clients
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('admin@galletti.com', 'corporate@galletti.com', 'hq@galletti.com')
      AND restaurants.id = rewards.restaurant_id
      AND platform_clients.id = restaurants.client_id
      AND platform_clients.slug = 'galletti'
    )
  );

DROP POLICY IF EXISTS "Restaurant owners can manage their rewards" ON public.rewards;
CREATE POLICY "Restaurant owners can manage their rewards" 
  ON public.rewards 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = rewards.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- Step 18: Create functions and triggers
CREATE OR REPLACE FUNCTION public.update_client_stamps()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clients 
    SET stamps = stamps + NEW.amount,
        total_visits = total_visits + 1,
        last_visit = NEW.created_at,
        updated_at = now()
    WHERE id = NEW.client_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clients 
    SET stamps = GREATEST(0, stamps - OLD.amount),
        updated_at = now()
    WHERE id = OLD.client_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_client_stamps ON public.stamps;
CREATE TRIGGER trigger_update_client_stamps
  AFTER INSERT OR DELETE ON public.stamps
  FOR EACH ROW EXECUTE FUNCTION public.update_client_stamps();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_platform_clients_updated_at ON public.platform_clients;
CREATE TRIGGER trigger_platform_clients_updated_at
  BEFORE UPDATE ON public.platform_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER trigger_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_locations_updated_at ON public.locations;
CREATE TRIGGER trigger_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_clients_updated_at ON public.clients;
CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- The database is now ready for the ZerionCore multi-client platform.
-- 
-- Test accounts:
-- - ZerionCore Admin: admin@zerioncore.com
-- - Galletti HQ: admin@galletti.com
-- - Restaurant Owner: (any user who creates a restaurant)
-- - Location Staff: (default role)
-- ============================================================================ 

-- ============================================
-- PLATFORM SETTINGS TABLES
-- ============================================

-- Platform Admin Users table
CREATE TABLE IF NOT EXISTS platform_admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'support')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Configuration table
CREATE TABLE IF NOT EXISTS system_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB, -- Available template variables
    is_active BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature Toggles table
CREATE TABLE IF NOT EXISTS feature_toggles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feature_key VARCHAR(100) UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    description TEXT,
    feature_category VARCHAR(50) DEFAULT 'core' CHECK (feature_category IN ('core', 'advanced', 'experimental')),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global Branding table
CREATE TABLE IF NOT EXISTS global_branding (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(50) DEFAULT 'text' CHECK (setting_type IN ('text', 'color', 'url', 'email')),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform Metrics table (for dashboard analytics)
CREATE TABLE IF NOT EXISTS platform_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_date DATE DEFAULT CURRENT_DATE,
    total_clients INTEGER DEFAULT 0,
    total_restaurants INTEGER DEFAULT 0,
    total_end_customers INTEGER DEFAULT 0,
    monthly_revenue DECIMAL(12,2) DEFAULT 0,
    growth_rate DECIMAL(5,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    total_stamps_issued INTEGER DEFAULT 0,
    total_rewards_redeemed INTEGER DEFAULT 0,
    average_session_time DECIMAL(5,2) DEFAULT 0,
    error_rate DECIMAL(5,3) DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(metric_date)
);

-- Platform Activity Log table
CREATE TABLE IF NOT EXISTS platform_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('client_signup', 'restaurant_added', 'system_update', 'payment_processed', 'issue_resolved')),
    description TEXT NOT NULL,
    client_name VARCHAR(255),
    amount DECIMAL(10,2),
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update platform_clients status and plan constraints
DO $$
BEGIN
    -- Drop existing constraints if they exist
    ALTER TABLE public.platform_clients DROP CONSTRAINT IF EXISTS platform_clients_status_check;
    ALTER TABLE public.platform_clients DROP CONSTRAINT IF EXISTS platform_clients_plan_check;
    
    -- Add new constraints
    ALTER TABLE public.platform_clients ADD CONSTRAINT platform_clients_status_check 
        CHECK (status IN ('active', 'trial', 'suspended'));
    ALTER TABLE public.platform_clients ADD CONSTRAINT platform_clients_plan_check 
        CHECK (plan IN ('trial', 'business', 'enterprise'));
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if constraints already exist or other issues
        NULL;
END $$;

-- Insert sample platform clients
INSERT INTO platform_clients (name, slug, type, status, plan, contact_email, contact_phone, monthly_revenue) VALUES
('Galletti Restaurant Group', 'galletti', 'restaurant_chain', 'active', 'enterprise', 'admin@galletti.com', '+1 (555) 123-4567', 15600.00),
('Pizza Palace International', 'pizza_palace', 'restaurant_chain', 'active', 'enterprise', 'corporate@pizzapalace.com', '+1 (555) 234-5678', 23400.00),
('Coffee Corner', 'coffee_corner', 'restaurant_chain', 'active', 'business', 'hello@coffeecorner.com', '+1 (555) 345-6789', 8900.00),
('Burger Kingdom', 'burger_kingdom', 'restaurant_chain', 'active', 'business', 'ops@burgerkingdom.com', '+1 (555) 456-7890', 17800.00),
('Healthy Bites', 'healthy_bites', 'restaurant_chain', 'trial', 'trial', 'info@healthybites.com', '+1 (555) 567-8901', 4500.00),
('Taco Fiesta', 'taco_fiesta', 'restaurant_chain', 'suspended', 'business', 'contact@tacofiesta.com', '+1 (555) 678-9012', -5.2)
ON CONFLICT DO NOTHING;

-- Step 1c: Update platform_clients with additional data (logos, counts, growth rates)
UPDATE platform_clients SET 
    logo = '🍝',
    restaurant_count = 156,
    location_count = 312,
    customer_count = 45600,
    growth_rate = 22.3,
    join_date = NOW() - INTERVAL '2 years',
    last_activity = NOW() - INTERVAL '2 hours'
WHERE slug = 'galletti';

UPDATE platform_clients SET 
    logo = '🍕',
    restaurant_count = 234,
    location_count = 467,
    customer_count = 67800,
    growth_rate = 18.7,
    join_date = NOW() - INTERVAL '1 year',
    last_activity = NOW() - INTERVAL '1 day'
WHERE slug = 'pizza_palace';

UPDATE platform_clients SET 
    logo = '☕',
    restaurant_count = 89,
    location_count = 134,
    customer_count = 28900,
    growth_rate = 31.2,
    join_date = NOW() - INTERVAL '8 months',
    last_activity = NOW() - INTERVAL '4 hours'
WHERE slug = 'coffee_corner';

UPDATE platform_clients SET 
    logo = '🍔',
    restaurant_count = 178,
    location_count = 289,
    customer_count = 52300,
    growth_rate = 15.4,
    join_date = NOW() - INTERVAL '3 years',
    last_activity = NOW() - INTERVAL '6 hours'
WHERE slug = 'burger_kingdom';

UPDATE platform_clients SET 
    logo = '🥗',
    restaurant_count = 45,
    location_count = 67,
    customer_count = 12400,
    growth_rate = 45.6,
    join_date = NOW() - INTERVAL '1 month',
    last_activity = NOW() - INTERVAL '3 hours'
WHERE slug = 'healthy_bites';

UPDATE platform_clients SET 
    logo = '🌮',
    restaurant_count = 67,
    location_count = 98,
    customer_count = 19800,
    growth_rate = -5.2,
    join_date = NOW() - INTERVAL '6 months',
    last_activity = NOW() - INTERVAL '2 weeks'
WHERE slug = 'taco_fiesta';

-- Update the existing platform_clients with additional sample data
UPDATE public.platform_clients SET 
    logo = '🍝',
    restaurant_count = 6,
    location_count = 18,
    customer_count = 15600,
    growth_rate = 22.3,
    join_date = NOW() - INTERVAL '2 years',
    last_activity = NOW() - INTERVAL '2 hours'
WHERE slug = 'galletti';

-- Insert sample platform metrics
INSERT INTO platform_metrics (
    metric_date, total_clients, total_restaurants, total_end_customers, 
    monthly_revenue, growth_rate, total_transactions, total_stamps_issued, 
    total_rewards_redeemed, average_session_time, error_rate, api_calls
) VALUES
(CURRENT_DATE, 47, 1847, 284750, 124500.00, 18.5, 1247890, 2847560, 284756, 4.2, 0.03, 15678900)
ON CONFLICT (metric_date) DO UPDATE SET
    total_clients = EXCLUDED.total_clients,
    total_restaurants = EXCLUDED.total_restaurants,
    total_end_customers = EXCLUDED.total_end_customers,
    monthly_revenue = EXCLUDED.monthly_revenue,
    growth_rate = EXCLUDED.growth_rate,
    total_transactions = EXCLUDED.total_transactions,
    total_stamps_issued = EXCLUDED.total_stamps_issued,
    total_rewards_redeemed = EXCLUDED.total_rewards_redeemed,
    average_session_time = EXCLUDED.average_session_time,
    error_rate = EXCLUDED.error_rate,
    api_calls = EXCLUDED.api_calls;

-- Insert sample activity log 
INSERT INTO platform_activity_log (activity_type, description, client_name, amount, severity) VALUES
('client_signup', 'New client "Burger Palace Chain" signed up with 12 locations', 'Burger Palace Chain', NULL, NULL),
('payment_processed', 'Monthly subscription payment processed', 'Galletti Restaurant Group', 2450.00, NULL),
('system_update', 'Platform updated to v2.4.1 - Enhanced analytics dashboard', NULL, NULL, 'low'),
('restaurant_added', 'Coffee Corner opened new location in Seattle Downtown', 'Coffee Corner', NULL, NULL),
('issue_resolved', 'API latency issue resolved - Response time improved by 40%', NULL, NULL, 'medium'),
('payment_processed', 'Enterprise plan upgrade completed', 'Pizza Palace International', 4999.00, NULL);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================ 
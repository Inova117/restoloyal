-- ============================================================================
-- ZERIONCORE RESTAURANT LOYALTY PLATFORM - DATABASE SETUP SCRIPT
-- ============================================================================
-- This script sets up the complete database schema for the multi-client restaurant loyalty platform.
-- ZerionCore is the platform provider, Galletti is the first client.
-- Run this in your Supabase SQL Editor to ensure proper setup.
-- ============================================================================

-- Step 1: Create platform_clients table (for managing restaurant chains/groups)
CREATE TABLE IF NOT EXISTS public.platform_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- e.g., 'galletti', 'pizza_palace'
  type TEXT NOT NULL DEFAULT 'restaurant_chain', -- 'restaurant_chain' or 'single_restaurant'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'trial', 'suspended'
  plan TEXT NOT NULL DEFAULT 'business', -- 'business', 'professional', 'enterprise'
  contact_email TEXT,
  contact_phone TEXT,
  billing_address TEXT,
  monthly_revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

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
  client_id UUID REFERENCES public.platform_clients(id) ON DELETE CASCADE,
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
  -- Insert platform clients
  INSERT INTO public.platform_clients (id, name, slug, type, status, plan, contact_email, monthly_revenue) VALUES
    (galletti_client_id, 'Galletti Restaurant Group', 'galletti', 'restaurant_chain', 'active', 'enterprise', 'admin@galletti.com', 12450000.00),
    (demo_pizza_id, 'Demo Pizza Palace', 'demo_pizza', 'single_restaurant', 'trial', 'professional', 'demo@pizzapalace.com', 45000.00),
    (test_burgers_id, 'Test Burger Kingdom', 'test_burgers', 'restaurant_chain', 'active', 'business', 'admin@burgerkingdom.com', 320000.00)
  ON CONFLICT (slug) DO NOTHING;

  -- Insert Galletti restaurants and brands
  INSERT INTO public.restaurants (id, client_id, name, brand, city, state, stamps_required, reward_description) VALUES
    (pizza_palace_id, galletti_client_id, 'Pizza Palace', 'Pizza Palace', 'New York', 'NY', 10, 'Free large pizza after 10 stamps'),
    (burger_kingdom_id, galletti_client_id, 'Burger Kingdom', 'Burger Kingdom', 'Los Angeles', 'CA', 8, 'Free burger combo after 8 stamps'),
    (taco_fiesta_id, galletti_client_id, 'Taco Fiesta', 'Taco Fiesta', 'Austin', 'TX', 12, 'Free taco platter after 12 stamps'),
    (sushi_express_id, galletti_client_id, 'Sushi Express', 'Sushi Express', 'San Francisco', 'CA', 15, 'Free sushi roll after 15 stamps'),
    (coffee_corner_id, galletti_client_id, 'Coffee Corner', 'Coffee Corner', 'Seattle', 'WA', 6, 'Free coffee after 6 stamps'),
    (healthy_bowls_id, galletti_client_id, 'Healthy Bowls', 'Healthy Bowls', 'Miami', 'FL', 10, 'Free bowl after 10 stamps')
  ON CONFLICT (id) DO NOTHING;

  -- Insert sample locations for Pizza Palace
  INSERT INTO public.locations (restaurant_id, name, address, city, state, zip_code, phone, manager_name) VALUES
    (pizza_palace_id, 'Pizza Palace - Times Square', '123 Broadway', 'New York', 'NY', '10001', '(212) 555-0101', 'John Manager'),
    (pizza_palace_id, 'Pizza Palace - Brooklyn', '456 Flatbush Ave', 'Brooklyn', 'NY', '11201', '(718) 555-0102', 'Jane Manager'),
    (pizza_palace_id, 'Pizza Palace - Queens', '789 Queens Blvd', 'Queens', 'NY', '11373', '(718) 555-0103', 'Mike Manager');
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
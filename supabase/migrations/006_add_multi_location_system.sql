-- Migration: Add Multi-Location Franchise Management System
-- This migration creates tables and functions for managing restaurant chains and franchises

-- Create locations table for individual restaurant locations
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  
  -- Location details
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  phone TEXT,
  email TEXT,
  
  -- Geographic coordinates for geo-push
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Location-specific settings
  stamps_required INTEGER DEFAULT 10,
  reward_description TEXT,
  timezone TEXT DEFAULT 'UTC',
  
  -- Operating hours (JSON format)
  operating_hours JSONB DEFAULT '{}',
  
  -- Location status
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false, -- One primary location per restaurant
  
  -- Branding and customization
  logo_url TEXT,
  brand_color TEXT DEFAULT '#3B82F6',
  custom_settings JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique location names per restaurant
  UNIQUE(restaurant_id, name),
  -- Ensure only one primary location per restaurant
  EXCLUDE (restaurant_id WITH =) WHERE (is_primary = true)
);

-- Enable RLS on locations
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policy for locations
CREATE POLICY "Restaurant owners can manage their locations" 
  ON public.locations 
  FOR ALL 
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

-- Update clients table to include location_id
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS home_location_id UUID REFERENCES public.locations(id);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_clients_location_id ON public.clients(location_id);
CREATE INDEX IF NOT EXISTS idx_clients_home_location_id ON public.clients(home_location_id);

-- Update stamps table to include location_id
ALTER TABLE public.stamps ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);
CREATE INDEX IF NOT EXISTS idx_stamps_location_id ON public.stamps(location_id);

-- Update rewards table to include location_id
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);
CREATE INDEX IF NOT EXISTS idx_rewards_location_id ON public.rewards(location_id);

-- Create location_managers table for staff management
CREATE TABLE IF NOT EXISTS public.location_managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  
  -- Manager details
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Access permissions
  role TEXT DEFAULT 'manager', -- 'manager', 'staff', 'admin'
  permissions JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique manager per location
  UNIQUE(location_id, user_id),
  CONSTRAINT valid_role CHECK (role IN ('manager', 'staff', 'admin'))
);

-- Enable RLS on location_managers
ALTER TABLE public.location_managers ENABLE ROW LEVEL SECURITY;

-- Create policy for location_managers
CREATE POLICY "Restaurant owners can manage location staff" 
  ON public.location_managers 
  FOR ALL 
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

-- Create location_analytics table for location-specific metrics
CREATE TABLE IF NOT EXISTS public.location_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  
  -- Analytics data
  date DATE NOT NULL,
  total_customers INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  stamps_issued INTEGER DEFAULT 0,
  rewards_redeemed INTEGER DEFAULT 0,
  
  -- Revenue tracking (optional)
  estimated_revenue DECIMAL(10, 2) DEFAULT 0,
  average_visit_value DECIMAL(10, 2) DEFAULT 0,
  
  -- Engagement metrics
  customer_visits INTEGER DEFAULT 0,
  referrals_created INTEGER DEFAULT 0,
  referrals_completed INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one record per location per date
  UNIQUE(location_id, date)
);

-- Enable RLS on location_analytics
ALTER TABLE public.location_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for location_analytics
CREATE POLICY "Restaurant owners can view their location analytics" 
  ON public.location_analytics 
  FOR SELECT 
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage location analytics" 
  ON public.location_analytics 
  FOR ALL 
  USING (true);

-- Create cross_location_visits table for tracking customer visits across locations
CREATE TABLE IF NOT EXISTS public.cross_location_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  
  -- Visit details
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  stamps_earned INTEGER DEFAULT 0,
  rewards_redeemed INTEGER DEFAULT 0,
  
  -- Visit metadata
  visit_source TEXT DEFAULT 'manual', -- 'manual', 'qr_scan', 'geo_trigger'
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on cross_location_visits
ALTER TABLE public.cross_location_visits ENABLE ROW LEVEL SECURITY;

-- Create policy for cross_location_visits
CREATE POLICY "Restaurant owners can view their cross-location visits" 
  ON public.cross_location_visits 
  FOR SELECT 
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage cross-location visits" 
  ON public.cross_location_visits 
  FOR ALL 
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_locations_restaurant_id ON public.locations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON public.locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_locations_active ON public.locations(is_active);

CREATE INDEX IF NOT EXISTS idx_location_managers_location_id ON public.location_managers(location_id);
CREATE INDEX IF NOT EXISTS idx_location_managers_user_id ON public.location_managers(user_id);

CREATE INDEX IF NOT EXISTS idx_location_analytics_location_id ON public.location_analytics(location_id);
CREATE INDEX IF NOT EXISTS idx_location_analytics_date ON public.location_analytics(date);

CREATE INDEX IF NOT EXISTS idx_cross_location_visits_client_id ON public.cross_location_visits(client_id);
CREATE INDEX IF NOT EXISTS idx_cross_location_visits_location_id ON public.cross_location_visits(location_id);
CREATE INDEX IF NOT EXISTS idx_cross_location_visits_date ON public.cross_location_visits(visit_date);

-- Function to create default location for existing restaurants
CREATE OR REPLACE FUNCTION public.create_default_location_for_restaurant(
  p_restaurant_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_location_id UUID;
  v_restaurant_name TEXT;
BEGIN
  -- Get restaurant name
  SELECT name INTO v_restaurant_name
  FROM public.restaurants
  WHERE id = p_restaurant_id;
  
  -- Create default location
  INSERT INTO public.locations (
    restaurant_id,
    name,
    address,
    stamps_required,
    reward_description,
    is_primary,
    is_active
  )
  SELECT 
    r.id,
    r.name || ' - Main Location',
    r.address,
    r.stamps_required,
    r.reward_description,
    true,
    true
  FROM public.restaurants r
  WHERE r.id = p_restaurant_id
  RETURNING id INTO v_location_id;
  
  -- Update existing clients to use this location
  UPDATE public.clients
  SET location_id = v_location_id,
      home_location_id = v_location_id
  WHERE restaurant_id = p_restaurant_id
    AND location_id IS NULL;
  
  -- Update existing stamps to use this location
  UPDATE public.stamps
  SET location_id = v_location_id
  WHERE restaurant_id = p_restaurant_id
    AND location_id IS NULL;
  
  -- Update existing rewards to use this location
  UPDATE public.rewards
  SET location_id = v_location_id
  WHERE restaurant_id = p_restaurant_id
    AND location_id IS NULL;
  
  RETURN v_location_id;
END;
$$;

-- Function to get customer's cross-location summary
CREATE OR REPLACE FUNCTION public.get_customer_cross_location_summary(
  p_client_id UUID,
  p_restaurant_id UUID
)
RETURNS TABLE (
  location_id UUID,
  location_name TEXT,
  total_visits INTEGER,
  total_stamps INTEGER,
  total_rewards INTEGER,
  last_visit TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id as location_id,
    l.name as location_name,
    COALESCE(visit_stats.visit_count, 0)::INTEGER as total_visits,
    COALESCE(stamp_stats.stamp_count, 0)::INTEGER as total_stamps,
    COALESCE(reward_stats.reward_count, 0)::INTEGER as total_rewards,
    visit_stats.last_visit
  FROM public.locations l
  LEFT JOIN (
    SELECT 
      clv.location_id,
      COUNT(*)::INTEGER as visit_count,
      MAX(clv.visit_date) as last_visit
    FROM public.cross_location_visits clv
    WHERE clv.client_id = p_client_id
    GROUP BY clv.location_id
  ) visit_stats ON l.id = visit_stats.location_id
  LEFT JOIN (
    SELECT 
      s.location_id,
      COUNT(*)::INTEGER as stamp_count
    FROM public.stamps s
    WHERE s.client_id = p_client_id
    GROUP BY s.location_id
  ) stamp_stats ON l.id = stamp_stats.location_id
  LEFT JOIN (
    SELECT 
      r.location_id,
      COUNT(*)::INTEGER as reward_count
    FROM public.rewards r
    WHERE r.client_id = p_client_id
    GROUP BY r.location_id
  ) reward_stats ON l.id = reward_stats.location_id
  WHERE l.restaurant_id = p_restaurant_id
    AND l.is_active = true
  ORDER BY total_visits DESC, l.name;
END;
$$;

-- Function to calculate location performance metrics
CREATE OR REPLACE FUNCTION public.calculate_location_performance(
  p_location_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_customers INTEGER,
  new_customers INTEGER,
  returning_customers INTEGER,
  stamps_issued INTEGER,
  rewards_redeemed INTEGER,
  customer_visits INTEGER,
  average_stamps_per_visit DECIMAL,
  customer_retention_rate DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_location_id UUID := p_location_id;
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT c.id)::INTEGER as total_customers,
    COUNT(DISTINCT CASE WHEN c.created_at::DATE BETWEEN p_start_date AND p_end_date THEN c.id END)::INTEGER as new_customers,
    COUNT(DISTINCT CASE WHEN c.created_at::DATE < p_start_date THEN c.id END)::INTEGER as returning_customers,
    COUNT(s.id)::INTEGER as stamps_issued,
    COUNT(r.id)::INTEGER as rewards_redeemed,
    COUNT(clv.id)::INTEGER as customer_visits,
    CASE 
      WHEN COUNT(clv.id) > 0 THEN ROUND(COUNT(s.id)::DECIMAL / COUNT(clv.id)::DECIMAL, 2)
      ELSE 0::DECIMAL
    END as average_stamps_per_visit,
    CASE 
      WHEN COUNT(DISTINCT CASE WHEN c.created_at::DATE < p_start_date THEN c.id END) > 0 THEN
        ROUND(
          COUNT(DISTINCT CASE WHEN c.created_at::DATE < p_start_date AND clv.visit_date::DATE BETWEEN p_start_date AND p_end_date THEN c.id END)::DECIMAL /
          COUNT(DISTINCT CASE WHEN c.created_at::DATE < p_start_date THEN c.id END)::DECIMAL * 100, 2
        )
      ELSE 0::DECIMAL
    END as customer_retention_rate
  FROM public.locations l
  LEFT JOIN public.clients c ON c.location_id = v_location_id OR c.home_location_id = v_location_id
  LEFT JOIN public.stamps s ON s.client_id = c.id AND s.location_id = v_location_id AND s.created_at::DATE BETWEEN p_start_date AND p_end_date
  LEFT JOIN public.rewards r ON r.client_id = c.id AND r.location_id = v_location_id AND r.created_at::DATE BETWEEN p_start_date AND p_end_date
  LEFT JOIN public.cross_location_visits clv ON clv.client_id = c.id AND clv.location_id = v_location_id AND clv.visit_date::DATE BETWEEN p_start_date AND p_end_date
  WHERE l.id = v_location_id;
END;
$$;

-- Function to track cross-location visits
CREATE OR REPLACE FUNCTION public.track_cross_location_visit(
  p_client_id UUID,
  p_location_id UUID,
  p_stamps_earned INTEGER DEFAULT 0,
  p_rewards_redeemed INTEGER DEFAULT 0,
  p_visit_source TEXT DEFAULT 'manual'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_visit_id UUID;
  v_restaurant_id UUID;
BEGIN
  -- Get restaurant_id from location
  SELECT restaurant_id INTO v_restaurant_id
  FROM public.locations
  WHERE id = p_location_id;
  
  -- Insert visit record
  INSERT INTO public.cross_location_visits (
    client_id,
    location_id,
    restaurant_id,
    stamps_earned,
    rewards_redeemed,
    visit_source
  ) VALUES (
    p_client_id,
    p_location_id,
    v_restaurant_id,
    p_stamps_earned,
    p_rewards_redeemed,
    p_visit_source
  ) RETURNING id INTO v_visit_id;
  
  -- Update location analytics
  INSERT INTO public.location_analytics (
    location_id,
    restaurant_id,
    date,
    customer_visits,
    stamps_issued,
    rewards_redeemed
  ) VALUES (
    p_location_id,
    v_restaurant_id,
    CURRENT_DATE,
    1,
    p_stamps_earned,
    p_rewards_redeemed
  )
  ON CONFLICT (location_id, date)
  DO UPDATE SET
    customer_visits = public.location_analytics.customer_visits + 1,
    stamps_issued = public.location_analytics.stamps_issued + p_stamps_earned,
    rewards_redeemed = public.location_analytics.rewards_redeemed + p_rewards_redeemed;
  
  RETURN v_visit_id;
END;
$$;

-- Trigger to automatically track visits when stamps are added
CREATE OR REPLACE FUNCTION public.auto_track_location_visit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Track the visit when a stamp is added
  IF NEW.location_id IS NOT NULL THEN
    PERFORM public.track_cross_location_visit(
      NEW.client_id,
      NEW.location_id,
      1, -- 1 stamp earned
      0, -- 0 rewards redeemed
      'stamp_addition'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_stamp_track_visit ON public.stamps;
CREATE TRIGGER on_stamp_track_visit
  AFTER INSERT ON public.stamps
  FOR EACH ROW EXECUTE PROCEDURE public.auto_track_location_visit();

-- Trigger to track visits when rewards are redeemed
CREATE OR REPLACE FUNCTION public.auto_track_reward_visit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Track the visit when a reward is redeemed
  IF NEW.location_id IS NOT NULL THEN
    PERFORM public.track_cross_location_visit(
      NEW.client_id,
      NEW.location_id,
      0, -- 0 stamps earned
      1, -- 1 reward redeemed
      'reward_redemption'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_reward_track_visit ON public.rewards;
CREATE TRIGGER on_reward_track_visit
  AFTER INSERT ON public.rewards
  FOR EACH ROW EXECUTE PROCEDURE public.auto_track_reward_visit();

-- Create default locations for existing restaurants
DO $$
DECLARE
  restaurant_record RECORD;
BEGIN
  FOR restaurant_record IN 
    SELECT id FROM public.restaurants 
    WHERE id NOT IN (SELECT DISTINCT restaurant_id FROM public.locations WHERE restaurant_id IS NOT NULL)
  LOOP
    PERFORM public.create_default_location_for_restaurant(restaurant_record.id);
  END LOOP;
END $$;

-- Add helpful comments
COMMENT ON TABLE public.locations IS 'Individual restaurant locations for multi-location franchise management';
COMMENT ON TABLE public.location_managers IS 'Staff and managers assigned to specific locations';
COMMENT ON TABLE public.location_analytics IS 'Location-specific analytics and performance metrics';
COMMENT ON TABLE public.cross_location_visits IS 'Customer visits tracked across multiple locations';
COMMENT ON FUNCTION public.create_default_location_for_restaurant(UUID) IS 'Creates a default location for existing restaurants';
COMMENT ON FUNCTION public.get_customer_cross_location_summary(UUID, UUID) IS 'Gets customer activity summary across all locations';
COMMENT ON FUNCTION public.calculate_location_performance(UUID, DATE, DATE) IS 'Calculates performance metrics for a specific location';
COMMENT ON FUNCTION public.track_cross_location_visit(UUID, UUID, INTEGER, INTEGER, TEXT) IS 'Tracks customer visits across locations'; 
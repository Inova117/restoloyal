-- Initial Schema Migration
-- This migration creates the core tables and RLS policies for the restaurant loyalty system

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('restaurant_admin', 'client');

-- Create restaurants table
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  stamps_required INTEGER DEFAULT 10,
  reward_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  qr_code TEXT UNIQUE NOT NULL,
  stamps INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stamps table
CREATE TABLE IF NOT EXISTS public.stamps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  added_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  redeemed_by UUID REFERENCES auth.users(id) NOT NULL,
  stamps_used INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON public.restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_restaurant_id ON public.clients(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_clients_qr_code ON public.clients(qr_code);
CREATE INDEX IF NOT EXISTS idx_stamps_client_id ON public.stamps(client_id);
CREATE INDEX IF NOT EXISTS idx_stamps_restaurant_id ON public.stamps(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_rewards_client_id ON public.rewards(client_id);
CREATE INDEX IF NOT EXISTS idx_rewards_restaurant_id ON public.rewards(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Enable RLS on all tables
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurants table
DROP POLICY IF EXISTS "Users can view their own restaurants" ON public.restaurants;
CREATE POLICY "Users can view their own restaurants" 
  ON public.restaurants 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own restaurants" ON public.restaurants;
CREATE POLICY "Users can create their own restaurants" 
  ON public.restaurants 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own restaurants" ON public.restaurants;
CREATE POLICY "Users can update their own restaurants" 
  ON public.restaurants 
  FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own restaurants" ON public.restaurants;
CREATE POLICY "Users can delete their own restaurants" 
  ON public.restaurants 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for clients table
DROP POLICY IF EXISTS "Restaurant owners can view their clients" ON public.clients;
CREATE POLICY "Restaurant owners can view their clients" 
  ON public.clients 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = clients.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Restaurant owners can create clients" ON public.clients;
CREATE POLICY "Restaurant owners can create clients" 
  ON public.clients 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = clients.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Restaurant owners can update their clients" ON public.clients;
CREATE POLICY "Restaurant owners can update their clients" 
  ON public.clients 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = clients.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Restaurant owners can delete their clients" ON public.clients;
CREATE POLICY "Restaurant owners can delete their clients" 
  ON public.clients 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = clients.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- RLS Policies for stamps table
DROP POLICY IF EXISTS "Restaurant owners can view their stamps" ON public.stamps;
CREATE POLICY "Restaurant owners can view their stamps" 
  ON public.stamps 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = stamps.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Restaurant owners can create stamps" ON public.stamps;
CREATE POLICY "Restaurant owners can create stamps" 
  ON public.stamps 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = stamps.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- RLS Policies for rewards table
DROP POLICY IF EXISTS "Restaurant owners can view their rewards" ON public.rewards;
CREATE POLICY "Restaurant owners can view their rewards" 
  ON public.rewards 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = rewards.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Restaurant owners can create rewards" ON public.rewards;
CREATE POLICY "Restaurant owners can create rewards" 
  ON public.rewards 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = rewards.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- RLS Policies for user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own roles" ON public.user_roles;
CREATE POLICY "Users can create their own roles" 
  ON public.user_roles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create trigger function to update stamps count
CREATE OR REPLACE FUNCTION public.update_client_stamps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment stamps when a new stamp is added
    UPDATE public.clients 
    SET stamps = stamps + 1, updated_at = now()
    WHERE id = NEW.client_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement stamps when a stamp is deleted
    UPDATE public.clients 
    SET stamps = stamps - 1, updated_at = now()
    WHERE id = OLD.client_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger to automatically update client stamps
DROP TRIGGER IF EXISTS trigger_update_client_stamps ON public.stamps;
CREATE TRIGGER trigger_update_client_stamps
  AFTER INSERT OR DELETE ON public.stamps
  FOR EACH ROW EXECUTE FUNCTION public.update_client_stamps();

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS trigger_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER trigger_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_clients_updated_at ON public.clients;
CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Default to restaurant_admin role for new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'restaurant_admin');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add helpful comments
COMMENT ON TABLE public.restaurants IS 'Stores restaurant information and loyalty program settings';
COMMENT ON TABLE public.clients IS 'Stores customer information for each restaurant';
COMMENT ON TABLE public.stamps IS 'Tracks individual stamp transactions';
COMMENT ON TABLE public.rewards IS 'Records reward redemptions';
COMMENT ON TABLE public.user_roles IS 'Manages user roles and permissions'; 
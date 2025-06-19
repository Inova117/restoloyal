-- ============================================================================
-- 🏢 BASE HIERARCHY TABLES - Day 2 Implementation  
-- Creates/updates the fundamental hierarchy: Clients → Locations → Customers
-- FIXED: Works with existing schema (locations, not restaurants)
-- ============================================================================

-- 🏢 CLIENTS TABLE - Top level of hierarchy
-- This table likely already exists, so we'll just add missing columns
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
    END IF;

    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='subscription_status') THEN
        ALTER TABLE public.clients ADD COLUMN subscription_status TEXT DEFAULT 'active' 
        CHECK (subscription_status IN ('active', 'suspended', 'cancelled'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='subscription_plan') THEN
        ALTER TABLE public.clients ADD COLUMN subscription_plan TEXT DEFAULT 'basic' 
        CHECK (subscription_plan IN ('basic', 'premium', 'enterprise'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='settings') THEN
        ALTER TABLE public.clients ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='website') THEN
        ALTER TABLE public.clients ADD COLUMN website TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='business_type') THEN
        ALTER TABLE public.clients ADD COLUMN business_type TEXT;
    END IF;
END $$;

-- 📍 LOCATIONS TABLE - Second level of hierarchy  
-- This table should already exist, we'll just add missing columns
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
    END IF;

    -- Add missing columns to locations if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='locations' AND column_name='features') THEN
        ALTER TABLE public.locations ADD COLUMN features JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='locations' AND column_name='pos_settings') THEN
        ALTER TABLE public.locations ADD COLUMN pos_settings JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='locations' AND column_name='business_hours') THEN
        ALTER TABLE public.locations ADD COLUMN business_hours JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='locations' AND column_name='coordinates') THEN
        ALTER TABLE public.locations ADD COLUMN coordinates POINT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='locations' AND column_name='status') THEN
        ALTER TABLE public.locations ADD COLUMN status TEXT DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'maintenance'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='locations' AND column_name='postal_code') THEN
        ALTER TABLE public.locations ADD COLUMN postal_code TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='locations' AND column_name='country') THEN
        ALTER TABLE public.locations ADD COLUMN country TEXT DEFAULT 'US';
    END IF;
END $$;

-- 🔄 Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 🔍 INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_subscription_status ON public.clients(subscription_status);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);

CREATE INDEX IF NOT EXISTS idx_locations_client_id ON public.locations(client_id);
CREATE INDEX IF NOT EXISTS idx_locations_name ON public.locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_city ON public.locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_status ON public.locations(status);

-- 🔄 TRIGGERS for updated_at (only if columns exist)
DO $$
BEGIN
    -- Add trigger for clients if updated_at column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='clients' AND column_name='updated_at') THEN
        DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
        CREATE TRIGGER update_clients_updated_at
          BEFORE UPDATE ON public.clients
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Add trigger for locations if updated_at column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='locations' AND column_name='updated_at') THEN
        DROP TRIGGER IF EXISTS update_locations_updated_at ON public.locations;
        CREATE TRIGGER update_locations_updated_at
          BEFORE UPDATE ON public.locations
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 📊 INSERT SAMPLE DATA (for testing) - Only if tables are empty and specific IDs don't exist
INSERT INTO public.clients (id, name, email, phone, business_type, subscription_plan) 
SELECT '550e8400-e29b-41d4-a716-446655440000', 'Galletti Restaurant Group', 'admin@galletti.com', '+1-555-0123', 'Restaurant Chain', 'premium'
WHERE NOT EXISTS (SELECT 1 FROM public.clients WHERE id = '550e8400-e29b-41d4-a716-446655440000');

INSERT INTO public.clients (id, name, email, phone, business_type, subscription_plan) 
SELECT '550e8400-e29b-41d4-a716-446655440001', 'Downtown Eats LLC', 'contact@downtowneats.com', '+1-555-0124', 'Restaurant Group', 'basic'
WHERE NOT EXISTS (SELECT 1 FROM public.clients WHERE id = '550e8400-e29b-41d4-a716-446655440001');

INSERT INTO public.locations (id, client_id, name, address, city, state, postal_code) 
SELECT '770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Main Street Store', '123 Main St', 'Downtown', 'CA', '90210'
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = '770e8400-e29b-41d4-a716-446655440000');

INSERT INTO public.locations (id, client_id, name, address, city, state, postal_code) 
SELECT '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Mall Location', '456 Mall Ave', 'Shopping Center', 'CA', '90211'
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE id = '770e8400-e29b-41d4-a716-446655440001');

-- ✅ SUCCESS
SELECT 'Base hierarchy tables created/updated successfully!' as status; 
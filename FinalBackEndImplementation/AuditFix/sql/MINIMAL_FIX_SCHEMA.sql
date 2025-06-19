-- ============================================================================
-- 🚨 MINIMAL FIX SCRIPT - Safe Schema Updates
-- This script safely adds missing columns and tables to your existing database
-- WITHOUT breaking any existing data or relationships
-- ============================================================================

-- 🔧 STEP 1: Safely add missing columns to existing tables
DO $$
BEGIN
  RAISE NOTICE '🔧 ADDING MISSING COLUMNS TO EXISTING TABLES...';
END $$;

-- Add client_id to customers table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'client_id' AND table_schema = 'public'
  ) THEN
    -- Add the column
    ALTER TABLE public.customers ADD COLUMN client_id UUID;
    RAISE NOTICE '✅ Added client_id column to customers table';
    
    -- Try to populate it from locations table if possible
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'customers' AND column_name = 'location_id' AND table_schema = 'public'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'locations' AND table_schema = 'public'
    ) THEN
      UPDATE public.customers 
      SET client_id = (
        SELECT client_id FROM public.locations 
        WHERE locations.id = customers.location_id
        LIMIT 1
      )
      WHERE client_id IS NULL;
      RAISE NOTICE '✅ Populated client_id from locations table';
    END IF;
  ELSE
    RAISE NOTICE '✅ client_id column already exists in customers table';
  END IF;
END $$;

-- Add location_id to customers table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'location_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN location_id UUID;
    RAISE NOTICE '✅ Added location_id column to customers table';
  ELSE
    RAISE NOTICE '✅ location_id column already exists in customers table';
  END IF;
END $$;

-- Add qr_code to customers table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'qr_code' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN qr_code TEXT;
    -- Generate QR codes for existing customers
    UPDATE public.customers 
    SET qr_code = 'QR_' || replace(id::TEXT, '-', '') 
    WHERE qr_code IS NULL;
    RAISE NOTICE '✅ Added qr_code column to customers table';
  ELSE
    RAISE NOTICE '✅ qr_code column already exists in customers table';
  END IF;
END $$;

-- Add total_stamps to customers table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'total_stamps' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN total_stamps INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added total_stamps column to customers table';
  ELSE
    RAISE NOTICE '✅ total_stamps column already exists in customers table';
  END IF;
END $$;

-- Add total_visits to customers table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'total_visits' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN total_visits INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added total_visits column to customers table';
  ELSE
    RAISE NOTICE '✅ total_visits column already exists in customers table';
  END IF;
END $$;

-- Add status to customers table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'status' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN status TEXT DEFAULT 'active';
    RAISE NOTICE '✅ Added status column to customers table';
  ELSE
    RAISE NOTICE '✅ status column already exists in customers table';
  END IF;
END $$;

-- 🏢 STEP 2: Create clients table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'clients' AND table_schema = 'public'
  ) THEN
    CREATE TABLE public.clients (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT DEFAULT 'US',
      status TEXT NOT NULL DEFAULT 'active',
      settings JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    -- Insert a default client for existing data
    INSERT INTO public.clients (name, email) 
    VALUES ('Default Restaurant', 'admin@restaurant.com')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Created clients table with default client';
  ELSE
    RAISE NOTICE '✅ clients table already exists';
  END IF;
END $$;

-- 📍 STEP 3: Create locations table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'locations' AND table_schema = 'public'
  ) THEN
    CREATE TABLE public.locations (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    -- Insert a default location
    INSERT INTO public.locations (client_id, name, address, city, state) 
    SELECT id, 'Main Location', '123 Main St', 'City', 'State' 
    FROM public.clients 
    LIMIT 1
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Created locations table with default location';
  ELSE
    RAISE NOTICE '✅ locations table already exists';
  END IF;
END $$;

-- 🏪 STEP 4: Create location_staff table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'location_staff' AND table_schema = 'public'
  ) THEN
    CREATE TABLE public.location_staff (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
      client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      is_active BOOLEAN NOT NULL DEFAULT true,
      permissions JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE '✅ Created location_staff table';
  ELSE
    RAISE NOTICE '✅ location_staff table already exists';
  END IF;
END $$;

-- 🎫 STEP 5: Create stamps table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'stamps' AND table_schema = 'public'
  ) THEN
    CREATE TABLE public.stamps (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
      location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
      client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      transaction_reference TEXT,
      purchase_amount DECIMAL(10,2),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE '✅ Created stamps table';
  ELSE
    RAISE NOTICE '✅ stamps table already exists';
  END IF;
END $$;

-- 🎁 STEP 6: Create rewards table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'rewards' AND table_schema = 'public'
  ) THEN
    CREATE TABLE public.rewards (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
      location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
      client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
      reward_type TEXT NOT NULL DEFAULT 'free_item',
      reward_description TEXT NOT NULL,
      stamps_used INTEGER NOT NULL,
      value_amount DECIMAL(10,2),
      transaction_reference TEXT,
      status TEXT NOT NULL DEFAULT 'redeemed',
      redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE '✅ Created rewards table';
  ELSE
    RAISE NOTICE '✅ rewards table already exists';
  END IF;
END $$;

-- 👥 STEP 7: Fix user_roles table if needed
DO $$
BEGIN
  -- Add missing columns to user_roles if they don't exist
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_roles' AND table_schema = 'public'
  ) THEN
    -- Add client_id if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_roles' AND column_name = 'client_id' AND table_schema = 'public'
    ) THEN
      ALTER TABLE public.user_roles ADD COLUMN client_id UUID;
      RAISE NOTICE '✅ Added client_id to user_roles table';
    END IF;
    
    -- Add location_id if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_roles' AND column_name = 'location_id' AND table_schema = 'public'
    ) THEN
      ALTER TABLE public.user_roles ADD COLUMN location_id UUID;
      RAISE NOTICE '✅ Added location_id to user_roles table';
    END IF;
  END IF;
END $$;

-- 🔗 STEP 8: Populate missing foreign key relationships
DO $$
DECLARE
  default_client_id UUID;
  default_location_id UUID;
BEGIN
  -- Get default IDs
  SELECT id INTO default_client_id FROM public.clients LIMIT 1;
  SELECT id INTO default_location_id FROM public.locations LIMIT 1;
  
  -- Update customers with missing client_id
  IF default_client_id IS NOT NULL THEN
    UPDATE public.customers 
    SET client_id = default_client_id 
    WHERE client_id IS NULL;
    RAISE NOTICE '✅ Updated customers with default client_id';
  END IF;
  
  -- Update customers with missing location_id
  IF default_location_id IS NOT NULL THEN
    UPDATE public.customers 
    SET location_id = default_location_id 
    WHERE location_id IS NULL;
    RAISE NOTICE '✅ Updated customers with default location_id';
  END IF;
END $$;

-- 📊 STEP 9: Create basic indexes for performance
DO $$
BEGIN
  -- Customers indexes
  CREATE INDEX IF NOT EXISTS idx_customers_client_id ON public.customers(client_id);
  CREATE INDEX IF NOT EXISTS idx_customers_location_id ON public.customers(location_id);
  CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
  
  -- Stamps indexes
  CREATE INDEX IF NOT EXISTS idx_stamps_customer_id ON public.stamps(customer_id);
  CREATE INDEX IF NOT EXISTS idx_stamps_location_id ON public.stamps(location_id);
  
  -- Rewards indexes
  CREATE INDEX IF NOT EXISTS idx_rewards_customer_id ON public.rewards(customer_id);
  CREATE INDEX IF NOT EXISTS idx_rewards_location_id ON public.rewards(location_id);
  
  RAISE NOTICE '✅ Created performance indexes';
END $$;

-- ✅ COMPLETION MESSAGE
DO $$
BEGIN
  RAISE NOTICE '🎉 MINIMAL FIX COMPLETE!';
  RAISE NOTICE '✅ Your database schema has been safely updated';
  RAISE NOTICE '✅ All missing columns and tables have been added';
  RAISE NOTICE '✅ Existing data has been preserved';
  RAISE NOTICE '✅ Default relationships have been created';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 NEXT STEPS:';
  RAISE NOTICE '1. Run the diagnostic script to verify everything is working';
  RAISE NOTICE '2. Test your Edge Functions';
  RAISE NOTICE '3. Disable MOCK_MODE in your frontend hooks';
END $$; 
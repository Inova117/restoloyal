-- ============================================================================
-- COMPLETE DATABASE SCHEMA DEPLOYMENT
-- ============================================================================
-- This script deploys the complete 4-tier hierarchy database schema
-- Execute this in Supabase SQL Editor to create all required tables
-- ============================================================================

-- ============================================================================
-- STEP 1: ENABLE EXTENSIONS & SETUP
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define the strict 4-tier role hierarchy
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_tier') THEN
    CREATE TYPE public.user_tier AS ENUM (
      'superadmin',    -- Tier 1: Platform owner (you)
      'client_admin',  -- Tier 2: Business/restaurant chain HQ  
      'location_staff',-- Tier 3: Store managers/POS users
      'customer'       -- Tier 4: End customers via QR/POS
    );
  END IF;
END $$;

-- ============================================================================
-- STEP 2: TIER 1 - SUPERADMINS TABLE
-- ============================================================================

-- Superadmins table (Tier 1) - Platform owners
CREATE TABLE IF NOT EXISTS public.superadmins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_bootstrap BOOLEAN NOT NULL DEFAULT false,
  bootstrap_method TEXT CHECK (bootstrap_method IN ('sql_script', 'superadmin_creation')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT superadmins_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  UNIQUE(user_id)
);

-- ============================================================================
-- STEP 3: TIER 2 - CLIENTS & CLIENT ADMINS
-- ============================================================================

-- Clients table (Tier 2) - Restaurant chains/businesses
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  
  -- Business details
  business_type TEXT DEFAULT 'restaurant_chain' CHECK (business_type IN ('restaurant_chain', 'single_restaurant', 'franchise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Hierarchy enforcement - CRITICAL
  created_by_superadmin_id UUID NOT NULL REFERENCES public.superadmins(id) ON DELETE RESTRICT,
  
  -- Business settings
  settings JSONB DEFAULT '{
    "stamps_required_for_reward": 10,
    "allow_cross_location_stamps": true,
    "auto_expire_stamps_days": 365,
    "customer_can_view_history": true
  }',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT clients_slug_format CHECK (slug ~ '^[a-z0-9\-]+$'),
  CONSTRAINT clients_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Client Admins table - Users who manage Tier 2 businesses
CREATE TABLE IF NOT EXISTS public.client_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'manager')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Hierarchy enforcement - CRITICAL
  created_by_superadmin_id UUID NOT NULL REFERENCES public.superadmins(id) ON DELETE RESTRICT,
  
  -- Client admin permissions
  permissions JSONB DEFAULT '{
    "can_create_locations": true,
    "can_create_staff": true,
    "can_view_analytics": true,
    "can_manage_settings": true,
    "can_manage_rewards": true,
    "can_export_data": true
  }',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT client_admins_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  UNIQUE(user_id, client_id),
  UNIQUE(email)
);

-- ============================================================================
-- STEP 4: TIER 3 - LOCATIONS & LOCATION STAFF
-- ============================================================================

-- Locations table - Physical restaurant locations
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  phone TEXT,
  email TEXT,
  
  -- Location settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  timezone TEXT DEFAULT 'UTC',
  settings JSONB DEFAULT '{}',
  
  -- Hierarchy enforcement - CRITICAL  
  created_by_client_admin_id UUID NOT NULL REFERENCES public.client_admins(id) ON DELETE RESTRICT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT locations_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  UNIQUE(client_id, name)
);

-- Location Staff table (Tier 3) - Store managers and POS users
CREATE TABLE IF NOT EXISTS public.location_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('manager', 'staff', 'pos_operator')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Hierarchy enforcement - CRITICAL
  created_by_client_admin_id UUID NOT NULL REFERENCES public.client_admins(id) ON DELETE RESTRICT,
  
  -- Staff permissions
  permissions JSONB DEFAULT '{
    "can_create_customers": true,
    "can_manage_loyalty": true,
    "can_view_analytics": false,
    "can_export_data": false
  }',
  
  -- Metadata  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT location_staff_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- ============================================================================
-- STEP 5: TIER 4 - CUSTOMERS & LOYALTY SYSTEM
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
  UNIQUE(client_id, customer_number)
);

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
-- STEP 6: AUDIT & TRACKING TABLES
-- ============================================================================

-- Hierarchy audit log for tracking violations and actions
CREATE TABLE IF NOT EXISTS public.hierarchy_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  violation_type TEXT NOT NULL,
  attempted_action TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  target_table TEXT NOT NULL,
  target_data JSONB,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Roles table - Central role tracking for all tiers
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.user_tier NOT NULL,
  
  -- Tier-specific references (only one should be filled per role)
  superadmin_id UUID REFERENCES public.superadmins(id) ON DELETE CASCADE,
  client_admin_id UUID REFERENCES public.client_admins(id) ON DELETE CASCADE,
  location_staff_id UUID REFERENCES public.location_staff(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Hierarchy enforcement - CRITICAL
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_by_tier public.user_tier,
  
  -- Status and metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  permissions JSONB DEFAULT '{}',
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints - Ensure only one tier reference per user
  CONSTRAINT user_roles_single_tier CHECK (
    (
      (tier = 'superadmin' AND superadmin_id IS NOT NULL AND client_admin_id IS NULL AND location_staff_id IS NULL AND customer_id IS NULL) OR
      (tier = 'client_admin' AND superadmin_id IS NULL AND client_admin_id IS NOT NULL AND location_staff_id IS NULL AND customer_id IS NULL) OR  
      (tier = 'location_staff' AND superadmin_id IS NULL AND client_admin_id IS NULL AND location_staff_id IS NOT NULL AND customer_id IS NULL) OR
      (tier = 'customer' AND superadmin_id IS NULL AND client_admin_id IS NULL AND location_staff_id IS NULL AND customer_id IS NOT NULL)
    )
  ),
  
  UNIQUE(user_id)
);

-- ============================================================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Superadmins indexes
CREATE INDEX IF NOT EXISTS idx_superadmins_user_id ON public.superadmins(user_id);
CREATE INDEX IF NOT EXISTS idx_superadmins_email ON public.superadmins(email);

-- Clients indexes  
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by_superadmin_id);
CREATE INDEX IF NOT EXISTS idx_clients_slug ON public.clients(slug);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);

-- Client Admins indexes
CREATE INDEX IF NOT EXISTS idx_client_admins_user_id ON public.client_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_client_admins_client_id ON public.client_admins(client_id);
CREATE INDEX IF NOT EXISTS idx_client_admins_email ON public.client_admins(email);

-- Locations indexes
CREATE INDEX IF NOT EXISTS idx_locations_client_id ON public.locations(client_id);
CREATE INDEX IF NOT EXISTS idx_locations_created_by ON public.locations(created_by_client_admin_id);

-- Location Staff indexes
CREATE INDEX IF NOT EXISTS idx_location_staff_user_id ON public.location_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_location_id ON public.location_staff(location_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_client_id ON public.location_staff(client_id);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_client_id ON public.customers(client_id);
CREATE INDEX IF NOT EXISTS idx_customers_location_id ON public.customers(location_id);
CREATE INDEX IF NOT EXISTS idx_customers_qr_code ON public.customers(qr_code);

-- Stamps indexes
CREATE INDEX IF NOT EXISTS idx_stamps_customer_id ON public.stamps(customer_id);
CREATE INDEX IF NOT EXISTS idx_stamps_location_id ON public.stamps(location_id);
CREATE INDEX IF NOT EXISTS idx_stamps_client_id ON public.stamps(client_id);

-- Rewards indexes
CREATE INDEX IF NOT EXISTS idx_rewards_customer_id ON public.rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_rewards_location_id ON public.rewards(location_id);
CREATE INDEX IF NOT EXISTS idx_rewards_client_id ON public.rewards(client_id);

-- User Roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tier ON public.user_roles(tier);

-- ============================================================================
-- STEP 8: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.superadmins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hierarchy_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================

-- Verify deployment
SELECT 'Database schema deployed successfully!' as status;

-- Show created tables
SELECT tablename, schemaname 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'superadmins', 'clients', 'client_admins', 'locations', 
  'location_staff', 'customers', 'stamps', 'rewards', 
  'user_roles', 'hierarchy_audit_log'
)
ORDER BY tablename; 
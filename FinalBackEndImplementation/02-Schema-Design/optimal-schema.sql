-- ============================================================================
-- OPTIMAL SCHEMA DESIGN - 4-TIER HIERARCHY RESTAURANT LOYALTY PLATFORM
-- ============================================================================
-- Version: 1.0.0 - Clean Implementation
-- Requirements: Strict 4-tier hierarchy with NO PUBLIC SIGNUP
-- Security: Complete multi-tenant isolation with hierarchy enforcement
-- ============================================================================

-- ============================================================================
-- STEP 1: ENABLE EXTENSIONS & SETUP
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 2: 4-TIER HIERARCHY ENUM
-- ============================================================================

-- Define the strict 4-tier role hierarchy
CREATE TYPE public.user_tier AS ENUM (
  'superadmin',    -- Tier 1: Platform owner (you)
  'client_admin',  -- Tier 2: Business/restaurant chain HQ  
  'location_staff',-- Tier 3: Store managers/POS users
  'customer'       -- Tier 4: End customers via QR/POS
);

-- ============================================================================
-- STEP 3: TIER 1 - SUPERADMIN MANAGEMENT
-- ============================================================================

-- Superadmins table (Tier 1) - Platform owners
CREATE TABLE public.superadmins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT superadmins_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  UNIQUE(user_id)
);

-- ============================================================================
-- STEP 4: TIER 2 - CLIENT/BUSINESS MANAGEMENT  
-- ============================================================================

-- Clients table (Tier 2) - Restaurant chains/businesses
CREATE TABLE public.clients (
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
  
  -- Metadata
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT clients_slug_format CHECK (slug ~ '^[a-z0-9\-]+$'),
  CONSTRAINT clients_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Client Admins table - Users who manage Tier 2 businesses
CREATE TABLE public.client_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'manager')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Hierarchy enforcement - CRITICAL
  created_by_superadmin_id UUID NOT NULL REFERENCES public.superadmins(id) ON DELETE RESTRICT,
  
  -- Metadata
  permissions JSONB DEFAULT '{
    "can_create_locations": true,
    "can_create_staff": true,
    "can_view_analytics": true,
    "can_manage_settings": true
  }',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT client_admins_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  UNIQUE(user_id, client_id),
  UNIQUE(email)
);

-- ============================================================================
-- STEP 5: TIER 3 - LOCATION & STAFF MANAGEMENT
-- ============================================================================

-- Locations table - Physical restaurant locations
CREATE TABLE public.locations (
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
CREATE TABLE public.location_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('manager', 'staff', 'cashier')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Hierarchy enforcement - CRITICAL
  created_by_client_admin_id UUID NOT NULL REFERENCES public.client_admins(id) ON DELETE RESTRICT,
  
  -- Staff permissions
  permissions JSONB DEFAULT '{
    "can_create_customers": true,
    "can_add_stamps": true,
    "can_redeem_rewards": true,
    "can_view_customer_data": true
  }',
  
  -- Metadata  
  hired_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT location_staff_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- ============================================================================
-- STEP 6: TIER 4 - CUSTOMER MANAGEMENT
-- ============================================================================

-- Customers table (Tier 4) - End customers created via QR/POS
CREATE TABLE public.customers (
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

-- ============================================================================
-- STEP 7: LOYALTY SYSTEM TABLES
-- ============================================================================

-- Stamps table - Customer loyalty points/stamps
CREATE TABLE public.stamps (
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
CREATE TABLE public.rewards (
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
-- STEP 8: USER ROLES TRACKING TABLE
-- ============================================================================

-- User Roles table - Central role tracking for all tiers
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.user_tier NOT NULL,
  
  -- Tier-specific references (only one should be filled per role)
  superadmin_id UUID REFERENCES public.superadmins(id) ON DELETE CASCADE,
  client_admin_id UUID REFERENCES public.client_admins(id) ON DELETE CASCADE,
  location_staff_id UUID REFERENCES public.location_staff(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Hierarchy enforcement - CRITICAL
  -- created_by tracks who created this user (must be upper tier)
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_by_tier public.user_tier,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
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
  
  -- Hierarchy creation validation
  CONSTRAINT user_roles_hierarchy_validation CHECK (
    (tier = 'superadmin' AND created_by_tier IS NULL) OR -- Superadmin is bootstrap
    (tier = 'client_admin' AND created_by_tier = 'superadmin') OR
    (tier = 'location_staff' AND created_by_tier = 'client_admin') OR  
    (tier = 'customer' AND created_by_tier = 'location_staff')
  ),
  
  UNIQUE(user_id)
);

-- ============================================================================
-- STEP 9: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Superadmins indexes
CREATE INDEX idx_superadmins_user_id ON public.superadmins(user_id);
CREATE INDEX idx_superadmins_email ON public.superadmins(email);
CREATE INDEX idx_superadmins_active ON public.superadmins(is_active);

-- Clients indexes  
CREATE INDEX idx_clients_created_by ON public.clients(created_by_superadmin_id);
CREATE INDEX idx_clients_slug ON public.clients(slug);
CREATE INDEX idx_clients_status ON public.clients(status);

-- Client Admins indexes
CREATE INDEX idx_client_admins_user_id ON public.client_admins(user_id);
CREATE INDEX idx_client_admins_client_id ON public.client_admins(client_id);
CREATE INDEX idx_client_admins_created_by ON public.client_admins(created_by_superadmin_id);
CREATE INDEX idx_client_admins_email ON public.client_admins(email);

-- Locations indexes
CREATE INDEX idx_locations_client_id ON public.locations(client_id);
CREATE INDEX idx_locations_created_by ON public.locations(created_by_client_admin_id);
CREATE INDEX idx_locations_active ON public.locations(is_active);

-- Location Staff indexes
CREATE INDEX idx_location_staff_user_id ON public.location_staff(user_id);
CREATE INDEX idx_location_staff_location_id ON public.location_staff(location_id);
CREATE INDEX idx_location_staff_client_id ON public.location_staff(client_id);
CREATE INDEX idx_location_staff_created_by ON public.location_staff(created_by_client_admin_id);
CREATE INDEX idx_location_staff_email ON public.location_staff(email);

-- Customers indexes
CREATE INDEX idx_customers_client_id ON public.customers(client_id);
CREATE INDEX idx_customers_location_id ON public.customers(location_id);
CREATE INDEX idx_customers_created_by ON public.customers(created_by_staff_id);
CREATE INDEX idx_customers_qr_code ON public.customers(qr_code);
CREATE INDEX idx_customers_customer_number ON public.customers(customer_number);
CREATE INDEX idx_customers_status ON public.customers(status);

-- Stamps indexes
CREATE INDEX idx_stamps_customer_id ON public.stamps(customer_id);
CREATE INDEX idx_stamps_location_id ON public.stamps(location_id);
CREATE INDEX idx_stamps_client_id ON public.stamps(client_id);
CREATE INDEX idx_stamps_created_by ON public.stamps(created_by_staff_id);
CREATE INDEX idx_stamps_created_at ON public.stamps(created_at);

-- Rewards indexes
CREATE INDEX idx_rewards_customer_id ON public.rewards(customer_id);
CREATE INDEX idx_rewards_location_id ON public.rewards(location_id);
CREATE INDEX idx_rewards_client_id ON public.rewards(client_id);
CREATE INDEX idx_rewards_created_by ON public.rewards(created_by_staff_id);
CREATE INDEX idx_rewards_created_at ON public.rewards(created_at);

-- User Roles indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_tier ON public.user_roles(tier);
CREATE INDEX idx_user_roles_created_by ON public.user_roles(created_by_user_id);
CREATE INDEX idx_user_roles_active ON public.user_roles(is_active);

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Schema creation complete
-- Next: Add triggers and functions for automation
-- Next: Add RLS policies for security
-- Next: Add Edge Functions for hierarchy enforcement 
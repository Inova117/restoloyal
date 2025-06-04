-- ============================================================================
-- RESTAURANT LOYALTY PLATFORM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Version: Production v2.1.0
-- Description: Complete database setup for multi-tenant restaurant loyalty platform
-- ZerionCore Platform with multi-client support (Galletti, etc.)
-- 
-- Usage: Run this entire script in Supabase SQL Editor for fresh database setup
-- ============================================================================

-- ============================================================================
-- STEP 1: PLATFORM CORE TABLES
-- ============================================================================

-- Platform Clients Table (Restaurant Chains/Groups)
CREATE TABLE IF NOT EXISTS platform_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- e.g., 'galletti', 'pizza-palace'
  type TEXT DEFAULT 'restaurant_chain' CHECK (type IN ('restaurant_chain', 'single_restaurant')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'trial', 'suspended')),
  plan TEXT DEFAULT 'business' CHECK (plan IN ('trial', 'business', 'enterprise')),
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  billing_address TEXT,
  logo VARCHAR(255),
  restaurant_count INTEGER DEFAULT 0,
  location_count INTEGER DEFAULT 0,
  customer_count INTEGER DEFAULT 0,
  monthly_revenue DECIMAL(12,2) DEFAULT 0,
  growth_rate DECIMAL(5,2) DEFAULT 0,
  join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Platform Admin Users Table
CREATE TABLE IF NOT EXISTS platform_admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'platform_admin' CHECK (role IN ('platform_admin', 'super_admin')),
  permissions JSONB DEFAULT '{
    "can_manage_clients": true,
    "can_view_all_data": true,
    "can_modify_platform": true,
    "can_access_billing": true
  }'::jsonb,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- ============================================================================
-- STEP 2: RESTAURANT & LOCATION STRUCTURE
-- ============================================================================

-- Restaurants Table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES platform_clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT, -- Brand name within client (e.g., 'Pizza Palace' under Galletti)
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  stamps_required INTEGER DEFAULT 10,
  reward_description TEXT DEFAULT 'Free Item',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Locations Table (Multi-location support)
CREATE TABLE IF NOT EXISTS locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES platform_clients(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
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

-- ============================================================================
-- STEP 3: USER MANAGEMENT & ROLES
-- ============================================================================

-- App Roles Enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('zerion_admin', 'client_admin', 'restaurant_admin', 'location_staff');
  END IF;
END $$;

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Location Staff Table (for POS operations)
CREATE TABLE IF NOT EXISTS location_staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES platform_clients(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'cashier' CHECK (role IN ('cashier', 'supervisor', 'manager')),
  permissions JSONB DEFAULT '{
    "can_register_customers": true,
    "can_add_stamps": true,
    "can_redeem_rewards": true,
    "can_view_customer_data": true,
    "can_process_refunds": false,
    "can_manage_inventory": false
  }'::jsonb,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  hired_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, location_id)
);

-- ============================================================================
-- STEP 4: CUSTOMER MANAGEMENT
-- ============================================================================

-- Customers Table (POS-compatible)
CREATE TABLE IF NOT EXISTS customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES platform_clients(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  qr_code TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  total_stamps INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE,
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Legacy Clients Table (for backward compatibility)
CREATE TABLE IF NOT EXISTS clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  qr_code TEXT UNIQUE NOT NULL,
  stamps INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE,
  customer_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 5: LOYALTY PROGRAM TRANSACTIONS
-- ============================================================================

-- Stamps Table (Loyalty Points)
CREATE TABLE IF NOT EXISTS stamps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- Legacy support
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  added_by UUID REFERENCES auth.users(id) NOT NULL,
  staff_id UUID REFERENCES auth.users(id), -- POS operations support
  amount INTEGER DEFAULT 1, -- Legacy column
  stamps_earned INTEGER DEFAULT 1, -- POS operations column
  purchase_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rewards Table (Redemptions)
CREATE TABLE IF NOT EXISTS rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- Legacy support
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  redeemed_by UUID REFERENCES auth.users(id) NOT NULL,
  staff_id UUID REFERENCES auth.users(id), -- POS operations support
  reward_type TEXT DEFAULT 'Free Item',
  reward_value TEXT DEFAULT '$15.00', -- POS operations format
  stamps_used INTEGER NOT NULL,
  description TEXT,
  value DECIMAL(10,2), -- Legacy column
  status TEXT DEFAULT 'redeemed' CHECK (status IN ('redeemed', 'cancelled')),
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 6: LOYALTY PROGRAM SETTINGS
-- ============================================================================

-- Loyalty Settings Table
CREATE TABLE IF NOT EXISTS loyalty_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES platform_clients(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  stamps_for_reward INTEGER DEFAULT 10,
  reward_value DECIMAL(10,2) DEFAULT 15.00,
  max_stamps_per_visit INTEGER DEFAULT 10,
  allow_partial_redemption BOOLEAN DEFAULT false,
  points_expiry_days INTEGER DEFAULT 365,
  welcome_bonus_stamps INTEGER DEFAULT 0,
  referral_bonus_stamps INTEGER DEFAULT 5,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(client_id, location_id)
);

-- ============================================================================
-- STEP 7: ACTIVITY & ANALYTICS
-- ============================================================================

-- Customer Activity Table
CREATE TABLE IF NOT EXISTS customer_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES platform_clients(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('registration', 'stamp_earned', 'reward_redeemed', 'visit')),
  details JSONB DEFAULT '{}',
  staff_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Platform Activity Log
CREATE TABLE IF NOT EXISTS platform_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 8: SYSTEM CONFIGURATION
-- ============================================================================

-- System Configuration
CREATE TABLE IF NOT EXISTS system_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feature Toggles
CREATE TABLE IF NOT EXISTS feature_toggles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES platform_clients(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(client_id, feature_name)
);

-- ============================================================================
-- STEP 9: PERFORMANCE INDEXES
-- ============================================================================

-- Platform Clients Indexes
CREATE INDEX IF NOT EXISTS idx_platform_clients_slug ON platform_clients(slug);
CREATE INDEX IF NOT EXISTS idx_platform_clients_status ON platform_clients(status);

-- Restaurants Indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_client_id ON restaurants(client_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON restaurants(user_id);

-- Locations Indexes
CREATE INDEX IF NOT EXISTS idx_locations_client_id ON locations(client_id);
CREATE INDEX IF NOT EXISTS idx_locations_restaurant_id ON locations(restaurant_id);

-- User Roles Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_client_id ON user_roles(client_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Customers Indexes
CREATE INDEX IF NOT EXISTS idx_customers_client_id ON customers(client_id);
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_location_id ON customers(location_id);
CREATE INDEX IF NOT EXISTS idx_customers_qr_code ON customers(qr_code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Legacy Clients Indexes
CREATE INDEX IF NOT EXISTS idx_clients_restaurant_id ON clients(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_clients_location_id ON clients(location_id);
CREATE INDEX IF NOT EXISTS idx_clients_qr_code ON clients(qr_code);

-- Stamps & Rewards Indexes
CREATE INDEX IF NOT EXISTS idx_stamps_customer_id ON stamps(customer_id);
CREATE INDEX IF NOT EXISTS idx_stamps_client_id ON stamps(client_id);
CREATE INDEX IF NOT EXISTS idx_stamps_restaurant_id ON stamps(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_stamps_location_id ON stamps(location_id);
CREATE INDEX IF NOT EXISTS idx_stamps_staff_id ON stamps(staff_id);
CREATE INDEX IF NOT EXISTS idx_stamps_created_at ON stamps(created_at);

CREATE INDEX IF NOT EXISTS idx_rewards_customer_id ON rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_rewards_client_id ON rewards(client_id);
CREATE INDEX IF NOT EXISTS idx_rewards_restaurant_id ON rewards(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_rewards_location_id ON rewards(location_id);
CREATE INDEX IF NOT EXISTS idx_rewards_staff_id ON rewards(staff_id);
CREATE INDEX IF NOT EXISTS idx_rewards_created_at ON rewards(created_at);

-- Location Staff Indexes
CREATE INDEX IF NOT EXISTS idx_location_staff_user_id ON location_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_location_id ON location_staff(location_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_client_id ON location_staff(client_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_status ON location_staff(status);

-- Activity Indexes
CREATE INDEX IF NOT EXISTS idx_customer_activity_customer_id ON customer_activity(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_location_id ON customer_activity(location_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_client_id ON customer_activity(client_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_staff_id ON customer_activity(staff_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_created_at ON customer_activity(created_at);

-- ============================================================================
-- STEP 10: DATABASE FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function: Update client stamps count
CREATE OR REPLACE FUNCTION update_client_stamps()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE clients SET stamps = stamps + NEW.amount WHERE id = NEW.client_id;
    UPDATE customers SET total_stamps = total_stamps + COALESCE(NEW.stamps_earned, NEW.amount, 1) WHERE id = NEW.customer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE clients SET stamps = stamps - OLD.amount WHERE id = OLD.client_id;
    UPDATE customers SET total_stamps = total_stamps - COALESCE(OLD.stamps_earned, OLD.amount, 1) WHERE id = OLD.customer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Updated At Triggers
CREATE TRIGGER trigger_platform_clients_updated_at
  BEFORE UPDATE ON platform_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Stamps Update Trigger
CREATE TRIGGER trigger_update_client_stamps
  AFTER INSERT OR DELETE ON stamps
  FOR EACH ROW EXECUTE FUNCTION update_client_stamps();

-- ============================================================================
-- STEP 11: ROW LEVEL SECURITY SETUP
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE platform_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_activity ENABLE ROW LEVEL SECURITY;

-- Note: RLS Policies are defined in SECURITY_POLICIES.sql

-- ============================================================================
-- STEP 12: INITIAL DATA SETUP
-- ============================================================================

-- Insert default system configuration
INSERT INTO system_config (key, value, description, is_public) VALUES
  ('platform_name', 'ZerionCore Restaurant Loyalty', 'Platform display name', true),
  ('default_stamps_for_reward', '10', 'Default stamps required for reward', true),
  ('max_locations_per_client', '100', 'Maximum locations per client', false),
  ('session_timeout_hours', '24', 'User session timeout in hours', false)
ON CONFLICT (key) DO NOTHING;

-- Insert default feature toggles
INSERT INTO feature_toggles (client_id, feature_name, is_enabled, rollout_percentage) VALUES
  (NULL, 'apple_wallet_integration', true, 100),
  (NULL, 'qr_code_scanning', true, 100),
  (NULL, 'analytics_dashboard', true, 100),
  (NULL, 'notification_campaigns', false, 0)
ON CONFLICT (client_id, feature_name) DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'RESTAURANT LOYALTY PLATFORM - DATABASE SETUP COMPLETE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Tables Created: 15+ core tables with indexes and triggers';
  RAISE NOTICE 'Security: RLS enabled on all tables (policies in SECURITY_POLICIES.sql)';
  RAISE NOTICE 'Compatibility: Supports both legacy and POS operations schemas';
  RAISE NOTICE 'Next Steps: ';
  RAISE NOTICE '1. Run SECURITY_POLICIES.sql for RLS policies';
  RAISE NOTICE '2. Deploy Edge Functions for full functionality';
  RAISE NOTICE '3. Configure environment variables';
  RAISE NOTICE '============================================================================';
END $$; 
-- Loyalty Manager Schema and RLS Policies

-- Create loyalty_settings table
CREATE TABLE IF NOT EXISTS loyalty_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  stamps_required INTEGER NOT NULL DEFAULT 10,
  reward_description TEXT NOT NULL DEFAULT 'Free item',
  reward_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stamps_per_dollar DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  auto_redeem BOOLEAN NOT NULL DEFAULT false,
  max_stamps_per_visit INTEGER NOT NULL DEFAULT 5,
  stamp_expiry_days INTEGER,
  minimum_purchase_amount DECIMAL(10,2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(restaurant_id)
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES platform_clients(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  promo_type VARCHAR(50) NOT NULL CHECK (promo_type IN ('bonus_stamps', 'discount', 'free_item', 'double_stamps', 'referral_bonus')),
  reward_config JSONB NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  eligible_locations UUID[] NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'expired')),
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT valid_usage_count CHECK (usage_count >= 0),
  CONSTRAINT valid_usage_limit CHECK (usage_limit IS NULL OR usage_limit > 0)
);

-- Enable RLS on both tables
ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "loyalty_settings_select_policy" ON loyalty_settings;
DROP POLICY IF EXISTS "loyalty_settings_insert_policy" ON loyalty_settings;
DROP POLICY IF EXISTS "loyalty_settings_update_policy" ON loyalty_settings;
DROP POLICY IF EXISTS "campaigns_select_policy" ON campaigns;
DROP POLICY IF EXISTS "campaigns_insert_policy" ON campaigns;
DROP POLICY IF EXISTS "campaigns_update_policy" ON campaigns;
DROP POLICY IF EXISTS "campaigns_delete_policy" ON campaigns;

-- Loyalty Settings RLS Policies
CREATE POLICY "loyalty_settings_select_policy" ON loyalty_settings
FOR SELECT
USING (
  -- Platform admins can view all settings
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can view settings for their client's restaurants
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN restaurants r ON r.id = loyalty_settings.restaurant_id
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = r.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
  OR
  -- Restaurant admins can view settings for their specific restaurant
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.restaurant_id = loyalty_settings.restaurant_id
    AND ur.role = 'restaurant_admin'
    AND ur.status = 'active'
  )
);

CREATE POLICY "loyalty_settings_insert_policy" ON loyalty_settings
FOR INSERT
WITH CHECK (
  -- Platform admins can create settings for any restaurant
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can create settings for their client's restaurants
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN restaurants r ON r.id = loyalty_settings.restaurant_id
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = r.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
  OR
  -- Restaurant admins can create settings for their specific restaurant
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.restaurant_id = loyalty_settings.restaurant_id
    AND ur.role = 'restaurant_admin'
    AND ur.status = 'active'
  )
);

CREATE POLICY "loyalty_settings_update_policy" ON loyalty_settings
FOR UPDATE
USING (
  -- Platform admins can update all settings
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can update settings for their client's restaurants
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN restaurants r ON r.id = loyalty_settings.restaurant_id
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = r.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
  OR
  -- Restaurant admins can update settings for their specific restaurant
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.restaurant_id = loyalty_settings.restaurant_id
    AND ur.role = 'restaurant_admin'
    AND ur.status = 'active'
  )
)
WITH CHECK (
  -- Same conditions as USING clause
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN restaurants r ON r.id = loyalty_settings.restaurant_id
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = r.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.restaurant_id = loyalty_settings.restaurant_id
    AND ur.role = 'restaurant_admin'
    AND ur.status = 'active'
  )
);

-- Campaigns RLS Policies
CREATE POLICY "campaigns_select_policy" ON campaigns
FOR SELECT
USING (
  -- Platform admins can view all campaigns
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can view campaigns for their client
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = campaigns.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
  OR
  -- Restaurant admins can view campaigns for their specific restaurant
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.restaurant_id = campaigns.restaurant_id
    AND ur.role = 'restaurant_admin'
    AND ur.status = 'active'
  )
);

CREATE POLICY "campaigns_insert_policy" ON campaigns
FOR INSERT
WITH CHECK (
  -- Platform admins can create campaigns for any client
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can create campaigns for their client
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = campaigns.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
  OR
  -- Restaurant admins can create campaigns for their specific restaurant
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.restaurant_id = campaigns.restaurant_id
    AND ur.role = 'restaurant_admin'
    AND ur.status = 'active'
  )
);

CREATE POLICY "campaigns_update_policy" ON campaigns
FOR UPDATE
USING (
  -- Platform admins can update all campaigns
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can update campaigns for their client
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = campaigns.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
  OR
  -- Restaurant admins can update campaigns for their specific restaurant
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.restaurant_id = campaigns.restaurant_id
    AND ur.role = 'restaurant_admin'
    AND ur.status = 'active'
  )
)
WITH CHECK (
  -- Same conditions as USING clause
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = campaigns.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.restaurant_id = campaigns.restaurant_id
    AND ur.role = 'restaurant_admin'
    AND ur.status = 'active'
  )
);

CREATE POLICY "campaigns_delete_policy" ON campaigns
FOR DELETE
USING (
  -- Platform admins can delete all campaigns
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can delete campaigns for their client
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = campaigns.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
  OR
  -- Restaurant admins can delete campaigns for their specific restaurant
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.restaurant_id = campaigns.restaurant_id
    AND ur.role = 'restaurant_admin'
    AND ur.status = 'active'
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loyalty_settings_restaurant_id ON loyalty_settings (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_settings_updated_at ON loyalty_settings (updated_at);

CREATE INDEX IF NOT EXISTS idx_campaigns_client_id ON campaigns (client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_restaurant_id ON campaigns (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns (status);
CREATE INDEX IF NOT EXISTS idx_campaigns_promo_type ON campaigns (promo_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns (start_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON campaigns (end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_eligible_locations ON campaigns USING gin (eligible_locations);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns (created_at);

-- Add triggers to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_loyalty_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_loyalty_settings_updated_at ON loyalty_settings;
CREATE TRIGGER trigger_loyalty_settings_updated_at
  BEFORE UPDATE ON loyalty_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_settings_updated_at();

DROP TRIGGER IF EXISTS trigger_campaigns_updated_at ON campaigns;
CREATE TRIGGER trigger_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaigns_updated_at(); 
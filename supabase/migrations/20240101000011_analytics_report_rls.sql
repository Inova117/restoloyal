-- Analytics Report RLS Policies and Performance Indexes

-- Ensure RLS is enabled on all relevant tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Add missing columns if they don't exist (with conditional creation)
DO $$
BEGIN
  -- Add client_id column to locations table if it doesn't exist (using UUID for consistency)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'client_id') THEN
    ALTER TABLE locations ADD COLUMN client_id UUID;
    RAISE NOTICE 'Added client_id column to locations table';
  END IF;

  -- Add status column to clients table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'status') THEN
    ALTER TABLE clients ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked'));
  END IF;

  -- Add redeemed_at column to rewards table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'redeemed_at') THEN
    ALTER TABLE rewards ADD COLUMN redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  END IF;

  -- Add client_id column to stamps table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stamps' AND column_name = 'client_id') THEN
    ALTER TABLE stamps ADD COLUMN client_id UUID REFERENCES clients(id);
  END IF;

  -- Add client_id column to rewards table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'client_id') THEN
    ALTER TABLE rewards ADD COLUMN client_id UUID REFERENCES clients(id);
  END IF;

  -- Add status column to locations table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'status') THEN
    ALTER TABLE locations ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'));
  END IF;

  -- Add restaurant_id column to locations table if it doesn't exist (for hierarchy)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'restaurant_id') THEN
    ALTER TABLE locations ADD COLUMN restaurant_id VARCHAR(255);
  END IF;
END $$;

-- Drop existing analytics-related policies if they exist
DROP POLICY IF EXISTS "analytics_clients_select_policy" ON clients;
DROP POLICY IF EXISTS "analytics_stamps_select_policy" ON stamps;
DROP POLICY IF EXISTS "analytics_rewards_select_policy" ON rewards;
DROP POLICY IF EXISTS "analytics_locations_select_policy" ON locations;

-- Clients table RLS policies for analytics
CREATE POLICY "analytics_clients_select_policy" ON clients
FOR SELECT
USING (
  -- Platform admins can view all client data
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can view clients for their locations
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN locations l ON l.id = clients.location_id
    WHERE ur.user_id = auth.uid()
    AND ur.client_id::text = l.client_id::text  -- Cast both to text for comparison
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
  OR
  -- Restaurant admins can view clients for their restaurant's locations
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN locations l ON l.id = clients.location_id
    WHERE ur.user_id = auth.uid()
    AND ur.restaurant_id = l.restaurant_id
    AND ur.role = 'restaurant_admin'
    AND ur.status = 'active'
  )
);

-- Stamps table RLS policies for analytics
CREATE POLICY "analytics_stamps_select_policy" ON stamps
FOR SELECT
USING (
  -- Platform admins can view all stamp data
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can view stamps for their locations
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN locations l ON l.id = stamps.location_id
    WHERE ur.user_id = auth.uid()
    AND ur.client_id::text = l.client_id::text  -- Cast both to text for comparison
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
  OR
  -- Restaurant admins can view stamps for their restaurant's locations
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN locations l ON l.id = stamps.location_id
    WHERE ur.user_id = auth.uid()
    AND ur.restaurant_id = l.restaurant_id
    AND ur.role = 'restaurant_admin'
    AND ur.status = 'active'
  )
);

-- Rewards table RLS policies for analytics
CREATE POLICY "analytics_rewards_select_policy" ON rewards
FOR SELECT
USING (
  -- Platform admins can view all reward data
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can view rewards for their locations
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN locations l ON l.id = rewards.location_id
    WHERE ur.user_id = auth.uid()
    AND ur.client_id::text = l.client_id::text  -- Cast both to text for comparison
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
  OR
  -- Restaurant admins can view rewards for their restaurant's locations
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN locations l ON l.id = rewards.location_id
    WHERE ur.user_id = auth.uid()
    AND ur.restaurant_id = l.restaurant_id
    AND ur.role = 'restaurant_admin'
    AND ur.status = 'active'
  )
);

-- Locations table RLS policies for analytics
CREATE POLICY "analytics_locations_select_policy" ON locations
FOR SELECT
USING (
  -- Platform admins can view all location data
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can view locations for their client
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.client_id::text = locations.client_id::text  -- Cast both to text for comparison
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
  OR
  -- Restaurant admins can view locations for their restaurant
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.restaurant_id = locations.restaurant_id
    AND ur.role = 'restaurant_admin'
    AND ur.status = 'active'
  )
);

-- Performance indexes for analytics queries

-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_location_id ON clients (location_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients (created_at);
CREATE INDEX IF NOT EXISTS idx_clients_location_created ON clients (location_id, created_at);

-- Stamps table indexes
CREATE INDEX IF NOT EXISTS idx_stamps_location_id ON stamps (location_id);
CREATE INDEX IF NOT EXISTS idx_stamps_created_at ON stamps (created_at);
CREATE INDEX IF NOT EXISTS idx_stamps_client_id ON stamps (client_id);
CREATE INDEX IF NOT EXISTS idx_stamps_location_created ON stamps (location_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stamps_client_created ON stamps (client_id, created_at);

-- Rewards table indexes
CREATE INDEX IF NOT EXISTS idx_rewards_location_id ON rewards (location_id);
CREATE INDEX IF NOT EXISTS idx_rewards_redeemed_at ON rewards (redeemed_at);
CREATE INDEX IF NOT EXISTS idx_rewards_client_id ON rewards (client_id);
CREATE INDEX IF NOT EXISTS idx_rewards_location_redeemed ON rewards (location_id, redeemed_at);
CREATE INDEX IF NOT EXISTS idx_rewards_client_redeemed ON rewards (client_id, redeemed_at);

-- Locations table indexes
CREATE INDEX IF NOT EXISTS idx_locations_client_id ON locations (client_id);
CREATE INDEX IF NOT EXISTS idx_locations_restaurant_id ON locations (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations (status);

-- Composite indexes for common analytics queries
CREATE INDEX IF NOT EXISTS idx_clients_analytics_composite ON clients (location_id, created_at, status);
CREATE INDEX IF NOT EXISTS idx_stamps_analytics_composite ON stamps (location_id, created_at, client_id);
CREATE INDEX IF NOT EXISTS idx_rewards_analytics_composite ON rewards (location_id, redeemed_at, client_id);

-- Monthly aggregation indexes (for trend analysis)
CREATE INDEX IF NOT EXISTS idx_clients_monthly ON clients (date_trunc('month', created_at), location_id);
CREATE INDEX IF NOT EXISTS idx_stamps_monthly ON stamps (date_trunc('month', created_at), location_id);
CREATE INDEX IF NOT EXISTS idx_rewards_monthly ON rewards (date_trunc('month', redeemed_at), location_id);

-- Create analytics summary view for better performance (updated to handle UUID types)
CREATE OR REPLACE VIEW analytics_summary AS
SELECT 
  l.client_id,
  l.id as location_id,
  l.name as location_name,
  l.city,
  l.state,
  COUNT(DISTINCT c.id) as total_customers,
  COUNT(DISTINCT CASE WHEN c.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN c.id END) as new_customers_30d,
  COUNT(DISTINCT CASE WHEN s.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN s.client_id END) as active_customers_30d,
  COUNT(s.id) as total_stamps,
  COUNT(r.id) as total_rewards,
  COALESCE(COUNT(s.id), 0) as total_stamp_value,
  COALESCE(COUNT(r.id), 0) as total_reward_value
FROM locations l
LEFT JOIN clients c ON c.location_id = l.id
LEFT JOIN stamps s ON s.location_id = l.id
LEFT JOIN rewards r ON r.location_id = l.id
WHERE l.client_id IS NOT NULL  -- Only include locations with valid client_id
GROUP BY l.client_id, l.id, l.name, l.city, l.state;

-- Grant necessary permissions
GRANT SELECT ON analytics_summary TO authenticated;

-- Add RLS policy for the analytics summary view
DROP POLICY IF EXISTS "analytics_summary_select_policy" ON analytics_summary;
CREATE POLICY "analytics_summary_select_policy" ON analytics_summary
FOR SELECT
USING (
  -- Platform admins can view all analytics
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can view analytics for their client
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.client_id::text = analytics_summary.client_id::text  -- Cast both to text for comparison
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
);

-- Create function to update analytics cache (for future optimization)
CREATE OR REPLACE FUNCTION refresh_analytics_cache()
RETURNS void AS $$
BEGIN
  -- This function can be used to refresh materialized views or cache tables
  -- Currently just refreshes the analytics summary view
  REFRESH MATERIALIZED VIEW IF EXISTS analytics_summary_materialized;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit logging for analytics access
CREATE OR REPLACE FUNCTION log_analytics_access()
RETURNS trigger AS $$
BEGIN
  INSERT INTO platform_activity_log (
    activity_type,
    description,
    user_id,
    metadata
  ) VALUES (
    'analytics_accessed',
    'Analytics data accessed',
    auth.uid(),
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', CURRENT_TIMESTAMP
    )
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for analytics access logging (optional, can be enabled if needed)
-- DROP TRIGGER IF EXISTS analytics_access_log_clients ON clients;
-- CREATE TRIGGER analytics_access_log_clients
--   AFTER SELECT ON clients
--   FOR EACH STATEMENT
--   EXECUTE FUNCTION log_analytics_access(); 
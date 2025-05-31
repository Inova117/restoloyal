-- Migration: Add Row Level Security for Location Management
-- Description: Ensures only authorized users can manage locations for their client

-- Enable RLS on locations table (if not already enabled)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "client_admins_can_view_own_locations" ON locations;
DROP POLICY IF EXISTS "client_admins_can_manage_own_locations" ON locations;
DROP POLICY IF EXISTS "restaurant_admins_can_view_own_locations" ON locations;
DROP POLICY IF EXISTS "restaurant_admins_can_manage_own_locations" ON locations;
DROP POLICY IF EXISTS "platform_admins_can_view_all_locations" ON locations;
DROP POLICY IF EXISTS "platform_admins_can_manage_all_locations" ON locations;

-- Policy: Allow client admins to view locations for their client
CREATE POLICY "client_admins_can_view_own_locations" ON locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN restaurants r ON r.client_id = ur.client_id
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'client_admin'
        AND r.id = locations.restaurant_id
    )
  );

-- Policy: Allow client admins to manage locations for their client
CREATE POLICY "client_admins_can_manage_own_locations" ON locations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN restaurants r ON r.client_id = ur.client_id
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'client_admin'
        AND r.id = locations.restaurant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN restaurants r ON r.client_id = ur.client_id
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'client_admin'
        AND r.id = locations.restaurant_id
    )
  );

-- Policy: Allow restaurant admins to view locations for their restaurant
CREATE POLICY "restaurant_admins_can_view_own_locations" ON locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'restaurant_admin'
        AND ur.restaurant_id = locations.restaurant_id
    )
  );

-- Policy: Allow restaurant admins to manage locations for their restaurant
CREATE POLICY "restaurant_admins_can_manage_own_locations" ON locations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'restaurant_admin'
        AND ur.restaurant_id = locations.restaurant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'restaurant_admin'
        AND ur.restaurant_id = locations.restaurant_id
    )
  );

-- Policy: Allow platform admins (ZerionCore) to view all locations
CREATE POLICY "platform_admins_can_view_all_locations" ON locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin_users pau
      WHERE pau.user_id = auth.uid()
        AND pau.role IN ('super_admin', 'admin')
        AND pau.status = 'active'
    )
  );

-- Policy: Allow platform admins (ZerionCore) to manage all locations
CREATE POLICY "platform_admins_can_manage_all_locations" ON locations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin_users pau
      WHERE pau.user_id = auth.uid()
        AND pau.role IN ('super_admin', 'admin')
        AND pau.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM platform_admin_users pau
      WHERE pau.user_id = auth.uid()
        AND pau.role IN ('super_admin', 'admin')
        AND pau.status = 'active'
    )
  );

-- Add indexes for better performance on RLS queries
CREATE INDEX IF NOT EXISTS idx_locations_restaurant_id_active 
ON locations(restaurant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_user_roles_restaurant_role 
ON user_roles(user_id, restaurant_id, role);

-- Add trigger to automatically update updated_at timestamp for locations
CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_locations_updated_at ON locations;
CREATE TRIGGER trigger_update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_locations_updated_at();

-- Add comments for documentation
COMMENT ON TABLE locations IS 'Restaurant locations with RLS for client_admin and restaurant_admin access control';
COMMENT ON POLICY "client_admins_can_view_own_locations" ON locations IS 'Allows client admins to view all locations for their client';
COMMENT ON POLICY "client_admins_can_manage_own_locations" ON locations IS 'Allows client admins to manage all locations for their client';
COMMENT ON POLICY "restaurant_admins_can_view_own_locations" ON locations IS 'Allows restaurant admins to view locations for their restaurant';
COMMENT ON POLICY "restaurant_admins_can_manage_own_locations" ON locations IS 'Allows restaurant admins to manage locations for their restaurant';
COMMENT ON POLICY "platform_admins_can_view_all_locations" ON locations IS 'Allows ZerionCore platform admins to view all locations';
COMMENT ON POLICY "platform_admins_can_manage_all_locations" ON locations IS 'Allows ZerionCore platform admins to manage all locations'; 
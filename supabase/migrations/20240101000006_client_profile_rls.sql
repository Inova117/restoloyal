-- Migration: Add Row Level Security for Client Profile Management
-- Description: Ensures only authorized client_admin users can view/update their client profiles

-- Enable RLS on platform_clients table
ALTER TABLE platform_clients ENABLE ROW LEVEL SECURITY;

-- Policy: Allow client admins to view their own client profile
-- Client admins are stored in user_roles table with role 'client_admin'
CREATE POLICY "client_admins_can_view_own_profile" ON platform_clients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.client_id = platform_clients.id
        AND ur.role = 'client_admin'
    )
  );

-- Policy: Allow client admins to update their own client profile
CREATE POLICY "client_admins_can_update_own_profile" ON platform_clients
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.client_id = platform_clients.id
        AND ur.role = 'client_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.client_id = platform_clients.id
        AND ur.role = 'client_admin'
    )
  );

-- Policy: Allow platform admins (ZerionCore) to view all client profiles
-- Platform admins are stored in platform_admin_users table
CREATE POLICY "platform_admins_can_view_all_profiles" ON platform_clients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin_users pau
      WHERE pau.user_id = auth.uid()
        AND pau.role IN ('super_admin', 'admin')
        AND pau.status = 'active'
    )
  );

-- Policy: Allow platform admins (ZerionCore) to update all client profiles
CREATE POLICY "platform_admins_can_update_all_profiles" ON platform_clients
  FOR UPDATE
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
CREATE INDEX IF NOT EXISTS idx_user_roles_user_client_role 
ON user_roles(user_id, client_id, role);

CREATE INDEX IF NOT EXISTS idx_platform_admin_users_user_role_status 
ON platform_admin_users(user_id, role, status);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_platform_clients_updated_at
  BEFORE UPDATE ON platform_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_clients_updated_at();

-- Add comment for documentation
COMMENT ON TABLE platform_clients IS 'Restaurant chain client profiles with RLS for client_admin access control';
COMMENT ON POLICY "client_admins_can_view_own_profile" ON platform_clients IS 'Allows client admins to view only their own client profile';
COMMENT ON POLICY "client_admins_can_update_own_profile" ON platform_clients IS 'Allows client admins to update only their own client profile';
COMMENT ON POLICY "platform_admins_can_view_all_profiles" ON platform_clients IS 'Allows ZerionCore platform admins to view all client profiles';
COMMENT ON POLICY "platform_admins_can_update_all_profiles" ON platform_clients IS 'Allows ZerionCore platform admins to update all client profiles'; 
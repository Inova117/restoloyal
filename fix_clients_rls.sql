-- Fix RLS policies for clients table to allow platform admin access
-- This fixes the 500 error when loading clients from the dashboard

-- Drop existing problematic policy
DROP POLICY IF EXISTS "analytics_clients_select_policy" ON clients;

-- Create new policy that allows platform admins using environment-based detection
CREATE POLICY "platform_admins_can_view_all_clients" ON clients
  FOR SELECT
  USING (
    -- Platform admins can view all clients (using environment-based detection)
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND (
        -- Check if user email is in platform admin list from environment
        u.email = ANY(
          string_to_array(
            COALESCE(
              current_setting('app.platform_admin_emails', true),
              'admin@zerioncore.com,platform@zerioncore.com,owner@zerioncore.com,martin@zerionstudio.com'
            ),
            ','
          )
        )
        OR
        -- Fallback: check platform_admin_users table if it exists and has data
        EXISTS (
          SELECT 1 FROM platform_admin_users pau
          WHERE pau.user_id = auth.uid()
          AND pau.role IN ('super_admin', 'platform_admin')
          AND pau.status = 'active'
        )
      )
    )
    OR
    -- Client admins can view clients for their locations
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN locations l ON l.id = clients.location_id
      WHERE ur.user_id = auth.uid()
      AND ur.client_id::text = l.client_id::text
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

-- Also create a policy for platform_clients table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_clients') THEN
    -- Drop existing policy if any
    DROP POLICY IF EXISTS "platform_admins_can_manage_platform_clients" ON platform_clients;
    
    -- Create new policy for platform_clients
    CREATE POLICY "platform_admins_can_manage_platform_clients" ON platform_clients
      FOR ALL
      USING (
        -- Platform admins can manage all platform clients
        EXISTS (
          SELECT 1 FROM auth.users u
          WHERE u.id = auth.uid()
          AND u.email = ANY(
            string_to_array(
              COALESCE(
                current_setting('app.platform_admin_emails', true),
                'admin@zerioncore.com,platform@zerioncore.com,owner@zerioncore.com,martin@zerionstudio.com'
              ),
              ','
            )
          )
        )
      );
  END IF;
END $$; 
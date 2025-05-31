-- Customer Manager RLS Policies
-- Enable RLS on clients table (if not already enabled)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "customer_manager_select_policy" ON clients;
DROP POLICY IF EXISTS "customer_manager_update_policy" ON clients;

-- Policy for SELECT: Client admins and restaurant admins can view customers within their scope
CREATE POLICY "customer_manager_select_policy" ON clients
FOR SELECT
USING (
  -- Platform admins can view all customers
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can view all customers for their client
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN restaurants r ON r.id = clients.restaurant_id
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = r.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
  OR
  -- Restaurant admins can view customers for their specific restaurant
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.restaurant_id = clients.restaurant_id
    AND ur.role = 'restaurant_admin'
    AND ur.status = 'active'
  )
  OR
  -- Location staff can view customers for their specific location
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.location_id = clients.location_id
    AND ur.role = 'location_staff'
    AND ur.status = 'active'
  )
);

-- Policy for UPDATE: Client admins and restaurant admins can update customers within their scope
CREATE POLICY "customer_manager_update_policy" ON clients
FOR UPDATE
USING (
  -- Platform admins can update all customers
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can update all customers for their client
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN restaurants r ON r.id = clients.restaurant_id
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = r.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
  OR
  -- Restaurant admins can update customers for their specific restaurant
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.restaurant_id = clients.restaurant_id
    AND ur.role = 'restaurant_admin'
    AND ur.status = 'active'
  )
)
WITH CHECK (
  -- Platform admins can update all customers
  EXISTS (
    SELECT 1 FROM platform_admin_users pau
    WHERE pau.user_id = auth.uid()
    AND pau.role IN ('super_admin', 'admin')
    AND pau.status = 'active'
  )
  OR
  -- Client admins can update all customers for their client
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN restaurants r ON r.id = clients.restaurant_id
    WHERE ur.user_id = auth.uid()
    AND ur.client_id = r.client_id
    AND ur.role = 'client_admin'
    AND ur.status = 'active'
  )
  OR
  -- Restaurant admins can update customers for their specific restaurant
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.restaurant_id = clients.restaurant_id
    AND ur.role = 'restaurant_admin'
    AND ur.status = 'active'
  )
);

-- Add basic indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_restaurant_id ON clients (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_clients_location_id ON clients (location_id);
CREATE INDEX IF NOT EXISTS idx_clients_customer_status ON clients (customer_status);

-- Try to enable trigram extension for better text search
DO $$
BEGIN
  -- Try to create the extension
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  
  -- Create trigram indexes if extension is available
  CREATE INDEX IF NOT EXISTS idx_clients_name_search ON clients USING gin (name gin_trgm_ops);
  CREATE INDEX IF NOT EXISTS idx_clients_email_search ON clients USING gin (email gin_trgm_ops);
  CREATE INDEX IF NOT EXISTS idx_clients_phone_search ON clients USING gin (phone gin_trgm_ops);
  
  RAISE NOTICE 'Trigram indexes created successfully';
  
EXCEPTION 
  WHEN OTHERS THEN
    -- If trigram extension fails, create basic text indexes instead
    RAISE NOTICE 'Trigram extension not available, creating basic text indexes instead';
    
    -- Create basic text indexes as fallback
    CREATE INDEX IF NOT EXISTS idx_clients_name_text ON clients (lower(name));
    CREATE INDEX IF NOT EXISTS idx_clients_email_text ON clients (lower(email));
    CREATE INDEX IF NOT EXISTS idx_clients_phone_text ON clients (phone);
END $$;

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clients_updated_at ON clients;
CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at(); 
-- Fix Analytics Schema Issues
-- This script adds missing columns required for the analytics system

-- Add missing columns to locations table
DO $$
DECLARE
  restaurant_id_type TEXT;
BEGIN
  -- Add client_id column to locations table if it doesn't exist (using UUID type for consistency)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'client_id') THEN
    ALTER TABLE locations ADD COLUMN client_id UUID;
    RAISE NOTICE 'Added client_id column to locations table';
  ELSE
    RAISE NOTICE 'client_id column already exists in locations table';
  END IF;

  -- Check if restaurant_id column exists and get its type
  SELECT data_type INTO restaurant_id_type 
  FROM information_schema.columns 
  WHERE table_name = 'locations' AND column_name = 'restaurant_id';

  -- Add restaurant_id column if it doesn't exist
  IF restaurant_id_type IS NULL THEN
    -- Check if we have a restaurants table to determine the correct type
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurants') THEN
      -- If restaurants table exists, use UUID (assuming it has UUID primary key)
      ALTER TABLE locations ADD COLUMN restaurant_id UUID;
      RAISE NOTICE 'Added restaurant_id column to locations table (UUID type)';
    ELSE
      -- If no restaurants table, use VARCHAR
      ALTER TABLE locations ADD COLUMN restaurant_id VARCHAR(255);
      RAISE NOTICE 'Added restaurant_id column to locations table (VARCHAR type)';
    END IF;
  ELSE
    RAISE NOTICE 'restaurant_id column already exists in locations table (type: %)', restaurant_id_type;
  END IF;

  -- Add status column to locations table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'status') THEN
    ALTER TABLE locations ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'));
    RAISE NOTICE 'Added status column to locations table';
  ELSE
    RAISE NOTICE 'status column already exists in locations table';
  END IF;

  -- Add client_id column to stamps table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stamps' AND column_name = 'client_id') THEN
    ALTER TABLE stamps ADD COLUMN client_id UUID REFERENCES clients(id);
    RAISE NOTICE 'Added client_id column to stamps table';
  ELSE
    RAISE NOTICE 'client_id column already exists in stamps table';
  END IF;

  -- Add client_id column to rewards table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'client_id') THEN
    ALTER TABLE rewards ADD COLUMN client_id UUID REFERENCES clients(id);
    RAISE NOTICE 'Added client_id column to rewards table';
  ELSE
    RAISE NOTICE 'client_id column already exists in rewards table';
  END IF;

  -- Add redeemed_at column to rewards table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'redeemed_at') THEN
    ALTER TABLE rewards ADD COLUMN redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE 'Added redeemed_at column to rewards table';
  ELSE
    RAISE NOTICE 'redeemed_at column already exists in rewards table';
  END IF;

  -- Add status column to clients table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'status') THEN
    ALTER TABLE clients ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked'));
    RAISE NOTICE 'Added status column to clients table';
  ELSE
    RAISE NOTICE 'status column already exists in clients table';
  END IF;
END $$;

-- Create indexes for analytics performance
CREATE INDEX IF NOT EXISTS idx_locations_client_id ON locations (client_id);
CREATE INDEX IF NOT EXISTS idx_locations_restaurant_id ON locations (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations (status);

-- Update any existing locations to have proper values
DO $$
DECLARE
  sample_client_id UUID;
  sample_restaurant_id UUID;
  restaurant_id_type TEXT;
BEGIN
  -- Try to get a sample client ID
  SELECT id INTO sample_client_id FROM clients LIMIT 1;
  
  IF sample_client_id IS NOT NULL THEN
    -- Update locations with actual client ID
    UPDATE locations SET client_id = sample_client_id WHERE client_id IS NULL;
    RAISE NOTICE 'Updated locations with client_id: %', sample_client_id;
  ELSE
    -- No clients exist, we'll need to create a placeholder or handle this differently
    RAISE NOTICE 'No clients found in database. Locations client_id will remain NULL until clients are created.';
  END IF;
  
  -- Check restaurant_id column type and update accordingly
  SELECT data_type INTO restaurant_id_type 
  FROM information_schema.columns 
  WHERE table_name = 'locations' AND column_name = 'restaurant_id';
  
  IF restaurant_id_type = 'uuid' THEN
    -- Try to get a sample restaurant ID
    SELECT id INTO sample_restaurant_id FROM restaurants LIMIT 1;
    
    IF sample_restaurant_id IS NOT NULL THEN
      UPDATE locations SET restaurant_id = sample_restaurant_id WHERE restaurant_id IS NULL;
      RAISE NOTICE 'Updated locations with restaurant_id: %', sample_restaurant_id;
    ELSE
      RAISE NOTICE 'No restaurants found in database. Locations restaurant_id will remain NULL until restaurants are created.';
    END IF;
  ELSE
    -- restaurant_id is VARCHAR, safe to use string value
    UPDATE locations SET restaurant_id = 'galletti-main' WHERE restaurant_id IS NULL OR restaurant_id = '';
    RAISE NOTICE 'Updated locations with restaurant_id: galletti-main';
  END IF;
  
  -- Update status (this is always VARCHAR)
  UPDATE locations SET status = 'active' WHERE status IS NULL OR status = '';
  RAISE NOTICE 'Updated locations status to active';
END $$;

-- Create a view that handles the analytics queries safely
CREATE OR REPLACE VIEW analytics_locations_view AS
SELECT 
  l.id,
  l.name,
  l.address,
  l.city,
  l.state,
  l.client_id,
  l.restaurant_id,
  l.status,
  l.created_at,
  l.updated_at
FROM locations l;

-- Grant permissions on the view
GRANT SELECT ON analytics_locations_view TO authenticated;

-- Verify the changes
DO $$
DECLARE
  client_id_type TEXT;
  restaurant_id_type TEXT;
  status_type TEXT;
BEGIN
  RAISE NOTICE 'Schema fix completed. Verifying columns:';
  
  -- Check if columns exist and get their types
  SELECT data_type INTO client_id_type FROM information_schema.columns 
  WHERE table_name = 'locations' AND column_name = 'client_id';
  
  SELECT data_type INTO restaurant_id_type FROM information_schema.columns 
  WHERE table_name = 'locations' AND column_name = 'restaurant_id';
  
  SELECT data_type INTO status_type FROM information_schema.columns 
  WHERE table_name = 'locations' AND column_name = 'status';
  
  IF client_id_type IS NOT NULL THEN
    RAISE NOTICE '✓ locations.client_id exists (type: %)', client_id_type;
  ELSE
    RAISE NOTICE '✗ locations.client_id missing';
  END IF;
  
  IF restaurant_id_type IS NOT NULL THEN
    RAISE NOTICE '✓ locations.restaurant_id exists (type: %)', restaurant_id_type;
  ELSE
    RAISE NOTICE '✗ locations.restaurant_id missing';
  END IF;
  
  IF status_type IS NOT NULL THEN
    RAISE NOTICE '✓ locations.status exists (type: %)', status_type;
  ELSE
    RAISE NOTICE '✗ locations.status missing';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during verification: %', SQLERRM;
END $$; 
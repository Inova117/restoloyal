-- Quick Fix for Analytics UUID Type Error
-- Run this if you're getting UUID type errors

-- First, let's check what columns exist and their types
DO $$
DECLARE
  client_id_exists BOOLEAN := FALSE;
  restaurant_id_exists BOOLEAN := FALSE;
  restaurant_id_type TEXT;
BEGIN
  -- Check if client_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'client_id'
  ) INTO client_id_exists;
  
  -- Check if restaurant_id column exists and get its type
  SELECT data_type INTO restaurant_id_type 
  FROM information_schema.columns 
  WHERE table_name = 'locations' AND column_name = 'restaurant_id';
  
  RAISE NOTICE 'client_id exists: %, restaurant_id type: %', client_id_exists, COALESCE(restaurant_id_type, 'does not exist');
  
  -- Add client_id if missing
  IF NOT client_id_exists THEN
    ALTER TABLE locations ADD COLUMN client_id UUID;
    RAISE NOTICE 'Added client_id column (UUID type)';
  END IF;
  
  -- Handle restaurant_id based on its current type
  IF restaurant_id_type IS NULL THEN
    -- Column doesn't exist, add as VARCHAR for simplicity
    ALTER TABLE locations ADD COLUMN restaurant_id VARCHAR(255);
    RAISE NOTICE 'Added restaurant_id column (VARCHAR type)';
  ELSIF restaurant_id_type = 'uuid' THEN
    -- Column exists as UUID, don't try to insert string values
    RAISE NOTICE 'restaurant_id is UUID type - will not update with string values';
  ELSE
    -- Column exists as VARCHAR or other type
    RAISE NOTICE 'restaurant_id is % type - safe to update with string values', restaurant_id_type;
  END IF;
  
  -- Add status column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'status') THEN
    ALTER TABLE locations ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    RAISE NOTICE 'Added status column';
  END IF;
END $$;

-- Update locations safely based on column types
DO $$
DECLARE
  restaurant_id_type TEXT;
  sample_client_id UUID;
BEGIN
  -- Get restaurant_id column type
  SELECT data_type INTO restaurant_id_type 
  FROM information_schema.columns 
  WHERE table_name = 'locations' AND column_name = 'restaurant_id';
  
  -- Try to get a sample client ID for client_id updates
  SELECT id INTO sample_client_id FROM clients LIMIT 1;
  
  -- Update client_id if we have a sample
  IF sample_client_id IS NOT NULL THEN
    UPDATE locations SET client_id = sample_client_id WHERE client_id IS NULL;
    RAISE NOTICE 'Updated client_id with: %', sample_client_id;
  ELSE
    RAISE NOTICE 'No clients found - client_id will remain NULL';
  END IF;
  
  -- Update restaurant_id only if it's not UUID type
  IF restaurant_id_type != 'uuid' THEN
    UPDATE locations SET restaurant_id = 'galletti-main' WHERE restaurant_id IS NULL OR restaurant_id = '';
    RAISE NOTICE 'Updated restaurant_id with string value';
  ELSE
    RAISE NOTICE 'Skipping restaurant_id update (UUID type requires UUID value)';
  END IF;
  
  -- Update status (always safe)
  UPDATE locations SET status = 'active' WHERE status IS NULL OR status = '';
  RAISE NOTICE 'Updated status to active';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during update: %', SQLERRM;
END $$;

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_locations_client_id ON locations (client_id);
CREATE INDEX IF NOT EXISTS idx_locations_restaurant_id ON locations (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations (status);

-- Final completion message
DO $$
BEGIN
  RAISE NOTICE 'Quick fix completed. You can now test the analytics system.';
END $$; 
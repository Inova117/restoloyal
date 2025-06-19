-- ============================================================================
-- QUICK UI FIX: Create minimal user_roles table
-- ============================================================================
-- This creates a minimal user_roles table to stop the 400 errors in the UI
-- Run this in Supabase SQL Editor to fix immediate UI issues
-- ============================================================================

-- Check if user_roles table exists and add missing columns
DO $$
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'status' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));
    RAISE NOTICE 'Added status column to user_roles table';
  ELSE
    RAISE NOTICE 'Status column already exists in user_roles table';
  END IF;

  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'created_at' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE 'Added created_at column to user_roles table';
  ELSE
    RAISE NOTICE 'Created_at column already exists in user_roles table';
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'updated_at' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE 'Added updated_at column to user_roles table';
  ELSE
    RAISE NOTICE 'Updated_at column already exists in user_roles table';
  END IF;

  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'created_by' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN created_by UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Added created_by column to user_roles table';
  ELSE
    RAISE NOTICE 'Created_by column already exists in user_roles table';
  END IF;
END $$;

-- Add unique constraint to prevent duplicate user roles
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique_user 
ON public.user_roles (user_id, tier, client_id, location_id);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy for testing (REMOVE IN PRODUCTION)
DROP POLICY IF EXISTS "Allow authenticated users to view user_roles" ON public.user_roles;
CREATE POLICY "Allow authenticated users to view user_roles" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (true);

-- Insert a test superadmin role for the current user (update email as needed)
-- First, check if status column exists before trying to insert with it
DO $$
DECLARE
  has_status_column BOOLEAN;
BEGIN
  -- Check if status column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'status' AND table_schema = 'public'
  ) INTO has_status_column;

  -- Insert based on whether status column exists
  IF has_status_column THEN
    INSERT INTO public.user_roles (user_id, tier, status) 
    SELECT 
      id as user_id,
      'superadmin' as tier,
      'active' as status
    FROM auth.users 
    WHERE email = 'martin@zerionstudio.com' -- UPDATE THIS EMAIL
    ON CONFLICT (user_id, tier, client_id, location_id) DO NOTHING;
    RAISE NOTICE 'Inserted superadmin role with status column';
  ELSE
    INSERT INTO public.user_roles (user_id, tier) 
    SELECT 
      id as user_id,
      'superadmin' as tier
    FROM auth.users 
    WHERE email = 'martin@zerionstudio.com' -- UPDATE THIS EMAIL
    ON CONFLICT (user_id, tier, client_id, location_id) DO NOTHING;
    RAISE NOTICE 'Inserted superadmin role without status column';
  END IF;
END $$;

-- Verify the table was created
SELECT 
  'user_roles table created successfully' as status,
  COUNT(*) as total_roles
FROM public.user_roles;

COMMENT ON TABLE public.user_roles IS 'Quick fix for UI testing - minimal user roles table'; 
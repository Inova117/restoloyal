-- ============================================================================
-- 🏪 ADD DEFAULT LOCATION - SIMPLE APPROACH
-- This creates a client admin first, then creates the location properly
-- ============================================================================

DO $$
DECLARE
  client_record RECORD;
  client_admin_id UUID;
  location_id UUID;
  current_user_id UUID;
BEGIN
  RAISE NOTICE '🔧 Creating default location the proper way...';
  
  -- Get current user ID (from auth.users)
  SELECT auth.uid() INTO current_user_id;
  
  -- Get the existing client
  SELECT * INTO client_record FROM public.clients LIMIT 1;
  
  IF client_record.id IS NULL THEN
    RAISE NOTICE '❌ No client found - cannot create location';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Found client: %', client_record.name;
  
  -- Check if client_admins table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'client_admins' AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ client_admins table exists';
    
    -- Try to get existing client admin for this client
    SELECT id INTO client_admin_id 
    FROM public.client_admins 
    WHERE client_id = client_record.id 
    LIMIT 1;
    
    IF client_admin_id IS NULL THEN
      RAISE NOTICE '⚠️ No client admin found - creating one';
      
      -- Create a client admin first
      INSERT INTO public.client_admins (
        user_id,
        client_id, 
        email,
        name,
        role,
        is_active
      ) VALUES (
        COALESCE(current_user_id, gen_random_uuid()), -- Use current user or generate UUID
        client_record.id,
        client_record.email,
        'Default Admin',
        'admin',
        true
      ) RETURNING id INTO client_admin_id;
      
      RAISE NOTICE '✅ Created client admin with ID: %', client_admin_id;
    ELSE
      RAISE NOTICE '✅ Found existing client admin: %', client_admin_id;
    END IF;
    
    -- Now create the location with proper validation
    INSERT INTO public.locations (
      client_id,
      created_by_client_admin_id,
      name, 
      address, 
      city, 
      state,
      phone,
      email,
      is_active
    ) VALUES (
      client_record.id,
      client_admin_id,
      'Main Location',
      '123 Main Street',
      'Your City', 
      'Your State',
      '(555) 123-4567',
      client_record.email,
      true
    ) RETURNING id INTO location_id;
    
    RAISE NOTICE '✅ Created location with ID: %', location_id;
    
  ELSE
    RAISE NOTICE '❌ client_admins table does not exist';
    RAISE NOTICE '💡 You need to create locations through your frontend or Edge Functions';
    RETURN;
  END IF;
  
  RAISE NOTICE '🎉 SUCCESS! Default location created and linked to client';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error: %', SQLERRM;
    RAISE NOTICE '💡 This is likely due to missing client_admins table or validation rules';
    RAISE NOTICE '💡 You can create locations through your frontend instead';
END $$;

-- Verify what we have now
DO $$
DECLARE
  client_count INTEGER;
  location_count INTEGER;
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO client_count FROM public.clients;
  SELECT COUNT(*) INTO location_count FROM public.locations;
  
  -- Check client_admins if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'client_admins' AND table_schema = 'public'
  ) THEN
    SELECT COUNT(*) INTO admin_count FROM public.client_admins;
    RAISE NOTICE '📊 FINAL STATUS:';
    RAISE NOTICE '   Clients: %', client_count;
    RAISE NOTICE '   Client Admins: %', admin_count;
    RAISE NOTICE '   Locations: %', location_count;
  ELSE
    RAISE NOTICE '📊 FINAL STATUS:';
    RAISE NOTICE '   Clients: %', client_count;
    RAISE NOTICE '   Client Admins: N/A (table does not exist)';
    RAISE NOTICE '   Locations: %', location_count;
  END IF;
END $$;

-- Show the created location (if any)
SELECT 
  l.id,
  l.name as location_name,
  c.name as client_name,
  l.address,
  l.city,
  l.state,
  l.is_active
FROM public.locations l
JOIN public.clients c ON l.client_id = c.id; 
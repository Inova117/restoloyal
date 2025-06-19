-- ============================================================================
-- 🔍 DIAGNOSTIC SCRIPT - Check Current Database Schema
-- This will show us exactly what tables and columns exist in your database
-- ============================================================================

-- 📊 STEP 1: Check which core tables exist
DO $$
BEGIN
  RAISE NOTICE '🔍 CHECKING EXISTING TABLES...';
END $$;

SELECT 
  'TABLE_EXISTS' as check_type,
  table_name,
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('clients', 'locations', 'customers', 'user_roles', 'location_staff', 'stamps', 'rewards')
GROUP BY table_name
ORDER BY table_name;

-- 📊 STEP 2: Check clients table structure
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='clients' AND table_schema='public') THEN
    RAISE NOTICE '🏢 CLIENTS TABLE COLUMNS:';
  END IF;
END $$;

SELECT 
  'CLIENTS_COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 📊 STEP 3: Check locations table structure  
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='locations' AND table_schema='public') THEN
    RAISE NOTICE '📍 LOCATIONS TABLE COLUMNS:';
  END IF;
END $$;

SELECT 
  'LOCATIONS_COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'locations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 📊 STEP 4: Check customers table structure
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='customers' AND table_schema='public') THEN
    RAISE NOTICE '👤 CUSTOMERS TABLE COLUMNS:';
  END IF;
END $$;

SELECT 
  'CUSTOMERS_COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'customers' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 📊 STEP 5: Check user_roles table structure
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_roles' AND table_schema='public') THEN
    RAISE NOTICE '👥 USER_ROLES TABLE COLUMNS:';
  END IF;
END $$;

SELECT 
  'USER_ROLES_COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_roles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 📊 STEP 6: Check location_staff table structure
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='location_staff' AND table_schema='public') THEN
    RAISE NOTICE '🏪 LOCATION_STAFF TABLE COLUMNS:';
  END IF;
END $$;

SELECT 
  'LOCATION_STAFF_COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'location_staff' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 📊 STEP 7: Check foreign key relationships
DO $$
BEGIN
  RAISE NOTICE '🔗 CHECKING FOREIGN KEY RELATIONSHIPS...';
END $$;

SELECT 
  'FOREIGN_KEYS' as check_type,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('clients', 'locations', 'customers', 'user_roles', 'location_staff')
ORDER BY tc.table_name, kcu.column_name;

-- 📊 STEP 8: Count existing data
DO $$
BEGIN
  RAISE NOTICE '📊 CHECKING EXISTING DATA COUNTS...';
END $$;

SELECT 
  'DATA_COUNTS' as check_type,
  'clients' as table_name,
  COUNT(*) as record_count
FROM public.clients
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='clients' AND table_schema='public')

UNION ALL

SELECT 
  'DATA_COUNTS',
  'locations',
  COUNT(*)
FROM public.locations  
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='locations' AND table_schema='public')

UNION ALL

SELECT 
  'DATA_COUNTS',
  'customers',
  COUNT(*)
FROM public.customers
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='customers' AND table_schema='public')

UNION ALL

SELECT 
  'DATA_COUNTS',
  'user_roles',
  COUNT(*)
FROM public.user_roles
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_roles' AND table_schema='public')

UNION ALL

SELECT 
  'DATA_COUNTS',
  'location_staff',
  COUNT(*)
FROM public.location_staff
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='location_staff' AND table_schema='public');

-- ✅ DIAGNOSTIC COMPLETE
DO $$
BEGIN
  RAISE NOTICE '✅ DIAGNOSTIC COMPLETE! Review the results above to see your current schema.';
END $$; 
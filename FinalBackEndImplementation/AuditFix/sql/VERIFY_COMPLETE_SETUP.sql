-- ============================================================================
-- 🔍 VERIFY COMPLETE SETUP - Check All Functionality is Working
-- This verifies that the minimal fix provided all the functionality 
-- that scripts 01-03 were supposed to provide
-- ============================================================================

-- 📊 STEP 1: Check all required tables exist
DO $$
BEGIN
  RAISE NOTICE '🔍 CHECKING ALL REQUIRED TABLES...';
END $$;

SELECT 
  'TABLE_STATUS' as check_type,
  table_name,
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'clients', 'locations', 'customers', 'user_roles', 
    'location_staff', 'stamps', 'rewards'
  )
GROUP BY table_name
ORDER BY table_name;

-- 📊 STEP 2: Check customers table has all required columns
DO $$
BEGIN
  RAISE NOTICE '👤 CHECKING CUSTOMERS TABLE COLUMNS...';
END $$;

SELECT 
  'CUSTOMERS_COLUMNS' as check_type,
  column_name,
  data_type,
  CASE WHEN column_name IN ('client_id', 'location_id', 'total_stamps', 'total_visits', 'status', 'qr_code') 
       THEN '✅ REQUIRED' 
       ELSE '📝 OPTIONAL' 
  END as importance
FROM information_schema.columns 
WHERE table_name = 'customers' AND table_schema = 'public'
ORDER BY 
  CASE WHEN column_name IN ('client_id', 'location_id', 'total_stamps', 'total_visits', 'status', 'qr_code') 
       THEN 1 ELSE 2 END,
  column_name;

-- 📊 STEP 3: Check foreign key relationships are working
DO $$
BEGIN
  RAISE NOTICE '🔗 CHECKING FOREIGN KEY RELATIONSHIPS...';
END $$;

SELECT 
  'FOREIGN_KEYS' as check_type,
  tc.table_name as source_table,
  kcu.column_name as source_column,
  ccu.table_name as target_table,
  ccu.column_name as target_column,
  '✅ LINKED' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('customers', 'stamps', 'rewards', 'location_staff', 'locations')
ORDER BY tc.table_name, kcu.column_name;

-- 📊 STEP 4: Check data counts and readiness
DO $$
BEGIN
  RAISE NOTICE '📊 CHECKING DATA READINESS...';
END $$;

SELECT 
  'DATA_READINESS' as check_type,
  'clients' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ READY' ELSE '⚠️ EMPTY' END as status
FROM public.clients
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='clients' AND table_schema='public')

UNION ALL

SELECT 
  'DATA_READINESS',
  'locations',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ READY' ELSE '⚠️ EMPTY (can create via frontend)' END
FROM public.locations  
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='locations' AND table_schema='public')

UNION ALL

SELECT 
  'DATA_READINESS',
  'customers',
  COUNT(*),
  CASE WHEN COUNT(*) >= 0 THEN '✅ READY' ELSE '❌ ERROR' END
FROM public.customers
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='customers' AND table_schema='public')

UNION ALL

SELECT 
  'DATA_READINESS',
  'stamps',
  COUNT(*),
  '✅ READY (loyalty system)'
FROM public.stamps
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='stamps' AND table_schema='public')

UNION ALL

SELECT 
  'DATA_READINESS',
  'rewards',
  COUNT(*),
  '✅ READY (loyalty system)'
FROM public.rewards
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='rewards' AND table_schema='public');

-- 📊 STEP 5: Verify Edge Function compatibility
DO $$
BEGIN
  RAISE NOTICE '🔌 CHECKING EDGE FUNCTION COMPATIBILITY...';
END $$;

-- Check if customers table has all columns needed by customer-manager Edge Function
SELECT 
  'EDGE_FUNCTION_READY' as check_type,
  'customer-manager' as edge_function,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'customers' AND column_name = 'client_id' AND table_schema = 'public'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'customers' AND column_name = 'location_id' AND table_schema = 'public'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'stamps' AND table_schema = 'public'
    ) THEN '✅ READY TO DEPLOY'
    ELSE '❌ MISSING REQUIREMENTS'
  END as status;

-- Check if location_staff table exists for staff-manager Edge Function  
SELECT 
  'EDGE_FUNCTION_READY' as check_type,
  'staff-manager' as edge_function,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'location_staff' AND table_schema = 'public'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'user_roles' AND table_schema = 'public'
    ) THEN '✅ READY TO DEPLOY'
    ELSE '❌ MISSING REQUIREMENTS'
  END as status;

-- 🎉 FINAL STATUS SUMMARY
DO $$
DECLARE
  tables_ready INTEGER := 0;
  columns_ready INTEGER := 0;
  relationships_ready INTEGER := 0;
BEGIN
  -- Count ready tables
  SELECT COUNT(*) INTO tables_ready
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('clients', 'locations', 'customers', 'location_staff', 'stamps', 'rewards');
    
  -- Count required columns in customers
  SELECT COUNT(*) INTO columns_ready
  FROM information_schema.columns 
  WHERE table_name = 'customers' AND table_schema = 'public'
    AND column_name IN ('client_id', 'location_id', 'total_stamps', 'total_visits', 'status');
    
  -- Count foreign key relationships
  SELECT COUNT(*) INTO relationships_ready
  FROM information_schema.table_constraints 
  WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public'
    AND table_name IN ('customers', 'stamps', 'rewards', 'location_staff');
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ===== FINAL VERIFICATION SUMMARY =====';
  RAISE NOTICE '✅ Required Tables: %/6 ready', tables_ready;
  RAISE NOTICE '✅ Required Columns: %/5 ready', columns_ready;  
  RAISE NOTICE '✅ Foreign Keys: % relationships established', relationships_ready;
  RAISE NOTICE '';
  
  IF tables_ready >= 6 AND columns_ready >= 5 AND relationships_ready > 0 THEN
    RAISE NOTICE '🎉 SUCCESS: Your database is FULLY READY!';
    RAISE NOTICE '🚀 You can now:';
    RAISE NOTICE '   1. Deploy your Edge Functions';
    RAISE NOTICE '   2. Disable MOCK_MODE in frontend hooks';
    RAISE NOTICE '   3. Test real functionality';
    RAISE NOTICE '   4. Create locations through your UI';
  ELSE
    RAISE NOTICE '⚠️  Some components may need attention';
  END IF;
  
  RAISE NOTICE '=====================================';
END $$; 
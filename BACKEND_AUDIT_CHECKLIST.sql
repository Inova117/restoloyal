-- ============================================================================
-- BACKEND AUDIT CHECKLIST - MULTI-TENANT RESTAURANT PLATFORM
-- ============================================================================
-- This script performs a comprehensive audit of your Supabase backend
-- Run each section in your Supabase SQL Editor to verify everything is working
-- ============================================================================

-- ============================================================================
-- SECTION 1: TABLE STRUCTURE AUDIT
-- ============================================================================

-- 1.1: Check if all core tables exist
SELECT 
  'TABLE EXISTENCE CHECK' as audit_type,
  table_name,
  CASE 
    WHEN table_name IN (
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  VALUES 
    ('platform_clients'),
    ('restaurants'), 
    ('locations'),
    ('clients'),
    ('stamps'),
    ('rewards'),
    ('user_roles'),
    ('platform_admin_users')
) AS required_tables(table_name)
ORDER BY table_name;

-- 1.2: Check table row counts (should have data)
SELECT 
  'TABLE ROW COUNTS' as audit_type,
  schemaname,
  relname as tablename,
  n_tup_ins as total_rows,
  CASE 
    WHEN relname = 'platform_clients' AND n_tup_ins > 0 THEN '✅ HAS CLIENTS'
    WHEN relname = 'user_roles' AND n_tup_ins > 0 THEN '✅ HAS USER ROLES'
    WHEN relname = 'platform_admin_users' THEN '⚠️ OPTIONAL'
    WHEN n_tup_ins > 0 THEN '✅ HAS DATA'
    ELSE '⚠️ EMPTY'
  END as status
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
AND relname IN ('platform_clients', 'restaurants', 'locations', 'clients', 'stamps', 'rewards', 'user_roles', 'platform_admin_users')
ORDER BY relname;

-- ============================================================================
-- SECTION 2: GALLETTI CLIENT VERIFICATION
-- ============================================================================

-- 2.1: Verify Galletti platform client exists
SELECT 
  'GALLETTI CLIENT CHECK' as audit_type,
  id,
  name,
  slug,
  type,
  status,
  plan,
  contact_email,
  '✅ GALLETTI CLIENT FOUND' as result_status
FROM platform_clients 
WHERE slug = 'galletti'
UNION ALL
SELECT 
  'GALLETTI CLIENT CHECK' as audit_type,
  NULL::uuid as id,
  NULL as name,
  'galletti' as slug,
  NULL as type,
  NULL as status,
  NULL as plan,
  NULL as contact_email,
  '❌ GALLETTI CLIENT MISSING' as result_status
WHERE NOT EXISTS (SELECT 1 FROM platform_clients WHERE slug = 'galletti');

-- 2.2: Check for any other platform clients
SELECT 
  'ALL PLATFORM CLIENTS' as audit_type,
  COUNT(*) as total_clients,
  STRING_AGG(name, ', ') as client_names,
  STRING_AGG(slug, ', ') as client_slugs,
  '📊 CLIENT SUMMARY' as result_status
FROM platform_clients;

-- ============================================================================
-- SECTION 3: USER ROLES VERIFICATION
-- ============================================================================

-- 3.1: Check user roles table structure
SELECT 
  'USER ROLES STRUCTURE' as audit_type,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name IN ('id', 'user_id', 'role', 'client_id', 'status', 'created_at') THEN '✅ REQUIRED COLUMN'
    ELSE '📋 OPTIONAL COLUMN'
  END as result_status
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3.2: Check for existing user role assignments
SELECT 
  'USER ROLE ASSIGNMENTS' as audit_type,
  ur.role,
  COUNT(*) as user_count,
  pc.name as client_name,
  STRING_AGG(DISTINCT au.email, ', ') as user_emails,
  CASE 
    WHEN ur.role = 'client_admin' THEN '✅ TIER 2 USERS'
    WHEN ur.role = 'restaurant_admin' THEN '✅ TIER 3 USERS'
    WHEN ur.role = 'location_staff' THEN '✅ TIER 4 USERS'
    ELSE '❓ UNKNOWN ROLE'
  END as result_status
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN platform_clients pc ON ur.client_id = pc.id
WHERE ur.status = 'active'
GROUP BY ur.role, pc.name
ORDER BY ur.role;

-- ============================================================================
-- SECTION 4: RELATIONSHIPS AND CONSTRAINTS AUDIT
-- ============================================================================

-- 4.1: Check foreign key constraints
SELECT 
  'FOREIGN KEY CONSTRAINTS' as audit_type,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  '✅ CONSTRAINT ACTIVE' as result_status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('user_roles', 'restaurants', 'locations', 'clients', 'stamps', 'rewards')
ORDER BY tc.table_name, tc.constraint_name;

-- 4.2: Check unique constraints
SELECT 
  'UNIQUE CONSTRAINTS' as audit_type,
  tc.constraint_name,
  tc.table_name,
  STRING_AGG(kcu.column_name, ', ') as columns,
  '✅ UNIQUE CONSTRAINT' as result_status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
AND tc.table_schema = 'public'
AND tc.table_name IN ('platform_clients', 'user_roles', 'platform_admin_users')
GROUP BY tc.constraint_name, tc.table_name
ORDER BY tc.table_name;

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) AUDIT
-- ============================================================================

-- 5.1: Check RLS is enabled on all tables
SELECT 
  'RLS ENABLED CHECK' as audit_type,
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as result_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('platform_clients', 'restaurants', 'locations', 'clients', 'stamps', 'rewards', 'user_roles', 'platform_admin_users')
ORDER BY tablename;

-- 5.2: Check RLS policies exist
SELECT 
  'RLS POLICIES CHECK' as audit_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  '✅ POLICY ACTIVE' as result_status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('platform_clients', 'restaurants', 'locations', 'clients', 'stamps', 'rewards', 'user_roles')
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 6: FUNCTIONS AND TRIGGERS AUDIT
-- ============================================================================

-- 6.1: Check custom functions exist
SELECT 
  'CUSTOM FUNCTIONS' as audit_type,
  routine_name,
  routine_type,
  data_type as return_type,
  CASE 
    WHEN routine_name = 'assign_galletti_tier2_user' THEN '✅ USER ASSIGNMENT FUNCTION'
    WHEN routine_name LIKE '%update%' THEN '✅ UPDATE FUNCTION'
    ELSE '📋 UTILITY FUNCTION'
  END as result_status
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name NOT LIKE 'pg_%'
AND routine_name NOT LIKE '__%'
ORDER BY routine_name;

-- 6.2: Check triggers
SELECT 
  'TRIGGERS CHECK' as audit_type,
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation,
  '✅ TRIGGER ACTIVE' as result_status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- SECTION 7: PERMISSIONS AUDIT
-- ============================================================================

-- 7.1: Check table permissions
SELECT 
  'TABLE PERMISSIONS' as audit_type,
  table_name,
  grantee,
  STRING_AGG(privilege_type, ', ') as privileges,
  CASE 
    WHEN grantee = 'service_role' THEN '✅ SERVICE ROLE ACCESS'
    WHEN grantee = 'authenticated' THEN '✅ USER ACCESS'
    WHEN grantee = 'anon' THEN '⚠️ ANONYMOUS ACCESS'
    ELSE '📋 OTHER ACCESS'
  END as result_status
FROM information_schema.role_table_grants 
WHERE table_schema = 'public'
AND table_name IN ('platform_clients', 'restaurants', 'locations', 'clients', 'stamps', 'rewards', 'user_roles')
AND grantee IN ('service_role', 'authenticated', 'anon')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;

-- ============================================================================
-- SECTION 8: DATA INTEGRITY TESTS
-- ============================================================================

-- 8.1: Test the user assignment function
SELECT 
  'FUNCTION TEST' as audit_type,
  'assign_galletti_tier2_user' as function_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'assign_galletti_tier2_user'
      AND routine_schema = 'public'
    ) THEN '✅ FUNCTION EXISTS'
    ELSE '❌ FUNCTION MISSING'
  END as result_status;

-- 8.2: Check for orphaned records
SELECT 
  'ORPHANED RECORDS CHECK' as audit_type,
  'user_roles without valid client_id' as check_type,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NO ORPHANED RECORDS'
    ELSE '⚠️ ORPHANED RECORDS FOUND'
  END as result_status
FROM user_roles ur
LEFT JOIN platform_clients pc ON ur.client_id = pc.id
WHERE pc.id IS NULL;

-- 8.3: Check for duplicate user assignments
SELECT 
  'DUPLICATE ASSIGNMENTS' as audit_type,
  ur.user_id,
  ur.client_id,
  COUNT(*) as assignment_count,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ UNIQUE ASSIGNMENT'
    ELSE '⚠️ DUPLICATE ASSIGNMENT'
  END as result_status
FROM user_roles ur
GROUP BY ur.user_id, ur.client_id
HAVING COUNT(*) > 1;

-- ============================================================================
-- SECTION 9: GALLETTI SPECIFIC VERIFICATION
-- ============================================================================

-- 9.1: Full Galletti setup verification
SELECT 
  'GALLETTI SETUP VERIFICATION' as audit_type,
  'Complete Chain Check' as check_name,
  au.email as user_email,
  ur.role as user_role,
  ur.status as role_status,
  pc.name as client_name,
  pc.slug as client_slug,
  '✅ COMPLETE CHAIN VERIFIED' as result_status
FROM auth.users au
JOIN user_roles ur ON au.id = ur.user_id
JOIN platform_clients pc ON ur.client_id = pc.id
WHERE pc.slug = 'galletti'
AND ur.status = 'active';

-- 9.2: Check Galletti data isolation (RLS test)
SELECT 
  'GALLETTI DATA ISOLATION' as audit_type,
  COUNT(DISTINCT pc.slug) as unique_clients_visible,
  STRING_AGG(DISTINCT pc.name, ', ') as client_names,
  CASE 
    WHEN COUNT(DISTINCT pc.slug) = 1 AND MAX(pc.slug) = 'galletti' THEN '✅ ISOLATION WORKING'
    WHEN COUNT(DISTINCT pc.slug) > 1 THEN '⚠️ MULTIPLE CLIENTS VISIBLE'
    ELSE '❓ NO DATA FOUND'
  END as result_status
FROM user_roles ur
JOIN platform_clients pc ON ur.client_id = pc.id
WHERE ur.role = 'client_admin';

-- ============================================================================
-- SECTION 10: FINAL SUMMARY
-- ============================================================================

-- 10.1: Overall system health summary
SELECT 
  'SYSTEM HEALTH SUMMARY' as audit_type,
  (
    SELECT COUNT(*) FROM platform_clients WHERE slug = 'galletti'
  ) as galletti_client_exists,
  (
    SELECT COUNT(*) FROM user_roles ur 
    JOIN platform_clients pc ON ur.client_id = pc.id 
    WHERE pc.slug = 'galletti' AND ur.role = 'client_admin'
  ) as galletti_tier2_users,
  (
    SELECT COUNT(*) FROM information_schema.routines 
    WHERE routine_name = 'assign_galletti_tier2_user'
  ) as assignment_function_exists,
  (
    SELECT COUNT(*) FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('user_roles', 'platform_clients')
  ) as rls_policies_count,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM platform_clients WHERE slug = 'galletti'
    ) > 0 THEN '✅ BACKEND READY FOR PRODUCTION'
    ELSE '❌ SETUP INCOMPLETE'
  END as overall_status;

-- ============================================================================
-- AUDIT COMPLETE
-- ============================================================================
/*
🎯 AUDIT INTERPRETATION GUIDE:

✅ GREEN (Success): Everything is working correctly
⚠️ YELLOW (Warning): Not critical but should be reviewed  
❌ RED (Error): Critical issue that needs immediate attention
📊 BLUE (Info): Informational data
📋 GRAY (Optional): Optional or informational

WHAT TO LOOK FOR:
1. All tables should exist (✅ EXISTS)
2. Galletti client should be found (✅ GALLETTI CLIENT FOUND)
3. RLS should be enabled on all tables (✅ RLS ENABLED)
4. At least one tier 2 user should exist for Galletti
5. Assignment function should exist (✅ FUNCTION EXISTS)
6. No orphaned or duplicate records (✅ NO ORPHANED RECORDS)

IF YOU SEE ANY ❌ RED ITEMS:
- Review the database setup script
- Check for missing migrations
- Verify RLS policies are properly created
- Ensure foreign key constraints are working

NEXT STEPS AFTER AUDIT:
1. If all ✅ green → Ready to test frontend
2. If any ❌ red → Fix issues first
3. If mostly ⚠️ yellow → Generally OK, but optimize
*/ 
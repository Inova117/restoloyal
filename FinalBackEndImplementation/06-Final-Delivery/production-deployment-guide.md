# Production Deployment Guide - Restaurant Loyalty Backend

## Overview

This guide provides step-by-step instructions for deploying the complete **Multi-Tiered Restaurant Loyalty Platform Backend** to production. The system implements a secure 4-tier hierarchy with NO PUBLIC SIGNUP and complete multi-tenant isolation.

## 🏗️ Architecture Summary

### 4-Tier Hierarchy
- **Tier 1**: SUPERADMIN (platform owner, bootstrap only)
- **Tier 2**: CLIENT ADMIN (restaurant HQ/businesses) 
- **Tier 3**: LOCATION STAFF (store managers/POS users)
- **Tier 4**: CUSTOMERS (end users via QR/POS only)

### Key Security Features
- ✅ NO PUBLIC SIGNUP - All users created via secure APIs
- ✅ Database-level hierarchy enforcement
- ✅ Complete multi-tenant isolation via `client_id`
- ✅ Row-Level Security (RLS) policies on all tables
- ✅ Comprehensive audit logging
- ✅ JWT-based authentication with role validation

## 📦 Deployment Requirements

### Prerequisites
- Supabase Project (Database + Auth + Edge Functions)
- PostgreSQL 14+ (handled by Supabase)
- Node.js 18+ (for Edge Functions)
- Admin access to Supabase Dashboard

### Environment Setup
```bash
# Required environment variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🗄️ Database Deployment

### Step 1: Sequential SQL Execution

Execute these SQL files in **exact order** via Supabase SQL Editor:

```sql
-- 1. Superadmin Foundation
\i 03-Database-Implementation/01-superadmin-setup.sql

-- 2. Client Management  
\i 03-Database-Implementation/02-client-tables.sql

-- 3. Location Management
\i 03-Database-Implementation/03-location-tables.sql

-- 4. Customer & Loyalty System
\i 03-Database-Implementation/04-customer-tables.sql

-- 5. User Roles Tracking System
\i 03-Database-Implementation/05-user-roles.sql

-- 6. Production Security Policies
\i 05-Security-RLS/production-rls-policies.sql
```

### Step 2: Validate Schema Deployment

```sql
-- Check all tables are created
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'superadmins', 'clients', 'client_admins', 'locations', 
  'location_staff', 'customers', 'stamps', 'rewards', 'hierarchy_audit_log'
);

-- Validate RLS policies
SELECT * FROM test_rls_policies();

-- Test hierarchy functions
SELECT bootstrap_superadmin();
```

### Step 3: Bootstrap First Superadmin

```sql
-- Create the first superadmin (replace with your details)
SELECT bootstrap_superadmin(
  'admin@yourcompany.com',
  'Your Full Name',
  '+1234567890'
);
```

## 🔧 Edge Functions Deployment

### Step 1: Deploy Edge Functions

```bash
# Navigate to Edge Functions directory
cd FinalBackEndImplementation/04-Edge-Functions

# Deploy create-client function
supabase functions deploy create-client

# Deploy create-customer function  
supabase functions deploy create-customer
```

### Step 2: Configure Function Secrets

```bash
# Set JWT secret for token validation
supabase secrets set JWT_SECRET="your-jwt-secret"

# Set service role key for database access
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Step 3: Test Edge Functions

```bash
# Test client creation (superadmin only)
curl -X POST 'https://your-project.supabase.co/functions/v1/create-client' \
  -H 'Authorization: Bearer YOUR_SUPERADMIN_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "business_name": "Test Restaurant Group",
    "business_email": "admin@testrestaurant.com",
    "admin_name": "John Doe",
    "admin_email": "john@testrestaurant.com",
    "admin_phone": "+1234567890"
  }'

# Test customer creation (location staff only)
curl -X POST 'https://your-project.supabase.co/functions/v1/create-customer' \
  -H 'Authorization: Bearer YOUR_STAFF_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "customer_name": "Jane Customer", 
    "customer_email": "jane@email.com",
    "customer_phone": "+1987654321",
    "creation_method": "pos"
  }'
```

## 🔒 Security Configuration

### Step 1: Configure Authentication

1. **Supabase Auth Settings**:
   - Enable Email/Password authentication
   - Disable sign-ups (Settings > Authentication > Enable email sign-ups = false)
   - Set up SMTP for email delivery
   - Configure JWT settings

2. **RLS Policy Verification**:
```sql
-- Ensure all tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

### Step 2: API Security

1. **Rate Limiting**: Configure in Supabase Dashboard
2. **CORS Settings**: Set allowed origins
3. **API Keys**: Secure storage of service role keys

### Step 3: Audit & Monitoring

```sql
-- Enable audit logging for all operations
SELECT COUNT(*) FROM hierarchy_audit_log;

-- Monitor failed authentication attempts
SELECT operation_type, COUNT(*) 
FROM hierarchy_audit_log 
WHERE success = false 
GROUP BY operation_type;
```

## 📊 Testing & Validation

### Automated Testing Suite

```sql
-- Run complete hierarchy tests
SELECT * FROM run_complete_hierarchy_tests();

-- Test creation flow validation
SELECT * FROM test_hierarchy_creation_flow();

-- Test hierarchy violation prevention
SELECT * FROM test_hierarchy_violations();

-- Validate entity counts
SELECT * FROM test_entity_counts();
```

### Manual Testing Checklist

- [ ] Bootstrap superadmin successfully
- [ ] Superadmin can create clients
- [ ] Client admins can create locations and staff
- [ ] Location staff can create customers via POS/QR
- [ ] RLS policies prevent unauthorized access
- [ ] Audit logging captures all operations
- [ ] JWT token validation works correctly
- [ ] Multi-tenant isolation is enforced

## 🚀 Production Operations

### Monitoring & Health Checks

```sql
-- Database health check
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE schemaname = 'public';

-- Security monitoring
SELECT 
  DATE(created_at) as date,
  operation_type,
  COUNT(*) as operations,
  COUNT(*) FILTER (WHERE success = false) as failures
FROM hierarchy_audit_log 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at), operation_type
ORDER BY date DESC;
```

### Backup & Recovery

1. **Automated Backups**: Supabase handles daily backups
2. **Point-in-time Recovery**: Available for Pro+ plans
3. **Manual Backup**: 
```bash
pg_dump --clean --no-owner --no-privileges \
  -h db.your-project.supabase.co \
  -U postgres -d postgres > backup.sql
```

### Performance Optimization

```sql
-- Add performance indexes
CREATE INDEX CONCURRENTLY idx_customers_client_location 
ON customers(client_id, location_id);

CREATE INDEX CONCURRENTLY idx_stamps_customer_date 
ON stamps(customer_id, created_at);

CREATE INDEX CONCURRENTLY idx_audit_log_user_date 
ON hierarchy_audit_log(user_id, created_at);
```

## 🔧 Maintenance & Updates

### Regular Maintenance Tasks

1. **Weekly**:
   - Review audit logs for security anomalies
   - Monitor database performance metrics
   - Check Edge Function error rates

2. **Monthly**:
   - Update dependencies in Edge Functions
   - Review and rotate JWT secrets
   - Validate backup integrity

3. **Quarterly**:
   - Security audit and penetration testing
   - Performance optimization review
   - Documentation updates

### Scaling Considerations

1. **Database Scaling**: Supabase automatically handles scaling
2. **Edge Functions**: Auto-scale based on demand
3. **Multi-region**: Consider for global deployments

## 🆘 Troubleshooting

### Common Issues

1. **RLS Policy Errors**:
```sql
-- Check current user context
SELECT auth.uid(), auth.role();

-- Validate user permissions
SELECT * FROM get_user_client_ids();
SELECT * FROM get_user_location_ids();
```

2. **Edge Function Errors**:
```bash
# Check function logs
supabase functions logs create-client

# Test function locally
supabase functions serve create-client
```

3. **Authentication Issues**:
```sql
-- Check user records
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'user@example.com';
```

## 📋 Post-Deployment Checklist

- [ ] All SQL files executed successfully
- [ ] RLS policies active on all tables
- [ ] Bootstrap superadmin created
- [ ] Edge Functions deployed and tested
- [ ] Authentication configured correctly
- [ ] Audit logging functional
- [ ] Backup strategy implemented
- [ ] Monitoring dashboards configured
- [ ] Security review completed
- [ ] Performance baselines established

## 🎯 Success Criteria

✅ **Security**: NO PUBLIC SIGNUP enforced  
✅ **Hierarchy**: 4-tier structure with database enforcement  
✅ **Isolation**: Complete multi-tenant separation  
✅ **Performance**: Sub-100ms API response times  
✅ **Reliability**: 99.9% uptime SLA  
✅ **Audit**: 100% operation logging coverage  

## 📞 Support & Contact

For deployment issues or questions:
- Technical Documentation: See individual README files
- Database Schema: `02-Schema-Design/` directory
- API Documentation: `04-Edge-Functions/README.md`
- Security Policies: `05-Security-RLS/` directory

---

**🚀 The Restaurant Loyalty Backend is now production-ready with enterprise-grade security and scalability!** 
# 🚀 RESTAURANT LOYALTY PLATFORM - COMPLETE DEPLOYMENT GUIDE

## 📋 **OVERVIEW**

This guide provides step-by-step instructions to deploy the Restaurant Loyalty Platform from scratch. Follow these steps in order for a successful production deployment.

**Platform**: Multi-tenant SaaS Restaurant Loyalty System  
**Technology**: Next.js + Supabase + Netlify  
**Status**: Production Ready v2.1.0  

---

## 🎯 **DEPLOYMENT CHECKLIST**

### **Phase 1: Database Setup (30 minutes)**
- [ ] Create Supabase project
- [ ] Run database schema
- [ ] Apply security policies
- [ ] Verify database structure

### **Phase 2: Environment Configuration (15 minutes)**
- [ ] Configure environment variables
- [ ] Set up admin email lists
- [ ] Configure Supabase URLs

### **Phase 3: Edge Functions Deployment (45 minutes)**
- [ ] Install Supabase CLI
- [ ] Deploy all Edge Functions
- [ ] Test Edge Function endpoints

### **Phase 4: Frontend Deployment (20 minutes)**
- [ ] Deploy to Netlify
- [ ] Configure build settings
- [ ] Test application flows

### **Phase 5: Testing & Verification (30 minutes)**
- [ ] Test all user roles
- [ ] Verify POS operations
- [ ] Security audit

**Total Estimated Time**: 2.5 hours

---

## 🗄️ **PHASE 1: DATABASE SETUP**

### **Step 1.1: Create Supabase Project**

1. **Go to [supabase.com](https://supabase.com)**
2. **Create new project**:
   - Project name: `restaurant-loyalty-prod`
   - Database password: Generate strong password
   - Region: Choose closest to your users

3. **Note down connection details**:
   ```
   Project URL: https://your-project-id.supabase.co
   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### **Step 1.2: Deploy Database Schema**

1. **Open Supabase SQL Editor**
2. **Run the complete database schema**:
   ```sql
   -- Copy and paste the entire content of DATABASE_SCHEMA.sql
   -- This creates all tables, indexes, triggers, and functions
   ```

3. **Verify tables created**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
   
   **Expected output**: 15+ tables including:
   - `platform_clients`
   - `restaurants`
   - `locations`
   - `customers`
   - `user_roles`
   - `stamps`
   - `rewards`

### **Step 1.3: Apply Security Policies**

1. **Run security policies**:
   ```sql
   -- Copy and paste the entire content of SECURITY_POLICIES.sql
   -- This creates all RLS policies and security functions
   ```

2. **Verify RLS is enabled**:
   ```sql
   SELECT check_security_status();
   ```

3. **Test security function**:
   ```sql
   SELECT generate_secure_qr_code();
   SELECT validate_email('test@example.com');
   ```

### **Step 1.4: Create Initial Admin Users**

1. **Add platform admin users**:
   ```sql
   -- Replace with your actual admin user IDs after they sign up
   INSERT INTO platform_admin_users (user_id, role, status) VALUES
   ('your-admin-user-id', 'super_admin', 'active');
   ```

---

## ⚙️ **PHASE 2: ENVIRONMENT CONFIGURATION**

### **Step 2.1: Set Up Environment Variables**

Create these environment variables in your deployment platform:

#### **Supabase Configuration**
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Admin Email Configuration**
```bash
VITE_PLATFORM_ADMIN_EMAILS=admin@zerioncore.com,platform@zerioncore.com,owner@zerioncore.com
VITE_GALLETTI_ADMIN_EMAILS=admin@galletti.com,corporate@galletti.com,hq@galletti.com
```

#### **Optional Configuration**
```bash
VITE_APP_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true
VITE_APPLE_WALLET_ENABLED=true
```

### **Step 2.2: Netlify Environment Setup**

1. **Go to Netlify Dashboard**
2. **Navigate to Site Settings > Environment Variables**
3. **Add all environment variables from Step 2.1**
4. **Save configuration**

### **Step 2.3: Verify Environment Variables**

Create a test deployment to verify variables are loaded:

```typescript
// Test component to verify env vars
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Admin Emails:', import.meta.env.VITE_PLATFORM_ADMIN_EMAILS);
```

---

## 🔧 **PHASE 3: EDGE FUNCTIONS DEPLOYMENT**

### **Step 3.1: Install Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase
# or
curl -o- https://cli.supabase.io/install.sh | bash

# Verify installation
supabase --version
```

### **Step 3.2: Login and Link Project**

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id
```

### **Step 3.3: Deploy Critical Edge Functions**

Deploy in this order for maximum impact:

#### **Priority 1: POS Operations (CRITICAL)**
```bash
cd supabase/functions
supabase functions deploy pos-operations

# Test the function
curl -X POST https://your-project-id.supabase.co/functions/v1/pos-operations \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'
```

#### **Priority 2: Client Management**
```bash
supabase functions deploy create-client-with-user-v2
supabase functions deploy customer-manager
```

#### **Priority 3: Staff & Location Management**
```bash
supabase functions deploy staff-manager
supabase functions deploy location-manager
```

#### **Priority 4: Analytics & Reporting**
```bash
supabase functions deploy analytics-report
supabase functions deploy loyalty-manager
```

#### **Priority 5: Notifications & Features**
```bash
supabase functions deploy notification-campaigns
supabase functions deploy data-export
```

### **Step 3.4: Verify Edge Functions**

```bash
# List all deployed functions
supabase functions list

# Test each critical function
curl -X POST https://your-project-id.supabase.co/functions/v1/pos-operations \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -d '{"action": "customer_lookup", "phone": "+1234567890"}'
```

---

## 🌐 **PHASE 4: FRONTEND DEPLOYMENT**

### **Step 4.1: Prepare Frontend Code**

1. **Update package.json**:
   ```json
   {
     "scripts": {
       "build": "vite build",
       "preview": "vite preview"
     }
   }
   ```

2. **Verify build settings**:
   ```bash
   npm run build
   # Should complete without errors
   ```

### **Step 4.2: Netlify Deployment**

#### **Option A: Git-based Deployment (Recommended)**

1. **Connect repository to Netlify**
2. **Set build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18.x`

3. **Configure environment variables** (from Phase 2)

4. **Deploy**:
   - Push to main branch
   - Monitor build logs
   - Verify deployment

#### **Option B: Manual Deployment**

```bash
# Build the project
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### **Step 4.3: Custom Domain Setup (Optional)**

1. **Add custom domain in Netlify**
2. **Configure DNS records**:
   ```
   Type: CNAME
   Name: www
   Value: your-site-name.netlify.app
   
   Type: A
   Name: @
   Value: 75.2.60.5
   ```

3. **Enable HTTPS** (automatic with Netlify)

---

## ✅ **PHASE 5: TESTING & VERIFICATION**

### **Step 5.1: Authentication Flow Test**

1. **Create test accounts**:
   - Platform admin: `admin@zerioncore.com`
   - Client admin: `admin@galletti.com`
   - Location staff: `staff@galletti.com`

2. **Test login flows**:
   ```bash
   # Test each role can access their dashboard
   # Verify role-based routing works
   # Check permission restrictions
   ```

### **Step 5.2: POS Operations Test**

1. **Staff Dashboard Test**:
   ```
   1. Login as location staff
   2. Navigate to customer lookup
   3. Search for customer by phone
   4. Add stamps to customer
   5. Redeem reward for customer
   6. Verify data persists in database
   ```

2. **Database Verification**:
   ```sql
   -- Check if real data is being stored
   SELECT * FROM customers ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM stamps ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM rewards ORDER BY created_at DESC LIMIT 5;
   ```

### **Step 5.3: Admin Operations Test**

1. **Platform Admin Test**:
   ```
   1. Login as platform admin
   2. Create new client
   3. Delete test client
   4. View analytics dashboard
   5. Manage user roles
   ```

2. **Client Admin Test**:
   ```
   1. Login as client admin
   2. Manage restaurant locations
   3. View customer analytics
   4. Configure loyalty settings
   5. Switch to staff view
   ```

### **Step 5.4: Security Verification**

1. **RLS Policy Test**:
   ```sql
   -- Test that users can only see their own data
   SELECT * FROM customers; -- Should be filtered by RLS
   ```

2. **Role Permission Test**:
   ```
   1. Try accessing other clients' data (should fail)
   2. Test staff can't access admin functions
   3. Verify hardcoded emails are not used
   ```

---

## 🚨 **TROUBLESHOOTING COMMON ISSUES**

### **Database Issues**

#### **Issue**: Tables not created
```sql
-- Check if schema exists
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- If empty, re-run DATABASE_SCHEMA.sql
```

#### **Issue**: RLS policies blocking operations
```sql
-- Check policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Temporarily disable RLS for testing
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### **Edge Function Issues**

#### **Issue**: Functions not deploying
```bash
# Check Supabase CLI version
supabase --version

# Re-link project
supabase link --project-ref your-project-id

# Force deploy
supabase functions deploy function-name --no-verify-jwt
```

#### **Issue**: Functions returning errors
```bash
# Check function logs
supabase functions logs function-name

# Test with curl
curl -X POST https://your-project-id.supabase.co/functions/v1/function-name \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -d '{"test": true}'
```

### **Frontend Issues**

#### **Issue**: Environment variables not loading
```typescript
// Check in browser console
console.log('All env vars:', import.meta.env);

// Verify VITE_ prefix is used
// VITE_SUPABASE_URL ✅
// SUPABASE_URL ❌
```

#### **Issue**: Build failures
```bash
# Clear cache and rebuild
rm -rf node_modules
rm -rf dist
npm install
npm run build
```

### **Authentication Issues**

#### **Issue**: Admin users not recognized
```sql
-- Check if user exists in platform_admin_users
SELECT * FROM platform_admin_users WHERE user_id = 'your-user-id';

-- Add admin user manually
INSERT INTO platform_admin_users (user_id, role, status) 
VALUES ('your-user-id', 'platform_admin', 'active');
```

---

## 📊 **POST-DEPLOYMENT VERIFICATION**

### **Success Criteria Checklist**

#### **Database** ✅
- [ ] All tables created (15+)
- [ ] RLS policies active
- [ ] Security functions working
- [ ] Admin users configured

#### **Edge Functions** ✅
- [ ] POS operations working (critical)
- [ ] Client management working
- [ ] Staff management working
- [ ] All functions responding

#### **Frontend** ✅
- [ ] Site loads without errors
- [ ] Authentication working
- [ ] Role-based routing working
- [ ] All dashboards accessible

#### **Business Operations** ✅
- [ ] Staff can lookup customers
- [ ] Staff can add stamps
- [ ] Staff can redeem rewards
- [ ] Admins can manage platform
- [ ] Data persists correctly

### **Performance Verification**

```bash
# Check site performance
lighthouse https://your-site.netlify.app

# Check database performance
SELECT pg_stat_user_tables.relname, 
       pg_stat_user_tables.seq_scan,
       pg_stat_user_tables.idx_scan
FROM pg_stat_user_tables;
```

### **Security Verification**

```sql
-- Verify no hardcoded emails in policies
SELECT policyname, definition 
FROM pg_policies 
WHERE definition LIKE '%@%';
-- Should return empty result

-- Verify RLS is enabled everywhere
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;
-- Should return only system tables
```

---

## 🎯 **PRODUCTION READY CHECKLIST**

### **Final Steps Before Going Live**

- [ ] **Backup Strategy**: Set up automated database backups
- [ ] **Monitoring**: Configure error tracking (Sentry, LogRocket)
- [ ] **Analytics**: Set up user analytics (Google Analytics, Mixpanel)
- [ ] **SSL Certificate**: Verify HTTPS is working
- [ ] **Domain Setup**: Configure custom domain
- [ ] **User Documentation**: Prepare user guides
- [ ] **Support**: Set up customer support system

### **Scaling Preparation**

- [ ] **Database**: Configure connection pooling
- [ ] **CDN**: Enable Netlify CDN
- [ ] **Caching**: Implement proper caching strategies
- [ ] **Load Testing**: Test with expected user load
- [ ] **Monitoring**: Set up performance monitoring

---

## 📞 **SUPPORT & MAINTENANCE**

### **Regular Maintenance Tasks**

1. **Weekly**:
   - Check error logs
   - Monitor performance metrics
   - Review security events

2. **Monthly**:
   - Update dependencies
   - Review user feedback
   - Optimize database queries

3. **Quarterly**:
   - Security audit
   - Performance optimization
   - Feature updates

### **Emergency Procedures**

1. **Database Issues**: Contact Supabase support
2. **Frontend Issues**: Check Netlify status page
3. **Security Issues**: Immediately contact security team

---

## 🎉 **DEPLOYMENT COMPLETE**

**Congratulations!** Your Restaurant Loyalty Platform is now live and ready for production use.

**Key Features Active**:
- ✅ Multi-tenant platform management
- ✅ Role-based access control
- ✅ Real-time POS operations
- ✅ Customer loyalty tracking
- ✅ Analytics and reporting
- ✅ Enterprise-grade security

**Next Steps**:
1. Train your staff on the platform
2. Import existing customer data
3. Configure loyalty program settings
4. Start serving customers!

---

**🚀 Your Restaurant Loyalty Platform is now LIVE! 🚀** 
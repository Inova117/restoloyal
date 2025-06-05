# 🔍 **AUDIT EXECUTION GUIDE** - Restaurant Loyalty Platform

## **🚀 QUICK START - Execute This Audit in 2 Hours**

### **Prerequisites Checklist**
- [ ] **Environment Setup**: Copy `env.example` to `.env` and configure
- [ ] **Database Access**: Supabase project running and accessible
- [ ] **Admin Access**: Can access Supabase dashboard
- [ ] **Browser Tools**: Chrome/Firefox with DevTools ready
- [ ] **Testing Checklist**: Have `docs/PRODUCTION_TESTING_CHECKLIST.md` open

---

## **⚡ PHASE 1: ENVIRONMENT SETUP (15 minutes)**

### **Step 1.1: Configure Environment**
```bash
# 1. Copy environment template
cp env.example .env

# 2. Edit .env with your Supabase credentials
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
```

**Required Environment Variables:**
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### **Step 1.2: Install Dependencies & Start Application**
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

**✅ Verification:** Application loads at `http://localhost:5173`

### **Step 1.3: Database Security Check**
Open Supabase SQL Editor and run:
```sql
-- Check if security functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('encrypt_sensitive_data', 'decrypt_sensitive_data', 'hash_sensitive_data', 'verify_hashed_data');
```

**Expected Result:** All 4 functions should exist. If not, run `sql/SIMPLE_ENCRYPTION_FIX.sql` first.

---

## **⚡ PHASE 2: TIER 1 - DATABASE FOUNDATION (20 minutes)**

### **Step 2.1: Database Schema Verification**
```sql
-- Check critical tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'platform_clients', 'restaurants', 'locations', 'customers', 
  'user_roles', 'platform_admin_users', 'stamps', 'rewards'
);
```

**✅ Mark in Checklist:** Update "Database Schema Tests" section

### **Step 2.2: Test Encryption Functions**
```sql
-- Test encryption/decryption
SELECT encrypt_sensitive_data('test_data') AS encrypted;
-- Copy the result, then test decryption:
SELECT decrypt_sensitive_data('YOUR_ENCRYPTED_RESULT') AS decrypted;

-- Test password hashing
SELECT hash_sensitive_data('test_password') AS hashed;
-- Copy the result, then test verification:
SELECT verify_hashed_data('test_password', 'YOUR_HASHED_RESULT') AS verified;
```

**✅ Mark in Checklist:** Update "Encryption Functions" section

### **Step 2.3: RLS Policy Security Check**
```sql
-- Check for dangerous policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE with_check = 'true' OR qual LIKE '%true%';
```

**🚨 Critical:** If you see `WITH CHECK (true)` policies, these are security vulnerabilities!

---

## **⚡ PHASE 3: TIER 2 - AUTHENTICATION SETUP (25 minutes)**

### **Step 3.1: Create Super Admin User**

**Option A: Via Supabase Dashboard**
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Email: `admin@zerioncore.com`
4. Password: `SecureAdmin123!`
5. Confirm via email (check spam folder)

**Option B: Via SQL (if email confirmation disabled)**
```sql
-- Insert into auth.users (requires service role)
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'admin@zerioncore.com',
  crypt('SecureAdmin123!', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Add to platform admin users
INSERT INTO platform_admin_users (user_id, role, permissions)
SELECT id, 'super_admin', '["all"]'::jsonb
FROM auth.users 
WHERE email = 'admin@zerioncore.com';
```

### **Step 3.2: Test Super Admin Login**
1. Open application: `http://localhost:5173`
2. Navigate to login page
3. Login with: `admin@zerioncore.com` / `SecureAdmin123!`
4. **Expected:** Should see platform admin dashboard

**✅ Mark in Checklist:** Update "User Creation & Login" section

### **Step 3.3: Verify Role Detection**
Check browser console for:
```javascript
// Should see user role information
console.log("User role:", userRole);
```

---

## **⚡ PHASE 4: TIER 3 - PLATFORM MANAGEMENT (30 minutes)**

### **Step 4.1: Test Client Creation**
1. **As Super Admin:** Navigate to Platform Management
2. Click "Create New Client"
3. Fill form:
   - Name: "Test Restaurant Group"
   - Contact Email: "contact@testgroup.com"
   - Phone: "+1-555-0123"
   - Plan: "Business"
4. **Expected:** Client appears in platform dashboard

### **Step 4.2: Create Client Admin User**
1. In Platform Management → Select "Test Restaurant Group"
2. Click "Add Admin User"
3. Fill form:
   - Email: `admin@testgroup.com`
   - Password: `ClientAdmin123!`
   - Role: "Client Admin"
4. **Expected:** User created and can login

### **Step 4.3: Test Client Admin Access**
1. **Logout** from super admin
2. **Login** as: `admin@testgroup.com` / `ClientAdmin123!`
3. **Expected:** Should see only "Test Restaurant Group" data
4. **Security Test:** Try accessing other clients' data (should be blocked)

**✅ Mark in Checklist:** Update "Platform Management" section

---

## **⚡ PHASE 5: TIER 4 - CLIENT OPERATIONS (25 minutes)**

### **Step 5.1: Create Restaurant/Location**
**As Client Admin:**
1. Navigate to "Locations" or "Restaurants"
2. Click "Add New Location"
3. Fill form:
   - Name: "Test Restaurant - Downtown"
   - Address: "123 Main St, City, State 12345"
   - Phone: "+1-555-0199"
4. **Expected:** Location appears in client dashboard

### **Step 5.2: Add Location Staff**
1. Select "Test Restaurant - Downtown"
2. Click "Add Staff Member"
3. Fill form:
   - Email: `staff@downtown.com`
   - Password: `StaffUser123!`
   - Permissions: Check "Add Stamps" and "Redeem Rewards"
4. **Expected:** Staff user created

### **Step 5.3: Test Staff Access**
1. **Logout** from client admin
2. **Login** as: `staff@downtown.com` / `StaffUser123!`
3. **Expected:** Should see POS interface for Downtown location only
4. **Security Test:** Try accessing other locations (should be blocked)

**✅ Mark in Checklist:** Update "Client Management" section

---

## **⚡ PHASE 6: TIER 5 - POS OPERATIONS (20 minutes)**

### **Step 6.1: Register Customer**
**As Location Staff:**
1. Navigate to POS interface
2. Click "Register New Customer"
3. Fill form:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Phone: "+1-555-0111"
4. **Expected:** Customer created with QR code

### **Step 6.2: Add Stamps**
1. Search for "John Doe"
2. Click "Add Stamps"
3. Enter:
   - Number of stamps: 3
   - Purchase amount: $25.99
4. **Expected:** Customer stamp count increases to 3

### **Step 6.3: Test Reward Redemption**
1. Add more stamps to reach reward threshold (usually 10)
2. Click "Redeem Reward"
3. **Expected:** Stamp count resets, redemption logged

**✅ Mark in Checklist:** Update "POS Operations" section

---

## **⚡ PHASE 7: SECURITY TESTING (15 minutes)**

### **Step 7.1: Access Control Tests**
**Test unauthorized access:**
```bash
# Try accessing admin URLs without login
curl -X GET "http://localhost:5173/platform-admin"
# Expected: Redirect to login

# Try API calls without auth
curl -X POST "http://localhost:5173/api/customers" \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'
# Expected: 401 Unauthorized
```

### **Step 7.2: Data Protection Check**
1. **Open Browser DevTools** → Network tab
2. Perform customer registration
3. **Check network requests:** No sensitive data in URLs or unencrypted payloads
4. **Check database:** Verify sensitive data is encrypted

### **Step 7.3: Cross-Tenant Security**
1. **As staff user:** Try to access other locations' customers
2. **As client admin:** Try to access other clients' data
3. **Expected:** All attempts should be blocked

**✅ Mark in Checklist:** Update "Security Testing" section

---

## **⚡ PHASE 8: END-TO-END FLOW (10 minutes)**

### **Complete Customer Journey Test**
1. **Register customer** (as staff)
2. **Add stamps** over multiple visits
3. **Redeem reward** when eligible
4. **Check analytics** (as client admin)
5. **Verify platform analytics** (as super admin)

**Expected:** Data flows correctly through all tiers

---

## **🔍 CRITICAL ISSUES TO WATCH FOR**

### **🚨 SECURITY RED FLAGS**
- [ ] **Encryption not working** → Run `sql/SIMPLE_ENCRYPTION_FIX.sql`
- [ ] **Cross-tenant data access** → Check RLS policies
- [ ] **Sensitive data in browser console** → Review frontend code
- [ ] **API calls without authentication** → Check middleware

### **⚠️ FUNCTIONAL ISSUES**
- [ ] **Users can't login** → Check auth configuration
- [ ] **Role detection fails** → Check user_roles table
- [ ] **Data not saving** → Check database permissions
- [ ] **UI not loading** → Check environment variables

### **📊 PERFORMANCE CONCERNS**
- [ ] **Slow page loads** → Check database indexes
- [ ] **API timeouts** → Check Edge Function performance
- [ ] **Memory leaks** → Check browser performance tab

---

## **📋 AUDIT COMPLETION CHECKLIST**

### **Before Marking "PRODUCTION READY":**
- [ ] **All Tier 1-5 tests pass** (✅ in checklist)
- [ ] **No critical security issues** found
- [ ] **End-to-end customer journey** works
- [ ] **All user roles** function correctly
- [ ] **Data isolation** between tenants verified
- [ ] **Error handling** works properly
- [ ] **Performance** is acceptable

### **If Issues Found:**
1. **Document in checklist** with specific error details
2. **Prioritize by severity:** Critical → High → Medium → Low
3. **Fix critical issues** before production deployment
4. **Re-test** after fixes applied

---

## **🚀 QUICK COMMANDS REFERENCE**

```bash
# Start audit
npm run dev

# Check database
supabase db status

# Run security fix
# (Copy/paste sql/SIMPLE_ENCRYPTION_FIX.sql in Supabase SQL Editor)

# Check logs
supabase functions logs

# Deploy fixes
supabase db push
```

---

## **📞 TROUBLESHOOTING**

### **Common Issues:**

**"Cannot connect to database"**
→ Check `.env` file has correct Supabase URL and keys

**"Function does not exist"**
→ Run `sql/SIMPLE_ENCRYPTION_FIX.sql` in Supabase SQL Editor

**"Permission denied"**
→ Check user has correct role in `platform_admin_users` table

**"RLS policy violation"**
→ Check `sql/FIX_CRITICAL_RLS_ISSUES.sql` has been applied

**"UI not loading"**
→ Check browser console for JavaScript errors

---

**🎯 GOAL: Complete this audit in 2 hours and have a clear production readiness assessment!** 
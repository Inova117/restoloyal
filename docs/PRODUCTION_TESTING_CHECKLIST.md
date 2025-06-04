# 🧪 Production Testing Checklist - Restaurant Loyalty Platform

## **Testing Instructions**

**For each test:**
- ✅ **YES** = Working correctly  
- ❌ **NO** = Not working (record error details)
- ⚠️ **PARTIAL** = Working but with issues (record what's wrong)

**Test as:** Create a super admin user first, then test each role progression.

---

## 🏗️ **TIER 1: Database & Foundation**

### **1.1 Database Schema Tests**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| All critical tables exist | ⬜ | |
| Foreign key relationships working | ⬜ | |
| Indexes exist on key tables | ⬜ | |
| RLS is enabled on all tables | ⬜ | |

**Manual Test:** Run this SQL to check tables:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('platform_clients', 'restaurants', 'locations', 'customers', 'user_roles', 'platform_admin_users', 'stamps', 'rewards');
```

### **1.2 Encryption Functions**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| `encrypt_sensitive_data()` works | ⬜ | |
| `decrypt_sensitive_data()` works | ⬜ | |
| `hash_sensitive_data()` works | ⬜ | |
| `verify_hashed_data()` works | ⬜ | |

**Manual Test:** Run these SQL commands:
```sql
-- Test encryption
SELECT encrypt_sensitive_data('test_data') AS encrypted;

-- Test decryption (use result from above)
SELECT decrypt_sensitive_data('YOUR_ENCRYPTED_RESULT') AS decrypted;

-- Test password hashing
SELECT hash_sensitive_data('test_password') AS hashed;

-- Test password verification (use result from above)
SELECT verify_hashed_data('test_password', 'YOUR_HASHED_RESULT') AS verified;
```

### **1.3 RLS Policy Security**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| System policies are secure (no `WITH CHECK (true)`) | ⬜ | |
| Users can only see their own tenant data | ⬜ | |
| Cross-tenant access blocked | ⬜ | |
| Platform admin can see all data | ⬜ | |

---

## 🔐 **TIER 2: Authentication & Authorization**

### **2.1 User Creation & Login**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Create super admin user | ⬜ | |
| Super admin can login | ⬜ | |
| Role detection works for super admin | ⬜ | |
| Session persists correctly | ⬜ | |

**Manual Test Steps:**
1. Create user: `admin@zerioncore.com` (password: strong password)
2. Add to `platform_admin_users` table with role `super_admin`
3. Login through UI
4. Check if recognized as platform admin

### **2.2 Role-Based Access Control**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Platform admin sees platform dashboard | ⬜ | |
| Platform admin can access all features | ⬜ | |
| Role switching works (admin viewing client) | ⬜ | |
| Session storage for context switching | ⬜ | |

### **2.3 Permission Boundaries**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Unauthenticated users redirected to login | ⬜ | |
| Users without permissions blocked from admin features | ⬜ | |
| API calls require valid authentication | ⬜ | |
| Token expiration handled properly | ⬜ | |

---

## 🏢 **TIER 3: Platform Management (As Super Admin)**

### **3.1 Client Management**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Can create new client | ⬜ | |
| Client appears in platform dashboard | ⬜ | |
| Can edit client details | ⬜ | |
| Can activate/deactivate client | ⬜ | |

**Manual Test Steps:**
1. Login as super admin
2. Go to platform management
3. Create new client: "Test Restaurant Group"
4. Verify it appears in client list
5. Edit client name, save, verify changes

### **3.2 Client Admin User Creation**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Can create client admin user | ⬜ | |
| Client admin user receives correct permissions | ⬜ | |
| Client admin can login | ⬜ | |
| Client admin sees only their client data | ⬜ | |

**Manual Test Steps:**
1. Create user: `admin@testclient.com`
2. Assign as client admin for test client
3. Logout, login as client admin
4. Verify they only see their client's data

### **3.3 Platform Analytics**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Platform analytics dashboard loads | ⬜ | |
| Shows data from all clients | ⬜ | |
| Date filtering works | ⬜ | |
| Export functionality works | ⬜ | |

---

## 🏪 **TIER 4: Client Management (As Client Admin)**

### **4.1 Restaurant/Location Management**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Can create new restaurant/location | ⬜ | |
| Location appears in client dashboard | ⬜ | |
| Can edit location details | ⬜ | |
| Can manage location settings | ⬜ | |

**Manual Test Steps (as client admin):**
1. Login as client admin
2. Create new location: "Test Restaurant - Downtown"
3. Set address, phone, settings
4. Verify location appears in list

### **4.2 Staff Management**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Can add staff to location | ⬜ | |
| Can set staff permissions | ⬜ | |
| Staff user can login | ⬜ | |
| Staff sees only their location | ⬜ | |

**Manual Test Steps:**
1. Add staff user: `staff@testlocation.com`
2. Assign to downtown location
3. Give permissions: can_add_stamps, can_redeem_rewards
4. Test staff login and access

### **4.3 Client Analytics**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Client analytics dashboard loads | ⬜ | |
| Shows only client's data | ⬜ | |
| Location filtering works | ⬜ | |
| Reports are accurate | ⬜ | |

---

## 🏬 **TIER 5: POS Operations (As Location Staff)**

### **5.1 Customer Management**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Can register new customer | ⬜ | |
| Customer gets QR code | ⬜ | |
| Can search existing customers | ⬜ | |
| Customer data saves correctly | ⬜ | |

**Manual Test Steps (as location staff):**
1. Login as location staff
2. Register new customer: "John Doe", john@test.com, +1234567890
3. Verify customer appears in list
4. Search for customer by name/email/phone

### **5.2 Stamp Operations**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Can add stamps to customer | ⬜ | |
| Stamp count updates correctly | ⬜ | |
| Transaction is logged | ⬜ | |
| Cannot exceed daily limits (if any) | ⬜ | |

**Manual Test Steps:**
1. Select customer "John Doe"
2. Add 3 stamps with purchase amount $25.99
3. Verify stamp count increased
4. Check transaction appears in history

### **5.3 Reward Redemption**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Can redeem reward when eligible | ⬜ | |
| Stamp count decreases correctly | ⬜ | |
| Redemption is logged | ⬜ | |
| Cannot redeem without enough stamps | ⬜ | |

**Manual Test Steps:**
1. Add enough stamps to customer (10 stamps)
2. Redeem reward (should deduct stamps)
3. Verify stamp count reset or decreased
4. Try redeeming again without enough stamps

---

## 🌐 **TIER 6: Edge Functions (API Testing)**

### **6.1 POS Operations API**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Register customer API works | ⬜ | |
| Add stamp API works | ⬜ | |
| Redeem reward API works | ⬜ | |
| Customer lookup API works | ⬜ | |

**Manual Test:** Open browser dev tools, watch network tab during POS operations

### **6.2 Authentication Security**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| API blocks requests without auth header | ⬜ | |
| API blocks requests with invalid token | ⬜ | |
| API validates user permissions | ⬜ | |
| API returns proper error messages | ⬜ | |

**Manual Test:** Try API calls without logging in (should fail)

### **6.3 Data Validation**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| API validates required fields | ⬜ | |
| API rejects invalid email formats | ⬜ | |
| API handles large payloads gracefully | ⬜ | |
| API sanitizes input data | ⬜ | |

---

## 🎨 **TIER 7: User Interface**

### **7.1 Role-Based UI**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Platform admin sees all features | ⬜ | |
| Client admin sees client features only | ⬜ | |
| Location staff sees POS interface only | ⬜ | |
| Unauthorized features are hidden | ⬜ | |

### **7.2 Error Handling**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Network errors show user-friendly messages | ⬜ | |
| Form validation works | ⬜ | |
| Loading states display correctly | ⬜ | |
| Success messages appear | ⬜ | |

### **7.3 Data Flow**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Real-time updates work | ⬜ | |
| Data persists after page refresh | ⬜ | |
| Pagination works on large lists | ⬜ | |
| Filtering and search work | ⬜ | |

---

## 🔄 **TIER 8: End-to-End Business Flow**

### **8.1 Complete Customer Journey**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Customer registration → stamps → reward works | ⬜ | |
| Multiple locations can serve same customer | ⬜ | |
| Customer data is consistent across locations | ⬜ | |
| Analytics reflect customer activity | ⬜ | |

### **8.2 Multi-Location Operations**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Staff at location A cannot see location B data | ⬜ | |
| Client admin can see all their locations | ⬜ | |
| Platform admin can see all locations | ⬜ | |
| Location switching works correctly | ⬜ | |

---

## 🛡️ **TIER 9: Security Testing**

### **9.1 Access Control**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Cannot access admin URLs as regular user | ⬜ | |
| Cannot view other clients' data | ⬜ | |
| Cannot perform actions without permissions | ⬜ | |
| Session timeouts work correctly | ⬜ | |

### **9.2 Data Protection**

| Test | Status | Error Details (if NO/PARTIAL) |
|------|--------|--------------------------------|
| Sensitive data is encrypted in database | ⬜ | |
| Passwords are properly hashed | ⬜ | |
| No sensitive data in browser console | ⬜ | |
| No sensitive data in network requests | ⬜ | |

---

## 📊 **TESTING SUMMARY**

### **Overall Results**
- **Total Tests:** _____ 
- **Passed (✅):** _____
- **Failed (❌):** _____
- **Partial (⚠️):** _____
- **Success Rate:** _____%

### **Critical Issues Found** *(List major problems that must be fixed)*
1. ________________________________
2. ________________________________
3. ________________________________

### **Minor Issues Found** *(List small problems to fix later)*
1. ________________________________
2. ________________________________
3. ________________________________

### **Production Readiness Assessment**
- ⬜ **READY** - All critical tests pass, minor issues acceptable
- ⬜ **NOT READY** - Critical issues must be fixed first
- ⬜ **NEEDS REVIEW** - Mixed results, requires analysis

### **Next Steps**
1. ________________________________
2. ________________________________
3. ________________________________

---

## 🚀 **Testing Tips**

### **Before You Start:**
1. Create super admin user: `admin@zerioncore.com`
2. Have browser dev tools open to watch network activity
3. Test in incognito/private browsing mode
4. Use realistic test data (real names, emails, phones)

### **During Testing:**
1. **Document everything** - even small issues
2. **Test edge cases** - empty fields, special characters, long inputs
3. **Test error scenarios** - what happens when things go wrong?
4. **Check the database** - verify data is saved correctly

### **If Something Fails:**
1. **Note the exact error message**
2. **Check browser console for errors**
3. **Check network tab for failed requests**
4. **Note what you were doing when it failed**
5. **Try to reproduce the issue**

**Good luck! Test systematically and document everything.** 🧪 
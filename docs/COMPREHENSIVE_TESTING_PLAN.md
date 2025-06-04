# 🧪 Comprehensive Testing Plan - Restaurant Loyalty Platform

## **Testing Strategy: Tier-by-Tier Flow Analysis**

This plan systematically tests every layer of your platform to understand the complete flow, identify security issues, and prevent production problems.

---

## 🏗️ **TIER 1: Database & RLS Foundation**

### **Database Schema Validation**

**Test Scope**: Core data integrity and relationships

```sql
-- Test 1: Verify all critical tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'platform_clients', 'restaurants', 'locations', 'customers', 
  'user_roles', 'platform_admin_users', 'location_staff',
  'stamps', 'rewards', 'security_events', 'platform_activity_log'
);

-- Test 2: Check foreign key relationships
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY';

-- Test 3: Verify critical indexes exist
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('customers', 'user_roles', 'stamps', 'rewards');
```

### **RLS Policy Testing**

**Test Scope**: Row-level security enforcement

```sql
-- Test 4: Verify policies exist for all tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test 5: Test tenant isolation (as different users)
-- This needs to be run with different auth contexts
SET SESSION "request.jwt.claims" = '{"sub":"test-user-1","role":"authenticated"}';
SELECT COUNT(*) FROM customers; -- Should only see own tenant data

-- Test 6: Verify system policies are secure
SELECT policyname, qual FROM pg_policies 
WHERE qual LIKE '%true%' AND tablename IN ('security_events', 'platform_activity_log');
```

### **Encryption Function Testing**

**Test Scope**: Data protection mechanisms

```sql
-- Test 7: Encryption function verification
SELECT encrypt_sensitive_data('test_data') AS encrypted;
SELECT decrypt_sensitive_data(encrypt_sensitive_data('test_data')) AS decrypted;

-- Test 8: Password hashing verification  
SELECT hash_sensitive_data('test_password') AS hashed;
SELECT verify_hashed_data('test_password', hash_sensitive_data('test_password')) AS verified;

-- Test 9: Error handling
SELECT encrypt_sensitive_data(NULL); -- Should handle gracefully
SELECT decrypt_sensitive_data('invalid_data'); -- Should not crash
```

---

## 🔐 **TIER 2: Authentication & Authorization Layer**

### **Auth Flow Testing**

**Test Scope**: User authentication and role assignment

```javascript
// Test 10: Authentication flow
async function testAuthFlow() {
  // Test successful login
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'test_password'
  });
  
  // Test session validation
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  // Test token refresh
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
  
  console.log('Auth Test Results:', {
    loginSuccess: !loginError,
    sessionValid: !!session,
    refreshWorks: !refreshError
  });
}

// Test 11: Role detection system
async function testRoleDetection() {
  const testCases = [
    { email: 'admin@zerioncore.com', expectedRole: 'zerion_admin' },
    { email: 'admin@galletti.com', expectedRole: 'galletti_hq' },
    { email: 'owner@restaurant.com', expectedRole: 'restaurant_owner' },
    { email: 'staff@location.com', expectedRole: 'location_staff' }
  ];
  
  for (const testCase of testCases) {
    // Test role detection logic
    const detectedRole = await detectUserRole(testCase.email);
    console.log(`Role Detection Test: ${testCase.email} -> ${detectedRole} (expected: ${testCase.expectedRole})`);
  }
}
```

### **Permission System Testing**

**Test Scope**: Authorization and access control

```javascript
// Test 12: Permission boundary testing
async function testPermissionBoundaries() {
  const permissionTests = [
    {
      role: 'location_staff',
      tests: [
        { action: 'viewAllClients', shouldPass: false },
        { action: 'addStamps', shouldPass: true },
        { action: 'managePlatform', shouldPass: false }
      ]
    },
    {
      role: 'client_admin', 
      tests: [
        { action: 'viewOwnRestaurants', shouldPass: true },
        { action: 'managePlatform', shouldPass: false },
        { action: 'viewAnalytics', shouldPass: true }
      ]
    },
    {
      role: 'zerion_admin',
      tests: [
        { action: 'viewAllClients', shouldPass: true },
        { action: 'managePlatform', shouldPass: true },
        { action: 'accessEverything', shouldPass: true }
      ]
    }
  ];
  
  for (const roleTest of permissionTests) {
    console.log(`Testing permissions for ${roleTest.role}:`);
    for (const test of roleTest.tests) {
      const result = await testPermission(roleTest.role, test.action);
      const status = result === test.shouldPass ? '✅' : '❌';
      console.log(`  ${status} ${test.action}: ${result} (expected: ${test.shouldPass})`);
    }
  }
}

// Test 13: Cross-tenant access prevention
async function testTenantIsolation() {
  // Test if user from client A can access client B data
  const clientAUser = await loginAs('clienta@test.com');
  const clientBData = await attemptDataAccess('client_b_id');
  
  console.log('Tenant Isolation Test:', {
    accessBlocked: clientBData === null,
    message: clientBData ? 'SECURITY ISSUE: Cross-tenant access allowed!' : 'Secure: Access properly blocked'
  });
}
```

---

## 🌐 **TIER 3: Edge Functions (Backend API)**

### **Edge Function Testing**

**Test Scope**: API endpoints and business logic

```javascript
// Test 14: POS Operations API
async function testPOSOperations() {
  const tests = [
    {
      name: 'Customer Registration',
      endpoint: 'pos-operations/register-customer',
      payload: {
        customer_data: {
          name: 'Test Customer',
          email: 'test@customer.com',
          phone: '+1234567890'
        },
        location_id: 'test_location_id'
      }
    },
    {
      name: 'Add Stamp',
      endpoint: 'pos-operations/add-stamp',
      payload: {
        customer_id: 'test_customer_id',
        location_id: 'test_location_id',
        stamps_earned: 1,
        amount: 15.99
      }
    },
    {
      name: 'Redeem Reward',
      endpoint: 'pos-operations/redeem-reward',
      payload: {
        customer_id: 'test_customer_id',
        location_id: 'test_location_id',
        reward_type: 'free_coffee',
        stamps_to_redeem: 10
      }
    }
  ];
  
  for (const test of tests) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${test.endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test.payload)
      });
      
      const result = await response.json();
      console.log(`${test.name} Test:`, {
        status: response.status,
        success: response.ok,
        data: result
      });
    } catch (error) {
      console.error(`${test.name} Test Failed:`, error);
    }
  }
}

// Test 15: Staff permission validation in APIs
async function testAPIPermissions() {
  const permissionTests = [
    {
      user: 'staff_no_stamps_permission',
      endpoint: 'pos-operations/add-stamp',
      shouldFail: true
    },
    {
      user: 'staff_with_full_permissions',
      endpoint: 'pos-operations/add-stamp', 
      shouldFail: false
    },
    {
      user: 'wrong_location_staff',
      endpoint: 'pos-operations/add-stamp',
      shouldFail: true
    }
  ];
  
  for (const test of permissionTests) {
    const session = await loginAs(test.user);
    const response = await callAPI(test.endpoint, session);
    const failed = response.status === 403;
    
    const status = failed === test.shouldFail ? '✅' : '❌';
    console.log(`${status} API Permission Test: ${test.user} -> ${test.endpoint} (failed: ${failed})`);
  }
}
```

### **Function Security Testing**

**Test Scope**: API security and error handling

```javascript
// Test 16: Authentication bypass attempts
async function testAPISecurityBypass() {
  const bypassAttempts = [
    {
      name: 'No Authorization Header',
      headers: {},
      shouldBlock: true
    },
    {
      name: 'Invalid Token',
      headers: { 'Authorization': 'Bearer invalid_token' },
      shouldBlock: true
    },
    {
      name: 'Expired Token',
      headers: { 'Authorization': 'Bearer expired_token' },
      shouldBlock: true
    },
    {
      name: 'Malformed Token',
      headers: { 'Authorization': 'Bearer malformed.token.here' },
      shouldBlock: true
    }
  ];
  
  for (const attempt of bypassAttempts) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/pos-operations/add-stamp`, {
      method: 'POST',
      headers: {
        ...attempt.headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'data' })
    });
    
    const blocked = response.status === 401;
    const status = blocked === attempt.shouldBlock ? '✅' : '❌';
    console.log(`${status} Security Test: ${attempt.name} (blocked: ${blocked})`);
  }
}

// Test 17: Input validation and injection testing
async function testInputValidation() {
  const injectionTests = [
    {
      name: 'SQL Injection in customer_id',
      payload: { customer_id: "'; DROP TABLE customers; --" }
    },
    {
      name: 'XSS in customer name',
      payload: { 
        customer_data: { 
          name: '<script>alert("xss")</script>' 
        }
      }
    },
    {
      name: 'Large payload attack',
      payload: { 
        notes: 'A'.repeat(10000) 
      }
    },
    {
      name: 'Null byte injection',
      payload: { 
        customer_data: { 
          email: 'test@example.com\0admin@system.com' 
        }
      }
    }
  ];
  
  for (const test of injectionTests) {
    try {
      const response = await callAPI('pos-operations/add-stamp', validSession, test.payload);
      console.log(`Injection Test ${test.name}:`, {
        status: response.status,
        blocked: response.status >= 400,
        message: 'API should reject malicious input'
      });
    } catch (error) {
      console.log(`✅ Injection Test ${test.name}: Properly rejected`);
    }
  }
}
```

---

## 🎨 **TIER 4: Frontend Application Layer**

### **Component Integration Testing**

**Test Scope**: React components and state management

```javascript
// Test 18: Authentication flow in UI
async function testUIAuthFlow() {
  // Test login form
  await page.goto('/auth');
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  // Verify redirect to dashboard
  await page.waitForURL('/');
  const dashboardVisible = await page.isVisible('[data-testid="dashboard"]');
  console.log('✅ UI Auth Flow Test:', { dashboardVisible });
  
  // Test logout
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/auth');
  console.log('✅ Logout Flow Test: Redirected to auth');
}

// Test 19: Role-based UI rendering
async function testRoleBasedUI() {
  const roleTests = [
    {
      role: 'zerion_admin',
      shouldSee: ['platform-settings', 'all-clients-tab', 'admin-dashboard'],
      shouldNotSee: ['location-pos-only']
    },
    {
      role: 'location_staff', 
      shouldSee: ['pos-interface', 'stamp-button', 'customer-lookup'],
      shouldNotSee: ['analytics-tab', 'platform-settings', 'manage-locations']
    },
    {
      role: 'client_admin',
      shouldSee: ['analytics-tab', 'manage-locations', 'client-dashboard'],
      shouldNotSee: ['platform-settings', 'all-clients-access']
    }
  ];
  
  for (const test of roleTests) {
    await loginAs(test.role);
    await page.goto('/');
    
    for (const element of test.shouldSee) {
      const visible = await page.isVisible(`[data-testid="${element}"]`);
      console.log(`${visible ? '✅' : '❌'} ${test.role} should see ${element}: ${visible}`);
    }
    
    for (const element of test.shouldNotSee) {
      const hidden = !(await page.isVisible(`[data-testid="${element}"]`));
      console.log(`${hidden ? '✅' : '❌'} ${test.role} should NOT see ${element}: ${hidden}`);
    }
  }
}
```

### **Data Flow Testing**

**Test Scope**: Frontend-backend integration

```javascript
// Test 20: Complete customer journey
async function testCustomerJourney() {
  await loginAs('location_staff');
  
  // Step 1: Register new customer
  await page.click('[data-testid="add-customer-button"]');
  await page.fill('[data-testid="customer-name"]', 'Test Customer');
  await page.fill('[data-testid="customer-email"]', 'test@customer.com');
  await page.click('[data-testid="save-customer"]');
  
  // Verify customer appears in list
  const customerVisible = await page.isVisible('text=Test Customer');
  console.log('✅ Customer Registration:', { customerVisible });
  
  // Step 2: Add stamps
  await page.click('[data-testid="add-stamp-button"]');
  await page.selectOption('[data-testid="customer-select"]', 'Test Customer');
  await page.fill('[data-testid="stamps-count"]', '3');
  await page.click('[data-testid="add-stamps"]');
  
  // Verify stamps were added
  const stampsAdded = await page.textContent('[data-testid="customer-stamps"]');
  console.log('✅ Add Stamps:', { stampsAdded });
  
  // Step 3: Redeem reward (if enough stamps)
  if (parseInt(stampsAdded) >= 10) {
    await page.click('[data-testid="redeem-reward-button"]');
    await page.click('[data-testid="confirm-redeem"]');
    
    const rewardRedeemed = await page.isVisible('text=Reward redeemed');
    console.log('✅ Redeem Reward:', { rewardRedeemed });
  }
}

// Test 21: Error handling in UI
async function testUIErrorHandling() {
  const errorTests = [
    {
      name: 'Network failure handling',
      action: async () => {
        // Simulate network failure
        await page.route('**/functions/v1/**', route => route.abort());
        await page.click('[data-testid="add-stamp-button"]');
        return await page.isVisible('text=Network error');
      }
    },
    {
      name: 'Invalid input handling',
      action: async () => {
        await page.fill('[data-testid="stamps-count"]', '-5');
        await page.click('[data-testid="add-stamps"]');
        return await page.isVisible('text=Invalid input');
      }
    },
    {
      name: 'Permission denied handling',
      action: async () => {
        // Try to access admin features as staff
        await loginAs('location_staff');
        await page.goto('/admin');
        return await page.isVisible('text=Access denied');
      }
    }
  ];
  
  for (const test of errorTests) {
    try {
      const errorHandled = await test.action();
      console.log(`${errorHandled ? '✅' : '❌'} UI Error Test: ${test.name}`);
    } catch (error) {
      console.log(`❌ UI Error Test Failed: ${test.name}`, error);
    }
  }
}
```

---

## 🔄 **TIER 5: End-to-End Business Flows**

### **Complete Business Process Testing**

**Test Scope**: Real-world usage scenarios

```javascript
// Test 22: Multi-location restaurant management
async function testMultiLocationFlow() {
  await loginAs('client_admin');
  
  // Create new location
  await page.click('[data-testid="add-location-button"]');
  await page.fill('[data-testid="location-name"]', 'New Branch');
  await page.fill('[data-testid="location-address"]', '123 Test St');
  await page.click('[data-testid="save-location"]');
  
  // Add staff to location
  await page.click('[data-testid="manage-staff-button"]');
  await page.fill('[data-testid="staff-email"]', 'staff@newbranch.com');
  await page.check('[data-testid="can-add-stamps"]');
  await page.click('[data-testid="add-staff"]');
  
  // Verify staff can access location
  await loginAs('staff@newbranch.com');
  const locationAccess = await page.isVisible('text=New Branch');
  console.log('✅ Multi-location Flow:', { locationAccess });
}

// Test 23: Analytics and reporting flow
async function testAnalyticsFlow() {
  await loginAs('client_admin');
  await page.click('[data-testid="analytics-tab"]');
  
  // Test date range filtering
  await page.fill('[data-testid="start-date"]', '2024-01-01');
  await page.fill('[data-testid="end-date"]', '2024-12-31');
  await page.click('[data-testid="apply-filter"]');
  
  // Verify charts load
  const chartsLoaded = await page.isVisible('[data-testid="analytics-chart"]');
  
  // Test export functionality
  await page.click('[data-testid="export-data"]');
  const exportStarted = await page.isVisible('text=Export started');
  
  console.log('✅ Analytics Flow:', { chartsLoaded, exportStarted });
}
```

### **Performance and Load Testing**

**Test Scope**: System performance under load

```javascript
// Test 24: Concurrent user testing
async function testConcurrentUsers() {
  const userSessions = [];
  const concurrentUsers = 10;
  
  // Create multiple user sessions
  for (let i = 0; i < concurrentUsers; i++) {
    const session = await createUserSession(`user${i}@test.com`);
    userSessions.push(session);
  }
  
  // Simulate concurrent operations
  const operations = userSessions.map(async (session, index) => {
    return await performStampOperation(session, {
      customer_id: `customer_${index}`,
      stamps_earned: Math.floor(Math.random() * 5) + 1
    });
  });
  
  const results = await Promise.allSettled(operations);
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  
  console.log('✅ Concurrent Users Test:', {
    totalUsers: concurrentUsers,
    successfulOperations: successCount,
    failureRate: ((concurrentUsers - successCount) / concurrentUsers * 100).toFixed(2) + '%'
  });
}

// Test 25: Database performance under load
async function testDatabaseLoad() {
  const startTime = Date.now();
  const operations = [];
  
  // Simulate high-volume operations
  for (let i = 0; i < 100; i++) {
    operations.push(
      supabase
        .from('customers')
        .select('*')
        .limit(10)
    );
  }
  
  const results = await Promise.allSettled(operations);
  const endTime = Date.now();
  
  console.log('✅ Database Load Test:', {
    operations: operations.length,
    duration: endTime - startTime,
    averageResponseTime: (endTime - startTime) / operations.length,
    successRate: (results.filter(r => r.status === 'fulfilled').length / operations.length * 100).toFixed(2) + '%'
  });
}
```

---

## 🛡️ **TIER 6: Security Penetration Testing**

### **Security Vulnerability Testing**

**Test Scope**: Security weaknesses and attack vectors

```javascript
// Test 26: Authentication bypass attempts
async function testAuthBypass() {
  const bypassAttempts = [
    {
      name: 'Direct API access without auth',
      test: async () => {
        const response = await fetch(`${API_URL}/pos-operations/add-stamp`, {
          method: 'POST',
          body: JSON.stringify({ test: 'data' })
        });
        return response.status === 401;
      }
    },
    {
      name: 'Token manipulation',
      test: async () => {
        const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.token';
        const response = await fetch(`${API_URL}/pos-operations/add-stamp`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${fakeToken}` },
          body: JSON.stringify({ test: 'data' })
        });
        return response.status === 401;
      }
    },
    {
      name: 'Role elevation attempt',
      test: async () => {
        // Try to access admin functions as regular user
        const staffSession = await loginAs('location_staff');
        const response = await fetch(`${API_URL}/platform-management/users`, {
          headers: { 'Authorization': `Bearer ${staffSession.access_token}` }
        });
        return response.status === 403;
      }
    }
  ];
  
  for (const attempt of bypassAttempts) {
    const blocked = await attempt.test();
    console.log(`${blocked ? '✅' : '❌'} Security Test: ${attempt.name} (blocked: ${blocked})`);
  }
}

// Test 27: Data injection and XSS testing
async function testDataInjection() {
  const injectionTests = [
    {
      name: 'SQL Injection in customer search',
      payload: { search: "'; DROP TABLE customers; --" },
      endpoint: 'customer-manager/search'
    },
    {
      name: 'XSS in customer name',
      payload: { 
        name: '<script>alert("XSS")</script>',
        email: 'test@example.com' 
      },
      endpoint: 'pos-operations/register-customer'
    },
    {
      name: 'Command injection in export',
      payload: { 
        format: 'csv; rm -rf /' 
      },
      endpoint: 'data-export/generate'
    }
  ];
  
  for (const test of injectionTests) {
    try {
      const response = await callAPI(test.endpoint, validSession, test.payload);
      const blocked = response.status >= 400;
      console.log(`${blocked ? '✅' : '❌'} Injection Test: ${test.name} (blocked: ${blocked})`);
    } catch (error) {
      console.log(`✅ Injection Test: ${test.name} - Properly rejected`);
    }
  }
}
```

---

## 📋 **Testing Execution Plan**

### **Phase 1: Foundation Testing (Day 1-2)**
```bash
# Database and RLS testing
npm run test:database
npm run test:rls-policies  
npm run test:encryption

# Expected Results:
# - All tables exist and have proper relationships
# - RLS policies block unauthorized access
# - Encryption functions work correctly
```

### **Phase 2: Backend Testing (Day 3-4)**
```bash
# Edge function testing
npm run test:edge-functions
npm run test:api-security
npm run test:permissions

# Expected Results:
# - All APIs respond correctly with valid auth
# - Invalid requests are properly rejected
# - Permission boundaries are enforced
```

### **Phase 3: Frontend Testing (Day 5-6)**
```bash
# UI and integration testing
npm run test:frontend
npm run test:role-based-ui
npm run test:error-handling

# Expected Results:
# - UI renders correctly for each role
# - Data flows work end-to-end
# - Errors are handled gracefully
```

### **Phase 4: Business Flow Testing (Day 7-8)**
```bash
# End-to-end business processes
npm run test:customer-journey
npm run test:multi-location
npm run test:analytics

# Expected Results:
# - Complete business workflows function
# - Multi-tenant isolation works
# - Reporting and analytics are accurate
```

### **Phase 5: Security Testing (Day 9-10)**
```bash
# Security and penetration testing
npm run test:security
npm run test:load-performance
npm run test:data-injection

# Expected Results:
# - No security bypasses possible
# - System handles load appropriately
# - All injection attempts blocked
```

---

## 🚨 **Critical Issues to Watch For**

### **Red Flags - Stop Testing If Found**
1. **Authentication Bypass**: Any way to access APIs without valid auth
2. **Cross-Tenant Data Access**: Users seeing other tenants' data
3. **SQL Injection Success**: Database queries being manipulated
4. **Privilege Escalation**: Users gaining higher permissions than assigned
5. **Data Corruption**: Any test that corrupts or loses data

### **Yellow Flags - Fix Before Production**
1. **Slow Response Times**: APIs taking >2 seconds consistently
2. **Memory Leaks**: Frontend memory usage growing indefinitely
3. **Error Handling Gaps**: Unhandled errors reaching users
4. **UI Permission Leaks**: UI showing features user can't use
5. **Audit Trail Gaps**: Important actions not being logged

### **Testing Tools Setup**

```javascript
// Create test environment configuration
const testConfig = {
  database: {
    supabaseUrl: process.env.SUPABASE_TEST_URL,
    serviceKey: process.env.SUPABASE_TEST_SERVICE_KEY
  },
  testUsers: {
    platformAdmin: 'admin@zerioncore.com',
    clientAdmin: 'admin@testclient.com', 
    restaurantOwner: 'owner@testrestaurant.com',
    locationStaff: 'staff@testlocation.com'
  },
  testData: {
    clientId: 'test-client-id',
    restaurantId: 'test-restaurant-id',
    locationId: 'test-location-id'
  }
};

// Utility functions for testing
async function setupTestData() {
  // Create test users and data
}

async function cleanupTestData() {
  // Remove test data after tests
}

async function loginAs(userType) {
  // Helper to login as different user types
}
```

This comprehensive testing plan will help you identify issues before they become production problems and ensure your platform is secure, performant, and reliable. 
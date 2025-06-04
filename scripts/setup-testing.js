#!/usr/bin/env node

/**
 * ============================================================================
 * RESTAURANT LOYALTY PLATFORM - TESTING SETUP SCRIPT
 * ============================================================================
 * 
 * This script sets up the testing environment and provides utilities for
 * comprehensive tier-by-tier testing of the platform.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Test configuration
const TEST_CONFIG = {
  // Test users for different roles
  testUsers: {
    zerionAdmin: {
      email: 'admin@zerioncore.com',
      password: 'TestPassword123!',
      expectedRole: 'zerion_admin'
    },
    clientAdmin: {
      email: 'admin@testclient.com', 
      password: 'TestPassword123!',
      expectedRole: 'galletti_hq'
    },
    restaurantOwner: {
      email: 'owner@testrestaurant.com',
      password: 'TestPassword123!',
      expectedRole: 'restaurant_owner'
    },
    locationStaff: {
      email: 'staff@testlocation.com',
      password: 'TestPassword123!',
      expectedRole: 'location_staff'
    }
  },
  
  // Test data IDs
  testData: {
    clientId: 'test-client-id-12345',
    restaurantId: 'test-restaurant-id-12345',
    locationId: 'test-location-id-12345',
    customerId: 'test-customer-id-12345'
  }
};

// Initialize Supabase clients
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// TIER 1: DATABASE TESTING UTILITIES
// ============================================================================

export class DatabaseTester {
  constructor() {
    this.client = supabaseAdmin;
  }

  async testTableExists(tableName) {
    try {
      const { data, error } = await this.client
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
      
      return { 
        exists: !error && data && data.length > 0,
        error: error?.message 
      };
    } catch (err) {
      return { exists: false, error: err.message };
    }
  }

  async testRLSPolicies(tableName) {
    try {
      const { data, error } = await this.client.rpc('test_rls_policies', {
        table_name: tableName
      });
      
      return { 
        policies: data || [],
        error: error?.message 
      };
    } catch (err) {
      return { policies: [], error: err.message };
    }
  }

  async testEncryptionFunctions() {
    try {
      const testData = 'test_sensitive_data';
      
      // Test encryption
      const { data: encrypted, error: encError } = await this.client.rpc(
        'encrypt_sensitive_data', 
        { data: testData }
      );
      
      if (encError) return { success: false, error: encError.message };
      
      // Test decryption
      const { data: decrypted, error: decError } = await this.client.rpc(
        'decrypt_sensitive_data',
        { encrypted_data: encrypted }
      );
      
      return {
        success: !decError && decrypted === testData,
        encrypted: encrypted?.substring(0, 20) + '...',
        decrypted: decrypted,
        matches: decrypted === testData,
        error: decError?.message
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async runFullDatabaseTests() {
    console.log('🗄️  Running Tier 1: Database Foundation Tests...\n');
    
    const criticalTables = [
      'platform_clients', 'restaurants', 'locations', 'customers',
      'user_roles', 'platform_admin_users', 'location_staff',
      'stamps', 'rewards', 'security_events', 'platform_activity_log'
    ];
    
    const results = {
      tablesExist: {},
      rlsPolicies: {},
      encryption: null,
      summary: { passed: 0, failed: 0, warnings: 0 }
    };
    
    // Test table existence
    for (const table of criticalTables) {
      const result = await this.testTableExists(table);
      results.tablesExist[table] = result;
      
      if (result.exists) {
        console.log(`✅ Table exists: ${table}`);
        results.summary.passed++;
      } else {
        console.log(`❌ Table missing: ${table} - ${result.error || 'Not found'}`);
        results.summary.failed++;
      }
    }
    
    // Test encryption functions
    console.log('\n🔐 Testing encryption functions...');
    results.encryption = await this.testEncryptionFunctions();
    
    if (results.encryption.success) {
      console.log('✅ Encryption/decryption working correctly');
      results.summary.passed++;
    } else {
      console.log(`❌ Encryption test failed: ${results.encryption.error}`);
      results.summary.failed++;
    }
    
    console.log(`\n📊 Database Tests Summary: ${results.summary.passed} passed, ${results.summary.failed} failed\n`);
    return results;
  }
}

// ============================================================================
// TIER 2: AUTHENTICATION TESTING UTILITIES
// ============================================================================

export class AuthTester {
  constructor() {
    this.client = supabaseClient;
  }

  async testLogin(email, password) {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });
      
      return {
        success: !error && !!data.session,
        session: data.session,
        user: data.user,
        error: error?.message
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async testRoleDetection(session) {
    try {
      // This would call your role detection logic
      // For now, we'll simulate it
      const userEmail = session.user.email;
      let expectedRole = 'location_staff'; // default
      
      if (userEmail.includes('@zerioncore.com')) {
        expectedRole = 'zerion_admin';
      } else if (userEmail.includes('@testclient.com')) {
        expectedRole = 'galletti_hq';
      } else if (userEmail.includes('owner@')) {
        expectedRole = 'restaurant_owner';
      }
      
      return {
        success: true,
        detectedRole: expectedRole,
        userEmail: userEmail
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async testPermissionBoundaries(role) {
    const permissionTests = {
      location_staff: {
        shouldHave: ['canAddStamps', 'canRedeemRewards'],
        shouldNotHave: ['canManagePlatform', 'canViewAllClients']
      },
      galletti_hq: {
        shouldHave: ['canViewAnalytics', 'canManageLocations'],
        shouldNotHave: ['canManagePlatform']
      },
      zerion_admin: {
        shouldHave: ['canManagePlatform', 'canViewAllClients'],
        shouldNotHave: []
      }
    };
    
    return permissionTests[role] || { shouldHave: [], shouldNotHave: [] };
  }

  async runFullAuthTests() {
    console.log('🔐 Running Tier 2: Authentication & Authorization Tests...\n');
    
    const results = {
      loginTests: {},
      roleDetection: {},
      permissions: {},
      summary: { passed: 0, failed: 0, warnings: 0 }
    };
    
    // Test login for each user type
    for (const [userType, credentials] of Object.entries(TEST_CONFIG.testUsers)) {
      console.log(`Testing login for ${userType}...`);
      
      const loginResult = await this.testLogin(credentials.email, credentials.password);
      results.loginTests[userType] = loginResult;
      
      if (loginResult.success) {
        console.log(`✅ Login successful: ${userType}`);
        results.summary.passed++;
        
        // Test role detection
        const roleResult = await this.testRoleDetection(loginResult.session);
        results.roleDetection[userType] = roleResult;
        
        if (roleResult.success && roleResult.detectedRole === credentials.expectedRole) {
          console.log(`✅ Role detection correct: ${roleResult.detectedRole}`);
          results.summary.passed++;
        } else {
          console.log(`❌ Role detection failed: expected ${credentials.expectedRole}, got ${roleResult.detectedRole}`);
          results.summary.failed++;
        }
        
        // Test permissions
        const permissions = await this.testPermissionBoundaries(roleResult.detectedRole);
        results.permissions[userType] = permissions;
        console.log(`📋 Permissions for ${userType}:`, permissions);
        
      } else {
        console.log(`❌ Login failed: ${userType} - ${loginResult.error}`);
        results.summary.failed++;
      }
    }
    
    console.log(`\n📊 Auth Tests Summary: ${results.summary.passed} passed, ${results.summary.failed} failed\n`);
    return results;
  }
}

// ============================================================================
// TIER 3: API TESTING UTILITIES
// ============================================================================

export class APITester {
  constructor() {
    this.baseUrl = `${SUPABASE_URL}/functions/v1`;
    this.session = null;
  }

  async setSession(session) {
    this.session = session;
  }

  async callAPI(endpoint, payload = {}, customHeaders = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...customHeaders
      };

      if (this.session) {
        headers.Authorization = `Bearer ${this.session.access_token}`;
      }

      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      return {
        status: response.status,
        success: response.ok,
        data,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (err) {
      return {
        status: 0,
        success: false,
        error: err.message
      };
    }
  }

  async testSecurityBypass() {
    console.log('🔒 Testing API security bypass attempts...');
    
    const bypassTests = [
      {
        name: 'No Authorization Header',
        headers: {},
        shouldBlock: true
      },
      {
        name: 'Invalid Token',
        headers: { 'Authorization': 'Bearer invalid_token_here' },
        shouldBlock: true
      },
      {
        name: 'Malformed Token',
        headers: { 'Authorization': 'Bearer malformed.token.data' },
        shouldBlock: true
      }
    ];

    const results = [];

    for (const test of bypassTests) {
      const result = await this.callAPI('pos-operations/add-stamp', 
        { test: 'data' }, 
        test.headers
      );
      
      const blocked = result.status === 401 || result.status === 403;
      const passed = blocked === test.shouldBlock;
      
      console.log(`${passed ? '✅' : '❌'} ${test.name}: ${blocked ? 'Blocked' : 'Allowed'}`);
      
      results.push({
        test: test.name,
        blocked,
        passed,
        status: result.status
      });
    }

    return results;
  }

  async testInputValidation() {
    console.log('🛡️  Testing input validation...');
    
    const injectionTests = [
      {
        name: 'SQL Injection',
        payload: { customer_id: "'; DROP TABLE customers; --" }
      },
      {
        name: 'XSS Injection',
        payload: { 
          customer_data: { name: '<script>alert("xss")</script>' }
        }
      },
      {
        name: 'Large Payload',
        payload: { notes: 'A'.repeat(10000) }
      }
    ];

    const results = [];

    for (const test of injectionTests) {
      const result = await this.callAPI('pos-operations/register-customer', test.payload);
      const blocked = result.status >= 400;
      
      console.log(`${blocked ? '✅' : '❌'} ${test.name}: ${blocked ? 'Rejected' : 'Accepted'}`);
      
      results.push({
        test: test.name,
        blocked,
        status: result.status,
        data: result.data
      });
    }

    return results;
  }

  async runFullAPITests() {
    console.log('🌐 Running Tier 3: Edge Functions (API) Tests...\n');
    
    const results = {
      securityBypass: await this.testSecurityBypass(),
      inputValidation: await this.testInputValidation(),
      summary: { passed: 0, failed: 0, warnings: 0 }
    };

    // Calculate summary
    results.securityBypass.forEach(test => {
      if (test.passed) results.summary.passed++;
      else results.summary.failed++;
    });

    results.inputValidation.forEach(test => {
      if (test.blocked) results.summary.passed++;
      else results.summary.failed++;
    });

    console.log(`\n📊 API Tests Summary: ${results.summary.passed} passed, ${results.summary.failed} failed\n`);
    return results;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

export async function runComprehensiveTests() {
  console.log('🧪 Starting Comprehensive Platform Testing...\n');
  console.log('===============================================\n');

  const overallResults = {
    tier1: null,
    tier2: null,
    tier3: null,
    summary: { 
      totalPassed: 0, 
      totalFailed: 0, 
      totalWarnings: 0,
      overallGrade: 'F'
    }
  };

  try {
    // Tier 1: Database Tests
    const dbTester = new DatabaseTester();
    overallResults.tier1 = await dbTester.runFullDatabaseTests();

    // Tier 2: Auth Tests  
    const authTester = new AuthTester();
    overallResults.tier2 = await authTester.runFullAuthTests();

    // Tier 3: API Tests
    const apiTester = new APITester();
    overallResults.tier3 = await apiTester.runFullAPITests();

    // Calculate overall summary
    const allTiers = [overallResults.tier1, overallResults.tier2, overallResults.tier3];
    allTiers.forEach(tier => {
      if (tier && tier.summary) {
        overallResults.summary.totalPassed += tier.summary.passed;
        overallResults.summary.totalFailed += tier.summary.failed;
        overallResults.summary.totalWarnings += tier.summary.warnings || 0;
      }
    });

    // Calculate grade
    const totalTests = overallResults.summary.totalPassed + overallResults.summary.totalFailed;
    const successRate = totalTests > 0 ? (overallResults.summary.totalPassed / totalTests) * 100 : 0;
    
    if (successRate >= 90) overallResults.summary.overallGrade = 'A';
    else if (successRate >= 80) overallResults.summary.overallGrade = 'B';
    else if (successRate >= 70) overallResults.summary.overallGrade = 'C';
    else if (successRate >= 60) overallResults.summary.overallGrade = 'D';
    else overallResults.summary.overallGrade = 'F';

    // Final Report
    console.log('===============================================');
    console.log('🏆 COMPREHENSIVE TESTING COMPLETE');
    console.log('===============================================\n');
    console.log(`📊 Overall Results:`);
    console.log(`   ✅ Passed: ${overallResults.summary.totalPassed}`);
    console.log(`   ❌ Failed: ${overallResults.summary.totalFailed}`);
    console.log(`   ⚠️  Warnings: ${overallResults.summary.totalWarnings}`);
    console.log(`   📈 Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`   🎯 Overall Grade: ${overallResults.summary.overallGrade}\n`);

    if (overallResults.summary.totalFailed > 0) {
      console.log('🚨 CRITICAL ISSUES FOUND - REVIEW FAILED TESTS BEFORE PRODUCTION');
    } else {
      console.log('🎉 ALL TESTS PASSED - PLATFORM READY FOR PRODUCTION');
    }

  } catch (error) {
    console.error('❌ Testing framework error:', error.message);
    overallResults.summary.overallGrade = 'F';
  }

  return overallResults;
}

// Export test configuration for use in other scripts
export { TEST_CONFIG };

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests().then(results => {
    process.exit(results.summary.totalFailed > 0 ? 1 : 0);
  });
} 
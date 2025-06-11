#!/usr/bin/env node

/**
 * 🔍 ENVIRONMENT VERIFICATION SCRIPT
 * 
 * This script helps debug environment variable issues in production deployments
 */

console.log('\n🔍 FYDELY - Environment Variables Verification\n');

// Check Node.js environment
console.log('📋 Environment Info:');
console.log(`  Node.js Version: ${process.version}`);
console.log(`  Platform: ${process.platform}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log('');

// Required environment variables for frontend
const REQUIRED_VITE_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

// Optional but recommended variables
const OPTIONAL_VITE_VARS = [
  'VITE_APP_NAME',
  'VITE_APP_URL',
  'VITE_APP_ENV',
  'VITE_PLATFORM_ADMIN_EMAILS',
  'VITE_GALLETTI_ADMIN_EMAILS'
];

// Server-side only variables (should NOT be prefixed with VITE_)
const SERVER_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('🔧 Required VITE_ Variables (Frontend):');
let missingRequired = [];

REQUIRED_VITE_VARS.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value.substring(0, 30)}...`);
    
    // Additional validation
    if (varName === 'VITE_SUPABASE_URL') {
      if (!value.startsWith('https://') || !value.includes('.supabase.co')) {
        console.log(`     ⚠️  Invalid format. Expected: https://project.supabase.co`);
      }
    }
    
    if (varName === 'VITE_SUPABASE_ANON_KEY') {
      if (!value.startsWith('eyJ')) {
        console.log(`     ⚠️  Invalid format. Should start with 'eyJ'`);
      }
    }
  } else {
    console.log(`  ❌ ${varName}: MISSING`);
    missingRequired.push(varName);
  }
});

console.log('\n📝 Optional VITE_ Variables:');
OPTIONAL_VITE_VARS.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value.length > 50 ? value.substring(0, 50) + '...' : value}`);
  } else {
    console.log(`  ⚪ ${varName}: Not set`);
  }
});

console.log('\n🔒 Server-side Variables (Should NOT have VITE_ prefix):');
SERVER_VARS.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`  ⚪ ${varName}: Not set`);
  }
});

// Check for common mistakes
console.log('\n🚨 Common Issues Check:');

// Check for variables without VITE_ prefix
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (supabaseUrl && !process.env.VITE_SUPABASE_URL) {
  console.log('  ⚠️  Found SUPABASE_URL but missing VITE_SUPABASE_URL');
  console.log('     Frontend needs VITE_ prefix for Vite access');
}

if (supabaseKey && !process.env.VITE_SUPABASE_ANON_KEY) {
  console.log('  ⚠️  Found SUPABASE_ANON_KEY but missing VITE_SUPABASE_ANON_KEY');
  console.log('     Frontend needs VITE_ prefix for Vite access');
}

// List all VITE_ variables
const allViteVars = Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .sort();

console.log(`\n📊 All VITE_ Variables Found (${allViteVars.length}):`);
if (allViteVars.length === 0) {
  console.log('  ❌ No VITE_ variables found!');
  console.log('     This suggests environment variables are not properly configured.');
} else {
  allViteVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`  • ${varName}: ${value?.substring(0, 20) || 'empty'}...`);
  });
}

// Final status
console.log('\n' + '='.repeat(60));

if (missingRequired.length === 0) {
  console.log('✅ SUCCESS: All required environment variables are configured!');
  console.log('\n🚀 You can proceed with deployment.');
} else {
  console.log('❌ FAILURE: Missing required environment variables!');
  console.log('\n🔧 ACTION REQUIRED:');
  console.log('1. Add these variables to your Netlify environment settings:');
  missingRequired.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n2. Ensure variables have the exact VITE_ prefix');
  console.log('3. Trigger a new deploy (not just redeploy)');
  console.log('4. Check both Production and Deploy Preview contexts');
}

console.log('\n📚 For more help, see:');
console.log('  • Netlify Environment Variables: https://docs.netlify.com/environment-variables/overview/');
console.log('  • Vite Environment Variables: https://vitejs.dev/guide/env-and-mode.html');
console.log('');

// Exit with appropriate code
process.exit(missingRequired.length === 0 ? 0 : 1); 
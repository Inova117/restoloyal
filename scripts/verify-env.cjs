#!/usr/bin/env node

/**
 * 🔍 ENVIRONMENT VERIFICATION SCRIPT
 * 
 * This script helps debug environment variable issues in production deployments
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 FYDELY - Environment Variables Verification\n');

// Function to load .env files manually
function loadEnvFile(filePath) {
  const envVars = {};
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // Remove quotes if present
          const cleanValue = value.replace(/^["']|["']$/g, '');
          envVars[key.trim()] = cleanValue;
        }
      }
    }
  }
  return envVars;
}

// Load environment variables from various sources
let allEnv = { ...process.env };

// Try to load .env files in order of precedence
const envFiles = [
  '.env.local',
  '.env.development.local',
  '.env.development',
  '.env'
];

console.log('📁 Loading environment files:');
for (const envFile of envFiles) {
  const filePath = path.join(process.cwd(), envFile);
  if (fs.existsSync(filePath)) {
    const envVars = loadEnvFile(filePath);
    const viteVars = Object.keys(envVars).filter(key => key.startsWith('VITE_'));
    console.log(`  ✅ ${envFile}: Found ${viteVars.length} VITE_ variables`);
    allEnv = { ...allEnv, ...envVars };
  } else {
    console.log(`  ⚪ ${envFile}: Not found`);
  }
}

// Try to load with Vite's loadEnv as fallback
try {
  const vite = require('vite');
  const viteEnv = vite.loadEnv('development', process.cwd(), 'VITE_');
  allEnv = { ...allEnv, ...viteEnv };
  console.log('  ✅ Vite loadEnv: Successfully loaded additional variables');
} catch (error) {
  console.log('  ⚪ Vite loadEnv: Not available (this is normal)');
}

console.log('');

// Check Node.js environment
console.log('📋 Environment Info:');
console.log(`  Node.js Version: ${process.version}`);
console.log(`  Platform: ${process.platform}`);
console.log(`  NODE_ENV: ${allEnv.NODE_ENV || 'undefined'}`);
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
  const value = allEnv[varName];
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
  const value = allEnv[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value.length > 50 ? value.substring(0, 50) + '...' : value}`);
  } else {
    console.log(`  ⚪ ${varName}: Not set`);
  }
});

console.log('\n🔒 Server-side Variables (Should NOT have VITE_ prefix):');
SERVER_VARS.forEach(varName => {
  const value = allEnv[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`  ⚪ ${varName}: Not set`);
  }
});

// Check for common mistakes
console.log('\n🚨 Common Issues Check:');

// Check for variables without VITE_ prefix
const supabaseUrl = allEnv.SUPABASE_URL;
const supabaseKey = allEnv.SUPABASE_ANON_KEY;

if (supabaseUrl && !allEnv.VITE_SUPABASE_URL) {
  console.log('  ⚠️  Found SUPABASE_URL but missing VITE_SUPABASE_URL');
  console.log('     Frontend needs VITE_ prefix for Vite access');
}

if (supabaseKey && !allEnv.VITE_SUPABASE_ANON_KEY) {
  console.log('  ⚠️  Found SUPABASE_ANON_KEY but missing VITE_SUPABASE_ANON_KEY');
  console.log('     Frontend needs VITE_ prefix for Vite access');
}

// List all VITE_ variables
const allViteVars = Object.keys(allEnv)
  .filter(key => key.startsWith('VITE_'))
  .sort();

console.log(`\n📊 All VITE_ Variables Found (${allViteVars.length}):`);
if (allViteVars.length === 0) {
  console.log('  ❌ No VITE_ variables found!');
  console.log('     This suggests environment variables are not properly configured.');
} else {
  allViteVars.forEach(varName => {
    const value = allEnv[varName];
    console.log(`  • ${varName}: ${value?.substring(0, 20) || 'empty'}...`);
  });
}

// Final status
console.log('\n' + '='.repeat(60));

if (missingRequired.length === 0) {
  console.log('✅ SUCCESS: All required environment variables are configured!');
  console.log('\n🚀 You can proceed with deployment.');
  
  // Additional success info
  console.log('\n📋 Configuration Summary:');
  console.log(`  • Supabase URL: ${allEnv.VITE_SUPABASE_URL?.substring(0, 40)}...`);
  console.log(`  • Anon Key: ${allEnv.VITE_SUPABASE_ANON_KEY ? 'Configured' : 'Missing'}`);
  console.log(`  • Total VITE_ vars: ${allViteVars.length}`);
} else {
  console.log('❌ FAILURE: Missing required environment variables!');
  console.log('\n🔧 ACTION REQUIRED:');
  
  if (fs.existsSync('.env.local')) {
    console.log('Local development:');
    console.log('1. Check your .env.local file for typos');
    console.log('2. Ensure variable names are exactly: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  } else {
    console.log('Local development:');
    console.log('1. Create a .env.local file with:');
    console.log('   VITE_SUPABASE_URL=https://your-project.supabase.co');
    console.log('   VITE_SUPABASE_ANON_KEY=your_anon_key_here');
  }
  
  console.log('\nNetlify deployment:');
  console.log('1. Add these variables to your Netlify environment settings:');
  missingRequired.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('2. Ensure variables have the exact VITE_ prefix');
  console.log('3. Trigger a new deploy (not just redeploy)');
  console.log('4. Check both Production and Deploy Preview contexts');
}

console.log('\n📚 For more help, see:');
console.log('  • Netlify Environment Variables: https://docs.netlify.com/environment-variables/overview/');
console.log('  • Vite Environment Variables: https://vitejs.dev/guide/env-and-mode.html');
console.log('');

// Exit with appropriate code
process.exit(missingRequired.length === 0 ? 0 : 1); 
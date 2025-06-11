#!/usr/bin/env node

/**
 * Simple Environment Variables Checker
 * No external dependencies - works in any Node.js environment
 */

console.log('\n🔍 Environment Variables Check\n');

// Required environment variables
const REQUIRED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

let hasErrors = false;

console.log('📋 Checking required variables...\n');

// Check required variables
REQUIRED_VARS.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: MISSING`);
    hasErrors = true;
  } else {
    // Mask sensitive values for security
    const maskedValue = varName.includes('KEY') ? 
      value.substring(0, 8) + '...[MASKED]' : 
      value;
    console.log(`✅ ${varName}: ${maskedValue}`);
  }
});

// Build environment info
console.log('\n🏗️ Build Environment Info:');
console.log(`📦 Node Version: ${process.version}`);
console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`⚙️ CI: ${process.env.CI ? 'Yes' : 'No'}`);
console.log(`🏢 Netlify: ${process.env.NETLIFY ? 'Yes' : 'No'}`);

// Show all VITE_ variables (for debugging)
const viteVars = Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .sort();

console.log('\n🔧 All VITE_ variables found:');
if (viteVars.length === 0) {
  console.log('❌ No VITE_ variables found!');
  hasErrors = true;
} else {
  viteVars.forEach(varName => {
    const value = process.env[varName];
    const maskedValue = varName.includes('KEY') || varName.includes('SECRET') ? 
      '***[MASKED]***' : 
      value;
    console.log(`   ${varName}: ${maskedValue}`);
  });
}

// Final result
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ BUILD CHECK FAILED!');
  console.log('\n🚨 Missing required environment variables.');
  console.log('\n💡 To fix this:');
  console.log('1. Go to Netlify Dashboard → Site Settings → Environment Variables');
  console.log('2. Add the missing VITE_SUPABASE_* variables');
  console.log('3. Trigger a new deploy');
  console.log('\n📖 See NETLIFY_CONFIG_GUIDE.md for detailed instructions');
  process.exit(1);
} else {
  console.log('✅ BUILD CHECK PASSED!');
  console.log('\n🎉 All required environment variables are present.');
  console.log('\n🚀 Proceeding with build...');
}

console.log('='.repeat(50) + '\n'); 
#!/usr/bin/env node

/**
 * Environment Variables Build Checker
 * Verifies that required environment variables are present during build time
 */

const chalk = require('chalk');

console.log(chalk.blue.bold('\n🔍 Environment Variables Build Check\n'));

// Required environment variables
const REQUIRED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

// Optional but recommended variables
const OPTIONAL_VARS = [
  'VITE_APP_NAME',
  'VITE_APP_URL',
  'VITE_APP_ENV'
];

let hasErrors = false;

console.log(chalk.yellow('📋 Checking required variables...\n'));

// Check required variables
REQUIRED_VARS.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(chalk.red(`❌ ${varName}: MISSING`));
    hasErrors = true;
  } else {
    // Mask sensitive values for security
    const maskedValue = varName.includes('KEY') ? 
      value.substring(0, 10) + '...[MASKED]' : 
      value;
    console.log(chalk.green(`✅ ${varName}: ${maskedValue}`));
  }
});

console.log(chalk.yellow('\n📋 Checking optional variables...\n'));

// Check optional variables
OPTIONAL_VARS.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(chalk.gray(`⚪ ${varName}: not set (optional)`));
  } else {
    console.log(chalk.green(`✅ ${varName}: ${value}`));
  }
});

// Build environment info
console.log(chalk.yellow('\n🏗️  Build Environment Info:\n'));
console.log(`📦 Node Version: ${process.version}`);
console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`⚙️  CI: ${process.env.CI ? 'Yes' : 'No'}`);
console.log(`🏢 Netlify: ${process.env.NETLIFY ? 'Yes' : 'No'}`);

// Vite-specific environment check
const viteVars = Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .sort();

console.log(chalk.yellow('\n🔧 All VITE_ variables found:\n'));
if (viteVars.length === 0) {
  console.log(chalk.red('❌ No VITE_ variables found!'));
  hasErrors = true;
} else {
  viteVars.forEach(varName => {
    const value = process.env[varName];
    const maskedValue = varName.includes('KEY') || varName.includes('SECRET') ? 
      '***[MASKED]***' : 
      value;
    console.log(chalk.cyan(`   ${varName}: ${maskedValue}`));
  });
}

// Final result
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log(chalk.red.bold('❌ BUILD CHECK FAILED!'));
  console.log(chalk.red('\n🚨 Missing required environment variables.'));
  console.log(chalk.yellow('\n💡 To fix this:'));
  console.log(chalk.white('1. Go to Netlify Dashboard → Site Settings → Environment Variables'));
  console.log(chalk.white('2. Add the missing VITE_SUPABASE_* variables'));
  console.log(chalk.white('3. Trigger a new deploy'));
  console.log(chalk.white('\n📖 See NETLIFY_CONFIG_GUIDE.md for detailed instructions'));
  process.exit(1);
} else {
  console.log(chalk.green.bold('✅ BUILD CHECK PASSED!'));
  console.log(chalk.green('\n🎉 All required environment variables are present.'));
  console.log(chalk.blue('\n🚀 Proceeding with build...'));
}

console.log('='.repeat(50) + '\n'); 
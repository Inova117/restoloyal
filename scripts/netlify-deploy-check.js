#!/usr/bin/env node

/**
 * Netlify Deployment Verification Script
 * Checks environment configuration and build readiness
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 NETLIFY DEPLOYMENT VERIFICATION');
console.log('=====================================\n');

// Required environment variables for production
const REQUIRED_VITE_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

// Optional but recommended variables
const OPTIONAL_VITE_VARS = [
  'VITE_PLATFORM_ADMIN_EMAILS',
  'VITE_GALLETTI_ADMIN_EMAILS',
  'VITE_APP_URL',
  'VITE_OPENAI_API_KEY'
];

function checkRequiredFiles() {
  console.log('📁 Checking Required Files...');
  
  const requiredFiles = [
    'package.json',
    'vite.config.ts', 
    'index.html',
    'src/main.tsx'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - MISSING!`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

function checkPackageJson() {
  console.log('\n📦 Checking package.json...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check build script
    if (packageJson.scripts && packageJson.scripts.build) {
      console.log(`   ✅ Build script: ${packageJson.scripts.build}`);
    } else {
      console.log('   ❌ Missing build script!');
      return false;
    }
    
    // Check preview script for testing
    if (packageJson.scripts && packageJson.scripts.preview) {
      console.log(`   ✅ Preview script: ${packageJson.scripts.preview}`);
    } else {
      console.log('   ⚠️  No preview script (optional)');
    }
    
    return true;
  } catch (error) {
    console.log('   ❌ Invalid package.json!');
    return false;
  }
}

function checkGitignore() {
  console.log('\n🔒 Checking .gitignore...');
  
  if (!fs.existsSync('.gitignore')) {
    console.log('   ❌ .gitignore missing!');
    return false;
  }
  
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  
  const requiredIgnores = ['.env', 'dist', 'node_modules'];
  let allIgnored = true;
  
  requiredIgnores.forEach(item => {
    if (gitignore.includes(item)) {
      console.log(`   ✅ ${item} ignored`);
    } else {
      console.log(`   ❌ ${item} NOT ignored!`);
      allIgnored = false;
    }
  });
  
  return allIgnored;
}

function checkEnvTemplate() {
  console.log('\n📋 Checking env.example...');
  
  if (!fs.existsSync('env.example')) {
    console.log('   ⚠️  No env.example found (recommended)');
    return true;
  }
  
  const envExample = fs.readFileSync('env.example', 'utf8');
  let hasAllRequired = true;
  
  REQUIRED_VITE_VARS.forEach(varName => {
    if (envExample.includes(varName)) {
      console.log(`   ✅ ${varName} documented`);
    } else {
      console.log(`   ❌ ${varName} missing from template!`);
      hasAllRequired = false;
    }
  });
  
  return hasAllRequired;
}

function generateNetlifyInstructions() {
  console.log('\n🌐 NETLIFY DEPLOYMENT INSTRUCTIONS');
  console.log('====================================\n');
  
  console.log('1. 🔧 NETLIFY SITE SETTINGS:');
  console.log('   • Build command: npm run build');
  console.log('   • Publish directory: dist');
  console.log('   • Node version: 18 or higher\n');
  
  console.log('2. 🔑 REQUIRED ENVIRONMENT VARIABLES:');
  console.log('   Go to Site Settings > Environment variables and add:');
  
  REQUIRED_VITE_VARS.forEach(varName => {
    console.log(`   • ${varName}=your_value_here`);
  });
  
  console.log('\n3. 🎯 OPTIONAL ENVIRONMENT VARIABLES:');
  OPTIONAL_VITE_VARS.forEach(varName => {
    console.log(`   • ${varName}=your_value_here`);
  });
  
  console.log('\n4. 🚀 DEPLOYMENT STEPS:');
  console.log('   1. Connect your GitHub repo to Netlify');
  console.log('   2. Set environment variables in Netlify UI');
  console.log('   3. Deploy site');
  console.log('   4. If env vars were added after deploy: "Clear cache and deploy site"');
  
  console.log('\n5. 🐛 DEBUGGING:');
  console.log('   • Open deployed app in browser');
  console.log('   • Open console and type: console.log(import.meta.env)');
  console.log('   • Verify your VITE_ variables appear');
  console.log('   • If undefined: redeploy after setting env vars\n');
}

function generateTestCommands() {
  console.log('🧪 LOCAL TESTING COMMANDS');
  console.log('=========================\n');
  
  console.log('Test build locally:');
  console.log('  npm run build');
  console.log('  npm run preview\n');
  
  console.log('Check environment variables:');
  console.log('  node -e "console.log(Object.keys(process.env).filter(k => k.startsWith(\'VITE_\')))"');
}

// Run all checks
function main() {
  let allChecksPass = true;
  
  allChecksPass = checkRequiredFiles() && allChecksPass;
  allChecksPass = checkPackageJson() && allChecksPass;
  allChecksPass = checkGitignore() && allChecksPass;
  allChecksPass = checkEnvTemplate() && allChecksPass;
  
  console.log('\n📊 VERIFICATION SUMMARY');
  console.log('=======================');
  
  if (allChecksPass) {
    console.log('✅ All checks passed! Ready for Netlify deployment.\n');
  } else {
    console.log('❌ Some checks failed. Please fix issues before deploying.\n');
  }
  
  generateNetlifyInstructions();
  generateTestCommands();
  
  console.log('💡 TROUBLESHOOTING TIPS:');
  console.log('• Environment variables must be set in Netlify UI BEFORE deployment');
  console.log('• Use "Clear cache and deploy site" if you added env vars after first deploy');
  console.log('• Verify no typos in variable names (case-sensitive)');
  console.log('• Check browser console for import.meta.env values');
  console.log('• All variables must start with VITE_ to be available in frontend\n');
}

main(); 
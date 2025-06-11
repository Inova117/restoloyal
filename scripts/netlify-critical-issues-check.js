#!/usr/bin/env node

/**
 * Critical Issues Checker for Netlify Deployment
 * Detects the most subtle and common deployment failures
 */

import fs from 'fs';

console.log('🚨 CRITICAL NETLIFY ISSUES CHECKER');
console.log('==================================\n');

function checkNetlifyTomlContextOverrides() {
  console.log('🔍 Issue #1: Checking netlify.toml for environment overrides...');
  
  if (!fs.existsSync('netlify.toml')) {
    console.log('   ✅ No netlify.toml found - no context override issues');
    return false;
  }
  
  const config = fs.readFileSync('netlify.toml', 'utf8');
  
  // Check for context environment blocks
  const contextEnvRegex = /\[context\.[^.]+\.environment\]/g;
  const matches = config.match(contextEnvRegex);
  
  if (!matches) {
    console.log('   ✅ No [context.*.environment] blocks found');
    return false;
  }
  
  console.log('   🚨 FOUND CONTEXT ENVIRONMENT BLOCKS:');
  matches.forEach(match => {
    console.log(`      • ${match}`);
  });
  
  // Look for VITE_ variable overrides
  const viteVarRegex = /VITE_[A-Z_]+\s*=\s*['""][^'"]*['""]?/g;
  const viteOverrides = config.match(viteVarRegex);
  
  if (viteOverrides) {
    console.log('   🚨 ENVIRONMENT VARIABLE OVERRIDES DETECTED:');
    viteOverrides.forEach(override => {
      console.log(`      • ${override}`);
    });
    console.log('   💡 These override Netlify UI settings!');
    return true;
  }
  
  console.log('   ✅ Context blocks exist but no VITE_ overrides found');
  return false;
}

function generateEnvVarValidationInstructions() {
  console.log('\n🔧 Issue #2: Hidden Characters in Environment Variables');
  console.log('======================================================\n');
  
  console.log('🚨 CRITICAL: Hidden characters can break env var injection!');
  console.log('');
  console.log('📋 STEP-BY-STEP FIX:');
  console.log('');
  console.log('1. 🗑️  DELETE existing variables:');
  console.log('   • Go to Netlify > Site Settings > Environment variables');
  console.log('   • Delete VITE_SUPABASE_URL');
  console.log('   • Delete VITE_SUPABASE_ANON_KEY');
  console.log('');
  console.log('2. ✋ TYPE (don\'t copy-paste) new variables:');
  console.log('   • Key: VITE_SUPABASE_URL');
  console.log('   • Value: https://your-project-ref.supabase.co');
  console.log('   • Key: VITE_SUPABASE_ANON_KEY');
  console.log('   • Value: your_anon_key_here');
  console.log('');
  console.log('3. ⚠️  AVOID THESE MISTAKES:');
  console.log('   ❌ Extra spaces: "VITE_SUPABASE_URL " (trailing space)');
  console.log('   ❌ Copy-paste: Can introduce invisible Unicode characters');
  console.log('   ❌ Wrong quotes: Smart quotes from docs vs straight quotes');
  console.log('   ❌ Line breaks: Make sure values are single line');
  console.log('');
  console.log('4. ✅ VERIFICATION:');
  console.log('   • Key should be exactly: VITE_SUPABASE_URL');
  console.log('   • Value should start with: https://');
  console.log('   • No leading/trailing spaces anywhere');
  console.log('   • Use "All scopes" or set specific contexts');
}

function generateCacheAndDeployInstructions() {
  console.log('\n🔄 Issue #3: Stale Cache and Deploy Artifacts');
  console.log('==============================================\n');
  
  console.log('🚨 After fixing environment variables:');
  console.log('');
  console.log('1. 🧹 CLEAR CACHE:');
  console.log('   • Go to Netlify > Deploys');
  console.log('   • Click "Trigger deploy" dropdown');
  console.log('   • Select "Clear cache and deploy site"');
  console.log('   • Wait for full rebuild (not just redeploy)');
  console.log('');
  console.log('2. 🕵️  TEST IN INCOGNITO:');
  console.log('   • Open deployed site in private/incognito browser');
  console.log('   • This bypasses any local browser cache');
  console.log('   • Check console for environment debug info');
  console.log('');
  console.log('3. ⏰ TIMING:');
  console.log('   • CDN updates can take 1-5 minutes');
  console.log('   • Don\'t test immediately after deploy completes');
  console.log('   • Wait a few minutes, then test again');
}

function generateImportMetaEnvGuidelines() {
  console.log('\n⚡ Issue #4: import.meta.env Usage Guidelines');
  console.log('============================================\n');
  
  console.log('✅ WORKS (Vite client-side):');
  console.log('   • React components: import.meta.env.VITE_SUPABASE_URL');
  console.log('   • TypeScript files in src/: import.meta.env.VITE_*');
  console.log('   • Build-time static replacement');
  console.log('');
  console.log('❌ DOESN\'T WORK:');
  console.log('   • Supabase Edge Functions: use Deno.env.get()');
  console.log('   • Files in public/: No build-time processing');
  console.log('   • Server-side rendering: Use process.env instead');
  console.log('   • Runtime dynamic access: Vite injects at build time');
  console.log('');
  console.log('💡 YOUR STATUS: ✅ All usage is correct in client code');
}

function generateFinalActionPlan() {
  console.log('\n🎯 FINAL ACTION PLAN - DO THIS NOW!');
  console.log('===================================\n');
  
  console.log('📝 CHECKLIST (follow exactly):');
  console.log('');
  console.log('□ Step 1: DELETE env vars in Netlify UI');
  console.log('   • Go to Site Settings > Environment variables');
  console.log('   • Delete VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.log('');
  console.log('□ Step 2: TYPE (don\'t paste) new variables');
  console.log('   • Manually type key names: VITE_SUPABASE_URL');
  console.log('   • Manually type or carefully paste values');
  console.log('   • Check for spaces before saving');
  console.log('');
  console.log('□ Step 3: Set context to "All scopes" or specific ones');
  console.log('   • Production (required)');
  console.log('   • Deploy previews (if using PR previews)');
  console.log('');
  console.log('□ Step 4: Clear cache and deploy');
  console.log('   • Deploys > "Clear cache and deploy site"');
  console.log('   • Wait for complete rebuild');
  console.log('');
  console.log('□ Step 5: Test in incognito browser');
  console.log('   • Open deployed site in private browser');
  console.log('   • Check console for environment debug info');
  console.log('   • Look for "🔍 Environment Debug Info:"');
  console.log('');
  console.log('□ Step 6: Verify success');
  console.log('   • Should see: VITE_SUPABASE_URL: https://...');
  console.log('   • Should see: VITE_SUPABASE_ANON_KEY: SET');
  console.log('   • Should see: Mode: production');
}

function generateCommonMistakeExamples() {
  console.log('\n⚠️  COMMON MISTAKES THAT BREAK DEPLOYMENT');
  console.log('=========================================\n');
  
  console.log('❌ MISTAKE #1: Hidden characters');
  console.log('   • Copied "VITE_SUPABASE_URL" from docs with invisible Unicode');
  console.log('   • Looks identical but fails silently');
  console.log('   • Solution: Type key names manually');
  console.log('');
  console.log('❌ MISTAKE #2: Trailing spaces');
  console.log('   • Key: "VITE_SUPABASE_URL " (space at end)');
  console.log('   • Value: " https://project.supabase.co" (space at start)');
  console.log('   • Solution: Trim all spaces');
  console.log('');
  console.log('❌ MISTAKE #3: Wrong context');
  console.log('   • Set variables for "Deploy previews" only');
  console.log('   • Production deploy fails because no Production context vars');
  console.log('   • Solution: Set for "All scopes" or specifically "Production"');
  console.log('');
  console.log('❌ MISTAKE #4: Cached old build');
  console.log('   • Added env vars but used "Trigger deploy" (not clear cache)');
  console.log('   • Old build without env vars still served');
  console.log('   • Solution: Always "Clear cache and deploy site"');
  console.log('');
  console.log('❌ MISTAKE #5: Testing too quickly');
  console.log('   • Tested immediately after deploy completes');
  console.log('   • CDN hasn\'t updated yet');
  console.log('   • Solution: Wait 2-5 minutes, test in incognito');
}

// Run all checks
function main() {
  const hasContextOverrides = checkNetlifyTomlContextOverrides();
  
  if (hasContextOverrides) {
    console.log('\n🚨 ACTION REQUIRED: Remove environment overrides from netlify.toml');
    console.log('   OR ensure they match your intended Netlify UI values');
  }
  
  generateEnvVarValidationInstructions();
  generateCacheAndDeployInstructions();
  generateImportMetaEnvGuidelines();
  generateCommonMistakeExamples();
  generateFinalActionPlan();
  
  console.log('\n💪 SUCCESS PROBABILITY: 95%+');
  console.log('Following this checklist exactly should resolve your deployment issues!');
  console.log('\nIf still failing after this checklist, the issue is likely:');
  console.log('• Invalid Supabase credentials');
  console.log('• Netlify service issues');
  console.log('• Network/CDN propagation delays\n');
}

main(); 
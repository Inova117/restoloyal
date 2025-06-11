#!/usr/bin/env node

/**
 * Advanced Netlify Deployment Checker
 * Covers monorepo, base directory, and build context issues
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 ADVANCED NETLIFY DEPLOYMENT ANALYSIS');
console.log('==========================================\n');

function checkMonorepoStructure() {
  console.log('📁 Checking Monorepo/Base Directory Structure...');
  
  const currentPath = process.cwd();
  const hasParentPackageJson = fs.existsSync('../package.json');
  const hasWorkspaces = fs.existsSync('../packages') || fs.existsSync('../apps');
  const pathSegments = currentPath.split('/');
  const projectName = pathSegments[pathSegments.length - 1];
  
  console.log(`   📍 Current directory: ${currentPath}`);
  console.log(`   📂 Project name: ${projectName}`);
  
  if (hasParentPackageJson) {
    console.log('   ⚠️  Parent package.json detected - possible monorepo!');
    
    try {
      const parentPkg = JSON.parse(fs.readFileSync('../package.json', 'utf8'));
      if (parentPkg.workspaces) {
        console.log('   🏗️  Monorepo workspaces detected:', parentPkg.workspaces);
        console.log('   🚨 NETLIFY BASE DIRECTORY REQUIRED!');
        return {
          isMonorepo: true,
          suggestedBaseDir: projectName,
          parentWorkspaces: parentPkg.workspaces
        };
      }
    } catch (error) {
      console.log('   ❌ Could not read parent package.json');
    }
  }
  
  if (hasWorkspaces) {
    console.log('   ⚠️  Workspace-like structure detected (packages/ or apps/)');
  }
  
  console.log('   ✅ Standard single-project structure');
  return { isMonorepo: false };
}

function checkNetlifyConfig() {
  console.log('\n🌐 Checking netlify.toml Configuration...');
  
  if (!fs.existsSync('netlify.toml')) {
    console.log('   ⚪ No netlify.toml found (using Netlify UI settings)');
    return null;
  }
  
  const config = fs.readFileSync('netlify.toml', 'utf8');
  console.log('   ✅ netlify.toml found');
  
  // Check for context-specific environment overrides
  const contextMatches = config.match(/\[context\.(.*?)\]/g);
  if (contextMatches) {
    console.log('   📋 Build contexts found:');
    contextMatches.forEach(match => {
      console.log(`      • ${match}`);
    });
    
    if (config.includes('[context.production.environment]')) {
      console.log('   🚨 Production environment override detected!');
      console.log('      This may override Netlify UI environment variables');
    }
  }
  
  // Check build command
  const buildCommandMatch = config.match(/command\s*=\s*"([^"]+)"/);
  if (buildCommandMatch) {
    console.log(`   🔧 Build command: ${buildCommandMatch[1]}`);
  }
  
  // Check publish directory
  const publishMatch = config.match(/publish\s*=\s*"([^"]+)"/);
  if (publishMatch) {
    console.log(`   📂 Publish directory: ${publishMatch[1]}`);
  }
  
  return config;
}

function checkBuildOutputDirectories() {
  console.log('\n📦 Checking Build Output Directories...');
  
  const possibleOutputDirs = ['dist', 'build', 'out', '.next'];
  const existingDirs = possibleOutputDirs.filter(dir => fs.existsSync(dir));
  
  if (existingDirs.length === 0) {
    console.log('   ⚪ No build output directories found (normal for pre-build)');
    return;
  }
  
  console.log('   📁 Existing build directories:');
  existingDirs.forEach(dir => {
    const stats = fs.statSync(dir);
    console.log(`      • ${dir}/ (modified: ${stats.mtime.toISOString()})`);
  });
  
  if (existingDirs.length > 1) {
    console.log('   ⚠️  Multiple build directories detected!');
    console.log('      Ensure Netlify publish directory points to correct one');
  }
}

function checkProcessEnvUsage() {
  console.log('\n🔍 Scanning for process.env Usage...');
  
  const srcPath = 'src';
  if (!fs.existsSync(srcPath)) {
    console.log('   ❌ src/ directory not found');
    return;
  }
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const issues = [];
    
    files.forEach(file => {
      if (file.isDirectory() && file.name !== 'node_modules') {
        issues.push(...scanDirectory(path.join(dir, file.name)));
      } else if (file.name.match(/\.(ts|tsx|js|jsx)$/)) {
        const filePath = path.join(dir, file.name);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Look for process.env usage in frontend code
        const processEnvMatches = content.match(/process\.env\.[A-Z_]+/g);
        if (processEnvMatches) {
          issues.push({
            file: filePath,
            matches: processEnvMatches
          });
        }
      }
    });
    
    return issues;
  }
  
  const issues = scanDirectory(srcPath);
  
  if (issues.length === 0) {
    console.log('   ✅ No process.env usage found in frontend code');
  } else {
    console.log('   🚨 process.env usage found in frontend code:');
    issues.forEach(issue => {
      console.log(`      • ${issue.file}:`);
      issue.matches.forEach(match => {
        console.log(`        - ${match}`);
      });
    });
    console.log('   💡 Replace with import.meta.env for Vite compatibility');
  }
}

function generateDebugComponent() {
  console.log('\n🧪 Generating Debug Component...');
  
  const debugComponent = `// Debug component to verify environment variables in production
// Add this to any component and check browser console after deployment

import { useEffect } from 'react';

export function EnvironmentDebugger() {
  useEffect(() => {
    console.log('🔍 Environment Debug Info:');
    console.log('Mode:', import.meta.env.MODE);
    console.log('Dev:', import.meta.env.DEV);
    console.log('Prod:', import.meta.env.PROD);
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
    console.log('All VITE_ vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
    console.log('Full import.meta.env:', import.meta.env);
  }, []);

  // Only show in development or if env vars are missing
  if (import.meta.env.PROD && import.meta.env.VITE_SUPABASE_URL) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      background: 'red',
      color: 'white',
      padding: '10px',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      🔍 ENV DEBUG: Check Console
    </div>
  );
}`;
  
  const debugPath = 'src/components/EnvironmentDebugger.tsx';
  
  try {
    // Create components directory if it doesn't exist
    if (!fs.existsSync('src/components')) {
      fs.mkdirSync('src/components', { recursive: true });
    }
    
    fs.writeFileSync(debugPath, debugComponent);
    console.log(`   ✅ Debug component created: ${debugPath}`);
    console.log('   💡 Import and use this component to debug env vars in production');
  } catch (error) {
    console.log('   ❌ Could not create debug component:', error.message);
  }
}

function generateNetlifyInstructions(monorepoInfo) {
  console.log('\n🚀 NETLIFY CONFIGURATION INSTRUCTIONS');
  console.log('======================================\n');
  
  if (monorepoInfo.isMonorepo) {
    console.log('🏗️  MONOREPO CONFIGURATION:');
    console.log('   1. Go to Netlify > Site settings > Build & deploy > Build settings');
    console.log(`   2. Set Base directory: ${monorepoInfo.suggestedBaseDir}`);
    console.log('   3. Set Build command: npm run build');
    console.log('   4. Set Publish directory: dist');
    console.log('   5. Ensure environment variables are set in correct context\n');
  }
  
  console.log('🔧 BUILD SETTINGS:');
  console.log('   • Build command: npm run build');
  console.log('   • Publish directory: dist');
  console.log('   • Node version: 18+');
  if (monorepoInfo.isMonorepo) {
    console.log(`   • Base directory: ${monorepoInfo.suggestedBaseDir}`);
  }
  
  console.log('\n🔑 ENVIRONMENT VARIABLES:');
  console.log('   Required:');
  console.log('   • VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('   • VITE_SUPABASE_ANON_KEY=your_anon_key');
  
  console.log('\n📋 CONTEXT SETTINGS:');
  console.log('   Ensure variables are set for:');
  console.log('   • Production');
  console.log('   • Deploy previews (if used)');
  console.log('   • Branch deploys (if used)');
  
  console.log('\n🐛 DEBUGGING STEPS:');
  console.log('   1. Deploy with debug component included');
  console.log('   2. Open deployed site in browser');
  console.log('   3. Check console for environment debug info');
  console.log('   4. If variables missing: Clear cache and redeploy');
  
  console.log('\n⚡ TROUBLESHOOTING CHECKLIST:');
  console.log('   □ Base directory set correctly (if monorepo)');
  console.log('   □ Environment variables set in Netlify UI');
  console.log('   □ No netlify.toml context overrides');
  console.log('   □ No process.env usage in frontend code');
  console.log('   □ Correct publish directory (dist)');
  console.log('   □ Clear cache after env var changes');
}

// Run all checks
function main() {
  const monorepoInfo = checkMonorepoStructure();
  checkNetlifyConfig();
  checkBuildOutputDirectories();
  checkProcessEnvUsage();
  generateDebugComponent();
  generateNetlifyInstructions(monorepoInfo);
  
  console.log('\n💡 QUICK VERIFICATION:');
  console.log('   Run: node scripts/netlify-deploy-check.js');
  console.log('   Then: npm run build (should succeed with proper env vars)');
  console.log('   Finally: Deploy and check browser console\n');
}

main(); 
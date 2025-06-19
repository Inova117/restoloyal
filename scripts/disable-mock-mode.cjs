#!/usr/bin/env node

/**
 * 🔄 Disable Mock Mode Script
 * 
 * This script helps you disable MOCK_MODE in your hooks when Edge Functions are deployed.
 * Run this after deploying the corresponding Edge Functions.
 */

const fs = require('fs');
const path = require('path');

// Hook files that can have MOCK_MODE disabled
const HOOK_FILES = [
  {
    file: 'src/hooks/useStaffManager.ts',
    edgeFunction: 'staff-manager',
    status: '✅ DEPLOYED', // Already has Edge Function
    description: 'Staff invitation and role management'
  },
  {
    file: 'src/hooks/useCustomerManager.ts',
    edgeFunction: 'customer-manager', 
    status: '✅ DEPLOYED', // Already has Edge Function
    description: 'Customer CRUD operations and loyalty tracking'
  },
  {
    file: 'src/hooks/useLocationManager.ts',
    edgeFunction: 'location-manager',
    status: '⏳ PENDING', // Needs Edge Function
    description: 'Location management and hierarchy'
  },
  {
    file: 'src/hooks/useLoyaltyManager.ts',
    edgeFunction: 'loyalty-manager',
    status: '⏳ PENDING', // Needs Edge Function  
    description: 'Stamps and rewards management'
  },
  {
    file: 'src/hooks/usePOSOperations.ts',
    edgeFunction: 'pos-operations',
    status: '⏳ PENDING', // Needs Edge Function
    description: 'Point of sale operations'
  },
  {
    file: 'src/hooks/useAnalyticsManager.ts',
    edgeFunction: 'analytics-manager',
    status: '⏳ PENDING', // Needs Edge Function
    description: 'Analytics and reporting'
  },
  {
    file: 'src/hooks/useDataExport.ts',
    edgeFunction: 'data-export',
    status: '⏳ PENDING', // Needs Edge Function
    description: 'Data export functionality'
  },
  {
    file: 'src/hooks/useNotificationCampaigns.ts',
    edgeFunction: 'notification-campaigns',
    status: '⏳ PENDING', // Needs Edge Function
    description: 'Push notification campaigns'
  }
];

function checkMockModeStatus() {
  console.log('🔍 MOCK MODE STATUS REPORT\n');
  console.log('═'.repeat(80));
  
  HOOK_FILES.forEach(({ file, edgeFunction, status, description }) => {
    const filePath = path.join(process.cwd(), file);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const mockModeMatch = content.match(/const MOCK_MODE = (true|false)/);
      
      if (mockModeMatch) {
        const isEnabled = mockModeMatch[1] === 'true';
        const mockStatus = isEnabled ? '🟡 MOCK_MODE' : '🟢 REAL_API';
        
        console.log(`${status} ${mockStatus} | ${edgeFunction}`);
        console.log(`    📁 ${file}`);
        console.log(`    📝 ${description}`);
        console.log('');
      }
    } else {
      console.log(`❌ FILE NOT FOUND | ${file}`);
    }
  });
  
  console.log('═'.repeat(80));
  console.log('🎯 NEXT STEPS:');
  console.log('1. Deploy Edge Functions for ⏳ PENDING items');
  console.log('2. Change MOCK_MODE = true to MOCK_MODE = false');
  console.log('3. Test functionality through your UI');
  console.log('');
}

function disableMockMode(hookName) {
  const hook = HOOK_FILES.find(h => h.file.includes(hookName) || h.edgeFunction === hookName);
  
  if (!hook) {
    console.log(`❌ Hook not found: ${hookName}`);
    console.log('Available hooks:', HOOK_FILES.map(h => h.edgeFunction).join(', '));
    return;
  }
  
  const filePath = path.join(process.cwd(), hook.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${hook.file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('const MOCK_MODE = true')) {
    content = content.replace(
      'const MOCK_MODE = true',
      `const MOCK_MODE = false // ✅ Real Edge Function deployed`
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Disabled MOCK_MODE for ${hook.edgeFunction}`);
    console.log(`📁 Updated: ${hook.file}`);
  } else if (content.includes('const MOCK_MODE = false')) {
    console.log(`ℹ️  MOCK_MODE already disabled for ${hook.edgeFunction}`);
  } else {
    console.log(`❌ MOCK_MODE not found in ${hook.file}`);
  }
}

// Command line interface
const command = process.argv[2];
const hookName = process.argv[3];

switch (command) {
  case 'status':
    checkMockModeStatus();
    break;
    
  case 'disable':
    if (!hookName) {
      console.log('❌ Usage: node scripts/disable-mock-mode.js disable <hook-name>');
      console.log('Example: node scripts/disable-mock-mode.js disable staff-manager');
      break;
    }
    disableMockMode(hookName);
    break;
    
  default:
    console.log('🔄 Mock Mode Manager');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/disable-mock-mode.js status          # Check current status');
    console.log('  node scripts/disable-mock-mode.js disable <hook>  # Disable mock mode for specific hook');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/disable-mock-mode.js status');
    console.log('  node scripts/disable-mock-mode.js disable staff-manager');
    console.log('  node scripts/disable-mock-mode.js disable customer-manager');
} 
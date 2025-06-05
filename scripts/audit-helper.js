#!/usr/bin/env node

/**
 * ============================================================================
 * RESTAURANT LOYALTY PLATFORM - AUDIT HELPER SCRIPT
 * ============================================================================
 * 
 * This script provides automated testing utilities for the production audit.
 * Run: node scripts/audit-helper.js [command]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import chalk from 'chalk';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize clients
const supabaseAdmin = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// AUDIT COMMANDS
// ============================================================================

const commands = {
  'check-env': checkEnvironment,
  'check-db': checkDatabase,
  'check-security': checkSecurity,
  'check-tables': checkTables,
  'test-encryption': testEncryption,
  'check-rls': checkRLS,
  'create-admin': createSuperAdmin,
  'full-check': runFullCheck,
  'help': showHelp
};

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const command = process.argv[2] || 'help';
  
  console.log(chalk.blue.bold('\n🔍 RESTAURANT LOYALTY PLATFORM - AUDIT HELPER\n'));
  
  if (commands[command]) {
    try {
      await commands[command]();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  } else {
    console.log(chalk.red(`❌ Unknown command: ${command}`));
    showHelp();
    process.exit(1);
  }
}

// ============================================================================
// ENVIRONMENT CHECKS
// ============================================================================

async function checkEnvironment() {
  console.log(chalk.yellow('🔧 Checking Environment Configuration...\n'));
  
  const checks = [
    { name: 'VITE_SUPABASE_URL', value: SUPABASE_URL },
    { name: 'VITE_SUPABASE_ANON_KEY', value: SUPABASE_ANON_KEY },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: SUPABASE_SERVICE_KEY }
  ];
  
  let allGood = true;
  
  for (const check of checks) {
    if (check.value) {
      console.log(chalk.green('✅'), `${check.name}: ${check.value.substring(0, 20)}...`);
    } else {
      console.log(chalk.red('❌'), `${check.name}: Missing`);
      allGood = false;
    }
  }
  
  if (allGood) {
    console.log(chalk.green('\n✅ Environment configuration looks good!'));
  } else {
    console.log(chalk.red('\n❌ Environment configuration has issues. Check your .env file.'));
  }
}

// ============================================================================
// DATABASE CHECKS
// ============================================================================

async function checkDatabase() {
  console.log(chalk.yellow('🗄️  Checking Database Connection...\n'));
  
  try {
    const { data, error } = await supabaseClient
      .from('platform_clients')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    console.log(chalk.green('✅ Database connection successful'));
    console.log(chalk.blue('ℹ️  Database is accessible and responding'));
  } catch (error) {
    console.log(chalk.red('❌ Database connection failed:'), error.message);
    console.log(chalk.yellow('💡 Check your Supabase URL and keys in .env file'));
  }
}

// ============================================================================
// TABLE STRUCTURE CHECKS
// ============================================================================

async function checkTables() {
  console.log(chalk.yellow('📋 Checking Database Tables...\n'));
  
  if (!supabaseAdmin) {
    console.log(chalk.red('❌ Service role key required for table checks'));
    return;
  }
  
  const requiredTables = [
    'platform_clients',
    'restaurants', 
    'locations',
    'customers',
    'user_roles',
    'platform_admin_users',
    'stamps',
    'rewards'
  ];
  
  try {
    const { data, error } = await supabaseAdmin
      .rpc('check_table_exists', { table_names: requiredTables });
    
    if (error) {
      // Fallback method if RPC doesn't exist
      console.log(chalk.yellow('⚠️  Using fallback table check method'));
      
      for (const table of requiredTables) {
        try {
          const { error: tableError } = await supabaseAdmin
            .from(table)
            .select('*')
            .limit(1);
          
          if (tableError) {
            console.log(chalk.red('❌'), `Table '${table}': ${tableError.message}`);
          } else {
            console.log(chalk.green('✅'), `Table '${table}': Exists`);
          }
        } catch (e) {
          console.log(chalk.red('❌'), `Table '${table}': Error - ${e.message}`);
        }
      }
    } else {
      console.log(chalk.green('✅ All required tables exist'));
    }
  } catch (error) {
    console.log(chalk.red('❌ Table check failed:'), error.message);
  }
}

// ============================================================================
// SECURITY FUNCTION CHECKS
// ============================================================================

async function checkSecurity() {
  console.log(chalk.yellow('🔐 Checking Security Functions...\n'));
  
  if (!supabaseAdmin) {
    console.log(chalk.red('❌ Service role key required for security checks'));
    return;
  }
  
  const securityFunctions = [
    'encrypt_sensitive_data',
    'decrypt_sensitive_data', 
    'hash_sensitive_data',
    'verify_hashed_data'
  ];
  
  try {
    const { data, error } = await supabaseAdmin
      .rpc('sql', {
        query: `
          SELECT routine_name 
          FROM information_schema.routines 
          WHERE routine_name = ANY($1)
          AND routine_schema = 'public'
        `,
        params: [securityFunctions]
      });
    
    if (error) throw error;
    
    const foundFunctions = data?.map(row => row.routine_name) || [];
    
    for (const func of securityFunctions) {
      if (foundFunctions.includes(func)) {
        console.log(chalk.green('✅'), `Function '${func}': Exists`);
      } else {
        console.log(chalk.red('❌'), `Function '${func}': Missing`);
      }
    }
    
    if (foundFunctions.length === securityFunctions.length) {
      console.log(chalk.green('\n✅ All security functions are available'));
    } else {
      console.log(chalk.red('\n❌ Some security functions are missing'));
      console.log(chalk.yellow('💡 Run sql/SIMPLE_ENCRYPTION_FIX.sql in Supabase SQL Editor'));
    }
    
  } catch (error) {
    console.log(chalk.red('❌ Security function check failed:'), error.message);
  }
}

// ============================================================================
// ENCRYPTION TESTING
// ============================================================================

async function testEncryption() {
  console.log(chalk.yellow('🔒 Testing Encryption Functions...\n'));
  
  if (!supabaseAdmin) {
    console.log(chalk.red('❌ Service role key required for encryption tests'));
    return;
  }
  
  try {
    // Test encryption
    const testData = 'test_sensitive_data_12345';
    const { data: encryptResult, error: encryptError } = await supabaseAdmin
      .rpc('encrypt_sensitive_data', { data: testData });
    
    if (encryptError) throw new Error(`Encryption failed: ${encryptError.message}`);
    
    console.log(chalk.green('✅'), 'Encryption test passed');
    console.log(chalk.blue('ℹ️ '), `Encrypted: ${encryptResult.substring(0, 30)}...`);
    
    // Test decryption
    const { data: decryptResult, error: decryptError } = await supabaseAdmin
      .rpc('decrypt_sensitive_data', { encrypted_data: encryptResult });
    
    if (decryptError) throw new Error(`Decryption failed: ${decryptError.message}`);
    
    if (decryptResult === testData) {
      console.log(chalk.green('✅'), 'Decryption test passed');
    } else {
      throw new Error('Decryption returned incorrect data');
    }
    
    // Test password hashing
    const testPassword = 'test_password_123';
    const { data: hashResult, error: hashError } = await supabaseAdmin
      .rpc('hash_sensitive_data', { data: testPassword });
    
    if (hashError) throw new Error(`Hashing failed: ${hashError.message}`);
    
    console.log(chalk.green('✅'), 'Password hashing test passed');
    
    // Test password verification
    const { data: verifyResult, error: verifyError } = await supabaseAdmin
      .rpc('verify_hashed_data', { data: testPassword, hashed: hashResult });
    
    if (verifyError) throw new Error(`Verification failed: ${verifyError.message}`);
    
    if (verifyResult) {
      console.log(chalk.green('✅'), 'Password verification test passed');
    } else {
      throw new Error('Password verification returned false');
    }
    
    console.log(chalk.green('\n🎉 All encryption tests passed!'));
    
  } catch (error) {
    console.log(chalk.red('❌ Encryption test failed:'), error.message);
    console.log(chalk.yellow('💡 Run sql/SIMPLE_ENCRYPTION_FIX.sql in Supabase SQL Editor'));
  }
}

// ============================================================================
// RLS POLICY CHECKS
// ============================================================================

async function checkRLS() {
  console.log(chalk.yellow('🛡️  Checking RLS Policies...\n'));
  
  if (!supabaseAdmin) {
    console.log(chalk.red('❌ Service role key required for RLS checks'));
    return;
  }
  
  try {
    const { data, error } = await supabaseAdmin
      .rpc('sql', {
        query: `
          SELECT schemaname, tablename, policyname, cmd, qual, with_check
          FROM pg_policies 
          WHERE schemaname = 'public'
          ORDER BY tablename, policyname
        `
      });
    
    if (error) throw error;
    
    let dangerousPolicies = 0;
    let totalPolicies = data?.length || 0;
    
    console.log(chalk.blue(`Found ${totalPolicies} RLS policies\n`));
    
    for (const policy of data || []) {
      const isDangerous = policy.with_check === 'true' || 
                         (policy.qual && policy.qual.includes('true')) ||
                         (policy.with_check && policy.with_check.includes('true'));
      
      if (isDangerous) {
        console.log(chalk.red('🚨'), `DANGEROUS: ${policy.tablename}.${policy.policyname}`);
        console.log(chalk.red('   '), `With Check: ${policy.with_check}`);
        dangerousPolicies++;
      } else {
        console.log(chalk.green('✅'), `${policy.tablename}.${policy.policyname}`);
      }
    }
    
    if (dangerousPolicies > 0) {
      console.log(chalk.red(`\n🚨 Found ${dangerousPolicies} dangerous RLS policies!`));
      console.log(chalk.yellow('💡 Run sql/FIX_CRITICAL_RLS_ISSUES.sql to fix'));
    } else {
      console.log(chalk.green('\n✅ All RLS policies look secure'));
    }
    
  } catch (error) {
    console.log(chalk.red('❌ RLS policy check failed:'), error.message);
  }
}

// ============================================================================
// SUPER ADMIN CREATION
// ============================================================================

async function createSuperAdmin() {
  console.log(chalk.yellow('👤 Creating Super Admin User...\n'));
  
  const email = 'admin@zerioncore.com';
  const password = 'SecureAdmin123!';
  
  try {
    // Create user via Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });
    
    if (authError) throw authError;
    
    console.log(chalk.green('✅'), `User created: ${email}`);
    
    // Add to platform admin users
    const { error: adminError } = await supabaseAdmin
      .from('platform_admin_users')
      .insert({
        user_id: authData.user.id,
        role: 'super_admin',
        permissions: ['all']
      });
    
    if (adminError) {
      console.log(chalk.yellow('⚠️ '), 'User created but admin role assignment failed:', adminError.message);
    } else {
      console.log(chalk.green('✅'), 'Super admin role assigned');
    }
    
    console.log(chalk.green('\n🎉 Super admin user ready!'));
    console.log(chalk.blue('📧'), `Email: ${email}`);
    console.log(chalk.blue('🔑'), `Password: ${password}`);
    
  } catch (error) {
    console.log(chalk.red('❌ Super admin creation failed:'), error.message);
    
    if (error.message.includes('already registered')) {
      console.log(chalk.yellow('💡 User already exists. Try logging in with existing credentials.'));
    }
  }
}

// ============================================================================
// FULL AUDIT CHECK
// ============================================================================

async function runFullCheck() {
  console.log(chalk.blue.bold('🚀 Running Full Audit Check...\n'));
  
  await checkEnvironment();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await checkDatabase();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await checkTables();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await checkSecurity();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testEncryption();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await checkRLS();
  
  console.log(chalk.blue.bold('\n🏁 Full audit check complete!'));
  console.log(chalk.yellow('📋 Review results above and update your testing checklist.'));
}

// ============================================================================
// HELP
// ============================================================================

function showHelp() {
  console.log(chalk.blue.bold('🔍 AUDIT HELPER COMMANDS\n'));
  
  const helpText = `
${chalk.green('check-env')}     - Check environment variables
${chalk.green('check-db')}      - Test database connection
${chalk.green('check-tables')}  - Verify required tables exist
${chalk.green('check-security')} - Check security functions exist
${chalk.green('test-encryption')} - Test encryption/decryption functions
${chalk.green('check-rls')}     - Check RLS policy security
${chalk.green('create-admin')}  - Create super admin user
${chalk.green('full-check')}    - Run all checks
${chalk.green('help')}          - Show this help

${chalk.yellow('Examples:')}
  node scripts/audit-helper.js check-env
  node scripts/audit-helper.js full-check
  node scripts/audit-helper.js create-admin

${chalk.blue('Prerequisites:')}
  - Copy env.example to .env
  - Configure Supabase credentials
  - Run: npm install
  `;
  
  console.log(helpText);
}

// ============================================================================
// RUN
// ============================================================================

main(); 
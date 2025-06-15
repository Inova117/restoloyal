#!/usr/bin/env node

// ============================================================================
// USER ROLE DIAGNOSTIC SCRIPT
// ============================================================================
// This script checks the current user's role and permissions in the database
// Run with: node scripts/check-user-role.js
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkUserRole() {
  console.log('🔍 USER ROLE DIAGNOSTIC\n')
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('❌ No authenticated user found')
      console.log('Please sign in to the application first')
      return
    }
    
    console.log('✅ Authenticated User:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Created: ${user.created_at}`)
    console.log('')
    
    // Check if user is superadmin
    console.log('🔍 Checking Superadmin Status...')
    const { data: superadminData, error: superadminError } = await supabase
      .from('superadmins')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (superadminData) {
      console.log('✅ USER IS SUPERADMIN')
      console.log(`   Superadmin ID: ${superadminData.id}`)
      console.log(`   Name: ${superadminData.name}`)
      console.log(`   Email: ${superadminData.email}`)
      console.log(`   Active: ${superadminData.is_active}`)
      console.log(`   Bootstrap: ${superadminData.is_bootstrap}`)
      console.log('')
    } else {
      console.log('❌ User is NOT a superadmin')
      if (superadminError) {
        console.log(`   Error: ${superadminError.message}`)
      }
      console.log('')
    }
    
    // Check if user is client admin
    console.log('🔍 Checking Client Admin Status...')
    const { data: clientAdminData, error: clientAdminError } = await supabase
      .from('client_admins')
      .select(`
        *,
        clients (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', user.id)
    
    if (clientAdminData && clientAdminData.length > 0) {
      console.log('✅ USER IS CLIENT ADMIN')
      clientAdminData.forEach((admin, index) => {
        console.log(`   Admin ${index + 1}:`)
        console.log(`     ID: ${admin.id}`)
        console.log(`     Client: ${admin.clients?.name} (${admin.clients?.slug})`)
        console.log(`     Client ID: ${admin.client_id}`)
        console.log(`     Active: ${admin.is_active}`)
        console.log('')
      })
    } else {
      console.log('❌ User is NOT a client admin')
      if (clientAdminError) {
        console.log(`   Error: ${clientAdminError.message}`)
      }
      console.log('')
    }
    
    // Check user_roles table
    console.log('🔍 Checking User Roles Table...')
    const { data: userRolesData, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
    
    if (userRolesData && userRolesData.length > 0) {
      console.log('✅ User Roles Found:')
      userRolesData.forEach((role, index) => {
        console.log(`   Role ${index + 1}:`)
        console.log(`     Tier: ${role.tier}`)
        console.log(`     Role ID: ${role.role_id}`)
        console.log(`     Client ID: ${role.client_id}`)
        console.log(`     Location ID: ${role.location_id}`)
        console.log('')
      })
    } else {
      console.log('❌ No user roles found')
      if (userRolesError) {
        console.log(`   Error: ${userRolesError.message}`)
      }
      console.log('')
    }
    
    // Test RLS function
    console.log('🔍 Testing RLS Functions...')
    try {
      const { data: rlsTest, error: rlsError } = await supabase
        .rpc('is_current_user_superadmin')
      
      if (rlsError) {
        console.log('❌ RLS Function Error:', rlsError.message)
      } else {
        console.log(`✅ is_current_user_superadmin(): ${rlsTest}`)
      }
    } catch (err) {
      console.log('❌ RLS Function Test Failed:', err.message)
    }
    
    console.log('\n📋 SUMMARY:')
    console.log('='.repeat(50))
    
    if (superadminData) {
      console.log('🎯 You ARE a superadmin - you should have full access')
      console.log('   If you\'re still getting permission errors, there may be an RLS issue')
    } else if (clientAdminData && clientAdminData.length > 0) {
      console.log('🎯 You ARE a client admin - you have limited access')
      console.log('   You can only manage your assigned client(s)')
    } else {
      console.log('🎯 You have NO admin privileges')
      console.log('   You need to be added as either a superadmin or client admin')
    }
    
  } catch (error) {
    console.error('❌ Error checking user role:', error.message)
  }
}

checkUserRole() 
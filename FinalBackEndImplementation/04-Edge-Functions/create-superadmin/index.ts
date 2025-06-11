// ============================================================================
// EDGE FUNCTION: CREATE SUPERADMIN (Tier 1)
// ============================================================================
// This function allows ONLY existing superadmins to create new superadmins
// Enforces hierarchy: superadmin → superadmin (peer creation)
// ============================================================================

// TypeScript declaration for Deno global
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore - Deno runtime imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno runtime imports  
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CreateSuperadminRequest {
  email: string
  name: string
  password: string
  is_active?: boolean
}

interface CreateSuperadminResponse {
  success: boolean
  superadmin_id?: string
  user_id?: string
  email?: string
  message: string
  error?: string
}

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Method not allowed. Use POST.' 
        }),
        { 
          status: 405, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing or invalid Authorization header' 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify JWT and get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired token' 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify user is superadmin
    const { data: superadminData, error: superadminError } = await supabaseClient
      .from('superadmins')
      .select('id, email, name, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (superadminError || !superadminData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Access denied. Only superadmins can create other superadmins.' 
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestBody: CreateSuperadminRequest = await req.json()

    // Validate required fields
    if (!requestBody.email || !requestBody.name || !requestBody.password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: email, name, password' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    if (!emailRegex.test(requestBody.email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid email format' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate password strength
    if (requestBody.password.length < 8) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Password must be at least 8 characters long' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if email already exists in auth.users
    const { data: existingUser, error: userCheckError } = await supabaseClient.auth.admin.listUsers()
    
    if (existingUser?.users?.some(u => u.email === requestBody.email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `User with email '${requestBody.email}' already exists` 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the auth user first
    const { data: newAuthUser, error: authCreateError } = await supabaseClient.auth.admin.createUser({
      email: requestBody.email,
      password: requestBody.password,
      email_confirm: true,
      user_metadata: {
        name: requestBody.name,
        role: 'superadmin',
        created_by: superadminData.email
      }
    })

    if (authCreateError || !newAuthUser.user) {
      console.error('Auth user creation error:', authCreateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create auth user: ${authCreateError?.message}` 
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the superadmin record
    const superadminData_new = {
      user_id: newAuthUser.user.id,
      email: requestBody.email,
      name: requestBody.name,
      is_active: requestBody.is_active !== false,
      is_bootstrap: false,
      bootstrap_method: 'superadmin_creation'
    }

    const { data: newSuperadmin, error: createError } = await supabaseClient
      .from('superadmins')
      .insert([superadminData_new])
      .select('id, email, name, is_active, created_at')
      .single()

    if (createError) {
      console.error('Superadmin creation error:', createError)
      
      // Cleanup: Delete the auth user if superadmin creation failed
      await supabaseClient.auth.admin.deleteUser(newAuthUser.user.id)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create superadmin: ${createError.message}` 
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create user_roles entry
    await supabaseClient
      .from('user_roles')
      .insert([{
        user_id: newAuthUser.user.id,
        tier: 'superadmin',
        superadmin_id: newSuperadmin.id,
        created_by_user_id: user.id,
        created_by_tier: 'superadmin',
        is_active: true
      }])

    // Log the successful creation
    await supabaseClient
      .from('hierarchy_audit_log')
      .insert([{
        violation_type: 'superadmin_creation',
        attempted_action: 'create_superadmin_via_edge_function',
        user_id: user.id,
        target_table: 'superadmins',
        target_data: {
          new_superadmin_id: newSuperadmin.id,
          new_superadmin_email: newSuperadmin.email,
          new_superadmin_name: newSuperadmin.name,
          created_by_superadmin: superadminData.email
        },
        error_message: 'Superadmin created successfully via Edge Function'
      }])

    // Return success response
    const response: CreateSuperadminResponse = {
      success: true,
      superadmin_id: newSuperadmin.id,
      user_id: newAuthUser.user.id,
      email: newSuperadmin.email,
      message: `Superadmin '${newSuperadmin.name}' created successfully`
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in create-superadmin function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* 
============================================================================
USAGE EXAMPLE:

POST /functions/v1/create-superadmin
Authorization: Bearer <existing-superadmin-jwt-token>
Content-Type: application/json

{
  "email": "newadmin@zerioncore.com",
  "name": "New Super Admin",
  "password": "SecurePassword123!",
  "is_active": true
}

SUCCESS RESPONSE (201):
{
  "success": true,
  "superadmin_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440000",
  "email": "newadmin@zerioncore.com",
  "message": "Superadmin 'New Super Admin' created successfully"
}

ERROR RESPONSES:
- 401: Invalid/missing auth token
- 403: User is not a superadmin
- 400: Missing required fields, invalid email, or weak password
- 500: Internal server error
============================================================================
*/ 
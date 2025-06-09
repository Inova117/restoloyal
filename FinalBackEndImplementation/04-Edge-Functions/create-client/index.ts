// ============================================================================
// EDGE FUNCTION: CREATE CLIENT (Tier 2)
// ============================================================================
// This function allows ONLY superadmins to create new clients (businesses)
// Enforces hierarchy: superadmin → client
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CreateClientRequest {
  name: string
  slug: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  business_type?: 'restaurant_chain' | 'single_restaurant' | 'franchise'
  settings?: Record<string, any>
}

interface CreateClientResponse {
  success: boolean
  client_id?: string
  client_slug?: string
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
          error: 'Access denied. Only superadmins can create clients.' 
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestBody: CreateClientRequest = await req.json()

    // Validate required fields
    if (!requestBody.name || !requestBody.slug || !requestBody.email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: name, slug, email' 
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

    // Validate slug format (lowercase, alphanumeric, hyphens only)
    const slugRegex = /^[a-z0-9\-]+$/
    if (!slugRegex.test(requestBody.slug)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if slug already exists
    const { data: existingClient, error: slugCheckError } = await supabaseClient
      .from('clients')
      .select('id, slug')
      .eq('slug', requestBody.slug)
      .single()

    if (existingClient) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Client with slug '${requestBody.slug}' already exists` 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare client data
    const clientData = {
      name: requestBody.name,
      slug: requestBody.slug,
      email: requestBody.email,
      phone: requestBody.phone || null,
      address: requestBody.address || null,
      city: requestBody.city || null,
      state: requestBody.state || null,
      country: requestBody.country || 'US',
      business_type: requestBody.business_type || 'restaurant_chain',
      settings: requestBody.settings || {
        stamps_required_for_reward: 10,
        allow_cross_location_stamps: true,
        auto_expire_stamps_days: 365,
        customer_can_view_history: true
      },
      created_by_superadmin_id: superadminData.id,
      status: 'active'
    }

    // Create the client
    const { data: newClient, error: createError } = await supabaseClient
      .from('clients')
      .insert([clientData])
      .select('id, name, slug, email, business_type, status, created_at')
      .single()

    if (createError) {
      console.error('Client creation error:', createError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create client: ${createError.message}` 
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the successful creation
    await supabaseClient
      .from('hierarchy_audit_log')
      .insert([{
        violation_type: 'client_creation',
        attempted_action: 'create_client_via_edge_function',
        user_id: user.id,
        target_table: 'clients',
        target_data: {
          client_id: newClient.id,
          client_name: newClient.name,
          client_slug: newClient.slug,
          created_by_superadmin: superadminData.email
        },
        error_message: 'Client created successfully via Edge Function'
      }])

    // Return success response
    const response: CreateClientResponse = {
      success: true,
      client_id: newClient.id,
      client_slug: newClient.slug,
      message: `Client '${newClient.name}' created successfully`
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in create-client function:', error)
    
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

POST /functions/v1/create-client
Authorization: Bearer <superadmin-jwt-token>
Content-Type: application/json

{
  "name": "Pizza Palace Chain",
  "slug": "pizza-palace-chain",
  "email": "admin@pizzapalace.com",
  "phone": "+1234567890",
  "address": "123 Corporate Blvd",
  "city": "Business City",
  "state": "CA",
  "country": "US",
  "business_type": "restaurant_chain",
  "settings": {
    "stamps_required_for_reward": 8,
    "allow_cross_location_stamps": true,
    "auto_expire_stamps_days": 180
  }
}

SUCCESS RESPONSE (201):
{
  "success": true,
  "client_id": "550e8400-e29b-41d4-a716-446655440000",
  "client_slug": "pizza-palace-chain",
  "message": "Client 'Pizza Palace Chain' created successfully"
}

ERROR RESPONSES:
- 401: Invalid/missing auth token
- 403: User is not a superadmin
- 400: Missing required fields or validation errors
- 500: Internal server error
============================================================================
*/ 
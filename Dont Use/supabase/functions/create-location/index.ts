// ============================================================================
// EDGE FUNCTION: CREATE LOCATION (Tier 3)
// ============================================================================
// This function allows ONLY client_admins to create new locations for their client
// Enforces hierarchy: client_admin → location
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

interface CreateLocationRequest {
  name: string
  address: string
  city: string
  state: string
  zip_code?: string
  country?: string
  phone?: string
  email?: string
  timezone?: string
  settings?: Record<string, any>
}

interface CreateLocationResponse {
  success: boolean
  location_id?: string
  location_name?: string
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

    // Verify user is client_admin
    const { data: clientAdminData, error: clientAdminError } = await supabaseClient
      .from('client_admins')
      .select('id, email, name, client_id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (clientAdminError || !clientAdminData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Access denied. Only client admins can create locations.' 
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestBody: CreateLocationRequest = await req.json()

    // Validate required fields
    if (!requestBody.name || !requestBody.address || !requestBody.city || !requestBody.state) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: name, address, city, state' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format if provided
    if (requestBody.email) {
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
    }

    // Check if location name already exists for this client
    const { data: existingLocation, error: nameCheckError } = await supabaseClient
      .from('locations')
      .select('id, name')
      .eq('client_id', clientAdminData.client_id)
      .eq('name', requestBody.name)
      .single()

    if (existingLocation) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Location with name '${requestBody.name}' already exists for this client` 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare location data
    const locationData = {
      client_id: clientAdminData.client_id,
      name: requestBody.name,
      address: requestBody.address,
      city: requestBody.city,
      state: requestBody.state,
      zip_code: requestBody.zip_code || null,
      country: requestBody.country || 'US',
      phone: requestBody.phone || null,
      email: requestBody.email || null,
      timezone: requestBody.timezone || 'UTC',
      is_active: true,
      settings: requestBody.settings || {
        pos_integration: true,
        qr_code_enabled: true,
        auto_stamp_on_purchase: true,
        require_customer_phone: false
      },
      created_by_client_admin_id: clientAdminData.id
    }

    // Create the location
    const { data: newLocation, error: createError } = await supabaseClient
      .from('locations')
      .insert([locationData])
      .select('id, name, address, city, state, is_active, created_at')
      .single()

    if (createError) {
      console.error('Location creation error:', createError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create location: ${createError.message}` 
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
        violation_type: 'location_creation',
        attempted_action: 'create_location_via_edge_function',
        user_id: user.id,
        target_table: 'locations',
        target_data: {
          location_id: newLocation.id,
          location_name: newLocation.name,
          client_id: clientAdminData.client_id,
          created_by_client_admin: clientAdminData.email
        },
        error_message: 'Location created successfully via Edge Function'
      }])

    // Return success response
    const response: CreateLocationResponse = {
      success: true,
      location_id: newLocation.id,
      location_name: newLocation.name,
      message: `Location '${newLocation.name}' created successfully`
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in create-location function:', error)
    
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

POST /functions/v1/create-location
Authorization: Bearer <client-admin-jwt-token>
Content-Type: application/json

{
  "name": "Downtown Pizza Palace",
  "address": "123 Main Street",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94102",
  "country": "US",
  "phone": "+1-415-555-0123",
  "email": "downtown@pizzapalace.com",
  "timezone": "America/Los_Angeles",
  "settings": {
    "pos_integration": true,
    "qr_code_enabled": true,
    "auto_stamp_on_purchase": true,
    "require_customer_phone": true
  }
}

SUCCESS RESPONSE (201):
{
  "success": true,
  "location_id": "550e8400-e29b-41d4-a716-446655440000",
  "location_name": "Downtown Pizza Palace",
  "message": "Location 'Downtown Pizza Palace' created successfully"
}

ERROR RESPONSES:
- 401: Invalid/missing auth token
- 403: User is not a client admin
- 400: Missing required fields or validation errors
- 500: Internal server error
============================================================================
*/ 
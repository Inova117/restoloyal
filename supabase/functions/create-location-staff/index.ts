// ============================================================================
// EDGE FUNCTION: CREATE LOCATION STAFF (Tier 3)
// ============================================================================
// This function allows ONLY client admins to create location staff
// Enforces hierarchy: client_admin → location_staff
// ============================================================================

/// <reference path="../create-customer/deno.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CreateLocationStaffRequest {
  email: string
  name: string
  phone?: string
  location_id: string
  role?: 'manager' | 'staff' | 'pos_operator'
  permissions?: {
    can_create_customers?: boolean
    can_manage_loyalty?: boolean
    can_view_analytics?: boolean
    can_export_data?: boolean
  }
}

interface CreateLocationStaffResponse {
  success: boolean
  staff_id?: string
  staff_email?: string
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

    // Verify user is client admin
    const { data: adminData, error: adminError } = await supabaseClient
      .from('client_admins')
      .select(`
        id, 
        client_id, 
        email, 
        name, 
        role, 
        is_active,
        permissions,
        clients (
          id,
          business_name,
          is_active
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Access denied. Only client administrators can create location staff.' 
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if client is active
    const client = adminData.clients as any
    if (!client?.is_active) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cannot create staff for inactive client.' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestBody: CreateLocationStaffRequest = await req.json()

    // Validate required fields
    if (!requestBody.email || !requestBody.name || !requestBody.location_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: email, name, location_id' 
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

    // Validate phone format if provided
    if (requestBody.phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/
      if (!phoneRegex.test(requestBody.phone)) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid phone format. Use international format (+1234567890)' 
          }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Verify location belongs to this client
    const { data: locationData, error: locationError } = await supabaseClient
      .from('locations')
      .select('id, name, client_id, is_active')
      .eq('id', requestBody.location_id)
      .eq('client_id', adminData.client_id)
      .single()

    if (locationError || !locationData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Location not found or does not belong to your client' 
        }),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!locationData.is_active) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cannot create staff for inactive location' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if email already exists in this client
    const { data: existingStaff, error: existingError } = await supabaseClient
      .from('location_staff')
      .select('id, email')
      .eq('email', requestBody.email)
      .eq('client_id', adminData.client_id)

    if (existingError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error checking existing staff' 
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    if (existingStaff && existingStaff.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Staff member with this email already exists in your organization' 
        }),
        { 
          status: 409, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Set default permissions based on role
    const defaultPermissions = {
      manager: {
        can_create_customers: true,
        can_manage_loyalty: true,
        can_view_analytics: true,
        can_export_data: true
      },
      staff: {
        can_create_customers: true,
        can_manage_loyalty: true,
        can_view_analytics: false,
        can_export_data: false
      },
      pos_operator: {
        can_create_customers: true,
        can_manage_loyalty: false,
        can_view_analytics: false,
        can_export_data: false
      }
    }

    const role = requestBody.role || 'staff'
    const permissions = requestBody.permissions || defaultPermissions[role]

    // Prepare staff data
    const staffData = {
      client_id: adminData.client_id,
      location_id: requestBody.location_id,
      email: requestBody.email,
      name: requestBody.name,
      phone: requestBody.phone || null,
      role: role,
      permissions: permissions,
      created_by_admin_id: adminData.id,
      is_active: true,
      created_at: new Date().toISOString()
    }

    // Create the location staff
    const { data: newStaff, error: createError } = await supabaseClient
      .from('location_staff')
      .insert([staffData])
      .select(`
        id, 
        email, 
        name, 
        phone, 
        role, 
        permissions,
        created_at
      `)
      .single()

    if (createError) {
      console.error('Staff creation error:', createError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create location staff: ${createError.message}` 
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
        violation_type: 'staff_creation',
        attempted_action: 'create_location_staff_via_edge_function',
        user_id: user.id,
        target_table: 'location_staff',
        target_data: {
          staff_id: newStaff.id,
          staff_email: newStaff.email,
          staff_name: newStaff.name,
          staff_role: newStaff.role,
          location_name: locationData.name,
          created_by_admin: adminData.email,
          client_name: client.business_name
        },
        error_message: 'Location staff created successfully via Edge Function'
      }])

    // Return success response
    const response: CreateLocationStaffResponse = {
      success: true,
      staff_id: newStaff.id,
      staff_email: newStaff.email,
      location_name: locationData.name,
      message: `Location staff '${newStaff.name}' created successfully for ${locationData.name}`
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in create-location-staff function:', error)
    
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

POST /functions/v1/create-location-staff
Authorization: Bearer <client-admin-jwt-token>
Content-Type: application/json

{
  "email": "manager@restaurant.com",
  "name": "Sarah Johnson",
  "phone": "+1234567890",
  "location_id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "manager",
  "permissions": {
    "can_create_customers": true,
    "can_manage_loyalty": true,
    "can_view_analytics": true,
    "can_export_data": true
  }
}

SUCCESS RESPONSE (201):
{
  "success": true,
  "staff_id": "660e8400-e29b-41d4-a716-446655440000",
  "staff_email": "manager@restaurant.com",
  "location_name": "Downtown Store",
  "message": "Location staff 'Sarah Johnson' created successfully for Downtown Store"
}

ERROR RESPONSES:
- 401: Invalid/missing auth token
- 403: User is not client admin
- 404: Location not found or doesn't belong to client
- 409: Staff email already exists in organization
- 400: Missing required fields or validation errors
- 500: Internal server error

============================================================================
HIERARCHY ENFORCEMENT:

1. Authentication:
   - Must have valid JWT token
   - Must be active client admin (Tier 2)
   - Client must be active

2. Authorization:
   - Can only create staff for locations owned by their client
   - Cannot create staff for other clients' locations
   - Location must be active

3. Business Rules:
   - Email must be unique within client organization
   - Role-based default permissions
   - Custom permissions override defaults
   - Complete audit logging

4. Default Role Permissions:
   - manager: Full access (create customers, manage loyalty, analytics, export)
   - staff: Operational access (create customers, manage loyalty)
   - pos_operator: Basic access (create customers only)

============================================================================
*/ 
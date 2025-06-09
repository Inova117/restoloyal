// ============================================================================
// EDGE FUNCTION: CREATE CUSTOMER (Tier 4)
// ============================================================================
// This function allows ONLY location staff to create customers via POS/QR
// Enforces hierarchy: location_staff → customer
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CreateCustomerRequest {
  name: string
  email?: string
  phone?: string
  creation_method?: 'pos' | 'qr_scan' | 'manual'
  location_id?: string  // Optional, will use staff's location if not provided
  pos_metadata?: Record<string, any>
}

interface CreateCustomerResponse {
  success: boolean
  customer_id?: string
  qr_code?: string
  customer_number?: string
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

    // Verify user is location staff
    const { data: staffData, error: staffError } = await supabaseClient
      .from('location_staff')
      .select(`
        id, 
        location_id, 
        client_id, 
        email, 
        name, 
        role, 
        is_active,
        permissions,
        locations (
          id,
          name,
          is_active
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (staffError || !staffData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Access denied. Only location staff can create customers.' 
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if staff has permission to create customers
    const permissions = staffData.permissions as any
    if (!permissions?.can_create_customers) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Access denied. Your role does not have permission to create customers.' 
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if location is active
    const location = staffData.locations as any
    if (!location?.is_active) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cannot create customers for inactive location.' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestBody: CreateCustomerRequest = await req.json()

    // Validate required fields
    if (!requestBody.name) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required field: name' 
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

    // Use staff's location if not specified, or validate if specified
    let targetLocationId = staffData.location_id
    if (requestBody.location_id) {
      if (requestBody.location_id !== staffData.location_id) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Staff can only create customers for their assigned location' 
          }),
          { 
            status: 403, 
            headers: { 'Content-Type': 'application/json' } 
          }
        )
      }
      targetLocationId = requestBody.location_id
    }

    // Generate unique QR code and customer number
    const qrCode = `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const customerNumber = `CUST_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Prepare customer data
    const customerData = {
      client_id: staffData.client_id,
      location_id: targetLocationId,
      name: requestBody.name,
      email: requestBody.email || null,
      phone: requestBody.phone || null,
      qr_code: qrCode,
      customer_number: customerNumber,
      creation_method: requestBody.creation_method || 'pos',
      pos_metadata: requestBody.pos_metadata || {},
      created_by_staff_id: staffData.id,
      status: 'active',
      is_active: true,
      total_stamps: 0,
      total_visits: 0,
      total_rewards: 0
    }

    // Create the customer
    const { data: newCustomer, error: createError } = await supabaseClient
      .from('customers')
      .insert([customerData])
      .select(`
        id, 
        name, 
        email, 
        phone, 
        qr_code, 
        customer_number, 
        creation_method,
        created_at
      `)
      .single()

    if (createError) {
      console.error('Customer creation error:', createError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create customer: ${createError.message}` 
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
        violation_type: 'customer_creation',
        attempted_action: 'create_customer_via_edge_function',
        user_id: user.id,
        target_table: 'customers',
        target_data: {
          customer_id: newCustomer.id,
          customer_name: newCustomer.name,
          customer_number: newCustomer.customer_number,
          qr_code: newCustomer.qr_code,
          created_by_staff: staffData.email,
          location_name: location.name,
          creation_method: newCustomer.creation_method
        },
        error_message: 'Customer created successfully via Edge Function'
      }])

    // Return success response
    const response: CreateCustomerResponse = {
      success: true,
      customer_id: newCustomer.id,
      qr_code: newCustomer.qr_code,
      customer_number: newCustomer.customer_number,
      location_name: location.name,
      message: `Customer '${newCustomer.name}' created successfully`
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in create-customer function:', error)
    
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

POST /functions/v1/create-customer
Authorization: Bearer <location-staff-jwt-token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@email.com",
  "phone": "+1234567890",
  "creation_method": "pos",
  "pos_metadata": {
    "terminal_id": "POS_001",
    "cashier_name": "Sarah Smith",
    "transaction_ref": "TXN_123456"
  }
}

SUCCESS RESPONSE (201):
{
  "success": true,
  "customer_id": "550e8400-e29b-41d4-a716-446655440000",
  "qr_code": "QR_1703123456789_abc123def",
  "customer_number": "CUST_1703123456789_ABC123",
  "location_name": "Downtown Store",
  "message": "Customer 'John Doe' created successfully"
}

ERROR RESPONSES:
- 401: Invalid/missing auth token
- 403: User is not location staff or lacks permissions
- 400: Missing required fields or validation errors
- 500: Internal server error

============================================================================
POS INTEGRATION NOTES:

1. QR Code Generation:
   - Format: QR_<timestamp>_<random9chars>
   - Unique across entire system
   - Used for customer identification

2. Customer Number:
   - Format: CUST_<timestamp>_<random6chars>
   - Human-readable identifier
   - Unique within client scope

3. Creation Methods:
   - 'pos': Created at point of sale terminal
   - 'qr_scan': Created via QR code scan
   - 'manual': Manually created by staff

4. POS Metadata:
   - terminal_id: Which POS terminal created this
   - cashier_name: Staff member who created customer
   - transaction_ref: Related transaction reference
   - Any other POS-specific data

5. Staff Permissions:
   - Must have 'can_create_customers': true
   - Must be assigned to active location
   - Location must be active

6. Automatic Features:
   - QR code and customer number auto-generated
   - Initial loyalty stats set to 0
   - Customer status set to 'active'
   - Audit logging for all creations
============================================================================
*/ 
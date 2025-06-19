// Customer Manager Edge Function - Compatible with Supabase Edge Functions
// Handles customer CRUD operations with proper authentication and authorization

// @ts-ignore: Deno deploy compatibility
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore: Deno deploy compatibility  
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

// Response helper
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Error response helper
function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status)
}

// Customer interface matching your actual database schema
interface Customer {
  id: string
  client_id: string
  location_id: string
  name: string
  email?: string
  phone?: string
  qr_code: string
  total_stamps: number
  total_visits: number
  last_visit?: string
  status: 'active' | 'inactive' | 'blocked'
  created_at: string
  updated_at: string
}

interface CustomerFilters {
  location_id?: string
  search?: string
  status?: 'active' | 'inactive' | 'blocked'
  limit?: number
  offset?: number
}

interface UpdateCustomerData {
  name?: string
  email?: string
  phone?: string
  status?: 'active' | 'inactive' | 'blocked'
  location_id?: string
}

interface CreateCustomerData {
  name: string
  email?: string
  phone?: string
  location_id: string
  client_id: string
}

// @ts-ignore: Deno deploy compatibility
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401)
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return errorResponse('Invalid or expired token', 401)
    }

    const url = new URL(req.url)
    const method = req.method
    
    // Extract client_id from query params or request body
    let clientId = url.searchParams.get('client_id')
    
    if (!clientId && (method === 'POST' || method === 'PATCH')) {
      const body = await req.json()
      clientId = body.client_id
    }

    if (!clientId) {
      return errorResponse('client_id is required', 400)
    }

    // Verify user has access to this client
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role, client_id, location_id')
      .eq('user_id', user.id)
      .eq('client_id', clientId)
      .single()

    if (roleError || !userRole) {
      console.error('Role verification error:', roleError)
      return errorResponse('Access denied: User not authorized for this client', 403)
    }

    console.log(`Customer Manager: ${method} request from user ${user.id} with role ${userRole.role}`)

    // Route handlers
    switch (method) {
      case 'GET':
        return await handleGetCustomers(supabaseClient, url, userRole)
      
      case 'POST':
        return await handleCreateCustomer(supabaseClient, req, userRole)
      
      case 'PATCH':
        return await handleUpdateCustomer(supabaseClient, req, userRole)
      
      case 'DELETE':
        return await handleDeleteCustomer(supabaseClient, url, userRole)
      
      default:
        return errorResponse(`Method ${method} not allowed`, 405)
    }

  } catch (error) {
    console.error('Customer Manager Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

// GET /customer-manager - List customers with filters
async function handleGetCustomers(supabaseClient: any, url: URL, userRole: any) {
  try {
    const clientId = url.searchParams.get('client_id')
    const locationId = url.searchParams.get('location_id')
    const search = url.searchParams.get('search')
    const status = url.searchParams.get('status') as 'active' | 'inactive' | 'blocked' | null
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const customerId = url.searchParams.get('customer_id')

    // Build base query with correct table references
    let query = supabaseClient
      .from('customers')
      .select(`
        *,
        locations!inner(id, name, address, city, state)
      `)

    // Apply client-level filter
    query = query.eq('client_id', clientId)

    // Apply role-based access control
    if (userRole.role === 'location_staff' && userRole.location_id) {
      query = query.eq('location_id', userRole.location_id)
    }

    // Apply filters
    if (customerId) {
      query = query.eq('id', customerId)
    }

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    query = query.order('created_at', { ascending: false })

    const { data: customers, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return errorResponse('Failed to fetch customers', 500)
    }

    // Get recent stamps and rewards for each customer
    const customersWithActivity = await Promise.all(
      (customers || []).map(async (customer: any) => {
        // Get recent stamps
        const { data: stamps } = await supabaseClient
          .from('stamps')
          .select('id, quantity, notes, created_at')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false })
          .limit(5)

        // Get recent rewards
        const { data: rewards } = await supabaseClient
          .from('rewards')
          .select('id, stamps_used, reward_description, value_amount, created_at')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false })
          .limit(5)

        return {
          ...customer,
          recent_stamps: stamps || [],
          recent_rewards: rewards || []
        }
      })
    )

    return jsonResponse({
      customers: customersWithActivity,
      pagination: {
        limit,
        offset,
        total: count || customersWithActivity.length
      }
    })

  } catch (error) {
    console.error('Error fetching customers:', error)
    return errorResponse('Failed to fetch customers', 500)
  }
}

// POST /customer-manager - Create new customer
async function handleCreateCustomer(supabaseClient: any, req: Request, userRole: any) {
  try {
    const body = await req.json()
    const { name, email, phone, location_id, client_id } = body as CreateCustomerData

    // Validate required fields
    if (!name || !location_id || !client_id) {
      return errorResponse('Missing required fields: name, location_id, client_id', 400)
    }

    // Verify location belongs to client
    const { data: location, error: locationError } = await supabaseClient
      .from('locations')
      .select('id, client_id')
      .eq('id', location_id)
      .eq('client_id', client_id)
      .single()

    if (locationError || !location) {
      return errorResponse('Invalid location for this client', 400)
    }

    // Check role-based permissions
    if (userRole.role === 'location_staff' && userRole.location_id !== location_id) {
      return errorResponse('Access denied: Can only create customers for your assigned location', 403)
    }

    // Generate QR code
    const qrCode = `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create customer
    const { data: customer, error } = await supabaseClient
      .from('customers')
      .insert({
        name,
        email,
        phone,
        location_id,
        client_id,
        qr_code: qrCode,
        total_stamps: 0,
        total_visits: 0,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return errorResponse('Failed to create customer', 500)
    }

    console.log(`Created customer: ${customer.id} for location: ${location_id}`)
    return jsonResponse({ customer }, 201)

  } catch (error) {
    console.error('Error creating customer:', error)
    return errorResponse('Failed to create customer', 500)
  }
}

// PATCH /customer-manager - Update customer
async function handleUpdateCustomer(supabaseClient: any, req: Request, userRole: any) {
  try {
    const url = new URL(req.url)
    const customerId = url.searchParams.get('customer_id')
    
    if (!customerId) {
      return errorResponse('customer_id is required', 400)
    }

    const body = await req.json()
    const updateData = body as UpdateCustomerData

    // Get existing customer to verify access
    const { data: existingCustomer, error: fetchError } = await supabaseClient
      .from('customers')
      .select('id, client_id, location_id')
      .eq('id', customerId)
      .single()

    if (fetchError || !existingCustomer) {
      return errorResponse('Customer not found', 404)
    }

    // Check role-based permissions
    if (userRole.role === 'location_staff' && userRole.location_id !== existingCustomer.location_id) {
      return errorResponse('Access denied: Can only update customers in your assigned location', 403)
    }

    // Update customer
    const { data: customer, error } = await supabaseClient
      .from('customers')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return errorResponse('Failed to update customer', 500)
    }

    console.log(`Updated customer: ${customerId}`)
    return jsonResponse({ customer })

  } catch (error) {
    console.error('Error updating customer:', error)
    return errorResponse('Failed to update customer', 500)
  }
}

// DELETE /customer-manager - Delete customer
async function handleDeleteCustomer(supabaseClient: any, url: URL, userRole: any) {
  try {
    const customerId = url.searchParams.get('customer_id')
    
    if (!customerId) {
      return errorResponse('customer_id is required', 400)
    }

    // Get existing customer to verify access
    const { data: existingCustomer, error: fetchError } = await supabaseClient
      .from('customers')
      .select('id, client_id, location_id')
      .eq('id', customerId)
      .single()

    if (fetchError || !existingCustomer) {
      return errorResponse('Customer not found', 404)
    }

    // Check role-based permissions (only admins can delete)
    if (!['superadmin', 'client_admin'].includes(userRole.role)) {
      return errorResponse('Access denied: Only admins can delete customers', 403)
    }

    // Delete customer (CASCADE will handle related records)
    const { error } = await supabaseClient
      .from('customers')
      .delete()
      .eq('id', customerId)

    if (error) {
      console.error('Database error:', error)
      return errorResponse('Failed to delete customer', 500)
    }

    console.log(`Deleted customer: ${customerId}`)
    return jsonResponse({ message: 'Customer deleted successfully' })

  } catch (error) {
    console.error('Error deleting customer:', error)
    return errorResponse('Failed to delete customer', 500)
  }
} 
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

// Customer interface matching frontend
interface Customer {
  id: string
  restaurant_id: string
  location_id?: string
  name: string
  email?: string
  phone?: string
  qr_code: string
  stamps: number
  total_visits: number
  last_visit?: string
  customer_status: 'active' | 'inactive' | 'blocked'
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
  customer_status?: 'active' | 'inactive' | 'blocked'
  location_id?: string
}

interface CreateCustomerData {
  name: string
  email?: string
  phone?: string
  location_id?: string
  restaurant_id: string
}

serve(async (req) => {
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
    const pathSegments = url.pathname.split('/').filter(Boolean)
    
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
      .select('role, client_id, restaurant_id, location_id')
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
    const customerId = url.searchParams.get('customer_id') // For single customer fetch

    // Build base query
    let query = supabaseClient
      .from('customers')
      .select(`
        *,
        location:locations(id, name, address),
        restaurant:restaurants(id, name, client_id),
        recent_stamps:stamps(id, amount, notes, created_at, added_by_name),
        recent_rewards:rewards(id, stamps_used, description, value, created_at, redeemed_by_name)
      `)

    // Apply client-level filter
    query = query.eq('restaurant.client_id', clientId)

    // Apply role-based access control
    if (userRole.role === 'location_staff' && userRole.location_id) {
      query = query.eq('location_id', userRole.location_id)
    } else if (userRole.role === 'restaurant_admin' && userRole.restaurant_id) {
      query = query.eq('restaurant_id', userRole.restaurant_id)
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
      query = query.eq('customer_status', status)
    }

    // Apply pagination
    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: customers, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return errorResponse('Failed to fetch customers', 500)
    }

    // If fetching single customer, return just the customer
    if (customerId) {
      return jsonResponse({
        data: customers?.[0] || null
      })
    }

    // Return paginated results
    return jsonResponse({
      data: customers || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Get customers error:', error)
    return errorResponse('Failed to fetch customers', 500)
  }
}

// POST /customer-manager - Create new customer
async function handleCreateCustomer(supabaseClient: any, req: Request, userRole: any) {
  try {
    const body = await req.json()
    const { name, email, phone, location_id, restaurant_id }: CreateCustomerData = body

    if (!name || !restaurant_id) {
      return errorResponse('name and restaurant_id are required', 400)
    }

    // Verify user can create customers for this restaurant/location
    if (userRole.role === 'location_staff') {
      if (!location_id || location_id !== userRole.location_id) {
        return errorResponse('Location staff can only create customers for their assigned location', 403)
      }
    } else if (userRole.role === 'restaurant_admin') {
      if (restaurant_id !== userRole.restaurant_id) {
        return errorResponse('Restaurant admin can only create customers for their assigned restaurant', 403)
      }
    }

    // Generate unique QR code
    const qrCode = `QR${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    // Create customer
    const { data: customer, error } = await supabaseClient
      .from('customers')
      .insert({
        name,
        email,
        phone,
        restaurant_id,
        location_id,
        qr_code: qrCode,
        stamps: 0,
        total_visits: 0,
        customer_status: 'active'
      })
      .select(`
        *,
        location:locations(id, name, address),
        restaurant:restaurants(id, name, client_id)
      `)
      .single()

    if (error) {
      console.error('Create customer error:', error)
      return errorResponse('Failed to create customer', 500)
    }

    return jsonResponse({
      data: customer,
      message: 'Customer created successfully'
    }, 201)

  } catch (error) {
    console.error('Create customer error:', error)
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
    const updateData: UpdateCustomerData = body

    // Verify customer exists and user has access
    const { data: existingCustomer, error: fetchError } = await supabaseClient
      .from('customers')
      .select('*, restaurant:restaurants(client_id)')
      .eq('id', customerId)
      .single()

    if (fetchError || !existingCustomer) {
      return errorResponse('Customer not found', 404)
    }

    // Verify access based on role
    if (userRole.role === 'location_staff' && existingCustomer.location_id !== userRole.location_id) {
      return errorResponse('Access denied: Cannot update customer from different location', 403)
    } else if (userRole.role === 'restaurant_admin' && existingCustomer.restaurant_id !== userRole.restaurant_id) {
      return errorResponse('Access denied: Cannot update customer from different restaurant', 403)
    }

    // Update customer
    const { data: updatedCustomer, error: updateError } = await supabaseClient
      .from('customers')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select(`
        *,
        location:locations(id, name, address),
        restaurant:restaurants(id, name, client_id)
      `)
      .single()

    if (updateError) {
      console.error('Update customer error:', updateError)
      return errorResponse('Failed to update customer', 500)
    }

    return jsonResponse({
      data: updatedCustomer,
      message: 'Customer updated successfully'
    })

  } catch (error) {
    console.error('Update customer error:', error)
    return errorResponse('Failed to update customer', 500)
  }
}

// DELETE /customer-manager - Delete customer (soft delete by setting status to 'blocked')
async function handleDeleteCustomer(supabaseClient: any, url: URL, userRole: any) {
  try {
    const customerId = url.searchParams.get('customer_id')
    
    if (!customerId) {
      return errorResponse('customer_id is required', 400)
    }

    // Verify customer exists and user has access
    const { data: existingCustomer, error: fetchError } = await supabaseClient
      .from('customers')
      .select('*, restaurant:restaurants(client_id)')
      .eq('id', customerId)
      .single()

    if (fetchError || !existingCustomer) {
      return errorResponse('Customer not found', 404)
    }

    // Verify access based on role
    if (userRole.role === 'location_staff' && existingCustomer.location_id !== userRole.location_id) {
      return errorResponse('Access denied: Cannot delete customer from different location', 403)
    } else if (userRole.role === 'restaurant_admin' && existingCustomer.restaurant_id !== userRole.restaurant_id) {
      return errorResponse('Access denied: Cannot delete customer from different restaurant', 403)
    }

    // Soft delete by setting status to 'blocked'
    const { error: deleteError } = await supabaseClient
      .from('customers')
      .update({
        customer_status: 'blocked',
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)

    if (deleteError) {
      console.error('Delete customer error:', deleteError)
      return errorResponse('Failed to delete customer', 500)
    }

    return jsonResponse({
      message: 'Customer deleted successfully'
    })

  } catch (error) {
    console.error('Delete customer error:', error)
    return errorResponse('Failed to delete customer', 500)
  }
} 
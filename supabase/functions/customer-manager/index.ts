// @ts-ignore - Deno imports work in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno imports work in Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
  location?: {
    id: string
    name: string
    address: string
  }
  restaurant?: {
    id: string
    name: string
    client_id: string
  }
  recent_stamps?: Array<{
    id: string
    amount: number
    notes?: string
    created_at: string
    added_by_name?: string
  }>
  recent_rewards?: Array<{
    id: string
    stamps_used: number
    description?: string
    value?: number
    created_at: string
    redeemed_by_name?: string
  }>
}

interface UpdateCustomerRequest {
  name?: string
  email?: string
  phone?: string
  customer_status?: 'active' | 'inactive' | 'blocked'
  location_id?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      // @ts-ignore - Deno global works in Edge Functions
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore - Deno global works in Edge Functions
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get client_id from query params or request body
    const url = new URL(req.url)
    let clientId = url.searchParams.get('client_id')
    
    if (!clientId && (req.method === 'POST' || req.method === 'PATCH')) {
      const body = await req.json()
      clientId = body.client_id
    }

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'client_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify user has client_admin or restaurant_admin role for this client
    const { data: adminCheck, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('role, client_id, restaurant_id')
      .eq('user_id', user.id)
      .eq('client_id', clientId)
      .in('role', ['client_admin', 'restaurant_admin'])
      .eq('status', 'active')
      .single()

    if (adminError || !adminCheck) {
      // Also check if user is a platform admin
      const { data: platformAdminCheck, error: platformAdminError } = await supabaseClient
        .from('platform_admin_users')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['super_admin', 'admin'])
        .eq('status', 'active')
        .single()

      if (platformAdminError || !platformAdminCheck) {
        return new Response(
          JSON.stringify({ 
            error: 'Forbidden: You are not authorized to manage customers for this client' 
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Handle GET request - List customers
    if (req.method === 'GET') {
      const customerId = url.searchParams.get('customer_id')
      const locationId = url.searchParams.get('location_id')
      const search = url.searchParams.get('search')
      const status = url.searchParams.get('status')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const offset = parseInt(url.searchParams.get('offset') || '0')

      // If customer_id is provided, fetch single customer with full details
      if (customerId) {
        let query = supabaseClient
          .from('clients')
          .select(`
            id,
            restaurant_id,
            location_id,
            name,
            email,
            phone,
            qr_code,
            stamps,
            total_visits,
            last_visit,
            customer_status,
            created_at,
            updated_at,
            locations:location_id (
              id,
              name,
              address
            ),
            restaurants:restaurant_id (
              id,
              name,
              client_id
            )
          `)
          .eq('id', customerId)

        // Apply restaurant scope for restaurant_admins
        if (adminCheck?.role === 'restaurant_admin' && adminCheck.restaurant_id) {
          query = query.eq('restaurant_id', adminCheck.restaurant_id)
        }

        const { data: customer, error: customerError } = await query.single()

        if (customerError || !customer) {
          return new Response(
            JSON.stringify({ error: 'Customer not found or access denied' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // Fetch recent stamps
        const { data: recentStamps } = await supabaseClient
          .from('stamps')
          .select(`
            id,
            amount,
            notes,
            created_at,
            auth_users:added_by (
              user_metadata
            )
          `)
          .eq('client_id', customerId)
          .order('created_at', { ascending: false })
          .limit(10)

        // Fetch recent rewards
        const { data: recentRewards } = await supabaseClient
          .from('rewards')
          .select(`
            id,
            stamps_used,
            description,
            value,
            created_at,
            auth_users:redeemed_by (
              user_metadata
            )
          `)
          .eq('client_id', customerId)
          .order('created_at', { ascending: false })
          .limit(10)

        const customerWithDetails = {
          ...customer,
          recent_stamps: recentStamps?.map(stamp => ({
            ...stamp,
            added_by_name: stamp.auth_users?.user_metadata?.full_name || 
                          stamp.auth_users?.user_metadata?.name || 'Unknown'
          })) || [],
          recent_rewards: recentRewards?.map(reward => ({
            ...reward,
            redeemed_by_name: reward.auth_users?.user_metadata?.full_name || 
                             reward.auth_users?.user_metadata?.name || 'Unknown'
          })) || []
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: customerWithDetails 
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // List customers with filters
      let query = supabaseClient
        .from('clients')
        .select(`
          id,
          restaurant_id,
          location_id,
          name,
          email,
          phone,
          qr_code,
          stamps,
          total_visits,
          last_visit,
          customer_status,
          created_at,
          updated_at,
          locations:location_id (
            id,
            name,
            address
          ),
          restaurants:restaurant_id (
            id,
            name,
            client_id
          )
        `, { count: 'exact' })

      // Apply restaurant scope for restaurant_admins
      if (adminCheck?.role === 'restaurant_admin' && adminCheck.restaurant_id) {
        query = query.eq('restaurant_id', adminCheck.restaurant_id)
      } else {
        // For client_admins, filter by client_id through restaurants
        query = query.eq('restaurants.client_id', clientId)
      }

      // Apply filters
      if (locationId) {
        query = query.eq('location_id', locationId)
      }

      if (status) {
        query = query.eq('customer_status', status)
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
      }

      // Apply pagination and ordering
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data: customers, error: customersError, count } = await query

      if (customersError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch customers', details: customersError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: customers || [],
          pagination: {
            total: count || 0,
            limit,
            offset,
            hasMore: (count || 0) > offset + limit
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Handle PATCH request - Update customer
    if (req.method === 'PATCH') {
      const customerId = url.searchParams.get('customer_id')
      if (!customerId) {
        return new Response(
          JSON.stringify({ error: 'customer_id is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const body: UpdateCustomerRequest = await req.json()

      // Validate customer status
      if (body.customer_status && !['active', 'inactive', 'blocked'].includes(body.customer_status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid customer status. Must be active, inactive, or blocked' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Validate email format if provided
      if (body.email && !isValidEmail(body.email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Build update object
      const updateData: any = {}
      if (body.name) updateData.name = body.name.trim()
      if (body.email !== undefined) updateData.email = body.email?.trim() || null
      if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null
      if (body.customer_status) updateData.customer_status = body.customer_status
      if (body.location_id !== undefined) updateData.location_id = body.location_id || null
      updateData.updated_at = new Date().toISOString()

      // Update the customer (RLS will ensure only authorized users can update)
      let updateQuery = supabaseClient
        .from('clients')
        .update(updateData)
        .eq('id', customerId)

      // Apply restaurant scope for restaurant_admins
      if (adminCheck?.role === 'restaurant_admin' && adminCheck.restaurant_id) {
        updateQuery = updateQuery.eq('restaurant_id', adminCheck.restaurant_id)
      }

      const { data: updatedCustomer, error: updateError } = await updateQuery
        .select(`
          id,
          restaurant_id,
          location_id,
          name,
          email,
          phone,
          qr_code,
          stamps,
          total_visits,
          last_visit,
          customer_status,
          created_at,
          updated_at,
          locations:location_id (
            id,
            name,
            address
          ),
          restaurants:restaurant_id (
            id,
            name,
            client_id
          )
        `)
        .single()

      if (updateError) {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update customer', 
            details: updateError.message 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Log the customer update for audit trail
      await supabaseClient
        .from('platform_activity_log')
        .insert({
          activity_type: 'customer_updated',
          description: `Customer updated: ${updatedCustomer.name}`,
          client_name: clientId,
          user_id: user.id,
          metadata: {
            client_id: clientId,
            customer_id: customerId,
            updated_fields: Object.keys(updateData),
            user_email: user.email
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Customer updated successfully',
          data: updatedCustomer 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Customer Manager API Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
} 
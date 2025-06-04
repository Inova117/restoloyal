import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient as createSupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface PlatformMetrics {
  total_clients: number
  active_clients: number
  total_restaurants: number
  total_locations: number
  total_customers: number
  monthly_revenue: number
  growth_rate: number
  system_health: 'healthy' | 'warning' | 'critical'
  last_updated: string
}

interface ClientData {
  id: string
  name: string
  slug: string
  type: 'restaurant_chain' | 'single_restaurant'
  status: 'active' | 'trial' | 'suspended'
  plan: 'trial' | 'business' | 'enterprise'
  contact_email: string
  contact_phone?: string
  logo?: string
  restaurant_count: number
  location_count: number
  customer_count: number
  monthly_revenue: number
  growth_rate: number
  join_date: string
  last_activity: string
}

interface ActivityItem {
  id: string
  type: 'client_signup' | 'restaurant_added' | 'system_update' | 'payment_processed' | 'issue_resolved'
  title: string
  description: string
  user_id?: string
  user_name?: string
  client_id?: string
  client_name?: string
  severity: 'low' | 'medium' | 'high'
  created_at: string
  metadata?: Record<string, any>
}

interface SystemHealthData {
  database_status: 'healthy' | 'warning' | 'critical'
  api_response_time: number
  active_connections: number
  memory_usage: number
  cpu_usage: number
  disk_usage: number
  uptime: number
  last_backup: string
  pending_migrations: number
}

interface CreateClientRequest {
  name: string
  slug: string
  type: 'restaurant_chain' | 'single_restaurant'
  plan: 'trial' | 'business' | 'enterprise'
  contact_email: string
  contact_phone?: string
  billing_address?: string
}

interface UpdateClientRequest {
  name?: string
  type?: 'restaurant_chain' | 'single_restaurant'
  status?: 'active' | 'trial' | 'suspended'
  plan?: 'trial' | 'business' | 'enterprise'
  contact_email?: string
  contact_phone?: string
  billing_address?: string
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createSupabaseClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify JWT token and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify platform admin privileges
    const isPlatformAdmin = await verifyPlatformAdmin(supabaseClient, user.id, user.email)
    if (!isPlatformAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Platform admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse URL and route to appropriate handler
    const url = new URL(req.url)
    const endpoint = url.searchParams.get('endpoint') || url.pathname.split('/').pop()

    switch (req.method) {
      case 'GET':
        return await handleGetRequest(supabaseClient, endpoint || 'metrics', url.searchParams)
      case 'POST':
        const postBody = await req.json()
        return await handlePostRequest(supabaseClient, endpoint || 'clients', postBody)
      case 'PUT':
        const putBody = await req.json()
        return await handlePutRequest(supabaseClient, endpoint || 'clients', putBody, url.searchParams)
      case 'DELETE':
        return await handleDeleteRequest(supabaseClient, endpoint || 'clients', url.searchParams)
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
    }

  } catch (error) {
    console.error('Platform Management API Error:', error)
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

// ============================================================================
// AUTH VERIFICATION
// ============================================================================

async function verifyPlatformAdmin(supabaseClient: any, userId: string, userEmail?: string): Promise<boolean> {
  try {
    // Check platform_admin_users table
    const { data: adminData, error: adminError } = await supabaseClient
      .from('platform_admin_users')
      .select('role, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (!adminError && adminData) {
      return true
    }

    // Fallback: Check if user email is in platform admin list
    if (userEmail) {
      const adminEmails = [
        'admin@zerioncore.com',
        'platform@zerioncore.com', 
        'owner@zerioncore.com',
        'martin@zerionstudio.com'
      ]
      return adminEmails.includes(userEmail.toLowerCase())
    }

    return false
  } catch (error) {
    console.error('Admin verification error:', error)
    return false
  }
}

// ============================================================================
// REQUEST HANDLERS
// ============================================================================

async function handleGetRequest(supabaseClient: any, endpoint: string, params: URLSearchParams) {
  switch (endpoint) {
    case 'metrics':
      return await getPlatformMetrics(supabaseClient)
    case 'clients':
      return await getClients(supabaseClient, params)
    case 'activity':
      return await getPlatformActivity(supabaseClient, params)
    case 'health':
      return await getSystemHealth(supabaseClient)
    case 'client':
      const clientId = params.get('id')
      if (!clientId) {
        return new Response(
          JSON.stringify({ error: 'Client ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return await getClient(supabaseClient, clientId)
    default:
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
  }
}

async function handlePostRequest(supabaseClient: any, endpoint: string, body: any) {
  switch (endpoint) {
    case 'clients':
      return await createClient(supabaseClient, body)
    case 'activity':
      return await logActivity(supabaseClient, body)
    default:
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint for POST' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
  }
}

async function handlePutRequest(supabaseClient: any, endpoint: string, body: any, params: URLSearchParams) {
  switch (endpoint) {
    case 'clients':
      const clientId = params.get('id')
      if (!clientId) {
        return new Response(
          JSON.stringify({ error: 'Client ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return await updateClient(supabaseClient, clientId, body)
    default:
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint for PUT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
  }
}

async function handleDeleteRequest(supabaseClient: any, endpoint: string, params: URLSearchParams) {
  switch (endpoint) {
    case 'clients':
      const clientId = params.get('id')
      if (!clientId) {
        return new Response(
          JSON.stringify({ error: 'Client ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return await deleteClient(supabaseClient, clientId)
    default:
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint for DELETE' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
  }
}

// ============================================================================
// PLATFORM METRICS
// ============================================================================

async function getPlatformMetrics(supabaseClient: any) {
  try {
    // Get client metrics
    const { data: clientMetrics, error: clientError } = await supabaseClient
      .from('platform_clients')
      .select('status, restaurant_count, location_count, customer_count, monthly_revenue')

    if (clientError) throw clientError

    // Get restaurant count
    const { count: restaurantCount, error: restaurantError } = await supabaseClient
      .from('restaurants')
      .select('*', { count: 'exact', head: true })

    if (restaurantError) throw restaurantError

    // Get location count
    const { count: locationCount, error: locationError } = await supabaseClient
      .from('locations')
      .select('*', { count: 'exact', head: true })

    if (locationError) throw locationError

    // Get customer count
    const { count: customerCount, error: customerError } = await supabaseClient
      .from('customers')
      .select('*', { count: 'exact', head: true })

    if (customerError) throw customerError

    // Calculate metrics
    const totalClients = clientMetrics.length
    const activeClients = clientMetrics.filter(c => c.status === 'active').length
    const totalRevenue = clientMetrics.reduce((sum, c) => sum + (c.monthly_revenue || 0), 0)

    // Calculate growth rate (simplified - based on clients created in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: newClientsCount, error: newClientsError } = await supabaseClient
      .from('platform_clients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (newClientsError) throw newClientsError

    const growthRate = totalClients > 0 ? (newClientsCount / totalClients) * 100 : 0

    // System health check (simplified)
    const systemHealth = await calculateSystemHealth(supabaseClient)

    const metrics: PlatformMetrics = {
      total_clients: totalClients,
      active_clients: activeClients,
      total_restaurants: restaurantCount || 0,
      total_locations: locationCount || 0,
      total_customers: customerCount || 0,
      monthly_revenue: totalRevenue,
      growth_rate: growthRate,
      system_health: systemHealth,
      last_updated: new Date().toISOString()
    }

    return new Response(
      JSON.stringify({ success: true, data: metrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error getting platform metrics:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get platform metrics', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ============================================================================
// CLIENT MANAGEMENT
// ============================================================================

async function getClients(supabaseClient: any, params: URLSearchParams) {
  try {
    const page = parseInt(params.get('page') || '1')
    const limit = parseInt(params.get('limit') || '20')
    const search = params.get('search')
    const status = params.get('status')
    const plan = params.get('plan')

    let query = supabaseClient
      .from('platform_clients')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_email.ilike.%${search}%`)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (plan) {
      query = query.eq('plan', plan)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: clients, error: clientsError } = await query

    if (clientsError) throw clientsError

    // Get total count for pagination
    let countQuery = supabaseClient
      .from('platform_clients')
      .select('*', { count: 'exact', head: true })

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,contact_email.ilike.%${search}%`)
    }
    if (status) {
      countQuery = countQuery.eq('status', status)
    }
    if (plan) {
      countQuery = countQuery.eq('plan', plan)
    }

    const { count: totalCount, error: countError } = await countQuery

    if (countError) throw countError

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: clients,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error getting clients:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get clients', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function getClient(supabaseClient: any, clientId: string) {
  try {
    const { data: client, error: clientError } = await supabaseClient
      .from('platform_clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (clientError) throw clientError

    return new Response(
      JSON.stringify({ success: true, data: client }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error getting client:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get client', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function createClient(supabaseClient: any, clientData: CreateClientRequest) {
  try {
    // Validate required fields
    if (!clientData.name || !clientData.slug || !clientData.contact_email) {
      return new Response(
        JSON.stringify({ error: 'Name, slug, and contact email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if slug is unique
    const { data: existingClient, error: slugError } = await supabaseClient
      .from('platform_clients')
      .select('id')
      .eq('slug', clientData.slug)
      .single()

    if (existingClient) {
      return new Response(
        JSON.stringify({ error: 'Client slug already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client
    const { data: newClient, error: createError } = await supabaseClient
      .from('platform_clients')
      .insert([{
        name: clientData.name,
        slug: clientData.slug,
        type: clientData.type || 'restaurant_chain',
        plan: clientData.plan || 'trial',
        contact_email: clientData.contact_email,
        contact_phone: clientData.contact_phone,
        billing_address: clientData.billing_address,
        status: 'trial'
      }])
      .select()
      .single()

    if (createError) throw createError

    // Log activity
    await logActivity(supabaseClient, {
      type: 'client_signup',
      title: 'New Client Created',
      description: `Client "${clientData.name}" has been created`,
      client_id: newClient.id,
      client_name: clientData.name,
      severity: 'medium'
    })

    return new Response(
      JSON.stringify({ success: true, data: newClient }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating client:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create client', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function updateClient(supabaseClient: any, clientId: string, updateData: UpdateClientRequest) {
  try {
    const { data: updatedClient, error: updateError } = await supabaseClient
      .from('platform_clients')
      .update(updateData)
      .eq('id', clientId)
      .select()
      .single()

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true, data: updatedClient }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error updating client:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update client', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function deleteClient(supabaseClient: any, clientId: string) {
  try {
    const { error: deleteError } = await supabaseClient
      .from('platform_clients')
      .delete()
      .eq('id', clientId)

    if (deleteError) throw deleteError

    return new Response(
      JSON.stringify({ success: true, message: 'Client deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error deleting client:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to delete client', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ============================================================================
// ACTIVITY MONITORING
// ============================================================================

async function getPlatformActivity(supabaseClient: any, params: URLSearchParams) {
  try {
    const limit = parseInt(params.get('limit') || '50')
    const page = parseInt(params.get('page') || '1')
    const type = params.get('type')

    let query = supabaseClient
      .from('platform_activity_log')
      .select('*')
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('activity_type', type)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: activities, error: activitiesError } = await query

    if (activitiesError) throw activitiesError

    // Transform to match frontend interface
    const transformedActivities: ActivityItem[] = activities.map(activity => ({
      id: activity.id,
      type: activity.activity_type,
      title: activity.title || activity.description,
      description: activity.description,
      user_id: activity.user_id,
      user_name: activity.metadata?.user_name,
      client_id: activity.client_id,
      client_name: activity.metadata?.client_name,
      severity: activity.severity || 'low',
      created_at: activity.created_at,
      metadata: activity.metadata
    }))

    return new Response(
      JSON.stringify({ success: true, data: transformedActivities }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error getting platform activity:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get platform activity', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function logActivity(supabaseClient: any, activityData: Partial<ActivityItem>) {
  try {
    const { data: newActivity, error: activityError } = await supabaseClient
      .from('platform_activity_log')
      .insert([{
        activity_type: activityData.type,
        title: activityData.title,
        description: activityData.description,
        user_id: activityData.user_id,
        client_id: activityData.client_id,
        severity: activityData.severity || 'low',
        metadata: activityData.metadata || {}
      }])
      .select()
      .single()

    if (activityError) throw activityError

    return new Response(
      JSON.stringify({ success: true, data: newActivity }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error logging activity:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to log activity', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ============================================================================
// SYSTEM HEALTH
// ============================================================================

async function getSystemHealth(supabaseClient: any) {
  try {
    const startTime = Date.now()

    // Test database connectivity and response time
    const { data: testQuery, error: testError } = await supabaseClient
      .from('platform_clients')
      .select('id')
      .limit(1)

    const responseTime = Date.now() - startTime

    if (testError) throw testError

    // Get connection stats (simplified)
    const { count: clientCount, error: clientCountError } = await supabaseClient
      .from('platform_clients')
      .select('*', { count: 'exact', head: true })

    if (clientCountError) throw clientCountError

    // Calculate system health metrics (simplified implementation)
    const healthData: SystemHealthData = {
      database_status: responseTime < 1000 ? 'healthy' : responseTime < 2000 ? 'warning' : 'critical',
      api_response_time: responseTime,
      active_connections: clientCount || 0,
      memory_usage: Math.random() * 80, // Simulated
      cpu_usage: Math.random() * 60,    // Simulated
      disk_usage: Math.random() * 70,   // Simulated
      uptime: Date.now() - new Date('2024-01-01').getTime(), // Simulated
      last_backup: new Date().toISOString(),
      pending_migrations: 0
    }

    return new Response(
      JSON.stringify({ success: true, data: healthData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error getting system health:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get system health', 
        details: error.message,
        data: {
          database_status: 'critical',
          api_response_time: 5000,
          active_connections: 0,
          memory_usage: 0,
          cpu_usage: 0,
          disk_usage: 0,
          uptime: 0,
          last_backup: new Date().toISOString(),
          pending_migrations: 0
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function calculateSystemHealth(supabaseClient: any): Promise<'healthy' | 'warning' | 'critical'> {
  try {
    const startTime = Date.now()
    
    // Test database response time
    await supabaseClient
      .from('platform_clients')
      .select('id')
      .limit(1)
    
    const responseTime = Date.now() - startTime

    if (responseTime < 500) return 'healthy'
    if (responseTime < 1500) return 'warning'
    return 'critical'

  } catch (error) {
    return 'critical'
  }
} 
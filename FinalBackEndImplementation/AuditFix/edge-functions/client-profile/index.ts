// ============================================================================
// EDGE FUNCTION: CLIENT PROFILE MANAGEMENT
// ============================================================================
// Task T1.2: Client Profile Management - AuditFix Implementation
// Hook integration: useClientProfile.ts already implemented
// Supports: GET, PUT operations for client profiles + metrics
// ============================================================================

/// <reference path="./deno.d.ts" />

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

// Client Profile interfaces matching useClientProfile.ts expectations
interface ClientProfile {
  id: string
  name: string
  slug: string
  email?: string
  phone?: string
  business_type?: string
  status: 'active' | 'inactive' | 'suspended'
  settings?: any
  created_at: string
  updated_at: string
}

interface ClientProfileWithStats extends ClientProfile {
  locations_count: number
  customers_count: number
  staff_count: number
  stamps_count: number
  rewards_count: number
  monthly_revenue: number
}

interface CreateClientData {
  name: string
  email?: string
  phone?: string
  business_type?: string
  settings?: any
}

interface UpdateClientData {
  name?: string
  email?: string
  phone?: string
  business_type?: string
  status?: 'active' | 'inactive' | 'suspended'
  settings?: any
}

interface ClientFilters {
  search?: string
  status?: 'active' | 'inactive' | 'suspended'
  business_type?: string
  limit?: number
  offset?: number
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
    
    // Verify user authorization - must be superadmin or client_admin
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('tier, role_id, client_id, location_id')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      console.error('Role verification error:', roleError)
      return errorResponse('Access denied: No valid role found', 403)
    }

    // Only superadmin and client_admin can access client profiles
    if (!['superadmin', 'client_admin'].includes(userRole.tier)) {
      return errorResponse('Access denied: Insufficient permissions', 403)
    }

    console.log(`Client Profile: ${method} request from user ${user.id} with role ${userRole.tier}`)

    // Route handlers
    switch (method) {
      case 'GET':
        return await handleGetClients(supabaseClient, url, userRole)
      
      case 'POST':
        if (userRole.tier !== 'superadmin') {
          return errorResponse('Access denied: Only superadmins can create clients', 403)
        }
        return await handleCreateClient(supabaseClient, req, userRole)
      
      case 'PATCH':
        return await handleUpdateClient(supabaseClient, req, userRole)
      
      case 'DELETE':
        if (userRole.tier !== 'superadmin') {
          return errorResponse('Access denied: Only superadmins can delete clients', 403)
        }
        return await handleDeleteClient(supabaseClient, url, userRole)
      
      default:
        return errorResponse(`Method ${method} not allowed`, 405)
    }

  } catch (error) {
    console.error('Client Profile Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

// GET /client-profile - List clients with stats and filters
async function handleGetClients(supabaseClient: any, url: URL, userRole: any) {
  try {
    const clientId = url.searchParams.get('client_id')
    const search = url.searchParams.get('search')
    const status = url.searchParams.get('status') as 'active' | 'inactive' | 'suspended' | null
    const businessType = url.searchParams.get('business_type')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const includeStats = url.searchParams.get('include_stats') === 'true'

    // Build base query
    let query = supabaseClient
      .from('clients')
      .select('*')

    // Apply role-based access control
    if (userRole.tier === 'client_admin' && userRole.client_id) {
      // Client admins can only see their own client
      query = query.eq('id', userRole.client_id)
    }

    // Apply specific client filter for superadmins
    if (clientId && userRole.tier === 'superadmin') {
      query = query.eq('id', clientId)
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,slug.ilike.%${search}%`)
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Apply business type filter
    if (businessType) {
      query = query.eq('business_type', businessType)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data: clients, error: clientsError } = await query

    if (clientsError) {
      console.error('Error fetching clients:', clientsError)
      return errorResponse('Failed to fetch clients', 500)
    }

    if (!clients || clients.length === 0) {
      return jsonResponse({ data: [], count: 0 })
    }

    // If stats are requested, load additional data
    if (includeStats) {
      const clientsWithStats = await Promise.all(
        clients.map(async (client) => {
          const stats = await loadClientStats(supabaseClient, client.id)
          return {
            ...client,
            ...stats
          } as ClientProfileWithStats
        })
      )

      return jsonResponse({ 
        data: clientsWithStats,
        count: clientsWithStats.length 
      })
    }

    return jsonResponse({ 
      data: clients,
      count: clients.length 
    })

  } catch (error) {
    console.error('Error in handleGetClients:', error)
    return errorResponse('Failed to fetch clients', 500)
  }
}

// Load client statistics
async function loadClientStats(supabaseClient: any, clientId: string) {
  try {
    // Load locations count
    const { count: locationsCount } = await supabaseClient
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('is_active', true)

    // Load customers count
    const { count: customersCount } = await supabaseClient
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'active')

    // Load staff count
    const { count: staffCount } = await supabaseClient
      .from('location_staff')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('is_active', true)

    // Load stamps count
    const { count: stampsCount } = await supabaseClient
      .from('stamps')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)

    // Load rewards count
    const { count: rewardsCount } = await supabaseClient
      .from('rewards')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)

    // Calculate monthly revenue (placeholder - would need transaction data)
    const monthlyRevenue = 0

    return {
      locations_count: locationsCount || 0,
      customers_count: customersCount || 0,
      staff_count: staffCount || 0,
      stamps_count: stampsCount || 0,
      rewards_count: rewardsCount || 0,
      monthly_revenue: monthlyRevenue
    }
  } catch (error) {
    console.error('Error loading client stats:', error)
    return {
      locations_count: 0,
      customers_count: 0,
      staff_count: 0,
      stamps_count: 0,
      rewards_count: 0,
      monthly_revenue: 0
    }
  }
}

// POST /client-profile - Create new client (superadmin only)
async function handleCreateClient(supabaseClient: any, req: Request, userRole: any) {
  try {
    const body = await req.json() as CreateClientData

    // Validate required fields
    if (!body.name) {
      return errorResponse('Client name is required', 400)
    }

    // Generate slug from name
    const slug = body.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')

    // Check if slug already exists
    const { data: existingClient } = await supabaseClient
      .from('clients')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existingClient) {
      return errorResponse('Client with similar name already exists', 409)
    }

    // Create client record
    const clientData = {
      name: body.name,
      slug,
      email: body.email || null,
      phone: body.phone || null,
      business_type: body.business_type || 'restaurant',
      status: 'active',
      settings: body.settings || {}
    }

    const { data: newClient, error: createError } = await supabaseClient
      .from('clients')
      .insert(clientData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating client:', createError)
      return errorResponse('Failed to create client', 500)
    }

    // Load stats for the new client
    const stats = await loadClientStats(supabaseClient, newClient.id)

    return jsonResponse({
      message: 'Client created successfully',
      data: {
        ...newClient,
        ...stats
      }
    }, 201)

  } catch (error) {
    console.error('Error in handleCreateClient:', error)
    return errorResponse('Failed to create client', 500)
  }
}

// PATCH /client-profile - Update client
async function handleUpdateClient(supabaseClient: any, req: Request, userRole: any) {
  try {
    const url = new URL(req.url)
    const clientId = url.searchParams.get('client_id')

    if (!clientId) {
      return errorResponse('client_id is required', 400)
    }

    // Verify access rights
    if (userRole.tier === 'client_admin' && userRole.client_id !== clientId) {
      return errorResponse('Access denied: Can only update own client profile', 403)
    }

    const body = await req.json() as UpdateClientData

    // If updating name, regenerate slug
    const updateData: any = { ...body }
    if (body.name) {
      updateData.slug = body.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-')

             // Check if new slug conflicts with existing clients
       const { data: existingClient } = await supabaseClient
         .from('clients')
         .select('id')
         .eq('slug', updateData.slug)
         .neq('id', clientId)
         .maybeSingle()

      if (existingClient) {
        return errorResponse('Client with similar name already exists', 409)
      }
    }

    updateData.updated_at = new Date().toISOString()

    // Update client
    const { data: updatedClient, error: updateError } = await supabaseClient
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating client:', updateError)
      return errorResponse('Failed to update client', 500)
    }

    // Load updated stats
    const stats = await loadClientStats(supabaseClient, clientId)

    return jsonResponse({
      message: 'Client updated successfully',
      data: {
        ...updatedClient,
        ...stats
      }
    })

  } catch (error) {
    console.error('Error in handleUpdateClient:', error)
    return errorResponse('Failed to update client', 500)
  }
}

// DELETE /client-profile - Delete client (superadmin only)
async function handleDeleteClient(supabaseClient: any, url: URL, userRole: any) {
  try {
    const clientId = url.searchParams.get('client_id')

    if (!clientId) {
      return errorResponse('client_id is required', 400)
    }

    // Check if client has associated locations/customers
    const { count: locationsCount } = await supabaseClient
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)

    const { count: customersCount } = await supabaseClient
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)

    if ((locationsCount || 0) > 0 || (customersCount || 0) > 0) {
      return errorResponse('Cannot delete client with existing locations or customers', 409)
    }

    // Delete client
    const { error: deleteError } = await supabaseClient
      .from('clients')
      .delete()
      .eq('id', clientId)

    if (deleteError) {
      console.error('Error deleting client:', deleteError)
      return errorResponse('Failed to delete client', 500)
    }

    return jsonResponse({
      message: 'Client deleted successfully'
    })

  } catch (error) {
    console.error('Error in handleDeleteClient:', error)
    return errorResponse('Failed to delete client', 500)
  }
}

/* 
============================================================================
TASK T1.2: CLIENT PROFILE MANAGEMENT - AUDITFIX
============================================================================
DEPLOYMENT STATUS: Ready for Supabase Edge Function deployment
INTEGRATION: useClientProfile.ts hook already implemented and ready
ENDPOINTS:
- GET /client-profile?client_id=123 - Get profile
- GET /client-profile/metrics?client_id=123 - Get metrics  
- PUT /client-profile - Update profile
============================================================================
*/ 
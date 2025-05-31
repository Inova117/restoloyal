// @ts-ignore - Deno imports work in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno imports work in Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Location {
  id: string
  restaurant_id: string
  name: string
  address: string
  city: string
  state: string
  zip_code?: string
  phone?: string
  manager_name?: string
  manager_email?: string
  is_active: boolean
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
}

interface LocationCreate {
  restaurant_id: string
  name: string
  address: string
  city: string
  state: string
  zip_code?: string
  phone?: string
  manager_name?: string
  manager_email?: string
  latitude?: number
  longitude?: number
}

interface LocationUpdate {
  name?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  phone?: string
  manager_name?: string
  manager_email?: string
  is_active?: boolean
  latitude?: number
  longitude?: number
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

    const url = new URL(req.url)
    const clientId = url.searchParams.get('client_id')
    const locationId = url.searchParams.get('location_id')

    // Verify user has appropriate role for this client
    const hasAccess = await verifyUserAccess(supabaseClient, user.id, clientId)
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden: You are not authorized to manage locations for this client' 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Handle GET request - List all locations for the franchise
    if (req.method === 'GET') {
      if (!clientId) {
        return new Response(
          JSON.stringify({ error: 'client_id is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const { data: locations, error: locationsError } = await supabaseClient
        .from('locations')
        .select(`
          id,
          restaurant_id,
          name,
          address,
          city,
          state,
          zip_code,
          phone,
          manager_name,
          manager_email,
          is_active,
          latitude,
          longitude,
          created_at,
          updated_at,
          restaurants!inner(
            id,
            name,
            client_id
          )
        `)
        .eq('restaurants.client_id', clientId)
        .order('name')

      if (locationsError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch locations', details: locationsError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: locations 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Handle POST request - Add a new location
    if (req.method === 'POST') {
      const body = await req.json()
      
      if (!clientId) {
        return new Response(
          JSON.stringify({ error: 'client_id is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Validate required fields
      const requiredFields = ['restaurant_id', 'name', 'address', 'city', 'state']
      for (const field of requiredFields) {
        if (!body[field] || body[field].trim().length === 0) {
          return new Response(
            JSON.stringify({ error: `${field} is required` }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
      }

      // Verify restaurant belongs to the client
      const { data: restaurant, error: restaurantError } = await supabaseClient
        .from('restaurants')
        .select('id, client_id')
        .eq('id', body.restaurant_id)
        .eq('client_id', clientId)
        .single()

      if (restaurantError || !restaurant) {
        return new Response(
          JSON.stringify({ error: 'Invalid restaurant_id for this client' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Validate email format if provided
      if (body.manager_email && !isValidEmail(body.manager_email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid manager email format' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const locationData: LocationCreate = {
        restaurant_id: body.restaurant_id,
        name: body.name.trim(),
        address: body.address.trim(),
        city: body.city.trim(),
        state: body.state.trim(),
        zip_code: body.zip_code?.trim(),
        phone: body.phone?.trim(),
        manager_name: body.manager_name?.trim(),
        manager_email: body.manager_email?.trim(),
        latitude: body.latitude,
        longitude: body.longitude
      }

      const { data: newLocation, error: createError } = await supabaseClient
        .from('locations')
        .insert(locationData)
        .select(`
          id,
          restaurant_id,
          name,
          address,
          city,
          state,
          zip_code,
          phone,
          manager_name,
          manager_email,
          is_active,
          latitude,
          longitude,
          created_at,
          updated_at
        `)
        .single()

      if (createError) {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create location', 
            details: createError.message 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Log the location creation for audit trail
      await supabaseClient
        .from('platform_activity_log')
        .insert({
          activity_type: 'location_added',
          description: `New location added: ${newLocation.name}`,
          client_name: `Client ${clientId}`,
          user_id: user.id,
          metadata: {
            location_id: newLocation.id,
            location_name: newLocation.name,
            client_id: clientId,
            user_email: user.email
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Location created successfully',
          data: newLocation 
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Handle PATCH request - Update location
    if (req.method === 'PATCH') {
      if (!locationId) {
        return new Response(
          JSON.stringify({ error: 'location_id is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const body = await req.json()

      // Verify location belongs to the client
      const { data: existingLocation, error: locationError } = await supabaseClient
        .from('locations')
        .select(`
          id,
          name,
          restaurants!inner(
            id,
            client_id
          )
        `)
        .eq('id', locationId)
        .eq('restaurants.client_id', clientId)
        .single()

      if (locationError || !existingLocation) {
        return new Response(
          JSON.stringify({ error: 'Location not found or access denied' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Validate email format if provided
      if (body.manager_email && !isValidEmail(body.manager_email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid manager email format' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Prepare update data
      const allowedFields = [
        'name', 'address', 'city', 'state', 'zip_code', 
        'phone', 'manager_name', 'manager_email', 'is_active',
        'latitude', 'longitude'
      ]
      
      const updateData: Partial<LocationUpdate> = {}
      
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = typeof body[field] === 'string' ? body[field].trim() : body[field]
        }
      }

      if (Object.keys(updateData).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No valid fields to update' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const { data: updatedLocation, error: updateError } = await supabaseClient
        .from('locations')
        .update(updateData)
        .eq('id', locationId)
        .select(`
          id,
          restaurant_id,
          name,
          address,
          city,
          state,
          zip_code,
          phone,
          manager_name,
          manager_email,
          is_active,
          latitude,
          longitude,
          created_at,
          updated_at
        `)
        .single()

      if (updateError) {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update location', 
            details: updateError.message 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Log the location update for audit trail
      await supabaseClient
        .from('platform_activity_log')
        .insert({
          activity_type: 'location_updated',
          description: `Location updated: ${updatedLocation.name}`,
          client_name: `Client ${clientId}`,
          user_id: user.id,
          metadata: {
            location_id: locationId,
            location_name: updatedLocation.name,
            updated_fields: Object.keys(updateData),
            client_id: clientId,
            user_email: user.email
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Location updated successfully',
          data: updatedLocation 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Handle DELETE request - Remove location
    if (req.method === 'DELETE') {
      if (!locationId) {
        return new Response(
          JSON.stringify({ error: 'location_id is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Verify location belongs to the client and get location details
      const { data: existingLocation, error: locationError } = await supabaseClient
        .from('locations')
        .select(`
          id,
          name,
          restaurants!inner(
            id,
            client_id
          )
        `)
        .eq('id', locationId)
        .eq('restaurants.client_id', clientId)
        .single()

      if (locationError || !existingLocation) {
        return new Response(
          JSON.stringify({ error: 'Location not found or access denied' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Check if location has associated data (clients, stamps, rewards)
      const { data: associatedData, error: checkError } = await supabaseClient
        .from('clients')
        .select('id')
        .eq('location_id', locationId)
        .limit(1)

      if (checkError) {
        return new Response(
          JSON.stringify({ error: 'Failed to check location dependencies' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      if (associatedData && associatedData.length > 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Cannot delete location with existing customer data. Please deactivate instead.' 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const { error: deleteError } = await supabaseClient
        .from('locations')
        .delete()
        .eq('id', locationId)

      if (deleteError) {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to delete location', 
            details: deleteError.message 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Log the location deletion for audit trail
      await supabaseClient
        .from('platform_activity_log')
        .insert({
          activity_type: 'location_deleted',
          description: `Location deleted: ${existingLocation.name}`,
          client_name: `Client ${clientId}`,
          user_id: user.id,
          metadata: {
            location_id: locationId,
            location_name: existingLocation.name,
            client_id: clientId,
            user_email: user.email
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Location deleted successfully' 
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
    console.error('Location Manager API Error:', error)
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

// Helper function to verify user access
async function verifyUserAccess(supabaseClient: any, userId: string, clientId: string | null): Promise<boolean> {
  if (!clientId) return false

  // Check if user is client_admin for this client
  const { data: clientAdmin, error: clientAdminError } = await supabaseClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .eq('role', 'client_admin')
    .single()

  if (!clientAdminError && clientAdmin) {
    return true
  }

  // Check if user is restaurant_admin for any restaurant in this client
  const { data: restaurantAdmin, error: restaurantAdminError } = await supabaseClient
    .from('user_roles')
    .select(`
      role,
      restaurants!inner(
        id,
        client_id
      )
    `)
    .eq('user_id', userId)
    .eq('role', 'restaurant_admin')
    .eq('restaurants.client_id', clientId)
    .single()

  if (!restaurantAdminError && restaurantAdmin) {
    return true
  }

  // Check if user is platform admin (can access all clients)
  const { data: platformAdmin, error: platformAdminError } = await supabaseClient
    .from('platform_admin_users')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['super_admin', 'admin'])
    .eq('status', 'active')
    .single()

  if (!platformAdminError && platformAdmin) {
    return true
  }

  return false
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
} 
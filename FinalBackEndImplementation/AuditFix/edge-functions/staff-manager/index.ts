// Staff Manager Edge Function - Compatible with Supabase Edge Functions
// Handles staff invitation, role management, and activity tracking

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

// Staff interfaces matching your actual database schema
interface StaffMember {
  id: string
  user_id: string
  email: string
  name: string
  role: 'client_admin' | 'location_staff'
  client_id: string
  location_id?: string
  location_name?: string
  location_address?: string
  is_active: boolean
  created_at: string
  last_login?: string
}

interface InviteStaffData {
  email: string
  name: string
  role: 'client_admin' | 'location_staff'
  location_id?: string
}

interface UpdateStaffData {
  role?: 'client_admin' | 'location_staff'
  location_id?: string
  is_active?: boolean
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
      // @ts-ignore: Deno.env is available in Deno runtime
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore: Deno.env is available in Deno runtime
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

    // Verify user has access to this client and has admin privileges
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

    // Only admin roles can manage staff
    if (!['superadmin', 'client_admin'].includes(userRole.role)) {
      return errorResponse('Access denied: Insufficient privileges to manage staff', 403)
    }

    console.log(`Staff Manager: ${method} request from user ${user.id} with role ${userRole.role}`)

    // Route handlers
    switch (method) {
      case 'GET':
        return await handleGetStaff(supabaseClient, url, userRole)
      
      case 'POST':
        return await handleInviteStaff(supabaseClient, req, userRole)
      
      case 'PATCH':
        return await handleUpdateStaff(supabaseClient, req, userRole)
      
      case 'DELETE':
        return await handleRemoveStaff(supabaseClient, url, userRole)
      
      default:
        return errorResponse(`Method ${method} not allowed`, 405)
    }

  } catch (error) {
    console.error('Staff Manager Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

// GET /staff-manager - List staff members
async function handleGetStaff(supabaseClient: any, url: URL, userRole: any) {
  try {
    const clientId = url.searchParams.get('client_id')

    // Build query for user_roles table
    let query = supabaseClient
      .from('user_roles')
      .select(`
        id,
        user_id,
        role,
        client_id,
        location_id,
        is_active,
        created_at
      `)
      .eq('client_id', clientId)
      .neq('role', 'superadmin') // Don't show superadmins in staff list

    // Order by creation date
    query = query.order('created_at', { ascending: false })

    const { data: staffRoles, error } = await query

    if (error) {
      console.error('Database error:', error)
      return errorResponse('Failed to fetch staff', 500)
    }

    // Get user details and location info for each staff member
    const staffWithDetails = await Promise.all(
      (staffRoles || []).map(async (staffRole: any) => {
        // Get user details from auth.users
        const { data: userData } = await supabaseClient.auth.admin.getUserById(staffRole.user_id)
        
        // Get location details if location_id exists
        let locationData: any = null
        if (staffRole.location_id) {
          const { data: location } = await supabaseClient
            .from('locations')
            .select('id, name, address, city, state')
            .eq('id', staffRole.location_id)
            .single()
          locationData = location
        }

        return {
          id: staffRole.id,
          user_id: staffRole.user_id,
          email: userData?.user?.email || 'Unknown',
          name: userData?.user?.user_metadata?.full_name || userData?.user?.email || 'Unknown',
          role: staffRole.role,
          client_id: staffRole.client_id,
          location_id: staffRole.location_id,
          location_name: locationData?.name,
          location_address: locationData ? `${locationData.address}, ${locationData.city}, ${locationData.state}` : undefined,
          is_active: staffRole.is_active,
          created_at: staffRole.created_at,
          last_login: userData?.user?.last_sign_in_at
        }
      })
    )

    return jsonResponse({
      staff: staffWithDetails
    })

  } catch (error) {
    console.error('Error fetching staff:', error)
    return errorResponse('Failed to fetch staff', 500)
  }
}

// POST /staff-manager - Invite new staff member
async function handleInviteStaff(supabaseClient: any, req: Request, userRole: any) {
  try {
    const body = await req.json()
    const { email, name, role, location_id } = body as InviteStaffData

    // Validate required fields
    if (!email || !name || !role) {
      return errorResponse('Missing required fields: email, name, role', 400)
    }

    // Validate role
    if (!['client_admin', 'location_staff'].includes(role)) {
      return errorResponse('Invalid role. Must be client_admin or location_staff', 400)
    }

    // If role is location_staff, location_id is required
    if (role === 'location_staff' && !location_id) {
      return errorResponse('location_id is required for location_staff role', 400)
    }

    // Verify location belongs to client if location_id provided
    if (location_id) {
      const { data: location, error: locationError } = await supabaseClient
        .from('locations')
        .select('id, client_id')
        .eq('id', location_id)
        .eq('client_id', userRole.client_id)
        .single()

      if (locationError || !location) {
        return errorResponse('Invalid location for this client', 400)
      }
    }

    // Check if user already exists in auth.users
    const { data: existingUser } = await supabaseClient.auth.admin.listUsers()
    const userExists = existingUser?.users?.find((u: any) => u.email === email)

    let userId: string

    if (userExists) {
      userId = userExists.id
      
      // Check if user already has a role for this client
      const { data: existingRole } = await supabaseClient
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('client_id', userRole.client_id)
        .single()

      if (existingRole) {
        return errorResponse('User already has a role in this client', 400)
      }
    } else {
      // Create new user account
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: name
        }
      })

      if (createError || !newUser.user) {
        console.error('Error creating user:', createError)
        return errorResponse('Failed to create user account', 500)
      }

      userId = newUser.user.id
    }

    // Create user role
    const { data: userRoleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: userId,
        role,
        client_id: userRole.client_id,
        location_id: role === 'location_staff' ? location_id : null,
        is_active: true
      })
      .select()
      .single()

    if (roleError) {
      console.error('Error creating user role:', roleError)
      return errorResponse('Failed to create staff role', 500)
    }

    // If location_staff, also create entry in location_staff table
    if (role === 'location_staff' && location_id) {
      const { error: staffError } = await supabaseClient
        .from('location_staff')
        .insert({
          user_id: userId,
          location_id,
          client_id: userRole.client_id,
          email,
          name,
          role: 'staff',
          is_active: true
        })

      if (staffError) {
        console.error('Error creating location staff:', staffError)
        // Continue anyway, user_roles entry is the primary record
      }
    }

    console.log(`Invited staff member: ${email} with role: ${role}`)
    return jsonResponse({
      message: 'Staff member invited successfully',
      staff: {
        id: userRoleData.id,
        user_id: userId,
        email,
        name,
        role,
        client_id: userRole.client_id,
        location_id: role === 'location_staff' ? location_id : null,
        is_active: true
      }
    }, 201)

  } catch (error) {
    console.error('Error inviting staff:', error)
    return errorResponse('Failed to invite staff member', 500)
  }
}

// PATCH /staff-manager - Update staff member
async function handleUpdateStaff(supabaseClient: any, req: Request, userRole: any) {
  try {
    const url = new URL(req.url)
    const staffId = url.searchParams.get('staff_id')
    
    if (!staffId) {
      return errorResponse('staff_id is required', 400)
    }

    const body = await req.json()
    const updateData = body as UpdateStaffData

    // Get existing staff member
    const { data: existingStaff, error: fetchError } = await supabaseClient
      .from('user_roles')
      .select('id, user_id, role, client_id, location_id')
      .eq('id', staffId)
      .eq('client_id', userRole.client_id)
      .single()

    if (fetchError || !existingStaff) {
      return errorResponse('Staff member not found', 404)
    }

    // Validate location if provided
    if (updateData.location_id) {
      const { data: location, error: locationError } = await supabaseClient
        .from('locations')
        .select('id, client_id')
        .eq('id', updateData.location_id)
        .eq('client_id', userRole.client_id)
        .single()

      if (locationError || !location) {
        return errorResponse('Invalid location for this client', 400)
      }
    }

    // Update user role
    const { data: updatedStaff, error } = await supabaseClient
      .from('user_roles')
      .update(updateData)
      .eq('id', staffId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return errorResponse('Failed to update staff member', 500)
    }

    // If updating location_staff, also update location_staff table
    if (updatedStaff.role === 'location_staff') {
      await supabaseClient
        .from('location_staff')
        .update({
          location_id: updateData.location_id || existingStaff.location_id,
          is_active: updateData.is_active ?? true
        })
        .eq('user_id', existingStaff.user_id)
        .eq('client_id', userRole.client_id)
    }

    console.log(`Updated staff member: ${staffId}`)
    return jsonResponse({
      message: 'Staff member updated successfully',
      staff: updatedStaff
    })

  } catch (error) {
    console.error('Error updating staff:', error)
    return errorResponse('Failed to update staff member', 500)
  }
}

// DELETE /staff-manager - Remove staff member
async function handleRemoveStaff(supabaseClient: any, url: URL, userRole: any) {
  try {
    const staffId = url.searchParams.get('staff_id')
    
    if (!staffId) {
      return errorResponse('staff_id is required', 400)
    }

    // Get existing staff member
    const { data: existingStaff, error: fetchError } = await supabaseClient
      .from('user_roles')
      .select('id, user_id, role, client_id')
      .eq('id', staffId)
      .eq('client_id', userRole.client_id)
      .single()

    if (fetchError || !existingStaff) {
      return errorResponse('Staff member not found', 404)
    }

    // Cannot remove superadmins
    if (existingStaff.role === 'superadmin') {
      return errorResponse('Cannot remove superadmin users', 403)
    }

    // Remove from location_staff table if exists
    await supabaseClient
      .from('location_staff')
      .delete()
      .eq('user_id', existingStaff.user_id)
      .eq('client_id', userRole.client_id)

    // Remove user role
    const { error } = await supabaseClient
      .from('user_roles')
      .delete()
      .eq('id', staffId)

    if (error) {
      console.error('Database error:', error)
      return errorResponse('Failed to remove staff member', 500)
    }

    console.log(`Removed staff member: ${staffId}`)
    return jsonResponse({
      message: 'Staff member removed successfully'
    })

  } catch (error) {
    console.error('Error removing staff:', error)
    return errorResponse('Failed to remove staff member', 500)
  }
} 
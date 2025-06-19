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

// Staff interfaces matching frontend
interface StaffMember {
  id: string
  user_id: string
  email: string
  full_name?: string
  role: 'client_admin' | 'restaurant_admin' | 'location_staff'
  client_id: string
  restaurant_id?: string
  restaurant_name?: string
  location_id?: string
  location_name?: string
  location_address?: string
  status: 'active' | 'suspended' | 'pending'
  invited_at: string
  last_login?: string
}

interface InviteStaffData {
  email: string
  full_name?: string
  role: 'client_admin' | 'restaurant_admin' | 'location_staff'
  restaurant_id?: string
  location_id?: string
}

interface UpdateStaffData {
  role?: 'client_admin' | 'restaurant_admin' | 'location_staff'
  restaurant_id?: string
  location_id?: string
  status?: 'active' | 'suspended' | 'pending'
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
      .select('role, client_id, restaurant_id, location_id')
      .eq('user_id', user.id)
      .eq('client_id', clientId)
      .single()

    if (roleError || !userRole) {
      console.error('Role verification error:', roleError)
      return errorResponse('Access denied: User not authorized for this client', 403)
    }

    // Only admin roles can manage staff
    if (!['superadmin', 'client_admin', 'restaurant_admin'].includes(userRole.role)) {
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

    // Build base query
    let query = supabaseClient
      .from('user_roles')
      .select(`
        id,
        user_id,
        role,
        client_id,
        restaurant_id,
        location_id,
        status,
        created_at as invited_at,
        users!inner(email, full_name, last_sign_in_at),
        restaurants(id, name),
        locations(id, name, address)
      `)
      .eq('client_id', clientId)

    // Apply role-based filtering
    if (userRole.role === 'restaurant_admin' && userRole.restaurant_id) {
      // Restaurant admins can only see staff in their restaurant
      query = query.eq('restaurant_id', userRole.restaurant_id)
    }

    // Order by creation date
    query = query.order('created_at', { ascending: false })

    const { data: staffRoles, error } = await query

    if (error) {
      console.error('Database error:', error)
      return errorResponse('Failed to fetch staff', 500)
    }

    // Transform data to match frontend interface
    const staff: StaffMember[] = (staffRoles || []).map((staffRole: any) => ({
      id: staffRole.id,
      user_id: staffRole.user_id,
      email: staffRole.users.email,
      full_name: staffRole.users.full_name,
      role: staffRole.role,
      client_id: staffRole.client_id,
      restaurant_id: staffRole.restaurant_id,
      restaurant_name: staffRole.restaurants?.name,
      location_id: staffRole.location_id,
      location_name: staffRole.locations?.name,
      location_address: staffRole.locations?.address,
      status: staffRole.status || 'active',
      invited_at: staffRole.invited_at,
      last_login: staffRole.users.last_sign_in_at
    }))

    return jsonResponse({
      data: staff
    })

  } catch (error) {
    console.error('Get staff error:', error)
    return errorResponse('Failed to fetch staff', 500)
  }
}

// POST /staff-manager - Invite new staff member
async function handleInviteStaff(supabaseClient: any, req: Request, userRole: any) {
  try {
    const body = await req.json()
    const { email, full_name, role, restaurant_id, location_id }: InviteStaffData = body
    const clientId = body.client_id

    if (!email || !role) {
      return errorResponse('email and role are required', 400)
    }

    // Validate role permissions
    if (userRole.role === 'restaurant_admin') {
      // Restaurant admins can only invite location_staff and only for their restaurant
      if (role !== 'location_staff' || restaurant_id !== userRole.restaurant_id) {
        return errorResponse('Restaurant admins can only invite location staff for their assigned restaurant', 403)
      }
    }

    // Validate role-specific requirements
    if (role === 'restaurant_admin' && !restaurant_id) {
      return errorResponse('restaurant_id is required for restaurant_admin role', 400)
    }

    if (role === 'location_staff' && (!restaurant_id || !location_id)) {
      return errorResponse('restaurant_id and location_id are required for location_staff role', 400)
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseClient.auth.admin.getUserByEmail(email)

    let userId: string

    if (existingUser.user) {
      // User exists, check if they already have a role for this client
      const { data: existingRole } = await supabaseClient
        .from('user_roles')
        .select('id')
        .eq('user_id', existingUser.user.id)
        .eq('client_id', clientId)
        .single()

      if (existingRole) {
        return errorResponse('User already has a role for this client', 400)
      }

      userId = existingUser.user.id
    } else {
      // Create new user with invitation
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name,
          invited_by: userRole.user_id,
          client_id: clientId
        }
      })

      if (createError || !newUser.user) {
        console.error('Create user error:', createError)
        return errorResponse('Failed to create user account', 500)
      }

      userId = newUser.user.id
    }

    // Create user role
    const { data: newRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: userId,
        role,
        client_id: clientId,
        restaurant_id,
        location_id,
        status: 'pending'
      })
      .select(`
        id,
        user_id,
        role,
        client_id,
        restaurant_id,
        location_id,
        status,
        created_at as invited_at,
        users!inner(email, full_name),
        restaurants(id, name),
        locations(id, name, address)
      `)
      .single()

    if (roleError) {
      console.error('Create role error:', roleError)
      return errorResponse('Failed to create staff role', 500)
    }

    // Transform response to match frontend interface
    const staffMember: StaffMember = {
      id: newRole.id,
      user_id: newRole.user_id,
      email: newRole.users.email,
      full_name: newRole.users.full_name,
      role: newRole.role,
      client_id: newRole.client_id,
      restaurant_id: newRole.restaurant_id,
      restaurant_name: newRole.restaurants?.name,
      location_id: newRole.location_id,
      location_name: newRole.locations?.name,
      location_address: newRole.locations?.address,
      status: newRole.status,
      invited_at: newRole.invited_at
    }

    // TODO: Send invitation email
    console.log(`Staff invitation sent to ${email} for role ${role}`)

    return jsonResponse({
      data: staffMember,
      message: 'Staff member invited successfully'
    }, 201)

  } catch (error) {
    console.error('Invite staff error:', error)
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
    const updateData: UpdateStaffData = body

    // Verify staff member exists and user has access
    const { data: existingStaff, error: fetchError } = await supabaseClient
      .from('user_roles')
      .select('*, users(email)')
      .eq('id', staffId)
      .single()

    if (fetchError || !existingStaff) {
      return errorResponse('Staff member not found', 404)
    }

    // Verify access based on role
    if (userRole.role === 'restaurant_admin') {
      if (existingStaff.restaurant_id !== userRole.restaurant_id) {
        return errorResponse('Access denied: Cannot update staff from different restaurant', 403)
      }
      
      // Restaurant admins cannot promote to admin roles
      if (updateData.role && updateData.role !== 'location_staff') {
        return errorResponse('Restaurant admins can only manage location staff', 403)
      }
    }

    // Update staff role
    const { data: updatedStaff, error: updateError } = await supabaseClient
      .from('user_roles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)
      .select(`
        id,
        user_id,
        role,
        client_id,
        restaurant_id,
        location_id,
        status,
        created_at as invited_at,
        users!inner(email, full_name, last_sign_in_at),
        restaurants(id, name),
        locations(id, name, address)
      `)
      .single()

    if (updateError) {
      console.error('Update staff error:', updateError)
      return errorResponse('Failed to update staff member', 500)
    }

    // Transform response
    const staffMember: StaffMember = {
      id: updatedStaff.id,
      user_id: updatedStaff.user_id,
      email: updatedStaff.users.email,
      full_name: updatedStaff.users.full_name,
      role: updatedStaff.role,
      client_id: updatedStaff.client_id,
      restaurant_id: updatedStaff.restaurant_id,
      restaurant_name: updatedStaff.restaurants?.name,
      location_id: updatedStaff.location_id,
      location_name: updatedStaff.locations?.name,
      location_address: updatedStaff.locations?.address,
      status: updatedStaff.status,
      invited_at: updatedStaff.invited_at,
      last_login: updatedStaff.users.last_sign_in_at
    }

    return jsonResponse({
      data: staffMember,
      message: 'Staff member updated successfully'
    })

  } catch (error) {
    console.error('Update staff error:', error)
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

    // Verify staff member exists and user has access
    const { data: existingStaff, error: fetchError } = await supabaseClient
      .from('user_roles')
      .select('*')
      .eq('id', staffId)
      .single()

    if (fetchError || !existingStaff) {
      return errorResponse('Staff member not found', 404)
    }

    // Verify access based on role
    if (userRole.role === 'restaurant_admin') {
      if (existingStaff.restaurant_id !== userRole.restaurant_id) {
        return errorResponse('Access denied: Cannot remove staff from different restaurant', 403)
      }
      
      // Restaurant admins cannot remove admin roles
      if (['client_admin', 'restaurant_admin'].includes(existingStaff.role)) {
        return errorResponse('Restaurant admins cannot remove admin staff', 403)
      }
    }

    // Remove staff role (hard delete)
    const { error: deleteError } = await supabaseClient
      .from('user_roles')
      .delete()
      .eq('id', staffId)

    if (deleteError) {
      console.error('Remove staff error:', deleteError)
      return errorResponse('Failed to remove staff member', 500)
    }

    return jsonResponse({
      message: 'Staff member removed successfully'
    })

  } catch (error) {
    console.error('Remove staff error:', error)
    return errorResponse('Failed to remove staff member', 500)
  }
} 
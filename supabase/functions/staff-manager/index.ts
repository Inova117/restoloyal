// @ts-ignore - Deno imports work in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno imports work in Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StaffMember {
  id: string
  user_id: string
  email: string
  full_name?: string
  role: 'client_admin' | 'restaurant_admin' | 'location_staff'
  client_id: string
  restaurant_id?: string
  location_id?: string
  status: 'active' | 'suspended' | 'pending'
  invited_at: string
  activated_at?: string
  last_login?: string
  created_by: string
}

interface InviteStaffRequest {
  email: string
  full_name?: string
  role: 'client_admin' | 'restaurant_admin' | 'location_staff'
  restaurant_id?: string
  location_id?: string
  client_id: string
}

interface UpdateStaffRequest {
  role?: 'client_admin' | 'restaurant_admin' | 'location_staff'
  restaurant_id?: string
  location_id?: string
  status?: 'active' | 'suspended'
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

    // Verify user has client_admin role for this client
    const { data: adminCheck, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('role, client_id')
      .eq('user_id', user.id)
      .eq('client_id', clientId)
      .eq('role', 'client_admin')
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
            error: 'Forbidden: You are not authorized to manage staff for this client' 
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Handle GET request - List all staff for the client
    if (req.method === 'GET') {
      const { data: staffList, error: staffError } = await supabaseClient
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          client_id,
          restaurant_id,
          location_id,
          status,
          created_at,
          updated_at,
          auth_users:user_id (
            email,
            user_metadata
          ),
          restaurants:restaurant_id (
            name
          ),
          locations:location_id (
            name,
            address
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (staffError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch staff list', details: staffError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Transform the data to include user information
      const transformedStaff = staffList.map(staff => ({
        id: staff.id,
        user_id: staff.user_id,
        email: staff.auth_users?.email || 'Unknown',
        full_name: staff.auth_users?.user_metadata?.full_name || staff.auth_users?.user_metadata?.name || null,
        role: staff.role,
        client_id: staff.client_id,
        restaurant_id: staff.restaurant_id,
        restaurant_name: staff.restaurants?.name || null,
        location_id: staff.location_id,
        location_name: staff.locations?.name || null,
        location_address: staff.locations?.address || null,
        status: staff.status,
        invited_at: staff.created_at,
        last_login: staff.auth_users?.last_sign_in_at || null
      }))

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: transformedStaff 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Handle POST request - Invite new staff member
    if (req.method === 'POST') {
      const body: InviteStaffRequest = await req.json()
      
      // Validate required fields
      if (!body.email || !body.role || !body.client_id) {
        return new Response(
          JSON.stringify({ error: 'email, role, and client_id are required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Validate email format
      if (!isValidEmail(body.email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Validate role
      if (!['client_admin', 'restaurant_admin', 'location_staff'].includes(body.role)) {
        return new Response(
          JSON.stringify({ error: 'Invalid role. Must be client_admin, restaurant_admin, or location_staff' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Validate restaurant/location assignments
      if (body.role === 'restaurant_admin' && !body.restaurant_id) {
        return new Response(
          JSON.stringify({ error: 'restaurant_id is required for restaurant_admin role' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      if (body.role === 'location_staff' && !body.location_id) {
        return new Response(
          JSON.stringify({ error: 'location_id is required for location_staff role' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Check if user already exists in auth.users
      const { data: existingUser, error: userCheckError } = await supabaseClient
        .from('auth.users')
        .select('id, email')
        .eq('email', body.email)
        .single()

      let userId = existingUser?.id

      // If user doesn't exist, create invitation
      if (!existingUser) {
        // Create user invitation using Supabase Admin API
        const { data: inviteData, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(
          body.email,
          {
            data: {
              full_name: body.full_name || '',
              invited_by: user.id,
              client_id: body.client_id,
              role: body.role
            },
            redirectTo: `${req.headers.get('origin')}/auth/callback`
          }
        )

        if (inviteError) {
          return new Response(
            JSON.stringify({ error: 'Failed to send invitation', details: inviteError.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        userId = inviteData.user?.id
      }

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Failed to get or create user ID' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Check if user already has a role for this client
      const { data: existingRole, error: roleCheckError } = await supabaseClient
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('client_id', body.client_id)
        .single()

      if (existingRole) {
        return new Response(
          JSON.stringify({ error: 'User already has a role assigned for this client' }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Create user role assignment
      const { data: newRole, error: roleError } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: userId,
          role: body.role,
          client_id: body.client_id,
          restaurant_id: body.restaurant_id || null,
          location_id: body.location_id || null,
          status: existingUser ? 'active' : 'pending',
          created_by: user.id
        })
        .select(`
          id,
          user_id,
          role,
          client_id,
          restaurant_id,
          location_id,
          status,
          created_at,
          restaurants:restaurant_id (name),
          locations:location_id (name, address)
        `)
        .single()

      if (roleError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create user role', details: roleError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Log the staff invitation for audit trail
      await supabaseClient
        .from('platform_activity_log')
        .insert({
          activity_type: 'staff_invited',
          description: `Staff member invited: ${body.email} as ${body.role}`,
          client_name: clientId,
          user_id: user.id,
          metadata: {
            client_id: body.client_id,
            invited_email: body.email,
            role: body.role,
            restaurant_id: body.restaurant_id,
            location_id: body.location_id,
            user_email: user.email
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: existingUser ? 'Staff member added successfully' : 'Invitation sent successfully',
          data: {
            ...newRole,
            email: body.email,
            full_name: body.full_name,
            restaurant_name: newRole.restaurants?.name,
            location_name: newRole.locations?.name,
            location_address: newRole.locations?.address
          }
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Handle PATCH request - Update staff member
    if (req.method === 'PATCH') {
      const staffId = url.searchParams.get('staff_id')
      if (!staffId) {
        return new Response(
          JSON.stringify({ error: 'staff_id is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const body: UpdateStaffRequest = await req.json()

      // Validate role if provided
      if (body.role && !['client_admin', 'restaurant_admin', 'location_staff'].includes(body.role)) {
        return new Response(
          JSON.stringify({ error: 'Invalid role. Must be client_admin, restaurant_admin, or location_staff' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Validate status if provided
      if (body.status && !['active', 'suspended'].includes(body.status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status. Must be active or suspended' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Build update object
      const updateData: any = {}
      if (body.role) updateData.role = body.role
      if (body.restaurant_id !== undefined) updateData.restaurant_id = body.restaurant_id
      if (body.location_id !== undefined) updateData.location_id = body.location_id
      if (body.status) updateData.status = body.status
      updateData.updated_at = new Date().toISOString()

      // Update the staff member (RLS will ensure only authorized users can update)
      const { data: updatedStaff, error: updateError } = await supabaseClient
        .from('user_roles')
        .update(updateData)
        .eq('id', staffId)
        .eq('client_id', clientId)
        .select(`
          id,
          user_id,
          role,
          client_id,
          restaurant_id,
          location_id,
          status,
          created_at,
          updated_at,
          auth_users:user_id (
            email,
            user_metadata
          ),
          restaurants:restaurant_id (name),
          locations:location_id (name, address)
        `)
        .single()

      if (updateError) {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update staff member', 
            details: updateError.message 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Log the staff update for audit trail
      await supabaseClient
        .from('platform_activity_log')
        .insert({
          activity_type: 'staff_updated',
          description: `Staff member updated: ${updatedStaff.auth_users?.email}`,
          client_name: clientId,
          user_id: user.id,
          metadata: {
            client_id: clientId,
            staff_id: staffId,
            updated_fields: Object.keys(updateData),
            user_email: user.email
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Staff member updated successfully',
          data: {
            ...updatedStaff,
            email: updatedStaff.auth_users?.email,
            full_name: updatedStaff.auth_users?.user_metadata?.full_name || updatedStaff.auth_users?.user_metadata?.name,
            restaurant_name: updatedStaff.restaurants?.name,
            location_name: updatedStaff.locations?.name,
            location_address: updatedStaff.locations?.address
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Handle DELETE request - Remove staff member
    if (req.method === 'DELETE') {
      const staffId = url.searchParams.get('staff_id')
      if (!staffId) {
        return new Response(
          JSON.stringify({ error: 'staff_id is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Get staff info before deletion for logging
      const { data: staffInfo, error: staffInfoError } = await supabaseClient
        .from('user_roles')
        .select(`
          user_id,
          role,
          auth_users:user_id (email)
        `)
        .eq('id', staffId)
        .eq('client_id', clientId)
        .single()

      if (staffInfoError || !staffInfo) {
        return new Response(
          JSON.stringify({ error: 'Staff member not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Delete the staff role assignment (RLS will ensure only authorized users can delete)
      const { error: deleteError } = await supabaseClient
        .from('user_roles')
        .delete()
        .eq('id', staffId)
        .eq('client_id', clientId)

      if (deleteError) {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to remove staff member', 
            details: deleteError.message 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Log the staff removal for audit trail
      await supabaseClient
        .from('platform_activity_log')
        .insert({
          activity_type: 'staff_removed',
          description: `Staff member removed: ${staffInfo.auth_users?.email}`,
          client_name: clientId,
          user_id: user.id,
          metadata: {
            client_id: clientId,
            staff_id: staffId,
            removed_email: staffInfo.auth_users?.email,
            removed_role: staffInfo.role,
            user_email: user.email
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Staff member removed successfully'
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
    console.error('Staff Manager API Error:', error)
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
// @ts-ignore - Deno imports work in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno imports work in Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateClientRequest {
  action?: 'create' | 'delete'
  name?: string
  contactEmail?: string
  contactPhone?: string
  plan?: 'trial' | 'business' | 'enterprise'
  clientId?: string // For delete operation
}

interface ClientResponse {
  success: boolean
  client?: {
    id: string
    name: string
    slug: string
    contactEmail: string
  }
  user?: {
    id: string
    email: string
    role: string
  }
  message: string
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      // @ts-ignore - Deno global works in Edge Functions
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore - Deno global works in Edge Functions
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Regular client for user verification
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

    // Verify requesting user has platform admin privileges
    const {
      data: { user: requestingUser },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user has platform admin role
    const { data: adminCheck, error: adminError } = await supabaseAdmin
      .from('platform_admin_users')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('status', 'active')
      .single()

    if (adminError || !adminCheck) {
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden: Only platform administrators can manage clients' 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const { action = 'create', name, contactEmail, contactPhone, plan, clientId }: CreateClientRequest = await req.json()

    // Handle DELETE operation
    if (action === 'delete') {
      if (!clientId) {
        return new Response(
          JSON.stringify({ error: 'Client ID is required for delete operation' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Step 1: Get client info and associated user ID before deletion
      const { data: clientInfo, error: getClientError } = await supabaseAdmin
        .from('platform_clients')
        .select('name, contact_email')
        .eq('id', clientId)
        .single()

      if (getClientError) {
        return new Response(
          JSON.stringify({ 
            error: `Client not found: ${getClientError.message}` 
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Step 2: Get user ID from user_roles before deleting
      const { data: userRoles, error: getUserRolesError } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('client_id', clientId)
        .eq('role', 'client_admin')

      let userIdsToDelete: string[] = []
      if (!getUserRolesError && userRoles) {
        userIdsToDelete = userRoles.map(role => role.user_id)
      }

      // Step 3: Delete user roles first (to avoid foreign key constraint)
      const { error: deleteRolesError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('client_id', clientId)

      if (deleteRolesError) {
        console.warn('Warning: Could not delete user roles:', deleteRolesError.message)
      }

      // Step 4: Delete platform client
      const { error: deleteClientError } = await supabaseAdmin
        .from('platform_clients')
        .delete()
        .eq('id', clientId)

      if (deleteClientError) {
        return new Response(
          JSON.stringify({ 
            error: `Failed to delete client: ${deleteClientError.message}` 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Step 5: Delete user accounts from auth.users
      for (const userId of userIdsToDelete) {
        try {
          const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)
          if (deleteUserError) {
            console.warn(`Warning: Could not delete user ${userId}:`, deleteUserError.message)
          } else {
            console.log(`Successfully deleted user ${userId}`)
          }
        } catch (error) {
          console.warn(`Error deleting user ${userId}:`, error)
        }
      }

      const response: ClientResponse = {
        success: true,
        message: `Client ${clientInfo.name} has been successfully deleted from the platform.`
      }

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Handle CREATE operation (existing logic)
    if (!name || !contactEmail) {
      return new Response(
        JSON.stringify({ error: 'Name and contact email are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .trim()

    // Step 1: Create platform client
    const { data: platformClient, error: clientError } = await supabaseAdmin
      .from('platform_clients')
      .insert({
        name: name,
        slug: slug,
        type: 'restaurant_chain',
        status: plan === 'trial' ? 'trial' : 'active',
        plan: plan,
        contact_email: contactEmail,
        contact_phone: contactPhone || null
      })
      .select()
      .single()

    if (clientError) {
      return new Response(
        JSON.stringify({ 
          error: `Failed to create platform client: ${clientError.message}` 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Step 2: Create user account
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.createUser({
      email: contactEmail,
      email_confirm: false, // Require email confirmation
      user_metadata: {
        full_name: `${name} Admin`,
        client_name: name,
        role: 'client_admin',
        client_id: platformClient.id
      }
    })

    let userId = authUser?.user?.id

    // If user creation fails, check if user already exists
    if (authUserError) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const foundUser = existingUsers.users?.find(u => u.email === contactEmail)
      
      if (foundUser) {
        userId = foundUser.id
        console.log('User already exists, proceeding with existing user:', userId)
      } else {
        return new Response(
          JSON.stringify({ 
            error: `Failed to create user account: ${authUserError.message}` 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Could not determine user ID' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Step 3: Assign tier 2 access
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'client_admin',
        client_id: platformClient.id,
        status: 'active'
      })

    if (roleError) {
      console.error('Role assignment error:', roleError)
      // Don't fail if role already exists
      if (!roleError.message.includes('duplicate key')) {
        return new Response(
          JSON.stringify({ 
            error: `Failed to assign user role: ${roleError.message}` 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Step 4: Send invitation email
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      contactEmail,
      {
        redirectTo: `${req.headers.get('origin') || 'https://restaurantloyalty.netlify.app'}/auth/callback?client=${slug}`,
        data: {
          client_name: name,
          role: 'client_admin',
          invited_by: 'Platform Admin'
        }
      }
    )

    if (inviteError) {
      console.warn('Failed to send invitation email:', inviteError.message)
      // Don't fail the entire process for email issues
    }

    // Return success response
    const response: ClientResponse = {
      success: true,
      client: {
        id: platformClient.id,
        name: platformClient.name,
        slug: platformClient.slug,
        contactEmail: platformClient.contact_email
      },
      user: {
        id: userId,
        email: contactEmail,
        role: 'client_admin'
      },
      message: `Client ${name} created successfully with tier 2 access. Invitation email sent to ${contactEmail}.`
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}) 
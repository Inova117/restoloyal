// @ts-ignore - Deno imports work in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno imports work in Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClientProfile {
  id: string
  name: string
  logo?: string
  theme?: {
    primary_color: string
    secondary_color: string
    accent_color: string
  }
  contact_email: string
  contact_phone?: string
  billing_address?: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  plan: 'trial' | 'business' | 'enterprise'
  status: 'active' | 'suspended' | 'trial'
  updated_at?: string
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
      .single()

    if (adminError || !adminCheck) {
      // Also check if user is a platform admin (can access all clients)
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
            error: 'Forbidden: You are not authorized to manage this client profile' 
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Handle GET request - View profile
    if (req.method === 'GET') {
      const { data: profile, error: profileError } = await supabaseClient
        .from('platform_clients')
        .select(`
          id,
          name,
          logo,
          theme,
          contact_email,
          contact_phone,
          billing_address,
          plan,
          status,
          created_at,
          updated_at
        `)
        .eq('id', clientId)
        .single()

      if (profileError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch profile', details: profileError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: profile 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Handle POST/PATCH request - Update profile
    if (req.method === 'POST' || req.method === 'PATCH') {
      const body = await req.json()
      
      // Validate and sanitize update data
      const allowedFields = [
        'name', 
        'logo', 
        'theme', 
        'contact_email', 
        'contact_phone', 
        'billing_address'
      ]
      
      const updateData: Partial<ClientProfile> = {}
      
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field]
        }
      }

      // Validate required fields
      if (updateData.name && updateData.name.trim().length < 2) {
        return new Response(
          JSON.stringify({ error: 'Name must be at least 2 characters long' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      if (updateData.contact_email && !isValidEmail(updateData.contact_email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Validate theme colors if provided
      if (updateData.theme) {
        const { primary_color, secondary_color, accent_color } = updateData.theme
        if (primary_color && !isValidHexColor(primary_color)) {
          return new Response(
            JSON.stringify({ error: 'Invalid primary color format' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
        if (secondary_color && !isValidHexColor(secondary_color)) {
          return new Response(
            JSON.stringify({ error: 'Invalid secondary color format' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
        if (accent_color && !isValidHexColor(accent_color)) {
          return new Response(
            JSON.stringify({ error: 'Invalid accent color format' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
      }

      // Add updated_at timestamp
      updateData.updated_at = new Date().toISOString()

      // Update the profile (RLS will ensure only authorized users can update)
      const { data: updatedProfile, error: updateError } = await supabaseClient
        .from('platform_clients')
        .update(updateData)
        .eq('id', clientId)
        .select(`
          id,
          name,
          logo,
          theme,
          contact_email,
          contact_phone,
          billing_address,
          plan,
          status,
          created_at,
          updated_at
        `)
        .single()

      if (updateError) {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update profile', 
            details: updateError.message 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Log the profile update for audit trail
      await supabaseClient
        .from('platform_activity_log')
        .insert({
          activity_type: 'profile_updated',
          description: `Client profile updated: ${updateData.name || 'profile changes'}`,
          client_name: updatedProfile.name,
          user_id: user.id,
          metadata: {
            client_id: clientId,
            updated_fields: Object.keys(updateData),
            user_email: user.email
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Profile updated successfully',
          data: updatedProfile 
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
    console.error('Client Profile API Error:', error)
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

function isValidHexColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexRegex.test(color)
} 
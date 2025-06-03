// 🔧 COMPLETE EDGE FUNCTION - CREATES CLIENT + USER + INVITATION
// This version includes the full onboarding flow

// @ts-ignore - Deno imports work in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno imports work in Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  console.log('🚀 COMPLETE Edge Function started');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔧 Initializing Supabase clients...');
    
    // Initialize Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      // @ts-ignore - Deno global works in Edge Functions
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore - Deno global works in Edge Functions
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Regular client for user verification
    const supabaseClient = createClient(
      // @ts-ignore - Deno global works in Edge Functions
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore - Deno global works in Edge Functions
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization')
          }
        }
      }
    );

    console.log('🔐 Getting user from auth...');
    
    // Verify requesting user has platform admin privileges
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return new Response(JSON.stringify({
        error: 'Authentication failed',
        details: authError.message
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!requestingUser) {
      console.error('❌ No user found');
      return new Response(JSON.stringify({
        error: 'No authenticated user found'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ User authenticated:', requestingUser.email);
    console.log('🔍 Checking admin privileges for user ID:', requestingUser.id);

    // Use supabaseAdmin for permission check (bypasses RLS)
    const { data: adminCheck, error: adminError } = await supabaseAdmin
      .from('platform_admin_users')
      .select('role, status, email')
      .eq('user_id', requestingUser.id)
      .eq('status', 'active')
      .in('role', ['platform_admin', 'super_admin', 'zerion_admin'])
      .single();

    console.log('🔍 Admin check result:', adminCheck);
    console.log('🔍 Admin check error:', adminError);

    if (adminError) {
      console.error('❌ Admin check error:', adminError);
      return new Response(JSON.stringify({
        error: 'Admin verification failed',
        details: adminError.message,
        user_id: requestingUser.id,
        user_email: requestingUser.email
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!adminCheck) {
      console.error('❌ User is not admin');
      return new Response(JSON.stringify({
        error: 'Forbidden: Only platform administrators can create new clients',
        user_id: requestingUser.id,
        user_email: requestingUser.email
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Admin privileges confirmed:', adminCheck);

    // Parse request body
    const requestBody = await req.json();
    console.log('📝 Request body:', requestBody);
    
    const { name, contactEmail, contactPhone, plan } = requestBody;

    if (!name || !contactEmail) {
      console.error('❌ Missing required fields');
      return new Response(JSON.stringify({
        error: 'Name and contact email are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🎉 SUCCESS: All checks passed, proceeding with complete client setup...');

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .trim();

    console.log('📝 Generated slug:', slug);

    // Step 1: Create platform client
    const { data: platformClient, error: clientError } = await supabaseAdmin
      .from('platform_clients')
      .insert({
        name,
        slug,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        plan: plan || 'basic',
        status: 'active'
      })
      .select()
      .single();

    if (clientError) {
      console.error('❌ Client creation error:', clientError);
      return new Response(JSON.stringify({
        error: 'Failed to create client',
        details: clientError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Platform client created:', platformClient);

    // Step 2: Create user account
    console.log('👤 Creating user account for:', contactEmail);
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.createUser({
      email: contactEmail,
      email_confirm: false, // Require email confirmation
      user_metadata: {
        full_name: `${name} Admin`,
        client_name: name,
        role: 'client_admin',
        client_id: platformClient.id
      }
    });

    let userId = authUser?.user?.id;

    // If user creation fails, check if user already exists
    if (authUserError) {
      console.log('⚠️ User creation failed, checking for existing user:', authUserError.message);
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const foundUser = existingUsers.users?.find(u => u.email === contactEmail);
      
      if (foundUser) {
        userId = foundUser.id;
        console.log('✅ Using existing user:', userId);
      } else {
        console.error('❌ Failed to create or find user');
        return new Response(JSON.stringify({
          error: 'Failed to create user account',
          details: authUserError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (!userId) {
      console.error('❌ Could not determine user ID');
      return new Response(JSON.stringify({
        error: 'Could not determine user ID'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ User account ready:', userId);

    // Step 3: Assign client_admin role
    console.log('🔑 Assigning client_admin role...');
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'client_admin',
        client_id: platformClient.id,
        status: 'active'
      });

    if (roleError) {
      console.error('⚠️ Role assignment error:', roleError);
      // Don't fail if role already exists
      if (!roleError.message.includes('duplicate key')) {
        return new Response(JSON.stringify({
          error: 'Failed to assign user role',
          details: roleError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      console.log('✅ Role already exists, continuing...');
    } else {
      console.log('✅ Role assigned successfully');
    }

    // Step 4: Send invitation email
    console.log('📧 Sending invitation email...');
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      contactEmail,
      {
        redirectTo: `${req.headers.get('origin') || 'https://restaurantloyalty.netlify.app'}/auth/callback?type=invitation&client=${slug}&email=${encodeURIComponent(contactEmail)}`,
        data: {
          client_name: name,
          role: 'client_admin',
          invited_by: 'Platform Admin',
          invitation_type: 'client_admin',
          client_slug: slug
        }
      }
    );

    if (inviteError) {
      console.warn('⚠️ Failed to send invitation email:', inviteError.message);
      // Don't fail the entire process for email issues
    } else {
      console.log('✅ Invitation email sent successfully');
    }

    // Return success response
    const response = {
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
    };

    console.log('🎉 Complete client setup finished successfully');
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 
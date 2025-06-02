// 🐛 DEBUG VERSION - Edge Function with detailed logging
// Copy this to Supabase Edge Function to debug the 403 error

// @ts-ignore - Deno imports work in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno imports work in Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  console.log('🚀 Edge Function started');
  
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

    // Check if user has platform admin role - UPDATED TO INCLUDE ZERION_ADMIN
    const { data: adminCheck, error: adminError } = await supabaseClient
      .from('platform_admin_users')
      .select('role, status, email')
      .eq('user_id', requestingUser.id)
      .eq('status', 'active')
      .in('role', ['platform_admin', 'super_admin', 'zerion_admin'])  // ⚡ ADDED zerion_admin
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

    console.log('🎉 SUCCESS: All checks passed, proceeding with client creation...');

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

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      client: platformClient,
      message: 'Client created successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 
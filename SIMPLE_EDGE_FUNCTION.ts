// 🚨 SIMPLIFIED EDGE FUNCTION - NO AUTH CHECKS
// Use this temporarily to test if the basic functionality works
// Copy this to Supabase Edge Function

// @ts-ignore - Deno imports work in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno imports work in Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  console.log('🚀 SIMPLIFIED Edge Function started');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔧 Initializing Supabase admin client...');
    
    // Use ONLY admin client - bypass all auth checks
    const supabaseAdmin = createClient(
      // @ts-ignore - Deno global works in Edge Functions
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore - Deno global works in Edge Functions
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('📝 Parsing request body...');
    
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

    console.log('🎉 Creating client without auth checks...');

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .trim();

    console.log('📝 Generated slug:', slug);

    // Create platform client using admin client (bypasses RLS)
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

    console.log('✅ Platform client created successfully:', platformClient);

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      client: platformClient,
      message: 'Client created successfully (no auth checks)'
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
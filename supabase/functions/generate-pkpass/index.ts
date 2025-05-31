import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PassData {
  clientId: string
  clientName: string
  restaurantName: string
  qrCode: string
  stamps: number
  stampsRequired: number
  backgroundColor: string
  foregroundColor: string
  logoText: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { clientId } = await req.json()

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'Client ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch client and restaurant data
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select(`
        *,
        restaurants (
          name,
          stamps_required,
          reward_description
        )
      `)
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify user has access to this client (restaurant owner)
    const { data: restaurant } = await supabaseClient
      .from('restaurants')
      .select('user_id')
      .eq('id', client.restaurant_id)
      .single()

    if (restaurant?.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate the Apple Wallet pass
    const passData: PassData = {
      clientId: client.id,
      clientName: client.name,
      restaurantName: client.restaurants.name,
      qrCode: client.qr_code,
      stamps: client.stamps,
      stampsRequired: client.restaurants.stamps_required,
      backgroundColor: 'rgb(59, 130, 246)', // Blue-600
      foregroundColor: 'rgb(255, 255, 255)', // White
      logoText: client.restaurants.name
    }

    const pkpass = await generatePkPass(passData)

    return new Response(pkpass, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${client.name}-loyalty-card.pkpass"`,
      },
    })

  } catch (error) {
    console.error('Error generating pkpass:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function generatePkPass(data: PassData): Promise<Uint8Array> {
  // Create the pass.json structure
  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: "pass.com.zerionstudio.loyalty",
    serialNumber: data.clientId,
    teamIdentifier: "ZERIONSTUDIO",
    organizationName: data.restaurantName,
    description: `${data.restaurantName} Loyalty Card`,
    logoText: data.logoText,
    foregroundColor: data.foregroundColor,
    backgroundColor: data.backgroundColor,
    labelColor: data.foregroundColor,
    
    // Store card type
    storeCard: {
      primaryFields: [
        {
          key: "balance",
          label: "Stamps Collected",
          value: `${data.stamps}/${data.stampsRequired}`,
          textAlignment: "PKTextAlignmentCenter"
        }
      ],
      secondaryFields: [
        {
          key: "name",
          label: "Customer",
          value: data.clientName,
          textAlignment: "PKTextAlignmentLeft"
        }
      ],
      auxiliaryFields: [
        {
          key: "restaurant",
          label: "Restaurant",
          value: data.restaurantName,
          textAlignment: "PKTextAlignmentLeft"
        }
      ],
      backFields: [
        {
          key: "qr_code",
          label: "QR Code",
          value: data.qrCode,
          textAlignment: "PKTextAlignmentLeft"
        },
        {
          key: "instructions",
          label: "How to Use",
          value: "Show this pass to collect stamps. When you reach the required number of stamps, you can redeem your reward!",
          textAlignment: "PKTextAlignmentLeft"
        }
      ]
    },

    // Barcode for scanning
    barcodes: [
      {
        message: data.qrCode,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: data.qrCode
      }
    ],

    // Locations for geo-notifications (future feature)
    locations: [],

    // Relevance for time-based notifications
    relevantDate: new Date().toISOString(),

    // Update service for live stamp updates
    webServiceURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/update-pkpass`,
    authenticationToken: data.clientId,

    // Visual styling
    suppressStripShine: false,
    sharingProhibited: false
  }

  // Create a simple ZIP structure for the .pkpass file
  // In a production environment, you would:
  // 1. Add proper images (icon.png, logo.png, etc.)
  // 2. Sign the pass with Apple certificates
  // 3. Create a proper ZIP structure with manifest.json and signature
  
  // For now, we'll create a basic structure
  const passJsonString = JSON.stringify(passJson, null, 2)
  
  // Create a simple ZIP-like structure (simplified for demo)
  // In production, use a proper ZIP library and Apple signing
  const encoder = new TextEncoder()
  const passData = encoder.encode(passJsonString)
  
  // Return the pass data (in production, this would be a signed .pkpass file)
  return passData
}

// Helper function to create manifest.json for the pass
function createManifest(files: Record<string, Uint8Array>): string {
  const manifest: Record<string, string> = {}
  
  for (const [filename, content] of Object.entries(files)) {
    // In production, calculate SHA1 hash of each file
    manifest[filename] = "placeholder-sha1-hash"
  }
  
  return JSON.stringify(manifest, null, 2)
} 
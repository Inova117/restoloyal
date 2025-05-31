import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    
    // Apple Wallet update service endpoints
    // GET /v1/passes/{passTypeIdentifier}/{serialNumber}
    // POST /v1/log (for logging)
    // GET /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}

    if (req.method === 'GET') {
      // Handle pass update requests
      const passTypeIdentifier = pathParts[3] // pass.com.zerionstudio.loyalty
      const serialNumber = pathParts[4] // client ID
      
      if (!serialNumber) {
        return new Response('Serial number required', { status: 400 })
      }

      // Get the If-Modified-Since header
      const ifModifiedSince = req.headers.get('If-Modified-Since')
      
      // Fetch client data
      const { data: client, error } = await supabaseClient
        .from('clients')
        .select(`
          *,
          restaurants (
            name,
            stamps_required,
            reward_description
          )
        `)
        .eq('id', serialNumber)
        .single()

      if (error || !client) {
        return new Response('Pass not found', { status: 404 })
      }

      // Check if pass has been modified since the last request
      const lastModified = new Date(client.updated_at)
      if (ifModifiedSince) {
        const ifModifiedSinceDate = new Date(ifModifiedSince)
        if (lastModified <= ifModifiedSinceDate) {
          return new Response('', { status: 304 }) // Not Modified
        }
      }

      // Generate updated pass
      const updatedPass = await generateUpdatedPass(client)
      
      return new Response(updatedPass, {
        headers: {
          'Content-Type': 'application/vnd.apple.pkpass',
          'Last-Modified': lastModified.toUTCString(),
        },
      })
    }

    if (req.method === 'POST') {
      // Handle device registration or logging
      const pathSegment = pathParts[2]
      
      if (pathSegment === 'log') {
        // Apple Wallet logging endpoint
        const logs = await req.json()
        console.log('Apple Wallet logs:', logs)
        return new Response('OK', { status: 200 })
      }
      
      if (pathSegment === 'devices') {
        // Device registration for push notifications
        const deviceLibraryIdentifier = pathParts[3]
        const passTypeIdentifier = pathParts[5]
        const serialNumber = pathParts[6]
        
        const { pushToken } = await req.json()
        
        // Store device registration (you would implement this in your database)
        console.log('Device registration:', {
          deviceLibraryIdentifier,
          passTypeIdentifier,
          serialNumber,
          pushToken
        })
        
        return new Response('', { status: 201 })
      }
    }

    if (req.method === 'DELETE') {
      // Handle device unregistration
      const deviceLibraryIdentifier = pathParts[3]
      const passTypeIdentifier = pathParts[5]
      const serialNumber = pathParts[6]
      
      // Remove device registration
      console.log('Device unregistration:', {
        deviceLibraryIdentifier,
        passTypeIdentifier,
        serialNumber
      })
      
      return new Response('', { status: 200 })
    }

    return new Response('Method not allowed', { status: 405 })

  } catch (error) {
    console.error('Error in update-pkpass:', error)
    return new Response('Internal server error', { status: 500 })
  }
})

async function generateUpdatedPass(client: any): Promise<Uint8Array> {
  // Create updated pass.json with current stamp count
  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: "pass.com.zerionstudio.loyalty",
    serialNumber: client.id,
    teamIdentifier: "ZERIONSTUDIO",
    organizationName: client.restaurants.name,
    description: `${client.restaurants.name} Loyalty Card`,
    logoText: client.restaurants.name,
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(59, 130, 246)',
    labelColor: 'rgb(255, 255, 255)',
    
    // Store card type with updated stamp count
    storeCard: {
      primaryFields: [
        {
          key: "balance",
          label: "Stamps Collected",
          value: `${client.stamps}/${client.restaurants.stamps_required}`,
          textAlignment: "PKTextAlignmentCenter"
        }
      ],
      secondaryFields: [
        {
          key: "name",
          label: "Customer",
          value: client.name,
          textAlignment: "PKTextAlignmentLeft"
        }
      ],
      auxiliaryFields: [
        {
          key: "restaurant",
          label: "Restaurant",
          value: client.restaurants.name,
          textAlignment: "PKTextAlignmentLeft"
        }
      ],
      backFields: [
        {
          key: "qr_code",
          label: "QR Code",
          value: client.qr_code,
          textAlignment: "PKTextAlignmentLeft"
        },
        {
          key: "instructions",
          label: "How to Use",
          value: "Show this pass to collect stamps. When you reach the required number of stamps, you can redeem your reward!",
          textAlignment: "PKTextAlignmentLeft"
        },
        {
          key: "status",
          label: "Status",
          value: client.stamps >= client.restaurants.stamps_required 
            ? "🎉 Reward Ready!" 
            : `${client.restaurants.stamps_required - client.stamps} stamps to go`,
          textAlignment: "PKTextAlignmentLeft"
        }
      ]
    },

    // Barcode for scanning
    barcodes: [
      {
        message: client.qr_code,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: client.qr_code
      }
    ],

    // Locations for geo-notifications (future feature)
    locations: [],

    // Relevance for time-based notifications
    relevantDate: new Date().toISOString(),

    // Update service for live stamp updates
    webServiceURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/update-pkpass`,
    authenticationToken: client.id,

    // Visual styling
    suppressStripShine: false,
    sharingProhibited: false
  }

  // Convert to bytes (in production, this would be a properly signed .pkpass file)
  const passJsonString = JSON.stringify(passJson, null, 2)
  const encoder = new TextEncoder()
  return encoder.encode(passJsonString)
} 
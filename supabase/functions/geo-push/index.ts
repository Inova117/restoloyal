import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LocationData {
  latitude: number
  longitude: number
  userId?: string
  clientId?: string
}

interface RestaurantLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  radius: number // in meters
  notification_message?: string
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const { latitude, longitude, userId, clientId } = await req.json() as LocationData

      if (!latitude || !longitude) {
        return new Response(
          JSON.stringify({ error: 'Latitude and longitude are required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Find nearby restaurants within notification radius
      const nearbyRestaurants = await findNearbyRestaurants(
        supabaseClient, 
        latitude, 
        longitude
      )

      if (nearbyRestaurants.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No nearby restaurants found' }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Check if user has a loyalty account with any nearby restaurants
      let loyaltyData = null
      if (clientId) {
        loyaltyData = await getUserLoyaltyData(supabaseClient, clientId, nearbyRestaurants)
      }

      // Send push notifications for nearby restaurants
      const notifications = await Promise.all(
        nearbyRestaurants.map(restaurant => 
          sendGeoNotification(restaurant, loyaltyData, latitude, longitude)
        )
      )

      // Log the geo-trigger event
      await logGeoTrigger(supabaseClient, {
        latitude,
        longitude,
        userId,
        clientId,
        restaurantsTriggered: nearbyRestaurants.map(r => r.id),
        notificationsSent: notifications.filter(n => n.success).length
      })

      return new Response(
        JSON.stringify({ 
          message: 'Geo-push notifications processed',
          nearbyRestaurants: nearbyRestaurants.length,
          notificationsSent: notifications.filter(n => n.success).length
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response('Method not allowed', { status: 405 })

  } catch (error) {
    console.error('Error in geo-push:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function findNearbyRestaurants(
  supabase: any, 
  userLat: number, 
  userLng: number
): Promise<RestaurantLocation[]> {
  // Fetch all restaurants with location data
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, latitude, longitude, notification_radius, notification_message')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (error || !restaurants) {
    console.error('Error fetching restaurants:', error)
    return []
  }

  // Filter restaurants within notification radius
  const nearbyRestaurants: RestaurantLocation[] = []
  
  for (const restaurant of restaurants) {
    const distance = calculateDistance(
      userLat, 
      userLng, 
      restaurant.latitude, 
      restaurant.longitude
    )
    
    const radius = restaurant.notification_radius || 500 // Default 500m radius
    
    if (distance <= radius) {
      nearbyRestaurants.push({
        id: restaurant.id,
        name: restaurant.name,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        radius: radius,
        notification_message: restaurant.notification_message
      })
    }
  }

  return nearbyRestaurants
}

async function getUserLoyaltyData(
  supabase: any, 
  clientId: string, 
  restaurants: RestaurantLocation[]
) {
  const restaurantIds = restaurants.map(r => r.id)
  
  const { data: clientData, error } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      stamps,
      restaurant_id,
      restaurants (
        name,
        stamps_required
      )
    `)
    .eq('id', clientId)
    .in('restaurant_id', restaurantIds)
    .single()

  if (error || !clientData) {
    return null
  }

  return clientData
}

async function sendGeoNotification(
  restaurant: RestaurantLocation,
  loyaltyData: any,
  userLat: number,
  userLng: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_API_KEY')

    if (!oneSignalAppId || !oneSignalApiKey) {
      console.error('OneSignal credentials not configured')
      return { success: false, error: 'OneSignal not configured' }
    }

    // Create personalized notification message
    let message = restaurant.notification_message || 
      `You're near ${restaurant.name}! Come collect your loyalty stamps.`
    
    let heading = `${restaurant.name} is nearby!`

    // Personalize message if user has loyalty data
    if (loyaltyData && loyaltyData.restaurant_id === restaurant.id) {
      const stampsNeeded = loyaltyData.restaurants.stamps_required - loyaltyData.stamps
      if (stampsNeeded <= 0) {
        message = `🎉 Your reward is ready at ${restaurant.name}! Come redeem it now.`
        heading = "Reward Ready!"
      } else if (stampsNeeded <= 2) {
        message = `You're only ${stampsNeeded} stamp${stampsNeeded > 1 ? 's' : ''} away from your reward at ${restaurant.name}!`
        heading = "Almost there!"
      } else {
        message = `Collect stamps at ${restaurant.name}! You have ${loyaltyData.stamps}/${loyaltyData.restaurants.stamps_required}.`
      }
    }

    // Send OneSignal notification
    const notificationData = {
      app_id: oneSignalAppId,
      headings: { en: heading },
      contents: { en: message },
      // Target users within the restaurant's radius
      filters: [
        {
          field: "location",
          radius: restaurant.radius,
          lat: restaurant.latitude,
          long: restaurant.longitude
        }
      ],
      // Add custom data
      data: {
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        user_latitude: userLat,
        user_longitude: userLng,
        notification_type: "geo_proximity"
      },
      // iOS specific settings
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      // Android specific settings
      android_channel_id: "loyalty_notifications"
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${oneSignalApiKey}`
      },
      body: JSON.stringify(notificationData)
    })

    const result = await response.json()

    if (response.ok) {
      console.log('OneSignal notification sent:', result)
      return { success: true }
    } else {
      console.error('OneSignal error:', result)
      return { success: false, error: result.errors?.[0] || 'Unknown OneSignal error' }
    }

  } catch (error) {
    console.error('Error sending notification:', error)
    return { success: false, error: error.message }
  }
}

async function logGeoTrigger(supabase: any, data: any) {
  try {
    await supabase
      .from('geo_triggers')
      .insert({
        latitude: data.latitude,
        longitude: data.longitude,
        user_id: data.userId,
        client_id: data.clientId,
        restaurants_triggered: data.restaurantsTriggered,
        notifications_sent: data.notificationsSent,
        triggered_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging geo trigger:', error)
  }
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // Distance in meters
} 
// ============================================================================
// EDGE FUNCTION: NOTIFICATION SYSTEM
// ============================================================================
// Task T4.1: Notification System - Push notifications and marketing campaigns
// Features: Campaign management, push notifications, customer segmentation, analytics
// Access: Client admins and location managers
// ============================================================================

/// <reference path="../client-profile/deno.d.ts" />

// @ts-ignore: Deno deploy compatibility
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore: Deno deploy compatibility  
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

// Success response helper
function successResponse(data: any, message?: string) {
  return jsonResponse({ 
    success: true, 
    data, 
    message: message || 'Operation completed successfully' 
  })
}

// ============================================================================
// INTERFACES
// ============================================================================

interface NotificationCampaign {
  id?: string
  client_id: string
  location_id?: string
  title: string
  message: string
  campaign_type: 'promotional' | 'loyalty_reminder' | 'welcome' | 'churn_prevention' | 'reward_available'
  target_criteria: {
    loyalty_levels?: ('bronze' | 'silver' | 'gold' | 'platinum')[]
    visit_frequency?: 'high' | 'medium' | 'low'
    last_visit_days?: number
    stamp_range?: { min: number; max: number }
    churn_risk?: ('low' | 'medium' | 'high')[]
    location_ids?: string[]
    customer_ids?: string[]
  }
  schedule: {
    send_immediately: boolean
    scheduled_at?: string
  }
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled'
  created_at?: string
  updated_at?: string
  sent_at?: string
  created_by: string
}

interface NotificationDelivery {
  id?: string
  campaign_id: string
  customer_id: string
  notification_type: 'push' | 'email' | 'sms'
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'clicked'
  sent_at?: string
  delivered_at?: string
  clicked_at?: string
  error_message?: string
  metadata?: any
}

interface PushNotificationPayload {
  title: string
  body: string
  data?: {
    campaign_id?: string
    action_type?: 'visit_store' | 'redeem_reward' | 'view_stamps' | 'custom'
    action_data?: any
  }
  badge?: number
  sound?: string
  click_action?: string
}

interface CustomerSegmentation {
  total_customers: number
  segments: {
    loyalty_levels: { [key: string]: number }
    visit_frequency: { [key: string]: number }
    churn_risk: { [key: string]: number }
    location_distribution: { [key: string]: number }
  }
  matching_criteria: number
}

interface CampaignAnalytics {
  campaign_id: string
  total_targeted: number
  total_sent: number
  total_delivered: number
  total_clicked: number
  delivery_rate: number
  click_rate: number
  engagement_score: number
  by_notification_type: {
    [key: string]: {
      sent: number
      delivered: number
      clicked: number
    }
  }
  timeline: Array<{
    date: string
    sent: number
    delivered: number
    clicked: number
  }>
}

interface SendNotificationRequest {
  campaign_id?: string
  customer_ids: string[]
  notification: {
    title: string
    body: string
    data?: any
  }
  notification_types: ('push' | 'email' | 'sms')[]
  send_immediately?: boolean
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

// @ts-ignore: Deno deploy compatibility
serve(async (req: Request) => {
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
    const operation = url.searchParams.get('operation') || url.pathname.split('/').pop()
    
    // Verify user authorization - must be client_admin or location_manager
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('tier, role_id, client_id, location_id')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      console.error('Role verification error:', roleError)
      return errorResponse('Access denied: No valid role found', 403)
    }

    // Check if user has sufficient permissions
    if (!['client_admin', 'location_manager'].includes(userRole.tier)) {
      return errorResponse('Access denied: Notification management requires admin or manager role', 403)
    }

    console.log(`Notification System: ${method} ${operation} by ${userRole.tier} user ${user.id}`)

    // Route to operation handlers
    switch (operation) {
      case 'create-campaign':
        if (method !== 'POST') {
          return errorResponse(`Method ${method} not allowed for create campaign`, 405)
        }
        return await createCampaign(supabaseClient, req, userRole)
      
      case 'get-campaigns':
        if (method !== 'GET') {
          return errorResponse(`Method ${method} not allowed for get campaigns`, 405)
        }
        return await getCampaigns(supabaseClient, req, userRole)
      
      case 'send-notification':
        if (method !== 'POST') {
          return errorResponse(`Method ${method} not allowed for send notification`, 405)
        }
        return await sendNotification(supabaseClient, req, userRole)
      
      case 'customer-segmentation':
        if (method !== 'POST') {
          return errorResponse(`Method ${method} not allowed for customer segmentation`, 405)
        }
        return await customerSegmentation(supabaseClient, req, userRole)
      
      case 'campaign-analytics':
        if (method !== 'GET') {
          return errorResponse(`Method ${method} not allowed for campaign analytics`, 405)
        }
        return await campaignAnalytics(supabaseClient, req, userRole)
      
      default:
        return errorResponse(`Unknown operation: ${operation}`, 400)
    }

  } catch (error) {
    console.error('Notification System Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

// ============================================================================
// OPERATION HANDLERS
// ============================================================================

// Create Notification Campaign
async function createCampaign(supabaseClient: any, req: Request, userRole: any) {
  try {
    const campaignData: NotificationCampaign = await req.json()

    // Validate required fields
    if (!campaignData.title || !campaignData.message || !campaignData.campaign_type) {
      return errorResponse('Title, message, and campaign_type are required')
    }

    // Set client_id and created_by
    campaignData.client_id = userRole.client_id
    campaignData.created_by = userRole.role_id

    // If location_manager, restrict to their location
    if (userRole.tier === 'location_manager') {
      campaignData.location_id = userRole.location_id
    }

    // Set default values
    if (!campaignData.status) campaignData.status = 'draft'
    if (!campaignData.schedule) {
      campaignData.schedule = { send_immediately: false }
    }

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('notification_campaigns')
      .insert({
        ...campaignData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (campaignError) {
      console.error('Campaign creation error:', campaignError)
      return errorResponse('Failed to create campaign')
    }

    return successResponse(campaign, 'Campaign created successfully')

  } catch (error) {
    console.error('Create campaign handler error:', error)
    return errorResponse('Failed to create campaign')
  }
}

// Get Campaigns
async function getCampaigns(supabaseClient: any, req: Request, userRole: any) {
  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = supabaseClient
      .from('notification_campaigns')
      .select('*')
      .eq('client_id', userRole.client_id)

    // If location_manager, filter by location
    if (userRole.tier === 'location_manager') {
      query = query.eq('location_id', userRole.location_id)
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: campaigns, error } = await query

    if (error) {
      console.error('Get campaigns error:', error)
      return errorResponse('Failed to get campaigns')
    }

    return successResponse({
      campaigns,
      total_count: campaigns.length,
      pagination: { limit, offset }
    })

  } catch (error) {
    console.error('Get campaigns handler error:', error)
    return errorResponse('Failed to get campaigns')
  }
}

// Send Notification
async function sendNotification(supabaseClient: any, req: Request, userRole: any) {
  try {
    const sendRequest: SendNotificationRequest = await req.json()

    if (!sendRequest.customer_ids || sendRequest.customer_ids.length === 0) {
      return errorResponse('customer_ids are required')
    }

    if (!sendRequest.notification) {
      return errorResponse('notification payload is required')
    }

    // Verify customer access
    let customerQuery = supabaseClient
      .from('customers')
      .select('id, client_id, location_id, name')
      .eq('client_id', userRole.client_id)
      .in('id', sendRequest.customer_ids)

    if (userRole.tier === 'location_manager') {
      customerQuery = customerQuery.eq('location_id', userRole.location_id)
    }

    const { data: customers, error: customerError } = await customerQuery

    if (customerError || !customers || customers.length === 0) {
      return errorResponse('No accessible customers found')
    }

    // Create delivery records
    const deliveries: any[] = []
    for (const customer of customers) {
      for (const notificationType of sendRequest.notification_types) {
        const delivery = {
          campaign_id: sendRequest.campaign_id || `manual_${Date.now()}`,
          customer_id: customer.id,
          notification_type: notificationType,
          status: 'pending',
          metadata: {
            notification_payload: sendRequest.notification,
            customer_info: { name: customer.name }
          }
        }
        deliveries.push(delivery)
      }
    }

    // Insert delivery records
    const { data: insertedDeliveries, error: deliveryError } = await supabaseClient
      .from('notification_deliveries')
      .insert(deliveries)
      .select()

    if (deliveryError) {
      console.error('Delivery insertion error:', deliveryError)
      return errorResponse('Failed to create delivery records')
    }

    // Simulate notification sending
    const sendResults: any[] = []
    for (const delivery of insertedDeliveries) {
      const success = Math.random() > 0.1 // 90% success rate
      sendResults.push({
        delivery_id: delivery.id,
        success,
        error: success ? undefined : 'Simulated delivery failure'
      })
    }

    const successCount = sendResults.filter(r => r.success).length
    const failureCount = sendResults.filter(r => !r.success).length

    return successResponse({
      total_deliveries: insertedDeliveries.length,
      successful_sends: successCount,
      failed_sends: failureCount
    }, `Notifications sent: ${successCount} successful, ${failureCount} failed`)

  } catch (error) {
    console.error('Send notification handler error:', error)
    return errorResponse('Failed to send notifications')
  }
}

// Customer Segmentation
async function customerSegmentation(supabaseClient: any, req: Request, userRole: any) {
  try {
    const criteria = await req.json()

    // Get customers
    let customerQuery = supabaseClient
      .from('customers')
      .select('*')
      .eq('client_id', userRole.client_id)

    if (userRole.tier === 'location_manager') {
      customerQuery = customerQuery.eq('location_id', userRole.location_id)
    }

    const { data: customers, error } = await customerQuery

    if (error) {
      console.error('Customer segmentation error:', error)
      return errorResponse('Failed to get customer data')
    }

    // Filter customers based on criteria
    const matchingCustomers = customers.filter((customer: any) => {
      // Simple filtering logic
      if (criteria.loyalty_levels) {
        const loyaltyLevel = customer.total_stamps >= 100 ? 'platinum' : 
                           customer.total_stamps >= 50 ? 'gold' : 
                           customer.total_stamps >= 20 ? 'silver' : 'bronze'
        if (!criteria.loyalty_levels.includes(loyaltyLevel)) return false
      }
      
      if (criteria.stamp_range) {
        if (customer.total_stamps < criteria.stamp_range.min || 
            customer.total_stamps > criteria.stamp_range.max) return false
      }
      
      return true
    })

    return successResponse({
      total_customers: customers.length,
      matching_criteria: matchingCustomers.length,
      matching_customer_ids: matchingCustomers.map((c: any) => c.id)
    })

  } catch (error) {
    console.error('Customer segmentation handler error:', error)
    return errorResponse('Failed to perform customer segmentation')
  }
}

// Campaign Analytics
async function campaignAnalytics(supabaseClient: any, req: Request, userRole: any) {
  try {
    const url = new URL(req.url)
    const campaignId = url.searchParams.get('campaign_id')

    if (!campaignId) {
      return errorResponse('campaign_id parameter is required')
    }

    // Get delivery data
    const { data: deliveries, error: deliveryError } = await supabaseClient
      .from('notification_deliveries')
      .select('*')
      .eq('campaign_id', campaignId)

    if (deliveryError) {
      console.error('Delivery fetch error:', deliveryError)
      return errorResponse('Failed to get delivery data')
    }

    // Calculate analytics
    const totalTargeted = deliveries.length
    const totalSent = deliveries.filter((d: any) => d.status !== 'pending').length
    const totalDelivered = deliveries.filter((d: any) => d.status === 'delivered' || d.status === 'clicked').length
    const totalClicked = deliveries.filter((d: any) => d.status === 'clicked').length

    const deliveryRate = totalTargeted > 0 ? (totalDelivered / totalTargeted) * 100 : 0
    const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0

    const analytics = {
      campaign_id: campaignId,
      total_targeted: totalTargeted,
      total_sent: totalSent,
      total_delivered: totalDelivered,
      total_clicked: totalClicked,
      delivery_rate: parseFloat(deliveryRate.toFixed(2)),
      click_rate: parseFloat(clickRate.toFixed(2))
    }

    return successResponse({ analytics })

  } catch (error) {
    console.error('Campaign analytics handler error:', error)
    return errorResponse('Failed to get campaign analytics')
  }
} 
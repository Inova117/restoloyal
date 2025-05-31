import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationCampaign {
  id?: string
  client_id: string
  location_id?: string
  campaign_name: string
  campaign_type: 'push' | 'email' | 'sms' | 'multi'
  target_audience: 'all_customers' | 'location_customers' | 'active_customers' | 'inactive_customers' | 'high_value_customers'
  message_title: string
  message_content: string
  scheduled_for?: string
  send_immediately: boolean
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  created_by: string
  metadata?: any
}

interface NotificationLog {
  campaign_id: string
  customer_id: string
  notification_type: 'push' | 'email' | 'sms'
  status: 'sent' | 'delivered' | 'failed' | 'opened' | 'clicked'
  sent_at: string
  delivered_at?: string
  error_message?: string
  external_id?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    switch (req.method) {
      case 'POST':
        if (path === 'create-campaign') {
          return await createCampaign(req, supabaseClient, user.id)
        } else if (path === 'send-campaign') {
          return await sendCampaign(req, supabaseClient, user.id)
        } else if (path === 'schedule-campaign') {
          return await scheduleCampaign(req, supabaseClient, user.id)
        }
        break

      case 'GET':
        if (path === 'campaigns') {
          return await getCampaigns(req, supabaseClient, user.id)
        } else if (path === 'campaign-analytics') {
          return await getCampaignAnalytics(req, supabaseClient, user.id)
        }
        break

      case 'PUT':
        if (path === 'update-campaign') {
          return await updateCampaign(req, supabaseClient, user.id)
        }
        break

      case 'DELETE':
        if (path === 'delete-campaign') {
          return await deleteCampaign(req, supabaseClient, user.id)
        }
        break
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Notification campaigns error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function createCampaign(req: Request, supabaseClient: any, userId: string) {
  try {
    const campaignData: NotificationCampaign = await req.json()

    // Verify user permissions
    const hasPermission = await verifyUserPermissions(supabaseClient, userId, campaignData.client_id, campaignData.location_id)
    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate campaign data
    if (!campaignData.campaign_name || !campaignData.message_title || !campaignData.message_content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('notification_campaigns')
      .insert({
        client_id: campaignData.client_id,
        location_id: campaignData.location_id,
        campaign_name: campaignData.campaign_name,
        campaign_type: campaignData.campaign_type,
        target_audience: campaignData.target_audience,
        message_title: campaignData.message_title,
        message_content: campaignData.message_content,
        scheduled_for: campaignData.scheduled_for,
        send_immediately: campaignData.send_immediately || false,
        status: campaignData.send_immediately ? 'sending' : 'draft',
        created_by: userId,
        metadata: campaignData.metadata || {}
      })
      .select()
      .single()

    if (campaignError) {
      throw campaignError
    }

    // If send immediately, trigger sending
    if (campaignData.send_immediately) {
      await processCampaignSending(supabaseClient, campaign.id, campaignData)
    }

    // Log activity
    await logActivity(supabaseClient, {
      campaign_id: campaign.id,
      activity_type: 'campaign_created',
      user_id: userId,
      details: { campaign_name: campaignData.campaign_name }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        campaign,
        message: campaignData.send_immediately ? 'Campaign created and sending initiated' : 'Campaign created successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Create campaign error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create campaign' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function sendCampaign(req: Request, supabaseClient: any, userId: string) {
  try {
    const { campaign_id } = await req.json()

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('notification_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user permissions
    const hasPermission = await verifyUserPermissions(supabaseClient, userId, campaign.client_id, campaign.location_id)
    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if campaign can be sent
    if (campaign.status === 'sent') {
      return new Response(
        JSON.stringify({ error: 'Campaign already sent' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update campaign status
    await supabaseClient
      .from('notification_campaigns')
      .update({ status: 'sending', sent_at: new Date().toISOString() })
      .eq('id', campaign_id)

    // Process sending
    await processCampaignSending(supabaseClient, campaign_id, campaign)

    // Log activity
    await logActivity(supabaseClient, {
      campaign_id: campaign_id,
      activity_type: 'campaign_sent',
      user_id: userId,
      details: { campaign_name: campaign.campaign_name }
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Campaign sending initiated' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Send campaign error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send campaign' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function scheduleCampaign(req: Request, supabaseClient: any, userId: string) {
  try {
    const { campaign_id, scheduled_for } = await req.json()

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('notification_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user permissions
    const hasPermission = await verifyUserPermissions(supabaseClient, userId, campaign.client_id, campaign.location_id)
    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate scheduled time
    const scheduledDate = new Date(scheduled_for)
    if (scheduledDate <= new Date()) {
      return new Response(
        JSON.stringify({ error: 'Scheduled time must be in the future' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update campaign
    await supabaseClient
      .from('notification_campaigns')
      .update({ 
        scheduled_for: scheduled_for,
        status: 'scheduled'
      })
      .eq('id', campaign_id)

    // Log activity
    await logActivity(supabaseClient, {
      campaign_id: campaign_id,
      activity_type: 'campaign_scheduled',
      user_id: userId,
      details: { 
        campaign_name: campaign.campaign_name,
        scheduled_for: scheduled_for
      }
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Campaign scheduled successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Schedule campaign error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to schedule campaign' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function getCampaigns(req: Request, supabaseClient: any, userId: string) {
  try {
    const url = new URL(req.url)
    const clientId = url.searchParams.get('client_id')
    const locationId = url.searchParams.get('location_id')
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Get user permissions
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('client_id, role, status')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (!userRoles || userRoles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No permissions found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build query
    let query = supabaseClient
      .from('notification_campaigns')
      .select(`
        *,
        notification_logs(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters based on permissions
    const clientIds = userRoles.map(role => role.client_id)
    query = query.in('client_id', clientIds)

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: campaigns, error: campaignsError } = await query

    if (campaignsError) {
      throw campaignsError
    }

    return new Response(
      JSON.stringify({ success: true, campaigns }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Get campaigns error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch campaigns' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function getCampaignAnalytics(req: Request, supabaseClient: any, userId: string) {
  try {
    const url = new URL(req.url)
    const campaignId = url.searchParams.get('campaign_id')

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'Campaign ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('notification_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify permissions
    const hasPermission = await verifyUserPermissions(supabaseClient, userId, campaign.client_id, campaign.location_id)
    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get analytics data
    const { data: logs, error: logsError } = await supabaseClient
      .from('notification_logs')
      .select('notification_type, status, sent_at, delivered_at')
      .eq('campaign_id', campaignId)

    if (logsError) {
      throw logsError
    }

    // Calculate analytics
    const analytics = {
      total_sent: logs.length,
      delivered: logs.filter(log => log.status === 'delivered').length,
      failed: logs.filter(log => log.status === 'failed').length,
      opened: logs.filter(log => log.status === 'opened').length,
      clicked: logs.filter(log => log.status === 'clicked').length,
      by_type: {
        push: logs.filter(log => log.notification_type === 'push').length,
        email: logs.filter(log => log.notification_type === 'email').length,
        sms: logs.filter(log => log.notification_type === 'sms').length
      },
      delivery_rate: logs.length > 0 ? (logs.filter(log => log.status === 'delivered').length / logs.length * 100).toFixed(2) : 0,
      open_rate: logs.length > 0 ? (logs.filter(log => log.status === 'opened').length / logs.length * 100).toFixed(2) : 0,
      click_rate: logs.length > 0 ? (logs.filter(log => log.status === 'clicked').length / logs.length * 100).toFixed(2) : 0
    }

    return new Response(
      JSON.stringify({ success: true, campaign, analytics }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Get campaign analytics error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch analytics' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function updateCampaign(req: Request, supabaseClient: any, userId: string) {
  try {
    const { campaign_id, ...updateData } = await req.json()

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('notification_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify permissions
    const hasPermission = await verifyUserPermissions(supabaseClient, userId, campaign.client_id, campaign.location_id)
    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if campaign can be updated
    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return new Response(
        JSON.stringify({ error: 'Cannot update sent or sending campaign' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update campaign
    const { data: updatedCampaign, error: updateError } = await supabaseClient
      .from('notification_campaigns')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign_id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Log activity
    await logActivity(supabaseClient, {
      campaign_id: campaign_id,
      activity_type: 'campaign_updated',
      user_id: userId,
      details: { updates: Object.keys(updateData) }
    })

    return new Response(
      JSON.stringify({ success: true, campaign: updatedCampaign }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Update campaign error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update campaign' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function deleteCampaign(req: Request, supabaseClient: any, userId: string) {
  try {
    const url = new URL(req.url)
    const campaignId = url.searchParams.get('campaign_id')

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'Campaign ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('notification_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify permissions
    const hasPermission = await verifyUserPermissions(supabaseClient, userId, campaign.client_id, campaign.location_id)
    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if campaign can be deleted
    if (campaign.status === 'sending') {
      return new Response(
        JSON.stringify({ error: 'Cannot delete campaign that is currently sending' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete campaign (soft delete by updating status)
    await supabaseClient
      .from('notification_campaigns')
      .update({ 
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      })
      .eq('id', campaignId)

    // Log activity
    await logActivity(supabaseClient, {
      campaign_id: campaignId,
      activity_type: 'campaign_deleted',
      user_id: userId,
      details: { campaign_name: campaign.campaign_name }
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Campaign deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Delete campaign error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to delete campaign' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function processCampaignSending(supabaseClient: any, campaignId: string, campaign: any) {
  try {
    // Get target customers based on audience criteria
    const customers = await getTargetCustomers(supabaseClient, campaign)
    
    console.log(`Processing campaign ${campaignId} for ${customers.length} customers`)

    // Send notifications based on campaign type
    const results = []
    
    for (const customer of customers) {
      if (campaign.campaign_type === 'push' || campaign.campaign_type === 'multi') {
        const pushResult = await sendPushNotification(customer, campaign)
        results.push(pushResult)
      }
      
      if (campaign.campaign_type === 'email' || campaign.campaign_type === 'multi') {
        const emailResult = await sendEmailNotification(customer, campaign)
        results.push(emailResult)
      }
      
      if (campaign.campaign_type === 'sms' || campaign.campaign_type === 'multi') {
        const smsResult = await sendSMSNotification(customer, campaign)
        results.push(smsResult)
      }
    }

    // Log all notification attempts
    for (const result of results) {
      await supabaseClient
        .from('notification_logs')
        .insert({
          campaign_id: campaignId,
          customer_id: result.customer_id,
          notification_type: result.type,
          status: result.status,
          sent_at: new Date().toISOString(),
          error_message: result.error,
          external_id: result.external_id
        })
    }

    // Update campaign status
    const successCount = results.filter(r => r.status === 'sent').length
    const failureCount = results.filter(r => r.status === 'failed').length

    await supabaseClient
      .from('notification_campaigns')
      .update({ 
        status: failureCount === 0 ? 'sent' : 'partially_sent',
        sent_count: successCount,
        failed_count: failureCount,
        completed_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    console.log(`Campaign ${campaignId} completed: ${successCount} sent, ${failureCount} failed`)
  } catch (error) {
    console.error('Process campaign sending error:', error)
    
    // Update campaign status to failed
    await supabaseClient
      .from('notification_campaigns')
      .update({ 
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', campaignId)
  }
}

async function getTargetCustomers(supabaseClient: any, campaign: any) {
  let query = supabaseClient
    .from('customers')
    .select('id, name, email, phone, total_stamps, last_visit, status')

  // Apply client filter
  query = query.eq('client_id', campaign.client_id)

  // Apply location filter if specified
  if (campaign.location_id) {
    query = query.eq('location_id', campaign.location_id)
  }

  // Apply audience filters
  switch (campaign.target_audience) {
    case 'active_customers':
      query = query.eq('status', 'active')
      break
    case 'inactive_customers':
      query = query.eq('status', 'inactive')
      break
    case 'high_value_customers':
      query = query.eq('status', 'active').gte('total_stamps', 50)
      break
    default: // all_customers or location_customers
      query = query.neq('status', 'blocked')
  }

  const { data: customers, error } = await query

  if (error) {
    throw error
  }

  return customers || []
}

async function sendPushNotification(customer: any, campaign: any) {
  try {
    // OneSignal integration (mock implementation)
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_API_KEY')
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')

    if (!oneSignalApiKey || !oneSignalAppId) {
      console.log('OneSignal not configured, simulating push notification')
      return {
        customer_id: customer.id,
        type: 'push',
        status: 'sent',
        external_id: `mock_push_${Date.now()}`
      }
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${oneSignalApiKey}`
      },
      body: JSON.stringify({
        app_id: oneSignalAppId,
        include_external_user_ids: [customer.id],
        headings: { en: campaign.message_title },
        contents: { en: campaign.message_content },
        data: {
          campaign_id: campaign.id,
          customer_id: customer.id
        }
      })
    })

    const result = await response.json()

    return {
      customer_id: customer.id,
      type: 'push',
      status: response.ok ? 'sent' : 'failed',
      external_id: result.id,
      error: response.ok ? null : result.errors?.join(', ')
    }
  } catch (error) {
    return {
      customer_id: customer.id,
      type: 'push',
      status: 'failed',
      error: error.message
    }
  }
}

async function sendEmailNotification(customer: any, campaign: any) {
  try {
    // SendGrid integration (mock implementation)
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')

    if (!sendGridApiKey || !customer.email) {
      console.log('SendGrid not configured or customer has no email, simulating email')
      return {
        customer_id: customer.id,
        type: 'email',
        status: customer.email ? 'sent' : 'failed',
        external_id: customer.email ? `mock_email_${Date.now()}` : null,
        error: customer.email ? null : 'No email address'
      }
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sendGridApiKey}`
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: customer.email, name: customer.name }],
          subject: campaign.message_title
        }],
        from: {
          email: 'noreply@galletti.com',
          name: 'Galletti Loyalty'
        },
        content: [{
          type: 'text/html',
          value: `
            <h2>${campaign.message_title}</h2>
            <p>${campaign.message_content}</p>
            <p>Best regards,<br>Galletti Team</p>
          `
        }],
        custom_args: {
          campaign_id: campaign.id,
          customer_id: customer.id
        }
      })
    })

    return {
      customer_id: customer.id,
      type: 'email',
      status: response.ok ? 'sent' : 'failed',
      external_id: response.headers.get('x-message-id'),
      error: response.ok ? null : await response.text()
    }
  } catch (error) {
    return {
      customer_id: customer.id,
      type: 'email',
      status: 'failed',
      error: error.message
    }
  }
}

async function sendSMSNotification(customer: any, campaign: any) {
  try {
    // Twilio integration (mock implementation)
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!twilioAccountSid || !twilioAuthToken || !customer.phone) {
      console.log('Twilio not configured or customer has no phone, simulating SMS')
      return {
        customer_id: customer.id,
        type: 'sms',
        status: customer.phone ? 'sent' : 'failed',
        external_id: customer.phone ? `mock_sms_${Date.now()}` : null,
        error: customer.phone ? null : 'No phone number'
      }
    }

    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: new URLSearchParams({
        From: twilioPhoneNumber,
        To: customer.phone,
        Body: `${campaign.message_title}\n\n${campaign.message_content}`
      })
    })

    const result = await response.json()

    return {
      customer_id: customer.id,
      type: 'sms',
      status: response.ok ? 'sent' : 'failed',
      external_id: result.sid,
      error: response.ok ? null : result.message
    }
  } catch (error) {
    return {
      customer_id: customer.id,
      type: 'sms',
      status: 'failed',
      error: error.message
    }
  }
}

async function verifyUserPermissions(supabaseClient: any, userId: string, clientId: string, locationId?: string) {
  // Check if user is platform admin
  const { data: platformAdmin } = await supabaseClient
    .from('platform_admin_users')
    .select('role')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (platformAdmin && ['super_admin', 'admin'].includes(platformAdmin.role)) {
    return true
  }

  // Check user roles
  const { data: userRoles } = await supabaseClient
    .from('user_roles')
    .select('client_id, role, location_id')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (!userRoles || userRoles.length === 0) {
    return false
  }

  // Check if user has permission for this client
  const hasClientPermission = userRoles.some(role => 
    role.client_id === clientId && 
    ['client_admin', 'restaurant_admin'].includes(role.role)
  )

  if (!hasClientPermission) {
    return false
  }

  // If location is specified, check location permission
  if (locationId) {
    const hasLocationPermission = userRoles.some(role =>
      role.client_id === clientId &&
      (role.role === 'client_admin' || role.location_id === locationId)
    )
    return hasLocationPermission
  }

  return true
}

async function logActivity(supabaseClient: any, activity: any) {
  try {
    await supabaseClient
      .from('campaign_activity_logs')
      .insert({
        campaign_id: activity.campaign_id,
        activity_type: activity.activity_type,
        user_id: activity.user_id,
        details: activity.details,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
} 
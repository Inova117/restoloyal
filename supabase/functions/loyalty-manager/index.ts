// @ts-ignore - Deno imports work in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno imports work in Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LoyaltySettings {
  id: string
  restaurant_id: string
  stamps_required: number
  reward_description: string
  reward_value: number
  stamps_per_dollar: number
  auto_redeem: boolean
  max_stamps_per_visit: number
  stamp_expiry_days?: number
  minimum_purchase_amount?: number
  updated_at: string
  updated_by: string
}

interface Campaign {
  id: string
  client_id: string
  restaurant_id?: string
  title: string
  description: string
  promo_type: 'bonus_stamps' | 'discount' | 'free_item' | 'double_stamps' | 'referral_bonus'
  reward_config: {
    bonus_stamps?: number
    discount_percentage?: number
    discount_amount?: number
    free_item_description?: string
    referral_bonus_stamps?: number
  }
  start_date: string
  end_date: string
  eligible_locations: string[]
  status: 'draft' | 'active' | 'paused' | 'expired'
  usage_limit?: number
  usage_count: number
  created_at: string
  updated_at: string
  created_by: string
}

interface CreateCampaignRequest {
  title: string
  description: string
  promo_type: 'bonus_stamps' | 'discount' | 'free_item' | 'double_stamps' | 'referral_bonus'
  reward_config: {
    bonus_stamps?: number
    discount_percentage?: number
    discount_amount?: number
    free_item_description?: string
    referral_bonus_stamps?: number
  }
  start_date: string
  end_date: string
  eligible_locations: string[]
  restaurant_id?: string
  usage_limit?: number
}

interface UpdateLoyaltySettingsRequest {
  stamps_required?: number
  reward_description?: string
  reward_value?: number
  stamps_per_dollar?: number
  auto_redeem?: boolean
  max_stamps_per_visit?: number
  stamp_expiry_days?: number
  minimum_purchase_amount?: number
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

    // Verify user has client_admin or restaurant_admin role for this client
    const { data: adminCheck, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('role, client_id, restaurant_id')
      .eq('user_id', user.id)
      .eq('client_id', clientId)
      .in('role', ['client_admin', 'restaurant_admin'])
      .eq('status', 'active')
      .single()

    if (adminError || !adminCheck) {
      // Also check if user is a platform admin
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
            error: 'Forbidden: You are not authorized to manage loyalty settings for this client' 
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    const endpoint = url.searchParams.get('endpoint') || 'loyalty'

    // Handle loyalty settings endpoints
    if (endpoint === 'loyalty') {
      return await handleLoyaltySettings(req, supabaseClient, url, adminCheck, user, clientId)
    }
    
    // Handle campaign endpoints
    if (endpoint === 'campaigns') {
      return await handleCampaigns(req, supabaseClient, url, adminCheck, user, clientId)
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Loyalty Manager API Error:', error)
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

async function handleLoyaltySettings(req: Request, supabaseClient: any, url: URL, adminCheck: any, user: any, clientId: string) {
  const restaurantId = url.searchParams.get('restaurant_id')

  // Handle GET request - Get loyalty settings
  if (req.method === 'GET') {
    let query = supabaseClient
      .from('loyalty_settings')
      .select(`
        id,
        restaurant_id,
        stamps_required,
        reward_description,
        reward_value,
        stamps_per_dollar,
        auto_redeem,
        max_stamps_per_visit,
        stamp_expiry_days,
        minimum_purchase_amount,
        updated_at,
        updated_by,
        restaurants:restaurant_id (
          id,
          name,
          client_id
        )
      `)

    // Apply restaurant scope for restaurant_admins
    if (adminCheck?.role === 'restaurant_admin' && adminCheck.restaurant_id) {
      query = query.eq('restaurant_id', adminCheck.restaurant_id)
    } else if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId)
    } else {
      // For client_admins, get all restaurants for their client
      query = query.eq('restaurants.client_id', clientId)
    }

    const { data: settings, error: settingsError } = await query

    if (settingsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch loyalty settings', details: settingsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: settings || []
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Handle POST/PATCH request - Update loyalty settings
  if (req.method === 'POST' || req.method === 'PATCH') {
    if (!restaurantId) {
      return new Response(
        JSON.stringify({ error: 'restaurant_id is required for updating loyalty settings' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const body: UpdateLoyaltySettingsRequest = await req.json()

    // Validate required fields
    if (body.stamps_required !== undefined && (body.stamps_required < 1 || body.stamps_required > 100)) {
      return new Response(
        JSON.stringify({ error: 'Stamps required must be between 1 and 100' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (body.reward_value !== undefined && body.reward_value < 0) {
      return new Response(
        JSON.stringify({ error: 'Reward value must be positive' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (body.stamps_per_dollar !== undefined && (body.stamps_per_dollar < 0.1 || body.stamps_per_dollar > 10)) {
      return new Response(
        JSON.stringify({ error: 'Stamps per dollar must be between 0.1 and 10' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Build update object
    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    }

    // Check if settings exist for this restaurant
    const { data: existingSettings } = await supabaseClient
      .from('loyalty_settings')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .single()

    let result
    if (existingSettings) {
      // Update existing settings
      const { data: updatedSettings, error: updateError } = await supabaseClient
        .from('loyalty_settings')
        .update(updateData)
        .eq('restaurant_id', restaurantId)
        .select(`
          id,
          restaurant_id,
          stamps_required,
          reward_description,
          reward_value,
          stamps_per_dollar,
          auto_redeem,
          max_stamps_per_visit,
          stamp_expiry_days,
          minimum_purchase_amount,
          updated_at,
          updated_by
        `)
        .single()

      if (updateError) {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update loyalty settings', 
            details: updateError.message 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      result = updatedSettings
    } else {
      // Create new settings
      const { data: newSettings, error: createError } = await supabaseClient
        .from('loyalty_settings')
        .insert({
          restaurant_id: restaurantId,
          ...updateData
        })
        .select(`
          id,
          restaurant_id,
          stamps_required,
          reward_description,
          reward_value,
          stamps_per_dollar,
          auto_redeem,
          max_stamps_per_visit,
          stamp_expiry_days,
          minimum_purchase_amount,
          updated_at,
          updated_by
        `)
        .single()

      if (createError) {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create loyalty settings', 
            details: createError.message 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      result = newSettings
    }

    // Log the settings update for audit trail
    await supabaseClient
      .from('platform_activity_log')
      .insert({
        activity_type: 'loyalty_settings_updated',
        description: `Loyalty settings updated for restaurant ${restaurantId}`,
        client_name: clientId,
        user_id: user.id,
        metadata: {
          client_id: clientId,
          restaurant_id: restaurantId,
          updated_fields: Object.keys(body),
          user_email: user.email
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Loyalty settings updated successfully',
        data: result 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function handleCampaigns(req: Request, supabaseClient: any, url: URL, adminCheck: any, user: any, clientId: string) {
  const campaignId = url.searchParams.get('campaign_id')

  // Handle GET request - List campaigns
  if (req.method === 'GET') {
    if (campaignId) {
      // Get specific campaign
      let query = supabaseClient
        .from('campaigns')
        .select(`
          id,
          client_id,
          restaurant_id,
          title,
          description,
          promo_type,
          reward_config,
          start_date,
          end_date,
          eligible_locations,
          status,
          usage_limit,
          usage_count,
          created_at,
          updated_at,
          created_by
        `)
        .eq('id', campaignId)

      // Apply restaurant scope for restaurant_admins
      if (adminCheck?.role === 'restaurant_admin' && adminCheck.restaurant_id) {
        query = query.eq('restaurant_id', adminCheck.restaurant_id)
      } else {
        query = query.eq('client_id', clientId)
      }

      const { data: campaign, error: campaignError } = await query.single()

      if (campaignError || !campaign) {
        return new Response(
          JSON.stringify({ error: 'Campaign not found or access denied' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: campaign 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // List all campaigns
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = supabaseClient
      .from('campaigns')
      .select(`
        id,
        client_id,
        restaurant_id,
        title,
        description,
        promo_type,
        reward_config,
        start_date,
        end_date,
        eligible_locations,
        status,
        usage_limit,
        usage_count,
        created_at,
        updated_at,
        created_by
      `, { count: 'exact' })

    // Apply restaurant scope for restaurant_admins
    if (adminCheck?.role === 'restaurant_admin' && adminCheck.restaurant_id) {
      query = query.eq('restaurant_id', adminCheck.restaurant_id)
    } else {
      query = query.eq('client_id', clientId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: campaigns, error: campaignsError, count } = await query

    if (campaignsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch campaigns', details: campaignsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: campaigns || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Handle POST request - Create campaign
  if (req.method === 'POST') {
    const body: CreateCampaignRequest = await req.json()

    // Validate required fields
    if (!body.title || body.title.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: 'Campaign title must be at least 3 characters long' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!body.description || body.description.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Campaign description must be at least 10 characters long' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!['bonus_stamps', 'discount', 'free_item', 'double_stamps', 'referral_bonus'].includes(body.promo_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid promo type' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const startDate = new Date(body.start_date)
    const endDate = new Date(body.end_date)
    if (endDate <= startDate) {
      return new Response(
        JSON.stringify({ error: 'End date must be after start date' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!body.eligible_locations || body.eligible_locations.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one eligible location must be specified' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate reward config based on promo type
    const rewardValidation = validateRewardConfig(body.promo_type, body.reward_config)
    if (!rewardValidation.valid) {
      return new Response(
        JSON.stringify({ error: rewardValidation.error }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create the campaign
    const campaignData = {
      client_id: clientId,
      restaurant_id: body.restaurant_id || null,
      title: body.title.trim(),
      description: body.description.trim(),
      promo_type: body.promo_type,
      reward_config: body.reward_config,
      start_date: body.start_date,
      end_date: body.end_date,
      eligible_locations: body.eligible_locations,
      status: 'draft' as const,
      usage_limit: body.usage_limit || null,
      usage_count: 0,
      created_by: user.id
    }

    const { data: newCampaign, error: createError } = await supabaseClient
      .from('campaigns')
      .insert(campaignData)
      .select(`
        id,
        client_id,
        restaurant_id,
        title,
        description,
        promo_type,
        reward_config,
        start_date,
        end_date,
        eligible_locations,
        status,
        usage_limit,
        usage_count,
        created_at,
        updated_at,
        created_by
      `)
      .single()

    if (createError) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create campaign', 
          details: createError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Log the campaign creation for audit trail
    await supabaseClient
      .from('platform_activity_log')
      .insert({
        activity_type: 'campaign_created',
        description: `Campaign created: ${newCampaign.title}`,
        client_name: clientId,
        user_id: user.id,
        metadata: {
          client_id: clientId,
          campaign_id: newCampaign.id,
          promo_type: body.promo_type,
          user_email: user.email
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Campaign created successfully',
        data: newCampaign 
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Handle PATCH request - Update campaign
  if (req.method === 'PATCH') {
    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'campaign_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const body = await req.json()

    // Build update object
    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString()
    }

    // Remove fields that shouldn't be updated
    delete updateData.id
    delete updateData.client_id
    delete updateData.created_at
    delete updateData.created_by
    delete updateData.usage_count

    // Update the campaign (RLS will ensure only authorized users can update)
    let updateQuery = supabaseClient
      .from('campaigns')
      .update(updateData)
      .eq('id', campaignId)

    // Apply restaurant scope for restaurant_admins
    if (adminCheck?.role === 'restaurant_admin' && adminCheck.restaurant_id) {
      updateQuery = updateQuery.eq('restaurant_id', adminCheck.restaurant_id)
    } else {
      updateQuery = updateQuery.eq('client_id', clientId)
    }

    const { data: updatedCampaign, error: updateError } = await updateQuery
      .select(`
        id,
        client_id,
        restaurant_id,
        title,
        description,
        promo_type,
        reward_config,
        start_date,
        end_date,
        eligible_locations,
        status,
        usage_limit,
        usage_count,
        created_at,
        updated_at,
        created_by
      `)
      .single()

    if (updateError) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update campaign', 
          details: updateError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Log the campaign update for audit trail
    await supabaseClient
      .from('platform_activity_log')
      .insert({
        activity_type: 'campaign_updated',
        description: `Campaign updated: ${updatedCampaign.title}`,
        client_name: clientId,
        user_id: user.id,
        metadata: {
          client_id: clientId,
          campaign_id: campaignId,
          updated_fields: Object.keys(body),
          user_email: user.email
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Campaign updated successfully',
        data: updatedCampaign 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

function validateRewardConfig(promoType: string, rewardConfig: any): { valid: boolean; error?: string } {
  switch (promoType) {
    case 'bonus_stamps':
      if (!rewardConfig.bonus_stamps || rewardConfig.bonus_stamps < 1 || rewardConfig.bonus_stamps > 50) {
        return { valid: false, error: 'Bonus stamps must be between 1 and 50' }
      }
      break
    case 'discount':
      if (rewardConfig.discount_percentage && (rewardConfig.discount_percentage < 1 || rewardConfig.discount_percentage > 100)) {
        return { valid: false, error: 'Discount percentage must be between 1 and 100' }
      }
      if (rewardConfig.discount_amount && rewardConfig.discount_amount < 0.01) {
        return { valid: false, error: 'Discount amount must be positive' }
      }
      if (!rewardConfig.discount_percentage && !rewardConfig.discount_amount) {
        return { valid: false, error: 'Either discount percentage or amount must be specified' }
      }
      break
    case 'free_item':
      if (!rewardConfig.free_item_description || rewardConfig.free_item_description.trim().length < 3) {
        return { valid: false, error: 'Free item description must be at least 3 characters long' }
      }
      break
    case 'referral_bonus':
      if (!rewardConfig.referral_bonus_stamps || rewardConfig.referral_bonus_stamps < 1 || rewardConfig.referral_bonus_stamps > 20) {
        return { valid: false, error: 'Referral bonus stamps must be between 1 and 20' }
      }
      break
    case 'double_stamps':
      // No additional validation needed for double stamps
      break
    default:
      return { valid: false, error: 'Invalid promo type' }
  }
  return { valid: true }
} 
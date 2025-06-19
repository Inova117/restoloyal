import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// ============================================================================
// LOYALTY SYSTEM INTERFACES
// ============================================================================

interface LoyaltySettings {
  id: string
  client_id: string
  location_id?: string
  stamps_to_reward: number
  reward_description: string
  reward_value: number
  auto_redeem: boolean
  max_stamps_per_visit: number
  stamp_value: number
  welcome_bonus_stamps: number
  birthday_bonus_stamps: number
  referral_bonus_stamps: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface StampTransaction {
  id: string
  customer_id: string
  location_id: string
  client_id: string
  stamps_added: number
  stamps_used: number
  transaction_type: 'earned' | 'redeemed' | 'bonus' | 'expired' | 'manual_adjustment'
  reference_type: 'purchase' | 'reward_redemption' | 'welcome_bonus' | 'birthday' | 'referral' | 'manual'
  reference_id?: string
  notes?: string
  added_by_user_id: string
  added_by_name: string
  value_amount?: number
  created_at: string
}

interface RewardRedemption {
  id: string
  customer_id: string
  location_id: string
  client_id: string
  stamps_used: number
  reward_description: string
  reward_value: number
  redemption_code?: string
  redeemed_by_user_id: string
  redeemed_by_name: string
  status: 'pending' | 'redeemed' | 'expired' | 'cancelled'
  expires_at?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

async function validateAuth(req: Request): Promise<{ user: any; error?: string }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { user: null, error: 'Invalid or expired token' }
  }

  return { user }
}

async function getUserRole(userId: string): Promise<{ role: string; client_id?: string; location_id?: string }> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('tier, client_id, location_id')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return { role: 'none' }
  }

  return {
    role: data.tier,
    client_id: data.client_id,
    location_id: data.location_id
  }
}

function hasPermission(userRole: string, action: string): boolean {
  const permissions = {
    superadmin: ['view_settings', 'update_settings', 'add_stamp', 'redeem_reward', 'view_history', 'manage_all'],
    client_admin: ['view_settings', 'update_settings', 'add_stamp', 'redeem_reward', 'view_history'],
    location_staff: ['view_settings', 'add_stamp', 'redeem_reward', 'view_history'],
    customer: ['view_history']
  }

  return permissions[userRole as keyof typeof permissions]?.includes(action) || false
}

// ============================================================================
// LOYALTY SETTINGS MANAGEMENT
// ============================================================================

async function getLoyaltySettings(clientId: string, locationId?: string) {
  try {
    let query = supabase
      .from('loyalty_settings')
      .select(`
        *,
        locations (
          id,
          name,
          address,
          city,
          state
        ),
        clients (
          id,
          name,
          slug
        )
      `)
      .eq('client_id', clientId)
      .eq('is_active', true)

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // If no specific location settings found, get client default
    if (!data || data.length === 0) {
      const { data: defaultData, error: defaultError } = await supabase
        .from('loyalty_settings')
        .select(`
          *,
          clients (
            id,
            name,
            slug
          )
        `)
        .eq('client_id', clientId)
        .is('location_id', null)
        .eq('is_active', true)
        .single()

      if (defaultError && defaultError.code !== 'PGRST116') {
        throw new Error(`Database error: ${defaultError.message}`)
      }

      return {
        success: true,
        data: defaultData || createDefaultSettings(clientId),
        message: defaultData ? 'Default settings retrieved' : 'Using system defaults'
      }
    }

    return {
      success: true,
      data: data[0],
      message: 'Loyalty settings retrieved successfully'
    }

  } catch (error) {
    console.error('Get loyalty settings error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get loyalty settings'
    }
  }
}

function createDefaultSettings(clientId: string) {
  return {
    id: 'default',
    client_id: clientId,
    location_id: null,
    stamps_to_reward: 10,
    reward_description: 'Free item of your choice',
    reward_value: 10.00,
    auto_redeem: false,
    max_stamps_per_visit: 5,
    stamp_value: 1.00,
    welcome_bonus_stamps: 1,
    birthday_bonus_stamps: 5,
    referral_bonus_stamps: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

async function updateLoyaltySettings(clientId: string, locationId: string | undefined, settings: Partial<LoyaltySettings>, userId: string) {
  try {
    const updateData = {
      ...settings,
      client_id: clientId,
      location_id: locationId || null,
      updated_at: new Date().toISOString()
    }

    // Check if settings exist
    let query = supabase
      .from('loyalty_settings')
      .select('id')
      .eq('client_id', clientId)

    if (locationId) {
      query = query.eq('location_id', locationId)
    } else {
      query = query.is('location_id', null)
    }

    const { data: existing } = await query.single()

    let result

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('loyalty_settings')
        .update(updateData)
        .eq('id', existing.id)
        .select(`
          *,
          locations (
            id,
            name
          ),
          clients (
            id,
            name
          )
        `)
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new
      const { data, error } = await supabase
        .from('loyalty_settings')
        .insert({
          ...updateData,
          id: crypto.randomUUID()
        })
        .select(`
          *,
          locations (
            id,
            name
          ),
          clients (
            id,
            name
          )
        `)
        .single()

      if (error) throw error
      result = data
    }

    return {
      success: true,
      data: result,
      message: existing ? 'Loyalty settings updated successfully' : 'Loyalty settings created successfully'
    }

  } catch (error) {
    console.error('Update loyalty settings error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update loyalty settings'
    }
  }
}

// ============================================================================
// STAMP MANAGEMENT
// ============================================================================

async function addStamp(
  customerId: string,
  clientId: string,
  locationId: string,
  stampsToAdd: number,
  addedByUserId: string,
  addedByName: string,
  notes?: string,
  referenceType: string = 'purchase'
) {
  try {
    // Validate customer exists and belongs to the client
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        current_stamps,
        lifetime_stamps,
        total_visits,
        total_rewards_redeemed,
        client_id,
        location_id,
        status
      `)
      .eq('id', customerId)
      .eq('client_id', clientId)
      .single()

    if (customerError || !customer) {
      throw new Error('Customer not found or does not belong to this client')
    }

    if (customer.status !== 'active') {
      throw new Error('Cannot add stamps to inactive customer')
    }

    // Get loyalty settings to check limits
    const settingsResult = await getLoyaltySettings(clientId, locationId)
    if (!settingsResult.success) {
      throw new Error('Failed to get loyalty settings')
    }

    const settings = settingsResult.data as LoyaltySettings
    
    // Validate stamp limits
    if (stampsToAdd > settings.max_stamps_per_visit) {
      throw new Error(`Cannot add more than ${settings.max_stamps_per_visit} stamps per visit`)
    }

    if (stampsToAdd <= 0) {
      throw new Error('Stamps to add must be greater than 0')
    }

    const transactionId = crypto.randomUUID()
    const currentStamps = customer.current_stamps || 0
    const newStampTotal = currentStamps + stampsToAdd

    // Create stamp transaction record
    const { error: transactionError } = await supabase
      .from('stamp_transactions')
      .insert({
        id: transactionId,
        customer_id: customerId,
        location_id: locationId,
        client_id: clientId,
        stamps_added: stampsToAdd,
        stamps_used: 0,
        transaction_type: 'earned',
        reference_type: referenceType as any,
        notes: notes,
        added_by_user_id: addedByUserId,
        added_by_name: addedByName,
        value_amount: stampsToAdd * settings.stamp_value,
        created_at: new Date().toISOString()
      })

    if (transactionError) {
      throw new Error(`Failed to create stamp transaction: ${transactionError.message}`)
    }

    // Update customer stamp count
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({
        current_stamps: newStampTotal,
        lifetime_stamps: (customer.lifetime_stamps || 0) + stampsToAdd,
        total_visits: (customer.total_visits || 0) + 1,
        last_visit: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select(`
        id,
        name,
        email,
        phone,
        current_stamps,
        lifetime_stamps,
        total_visits,
        last_visit
      `)
      .single()

    if (updateError) {
      throw new Error(`Failed to update customer: ${updateError.message}`)
    }

    // Check if customer qualifies for automatic reward
    const canRedeem = newStampTotal >= settings.stamps_to_reward
    const eligibleRewards = Math.floor(newStampTotal / settings.stamps_to_reward)

    return {
      success: true,
      data: {
        transaction_id: transactionId,
        customer: updatedCustomer,
        stamps_added: stampsToAdd,
        new_stamp_total: newStampTotal,
        can_redeem_reward: canRedeem,
        eligible_rewards: eligibleRewards,
        stamps_to_next_reward: settings.stamps_to_reward - (newStampTotal % settings.stamps_to_reward)
      },
      message: `Successfully added ${stampsToAdd} stamp(s). Customer now has ${newStampTotal} stamps.`
    }

  } catch (error) {
    console.error('Add stamp error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add stamp'
    }
  }
}

// ============================================================================
// REWARD REDEMPTION
// ============================================================================

async function redeemReward(
  customerId: string,
  clientId: string,
  locationId: string,
  redeemedByUserId: string,
  redeemedByName: string,
  customRewardDescription?: string,
  customRewardValue?: number
) {
  try {
    // Validate customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        email,
        phone,
        current_stamps,
        total_rewards_redeemed,
        client_id,
        status
      `)
      .eq('id', customerId)
      .eq('client_id', clientId)
      .single()

    if (customerError || !customer) {
      throw new Error('Customer not found or does not belong to this client')
    }

    if (customer.status !== 'active') {
      throw new Error('Cannot redeem reward for inactive customer')
    }

    // Get loyalty settings
    const settingsResult = await getLoyaltySettings(clientId, locationId)
    if (!settingsResult.success) {
      throw new Error('Failed to get loyalty settings')
    }

    const settings = settingsResult.data as LoyaltySettings
    
    // Check if customer has enough stamps
    if (customer.current_stamps < settings.stamps_to_reward) {
      throw new Error(`Customer needs ${settings.stamps_to_reward} stamps to redeem a reward. Current: ${customer.current_stamps}`)
    }

    const stampsToUse = settings.stamps_to_reward
    const remainingStamps = customer.current_stamps - stampsToUse
    const redemptionId = crypto.randomUUID()
    const transactionId = crypto.randomUUID()
    const redemptionCode = `RWD-${Date.now().toString(36).toUpperCase()}`

    // Create reward redemption record
    const { error: redemptionError } = await supabase
      .from('reward_redemptions')
      .insert({
        id: redemptionId,
        customer_id: customerId,
        location_id: locationId,
        client_id: clientId,
        stamps_used: stampsToUse,
        reward_description: customRewardDescription || settings.reward_description,
        reward_value: customRewardValue || settings.reward_value,
        redemption_code: redemptionCode,
        redeemed_by_user_id: redeemedByUserId,
        redeemed_by_name: redeemedByName,
        status: 'redeemed',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (redemptionError) {
      throw new Error(`Failed to create reward redemption: ${redemptionError.message}`)
    }

    // Create stamp transaction record
    const { error: transactionError } = await supabase
      .from('stamp_transactions')
      .insert({
        id: transactionId,
        customer_id: customerId,
        location_id: locationId,
        client_id: clientId,
        stamps_added: 0,
        stamps_used: stampsToUse,
        transaction_type: 'redeemed',
        reference_type: 'reward_redemption',
        reference_id: redemptionId,
        notes: `Redeemed: ${customRewardDescription || settings.reward_description}`,
        added_by_user_id: redeemedByUserId,
        added_by_name: redeemedByName,
        value_amount: customRewardValue || settings.reward_value,
        created_at: new Date().toISOString()
      })

    if (transactionError) {
      throw new Error(`Failed to create stamp transaction: ${transactionError.message}`)
    }

    // Update customer
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({
        current_stamps: remainingStamps,
        total_rewards_redeemed: (customer.total_rewards_redeemed || 0) + 1,
        last_visit: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select(`
        id,
        name,
        email,
        phone,
        current_stamps,
        total_rewards_redeemed
      `)
      .single()

    if (updateError) {
      throw new Error(`Failed to update customer: ${updateError.message}`)
    }

    return {
      success: true,
      data: {
        redemption_id: redemptionId,
        transaction_id: transactionId,
        customer: updatedCustomer,
        stamps_used: stampsToUse,
        remaining_stamps: remainingStamps,
        reward_description: customRewardDescription || settings.reward_description,
        reward_value: customRewardValue || settings.reward_value,
        redemption_code: redemptionCode,
        can_redeem_another: remainingStamps >= settings.stamps_to_reward
      },
      message: 'Reward redeemed successfully!'
    }

  } catch (error) {
    console.error('Redeem reward error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to redeem reward'
    }
  }
}

// ============================================================================
// CUSTOMER LOYALTY STATUS
// ============================================================================

async function getCustomerLoyaltyStatus(customerId: string, clientId: string): Promise<any> {
  try {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        email,
        phone,
        current_stamps,
        lifetime_stamps,
        total_visits,
        total_rewards_redeemed,
        last_visit,
        created_at,
        status
      `)
      .eq('id', customerId)
      .eq('client_id', clientId)
      .single()

    if (customerError || !customer) {
      throw new Error('Customer not found')
    }

    // Get loyalty settings
    const settingsResult = await getLoyaltySettings(clientId)
    if (!settingsResult.success) {
      throw new Error('Failed to get loyalty settings')
    }

    const settings = settingsResult.data as LoyaltySettings

    // Calculate loyalty level based on lifetime stamps
    function calculateLoyaltyLevel(lifetimeStamps: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
      if (lifetimeStamps >= 200) return 'platinum'
      if (lifetimeStamps >= 100) return 'gold'
      if (lifetimeStamps >= 50) return 'silver'
      return 'bronze'
    }

    const loyaltyLevel = calculateLoyaltyLevel(customer.lifetime_stamps || 0)
    const stampsToNextReward = settings.stamps_to_reward - (customer.current_stamps % settings.stamps_to_reward)

    // Get recent transactions
    const { data: recentTransactions } = await supabase
      .from('stamp_transactions')
      .select(`
        id,
        stamps_added,
        stamps_used,
        transaction_type,
        reference_type,
        notes,
        added_by_name,
        value_amount,
        created_at
      `)
      .eq('customer_id', customerId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get recent rewards
    const { data: recentRewards } = await supabase
      .from('reward_redemptions')
      .select(`
        id,
        stamps_used,
        reward_description,
        reward_value,
        redemption_code,
        redeemed_by_name,
        status,
        created_at
      `)
      .eq('customer_id', customerId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(5)

    return {
      success: true,
      data: {
        customer: {
          ...customer,
          loyalty_level: loyaltyLevel,
          stamps_to_next_reward: stampsToNextReward,
          can_redeem_reward: customer.current_stamps >= settings.stamps_to_reward,
          eligible_rewards: Math.floor(customer.current_stamps / settings.stamps_to_reward)
        },
        settings,
        recent_transactions: recentTransactions || [],
        recent_rewards: recentRewards || [],
        analytics: {
          average_stamps_per_visit: customer.total_visits > 0 ? (customer.lifetime_stamps || 0) / customer.total_visits : 0,
          days_since_last_visit: customer.last_visit ? Math.floor((Date.now() - new Date(customer.last_visit).getTime()) / (1000 * 60 * 60 * 24)) : null,
          account_age_days: Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24)),
          redemption_rate: customer.lifetime_stamps > 0 ? (customer.total_rewards_redeemed || 0) / Math.floor((customer.lifetime_stamps || 0) / settings.stamps_to_reward) : 0
        }
      },
      message: 'Customer loyalty status retrieved successfully'
    }

  } catch (error) {
    console.error('Get customer loyalty status error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get customer loyalty status'
    }
  }
}

// ============================================================================
// TRANSACTION HISTORY
// ============================================================================

async function getTransactionHistory(
  clientId: string,
  locationId?: string,
  customerId?: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    let query = supabase
      .from('stamp_transactions')
      .select(`
        id,
        customer_id,
        location_id,
        stamps_added,
        stamps_used,
        transaction_type,
        reference_type,
        reference_id,
        notes,
        added_by_user_id,
        added_by_name,
        value_amount,
        created_at,
        customers (
          id,
          name,
          email,
          phone
        ),
        locations (
          id,
          name,
          address,
          city
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return {
      success: true,
      data: {
        transactions: data || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          has_more: (data?.length || 0) === limit
        }
      },
      message: 'Transaction history retrieved successfully'
    }

  } catch (error) {
    console.error('Get transaction history error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get transaction history'
    }
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: authError || 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get user role and permissions
    const { role: userRole, client_id: userClientId, location_id: userLocationId } = await getUserRole(user.id)
    
    const url = new URL(req.url)
    const endpoint = url.searchParams.get('endpoint')
    const clientId = url.searchParams.get('client_id') || userClientId
    const locationId = url.searchParams.get('location_id') || userLocationId

    // Validate client access
    if (userRole !== 'superadmin' && userClientId && clientId !== userClientId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Access denied: insufficient permissions for this client' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!clientId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Client ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let result

    switch (req.method) {
      case 'GET':
        switch (endpoint) {
          case 'settings':
            if (!hasPermission(userRole, 'view_settings')) {
              return new Response(
                JSON.stringify({ success: false, error: 'Permission denied' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
              )
            }
            result = await getLoyaltySettings(clientId, locationId)
            break

          case 'customer-status':
            const customerId = url.searchParams.get('customer_id')
            if (!customerId) {
              return new Response(
                JSON.stringify({ success: false, error: 'Customer ID is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
              )
            }
            result = await getCustomerLoyaltyStatus(customerId, clientId)
            break

          case 'history':
            if (!hasPermission(userRole, 'view_history')) {
              return new Response(
                JSON.stringify({ success: false, error: 'Permission denied' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
              )
            }
            const limit = parseInt(url.searchParams.get('limit') || '50')
            const offset = parseInt(url.searchParams.get('offset') || '0')
            const historyCustomerId = url.searchParams.get('customer_id')
            result = await getTransactionHistory(clientId, locationId, historyCustomerId, limit, offset)
            break

          default:
            return new Response(
              JSON.stringify({ success: false, error: 'Invalid endpoint for GET request' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
            )
        }
        break

      case 'POST':
        const body = await req.json()

        switch (endpoint) {
          case 'settings':
            if (!hasPermission(userRole, 'update_settings')) {
              return new Response(
                JSON.stringify({ success: false, error: 'Permission denied' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
              )
            }
            result = await updateLoyaltySettings(clientId, locationId, body, user.id)
            break

          case 'add-stamp':
            if (!hasPermission(userRole, 'add_stamp')) {
              return new Response(
                JSON.stringify({ success: false, error: 'Permission denied' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
              )
            }
            
            const { 
              customer_id, 
              stamps_to_add, 
              notes, 
              reference_type = 'purchase' 
            } = body

            if (!customer_id || !stamps_to_add || !locationId) {
              return new Response(
                JSON.stringify({ success: false, error: 'customer_id, stamps_to_add, and location_id are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
              )
            }

            // Get user name for attribution
            const { data: userData } = await supabase.auth.admin.getUserById(user.id)
            const addedByName = userData?.user?.user_metadata?.full_name || userData?.user?.email || 'System'

            result = await addStamp(
              customer_id,
              clientId,
              locationId,
              stamps_to_add,
              user.id,
              addedByName,
              notes,
              reference_type
            )
            break

          case 'redeem-reward':
            if (!hasPermission(userRole, 'redeem_reward')) {
              return new Response(
                JSON.stringify({ success: false, error: 'Permission denied' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
              )
            }
            
            const { 
              customer_id: rewardCustomerId, 
              custom_reward_description, 
              custom_reward_value 
            } = body

            if (!rewardCustomerId || !locationId) {
              return new Response(
                JSON.stringify({ success: false, error: 'customer_id and location_id are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
              )
            }

            // Get user name for attribution
            const { data: rewardUserData } = await supabase.auth.admin.getUserById(user.id)
            const redeemedByName = rewardUserData?.user?.user_metadata?.full_name || rewardUserData?.user?.email || 'System'

            result = await redeemReward(
              rewardCustomerId,
              clientId,
              locationId,
              user.id,
              redeemedByName,
              custom_reward_description,
              custom_reward_value
            )
            break

          default:
            return new Response(
              JSON.stringify({ success: false, error: 'Invalid endpoint for POST request' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
            )
        }
        break

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Loyalty Manager Error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 
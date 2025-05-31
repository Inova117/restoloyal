import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CustomerRegistrationRequest {
  qr_code?: string
  customer_data?: {
    name: string
    email: string
    phone: string
  }
  location_id: string
}

interface AddStampRequest {
  customer_id: string
  location_id: string
  stamps_earned: number
  amount?: number
  notes?: string
}

interface RedeemRewardRequest {
  customer_id: string
  location_id: string
  reward_type: string
  stamps_to_redeem: number
}

interface StaffPermissions {
  user_id: string
  location_id: string
  role: string
  can_register_customers: boolean
  can_add_stamps: boolean
  can_redeem_rewards: boolean
  can_view_customer_data: boolean
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

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify JWT token and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get URL path to determine operation
    const url = new URL(req.url)
    const operation = url.pathname.split('/').pop()

    // Verify staff permissions for the requested location
    const requestBody = await req.json()
    const locationId = requestBody.location_id

    if (!locationId) {
      return new Response(
        JSON.stringify({ error: 'location_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const staffPermissions = await verifyStaffPermissions(supabaseClient, user.id, locationId)
    if (!staffPermissions) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions for this location' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route to appropriate handler
    switch (operation) {
      case 'register-customer':
        if (!staffPermissions.can_register_customers) {
          return new Response(
            JSON.stringify({ error: 'No permission to register customers' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return await handleCustomerRegistration(supabaseClient, requestBody, staffPermissions)

      case 'add-stamp':
        if (!staffPermissions.can_add_stamps) {
          return new Response(
            JSON.stringify({ error: 'No permission to add stamps' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return await handleAddStamp(supabaseClient, requestBody, staffPermissions)

      case 'redeem-reward':
        if (!staffPermissions.can_redeem_rewards) {
          return new Response(
            JSON.stringify({ error: 'No permission to redeem rewards' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return await handleRedeemReward(supabaseClient, requestBody, staffPermissions)

      case 'customer-lookup':
        if (!staffPermissions.can_view_customer_data) {
          return new Response(
            JSON.stringify({ error: 'No permission to view customer data' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return await handleCustomerLookup(supabaseClient, requestBody, staffPermissions)

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('POS Operations error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function verifyStaffPermissions(
  supabaseClient: any, 
  userId: string, 
  locationId: string
): Promise<StaffPermissions | null> {
  try {
    // Check if user is staff at this location
    const { data: staffData, error: staffError } = await supabaseClient
      .from('location_staff')
      .select(`
        user_id,
        location_id,
        role,
        permissions,
        status,
        locations!inner(client_id)
      `)
      .eq('user_id', userId)
      .eq('location_id', locationId)
      .eq('status', 'active')
      .single()

    if (staffError || !staffData) {
      // Also check if user is a client admin for this location's client
      const { data: locationData, error: locationError } = await supabaseClient
        .from('locations')
        .select('client_id')
        .eq('id', locationId)
        .single()

      if (locationError || !locationData) {
        return null
      }

      const { data: adminData, error: adminError } = await supabaseClient
        .from('user_roles')
        .select('role, client_id')
        .eq('user_id', userId)
        .eq('client_id', locationData.client_id)
        .eq('role', 'client_admin')
        .eq('status', 'active')
        .single()

      if (adminError || !adminData) {
        return null
      }

      // Client admin has all permissions
      return {
        user_id: userId,
        location_id: locationId,
        role: 'client_admin',
        can_register_customers: true,
        can_add_stamps: true,
        can_redeem_rewards: true,
        can_view_customer_data: true
      }
    }

    // Return staff permissions
    return {
      user_id: userId,
      location_id: locationId,
      role: staffData.role,
      can_register_customers: staffData.permissions?.can_register_customers || false,
      can_add_stamps: staffData.permissions?.can_add_stamps || false,
      can_redeem_rewards: staffData.permissions?.can_redeem_rewards || false,
      can_view_customer_data: staffData.permissions?.can_view_customer_data || false
    }

  } catch (error) {
    console.error('Error verifying staff permissions:', error)
    return null
  }
}

async function handleCustomerRegistration(
  supabaseClient: any,
  request: CustomerRegistrationRequest,
  staffPermissions: StaffPermissions
) {
  try {
    let customerId: string

    if (request.qr_code) {
      // Look up existing customer by QR code
      const { data: existingCustomer, error: lookupError } = await supabaseClient
        .from('customers')
        .select('id, name, email, phone, status')
        .eq('qr_code', request.qr_code)
        .single()

      if (lookupError && lookupError.code !== 'PGRST116') {
        throw new Error(`Customer lookup failed: ${lookupError.message}`)
      }

      if (existingCustomer) {
        if (existingCustomer.status === 'blocked') {
          return new Response(
            JSON.stringify({ error: 'Customer account is blocked' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        customerId = existingCustomer.id

        // Log the registration activity
        await supabaseClient
          .from('customer_activity')
          .insert({
            customer_id: customerId,
            location_id: request.location_id,
            activity_type: 'registration_scan',
            details: { scanned_by: staffPermissions.user_id },
            staff_id: staffPermissions.user_id
          })

        return new Response(
          JSON.stringify({
            success: true,
            customer: existingCustomer,
            message: 'Existing customer found and registered for visit'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Create new customer
    if (!request.customer_data) {
      return new Response(
        JSON.stringify({ error: 'Customer data required for new registration' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get location's client_id
    const { data: locationData, error: locationError } = await supabaseClient
      .from('locations')
      .select('client_id')
      .eq('id', request.location_id)
      .single()

    if (locationError || !locationData) {
      throw new Error('Invalid location')
    }

    // Generate QR code if not provided
    const qrCode = request.qr_code || `CUST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { data: newCustomer, error: createError } = await supabaseClient
      .from('customers')
      .insert({
        name: request.customer_data.name,
        email: request.customer_data.email,
        phone: request.customer_data.phone,
        qr_code: qrCode,
        location_id: request.location_id,
        client_id: locationData.client_id,
        status: 'active',
        registered_by: staffPermissions.user_id
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Customer creation failed: ${createError.message}`)
    }

    // Log the registration activity
    await supabaseClient
      .from('customer_activity')
      .insert({
        customer_id: newCustomer.id,
        location_id: request.location_id,
        activity_type: 'new_registration',
        details: { 
          registered_by: staffPermissions.user_id,
          registration_method: request.qr_code ? 'qr_scan' : 'manual_entry'
        },
        staff_id: staffPermissions.user_id
      })

    return new Response(
      JSON.stringify({
        success: true,
        customer: newCustomer,
        message: 'New customer registered successfully'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Customer registration error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Customer registration failed',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleAddStamp(
  supabaseClient: any,
  request: AddStampRequest,
  staffPermissions: StaffPermissions
) {
  try {
    // Verify customer exists and is active
    const { data: customer, error: customerError } = await supabaseClient
      .from('customers')
      .select('id, name, status, client_id')
      .eq('id', request.customer_id)
      .single()

    if (customerError || !customer) {
      return new Response(
        JSON.stringify({ error: 'Customer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (customer.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Customer account is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify location belongs to same client as customer
    const { data: locationData, error: locationError } = await supabaseClient
      .from('locations')
      .select('client_id')
      .eq('id', request.location_id)
      .single()

    if (locationError || !locationData || locationData.client_id !== customer.client_id) {
      return new Response(
        JSON.stringify({ error: 'Invalid location for this customer' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get loyalty settings for this location
    const { data: loyaltySettings, error: loyaltyError } = await supabaseClient
      .from('loyalty_settings')
      .select('stamps_for_reward, max_stamps_per_visit')
      .eq('location_id', request.location_id)
      .single()

    if (loyaltyError) {
      console.warn('No loyalty settings found for location, using defaults')
    }

    const maxStampsPerVisit = loyaltySettings?.max_stamps_per_visit || 10
    const stampsForReward = loyaltySettings?.stamps_for_reward || 10

    // Validate stamps earned
    if (request.stamps_earned <= 0 || request.stamps_earned > maxStampsPerVisit) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid stamps amount. Must be between 1 and ${maxStampsPerVisit}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add stamp record
    const { data: stampRecord, error: stampError } = await supabaseClient
      .from('stamps')
      .insert({
        customer_id: request.customer_id,
        location_id: request.location_id,
        client_id: customer.client_id,
        stamps_earned: request.stamps_earned,
        amount: request.amount || 0,
        notes: request.notes || '',
        staff_id: staffPermissions.user_id
      })
      .select()
      .single()

    if (stampError) {
      throw new Error(`Failed to add stamp: ${stampError.message}`)
    }

    // Get customer's total stamps
    const { data: totalStampsData, error: totalError } = await supabaseClient
      .from('stamps')
      .select('stamps_earned')
      .eq('customer_id', request.customer_id)

    if (totalError) {
      throw new Error(`Failed to calculate total stamps: ${totalError.message}`)
    }

    const totalStamps = totalStampsData.reduce((sum, record) => sum + record.stamps_earned, 0)
    const availableRewards = Math.floor(totalStamps / stampsForReward)

    // Log the activity
    await supabaseClient
      .from('customer_activity')
      .insert({
        customer_id: request.customer_id,
        location_id: request.location_id,
        activity_type: 'stamps_earned',
        details: { 
          stamps_earned: request.stamps_earned,
          amount: request.amount,
          total_stamps: totalStamps,
          available_rewards: availableRewards,
          staff_id: staffPermissions.user_id
        },
        staff_id: staffPermissions.user_id
      })

    return new Response(
      JSON.stringify({
        success: true,
        stamp_record: stampRecord,
        customer_summary: {
          total_stamps: totalStamps,
          available_rewards: availableRewards,
          stamps_for_next_reward: stampsForReward - (totalStamps % stampsForReward)
        },
        message: `Added ${request.stamps_earned} stamp(s) successfully`
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Add stamp error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to add stamp',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleRedeemReward(
  supabaseClient: any,
  request: RedeemRewardRequest,
  staffPermissions: StaffPermissions
) {
  try {
    // Verify customer exists and is active
    const { data: customer, error: customerError } = await supabaseClient
      .from('customers')
      .select('id, name, status, client_id')
      .eq('id', request.customer_id)
      .single()

    if (customerError || !customer) {
      return new Response(
        JSON.stringify({ error: 'Customer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (customer.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Customer account is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify location belongs to same client as customer
    const { data: locationData, error: locationError } = await supabaseClient
      .from('locations')
      .select('client_id')
      .eq('id', request.location_id)
      .single()

    if (locationError || !locationData || locationData.client_id !== customer.client_id) {
      return new Response(
        JSON.stringify({ error: 'Invalid location for this customer' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get customer's total stamps
    const { data: totalStampsData, error: totalError } = await supabaseClient
      .from('stamps')
      .select('stamps_earned')
      .eq('customer_id', request.customer_id)

    if (totalError) {
      throw new Error(`Failed to calculate total stamps: ${totalError.message}`)
    }

    const totalStamps = totalStampsData.reduce((sum, record) => sum + record.stamps_earned, 0)

    // Check if customer has enough stamps
    if (totalStamps < request.stamps_to_redeem) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient stamps for redemption',
          available_stamps: totalStamps,
          required_stamps: request.stamps_to_redeem
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get loyalty settings for reward value
    const { data: loyaltySettings, error: loyaltyError } = await supabaseClient
      .from('loyalty_settings')
      .select('reward_value, stamps_for_reward')
      .eq('location_id', request.location_id)
      .single()

    const rewardValue = loyaltySettings?.reward_value || 10.00
    const stampsForReward = loyaltySettings?.stamps_for_reward || 10

    // Validate stamps to redeem matches reward requirement
    if (request.stamps_to_redeem !== stampsForReward) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid redemption amount. Must redeem exactly ${stampsForReward} stamps for a reward` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create reward record
    const { data: rewardRecord, error: rewardError } = await supabaseClient
      .from('rewards')
      .insert({
        customer_id: request.customer_id,
        location_id: request.location_id,
        client_id: customer.client_id,
        reward_type: request.reward_type,
        reward_value: rewardValue.toString(),
        stamps_used: request.stamps_to_redeem,
        redeemed_at: new Date().toISOString(),
        status: 'redeemed',
        staff_id: staffPermissions.user_id
      })
      .select()
      .single()

    if (rewardError) {
      throw new Error(`Failed to create reward: ${rewardError.message}`)
    }

    // Calculate remaining stamps
    const remainingStamps = totalStamps - request.stamps_to_redeem
    const availableRewards = Math.floor(remainingStamps / stampsForReward)

    // Log the activity
    await supabaseClient
      .from('customer_activity')
      .insert({
        customer_id: request.customer_id,
        location_id: request.location_id,
        activity_type: 'reward_redeemed',
        details: { 
          reward_type: request.reward_type,
          reward_value: rewardValue,
          stamps_used: request.stamps_to_redeem,
          remaining_stamps: remainingStamps,
          staff_id: staffPermissions.user_id
        },
        staff_id: staffPermissions.user_id
      })

    return new Response(
      JSON.stringify({
        success: true,
        reward_record: rewardRecord,
        customer_summary: {
          remaining_stamps: remainingStamps,
          available_rewards: availableRewards,
          stamps_for_next_reward: stampsForReward - (remainingStamps % stampsForReward)
        },
        message: `Reward redeemed successfully: ${request.reward_type}`
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Redeem reward error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to redeem reward',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleCustomerLookup(
  supabaseClient: any,
  request: { qr_code?: string, phone?: string, email?: string, location_id: string },
  staffPermissions: StaffPermissions
) {
  try {
    let query = supabaseClient
      .from('customers')
      .select(`
        id,
        name,
        email,
        phone,
        qr_code,
        status,
        created_at,
        stamps:stamps(stamps_earned),
        rewards:rewards(id, reward_type, redeemed_at)
      `)

    // Add search criteria
    if (request.qr_code) {
      query = query.eq('qr_code', request.qr_code)
    } else if (request.phone) {
      query = query.eq('phone', request.phone)
    } else if (request.email) {
      query = query.eq('email', request.email)
    } else {
      return new Response(
        JSON.stringify({ error: 'Must provide qr_code, phone, or email for lookup' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: customers, error: lookupError } = await query

    if (lookupError) {
      throw new Error(`Customer lookup failed: ${lookupError.message}`)
    }

    if (!customers || customers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Customer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate totals for each customer
    const customersWithTotals = customers.map(customer => {
      const totalStamps = customer.stamps?.reduce((sum: number, stamp: any) => sum + stamp.stamps_earned, 0) || 0
      const totalRewards = customer.rewards?.length || 0

      return {
        ...customer,
        total_stamps: totalStamps,
        total_rewards: totalRewards,
        stamps: undefined, // Remove detailed stamps from response
        rewards: undefined // Remove detailed rewards from response
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        customers: customersWithTotals
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Customer lookup error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Customer lookup failed',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
} 
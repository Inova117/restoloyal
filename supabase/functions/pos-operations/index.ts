// ============================================================================
// EDGE FUNCTION: POS OPERATIONS
// ============================================================================
// Task T3.1: POS Operations for Location Staff - Critical functionality
// Endpoints: register-customer, add-stamp, redeem-reward, customer-lookup
// Access: Location staff only (with proper location validation)
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

interface CustomerLookupQuery {
  qr_code?: string
  phone?: string
  email?: string
  name?: string
}

interface RegisterCustomerData {
  name: string
  email?: string
  phone?: string
  location_id: string
  initial_stamps?: number
}

interface AddStampData {
  customer_id: string
  location_id: string
  stamp_count?: number
  notes?: string
  staff_id: string
}

interface RedeemRewardData {
  customer_id: string
  location_id: string
  reward_type: string
  description?: string
  stamps_used: number
  staff_id: string
}

interface CustomerProfile {
  id: string
  client_id: string
  location_id: string
  name: string
  email?: string
  phone?: string
  qr_code: string
  total_stamps: number
  status: string
  created_at: string
  updated_at: string
}

interface POSOperationResult {
  customer: CustomerProfile
  operation_type: string
  stamps_before?: number
  stamps_after?: number
  rewards_available?: number
  loyalty_status?: 'active' | 'reward_available' | 'max_rewards'
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
    
    // Verify user authorization - must be location_staff
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('tier, role_id, client_id, location_id')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      console.error('Role verification error:', roleError)
      return errorResponse('Access denied: No valid role found', 403)
    }

    // Only location_staff can access POS operations
    if (userRole.tier !== 'location_staff') {
      return errorResponse('Access denied: POS operations are for location staff only', 403)
    }

    // Get staff information for location validation
    const { data: staffInfo, error: staffError } = await supabaseClient
      .from('location_staff')
      .select(`
        id,
        location_id,
        client_id,
        name,
        is_active,
        locations (
          id,
          name,
          client_id,
          is_active
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (staffError || !staffInfo || !staffInfo.is_active) {
      return errorResponse('Access denied: Staff account not found or inactive', 403)
    }

    if (!staffInfo.locations?.is_active) {
      return errorResponse('Access denied: Location is not active', 403)
    }

    console.log(`POS Operation: ${method} ${operation} by staff ${staffInfo.name} at location ${staffInfo.location_id}`)

    // Route to operation handlers
    switch (operation) {
      case 'customer-lookup':
        if (method !== 'GET' && method !== 'POST') {
          return errorResponse(`Method ${method} not allowed for customer lookup`, 405)
        }
        return await handleCustomerLookup(supabaseClient, req, staffInfo)
      
      case 'register-customer':
        if (method !== 'POST') {
          return errorResponse(`Method ${method} not allowed for customer registration`, 405)
        }
        return await handleRegisterCustomer(supabaseClient, req, staffInfo)
      
      case 'add-stamp':
        if (method !== 'POST') {
          return errorResponse(`Method ${method} not allowed for add stamp`, 405)
        }
        return await handleAddStamp(supabaseClient, req, staffInfo)
      
      case 'redeem-reward':
        if (method !== 'POST') {
          return errorResponse(`Method ${method} not allowed for redeem reward`, 405)
        }
        return await handleRedeemReward(supabaseClient, req, staffInfo)
      
      default:
        return errorResponse(`Unknown operation: ${operation}`, 400)
    }

  } catch (error) {
    console.error('POS Operations Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

// ============================================================================
// OPERATION HANDLERS
// ============================================================================

// Customer Lookup - Find customer by QR, phone, email, or name
async function handleCustomerLookup(supabaseClient: any, req: Request, staffInfo: any) {
  try {
    let query: CustomerLookupQuery = {}
    
    if (req.method === 'GET') {
      const url = new URL(req.url)
      query = {
        qr_code: url.searchParams.get('qr_code') || undefined,
        phone: url.searchParams.get('phone') || undefined,
        email: url.searchParams.get('email') || undefined,
        name: url.searchParams.get('name') || undefined,
      }
    } else {
      query = await req.json()
    }

    if (!query.qr_code && !query.phone && !query.email && !query.name) {
      return errorResponse('At least one search parameter is required (qr_code, phone, email, or name)')
    }

    // Build dynamic query
    let dbQuery = supabaseClient
      .from('customers')
      .select('*')
      .eq('client_id', staffInfo.client_id)
      .eq('status', 'active')

    // Apply search filters
    if (query.qr_code) {
      dbQuery = dbQuery.eq('qr_code', query.qr_code)
    } else if (query.phone) {
      dbQuery = dbQuery.eq('phone', query.phone)
    } else if (query.email) {
      dbQuery = dbQuery.eq('email', query.email)
    } else if (query.name) {
      dbQuery = dbQuery.ilike('name', `%${query.name}%`)
    }

    const { data: customers, error } = await dbQuery.limit(10)

    if (error) {
      console.error('Customer lookup error:', error)
      return errorResponse('Failed to search customers')
    }

    if (!customers || customers.length === 0) {
      return successResponse([], 'No customers found matching the search criteria')
    }

    // Calculate loyalty status for each customer
    const customersWithStatus = await Promise.all(
      customers.map(async (customer) => {
        const loyaltyStatus = calculateLoyaltyStatus(customer.total_stamps)
        const rewardsAvailable = Math.floor(customer.total_stamps / 10) // Assuming 10 stamps = 1 reward
        
        return {
          ...customer,
          loyalty_status: loyaltyStatus,
          rewards_available: rewardsAvailable,
          stamps_to_next_reward: 10 - (customer.total_stamps % 10)
        }
      })
    )

    return successResponse(customersWithStatus, `Found ${customers.length} customer(s)`)

  } catch (error) {
    console.error('Customer lookup handler error:', error)
    return errorResponse('Failed to lookup customer')
  }
}

// Register new customer
async function handleRegisterCustomer(supabaseClient: any, req: Request, staffInfo: any) {
  try {
    const data: RegisterCustomerData = await req.json()

    // Validate required fields
    if (!data.name) {
      return errorResponse('Customer name is required')
    }

    // Ensure location matches staff location
    if (data.location_id && data.location_id !== staffInfo.location_id) {
      return errorResponse('Cannot register customer for different location')
    }

    // Generate unique QR code
    const qrCode = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`

    // Validate email format if provided
    if (data.email && !isValidEmail(data.email)) {
      return errorResponse('Invalid email format')
    }

    // Check for existing customer with same email or phone
    if (data.email || data.phone) {
      let duplicateQuery = supabaseClient
        .from('customers')
        .select('id, name, email, phone')
        .eq('client_id', staffInfo.client_id)
        .eq('status', 'active')

      if (data.email && data.phone) {
        duplicateQuery = duplicateQuery.or(`email.eq.${data.email},phone.eq.${data.phone}`)
      } else if (data.email) {
        duplicateQuery = duplicateQuery.eq('email', data.email)
      } else if (data.phone) {
        duplicateQuery = duplicateQuery.eq('phone', data.phone)
      }

      const { data: existingCustomers } = await duplicateQuery

      if (existingCustomers && existingCustomers.length > 0) {
        return errorResponse('Customer already exists with this email or phone number')
      }
    }

    // Create new customer
    const newCustomer = {
      client_id: staffInfo.client_id,
      location_id: staffInfo.location_id,
      name: data.name.trim(),
      email: data.email?.toLowerCase(),
      phone: data.phone,
      qr_code: qrCode,
      total_stamps: data.initial_stamps || 0,
      status: 'active'
    }

    const { data: customer, error } = await supabaseClient
      .from('customers')
      .insert(newCustomer)
      .select()
      .single()

    if (error) {
      console.error('Customer creation error:', error)
      return errorResponse('Failed to register customer')
    }

    // Add initial stamps record if provided
    if (data.initial_stamps && data.initial_stamps > 0) {
      await supabaseClient
        .from('stamps')
        .insert({
          customer_id: customer.id,
          location_id: staffInfo.location_id,
          client_id: staffInfo.client_id,
          stamp_count: data.initial_stamps,
          notes: 'Initial stamps upon registration'
        })
    }

    const result: POSOperationResult = {
      customer,
      operation_type: 'register_customer',
      stamps_after: customer.total_stamps,
      rewards_available: Math.floor(customer.total_stamps / 10),
      loyalty_status: calculateLoyaltyStatus(customer.total_stamps)
    }

    return successResponse(result, 'Customer registered successfully')

  } catch (error) {
    console.error('Register customer handler error:', error)
    return errorResponse('Failed to register customer')
  }
}

// Add stamp to customer loyalty card
async function handleAddStamp(supabaseClient: any, req: Request, staffInfo: any) {
  try {
    const data: AddStampData = await req.json()

    // Validate required fields
    if (!data.customer_id) {
      return errorResponse('Customer ID is required')
    }

    const stampCount = data.stamp_count || 1

    if (stampCount < 1 || stampCount > 10) {
      return errorResponse('Stamp count must be between 1 and 10')
    }

    // Get customer and verify they belong to the same client
    const { data: customer, error: customerError } = await supabaseClient
      .from('customers')
      .select('*')
      .eq('id', data.customer_id)
      .eq('client_id', staffInfo.client_id)
      .eq('status', 'active')
      .single()

    if (customerError || !customer) {
      return errorResponse('Customer not found or not accessible')
    }

    const stampsBefore = customer.total_stamps
    const stampsAfter = stampsBefore + stampCount

    // Update customer stamp count
    const { error: updateError } = await supabaseClient
      .from('customers')
      .update({ 
        total_stamps: stampsAfter,
        updated_at: new Date().toISOString()
      })
      .eq('id', customer.id)

    if (updateError) {
      console.error('Customer update error:', updateError)
      return errorResponse('Failed to update customer stamps')
    }

    // Create stamp record
    const { error: stampError } = await supabaseClient
      .from('stamps')
      .insert({
        customer_id: customer.id,
        location_id: staffInfo.location_id,
        client_id: staffInfo.client_id,
        stamp_count: stampCount,
        notes: data.notes || `Added ${stampCount} stamp(s) via POS`
      })

    if (stampError) {
      console.error('Stamp record error:', stampError)
      // Continue execution - stamp record is for tracking but not critical
    }

    const updatedCustomer = { ...customer, total_stamps: stampsAfter }
    const result: POSOperationResult = {
      customer: updatedCustomer,
      operation_type: 'add_stamp',
      stamps_before: stampsBefore,
      stamps_after: stampsAfter,
      rewards_available: Math.floor(stampsAfter / 10),
      loyalty_status: calculateLoyaltyStatus(stampsAfter)
    }

    return successResponse(result, `Added ${stampCount} stamp(s) successfully`)

  } catch (error) {
    console.error('Add stamp handler error:', error)
    return errorResponse('Failed to add stamp')
  }
}

// Redeem reward
async function handleRedeemReward(supabaseClient: any, req: Request, staffInfo: any) {
  try {
    const data: RedeemRewardData = await req.json()

    // Validate required fields
    if (!data.customer_id || !data.reward_type || !data.stamps_used) {
      return errorResponse('Customer ID, reward type, and stamps used are required')
    }

    if (data.stamps_used < 1) {
      return errorResponse('Stamps used must be at least 1')
    }

    // Get customer and verify they belong to the same client
    const { data: customer, error: customerError } = await supabaseClient
      .from('customers')
      .select('*')
      .eq('id', data.customer_id)
      .eq('client_id', staffInfo.client_id)
      .eq('status', 'active')
      .single()

    if (customerError || !customer) {
      return errorResponse('Customer not found or not accessible')
    }

    const stampsBefore = customer.total_stamps

    // Check if customer has enough stamps
    if (stampsBefore < data.stamps_used) {
      return errorResponse(`Customer only has ${stampsBefore} stamps, cannot redeem ${data.stamps_used} stamps`)
    }

    const stampsAfter = stampsBefore - data.stamps_used

    // Update customer stamp count
    const { error: updateError } = await supabaseClient
      .from('customers')
      .update({ 
        total_stamps: stampsAfter,
        updated_at: new Date().toISOString()
      })
      .eq('id', customer.id)

    if (updateError) {
      console.error('Customer update error:', updateError)
      return errorResponse('Failed to update customer stamps')
    }

    // Create reward record
    const { error: rewardError } = await supabaseClient
      .from('rewards')
      .insert({
        customer_id: customer.id,
        location_id: staffInfo.location_id,
        client_id: staffInfo.client_id,
        reward_type: data.reward_type,
        description: data.description || `${data.reward_type} redeemed via POS`,
        stamps_used: data.stamps_used,
        status: 'redeemed',
        redeemed_at: new Date().toISOString()
      })

    if (rewardError) {
      console.error('Reward record error:', rewardError)
      return errorResponse('Failed to create reward record')
    }

    const updatedCustomer = { ...customer, total_stamps: stampsAfter }
    const result: POSOperationResult = {
      customer: updatedCustomer,
      operation_type: 'redeem_reward',
      stamps_before: stampsBefore,
      stamps_after: stampsAfter,
      rewards_available: Math.floor(stampsAfter / 10),
      loyalty_status: calculateLoyaltyStatus(stampsAfter)
    }

    return successResponse(result, `${data.reward_type} redeemed successfully`)

  } catch (error) {
    console.error('Redeem reward handler error:', error)
    return errorResponse('Failed to redeem reward')
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateLoyaltyStatus(stamps: number): 'active' | 'reward_available' | 'max_rewards' {
  if (stamps >= 100) return 'max_rewards' // Max level
  if (stamps >= 10) return 'reward_available' // Has rewards to redeem
  return 'active' // Active but no rewards yet
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
} 
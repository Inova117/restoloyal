// ============================================================================
// EDGE FUNCTION: CUSTOMER MANAGER ENHANCED
// ============================================================================
// Task T2.1: Customer Manager Enhancements - Advanced customer management
// Features: Advanced search, bulk operations, analytics, export
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

interface CustomerSearchFilters {
  search?: string // Name, email, phone search
  status?: 'active' | 'inactive' | 'suspended'
  location_id?: string
  date_range?: {
    start: string
    end: string
  }
  stamp_range?: {
    min: number
    max: number
  }
  loyalty_status?: 'active' | 'reward_available' | 'max_rewards'
  sort_by?: 'name' | 'created_at' | 'total_stamps' | 'last_visit'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

interface BulkOperation {
  operation: 'update_status' | 'add_stamps' | 'export' | 'delete'
  customer_ids: string[]
  data?: {
    status?: string
    stamp_count?: number
    notes?: string
  }
}

interface CustomerAnalytics {
  customer_id: string
  visit_frequency: number
  average_stamps_per_visit: number
  total_spent_estimate: number
  last_visit_days_ago: number
  loyalty_level: 'bronze' | 'silver' | 'gold' | 'platinum'
  predicted_churn_risk: 'low' | 'medium' | 'high'
  lifetime_value_score: number
}

interface EnhancedCustomer {
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
  last_visit?: string
  visit_count: number
  analytics?: CustomerAnalytics
}

interface CustomerExport {
  format: 'csv' | 'json' | 'xlsx'
  filters?: CustomerSearchFilters
  include_analytics?: boolean
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
      return errorResponse('Access denied: Customer management requires admin or manager role', 403)
    }

    console.log(`Customer Manager Enhanced: ${method} ${operation} by ${userRole.tier} user ${user.id}`)

    // Route to operation handlers
    switch (operation) {
      case 'search-customers':
        if (method !== 'GET' && method !== 'POST') {
          return errorResponse(`Method ${method} not allowed for customer search`, 405)
        }
        return await handleCustomerSearch(supabaseClient, req, userRole)
      
      case 'bulk-operations':
        if (method !== 'POST') {
          return errorResponse(`Method ${method} not allowed for bulk operations`, 405)
        }
        return await handleBulkOperations(supabaseClient, req, userRole)
      
      case 'customer-analytics':
        if (method !== 'GET') {
          return errorResponse(`Method ${method} not allowed for analytics`, 405)
        }
        return await handleCustomerAnalytics(supabaseClient, req, userRole)
      
      case 'export-customers':
        if (method !== 'POST') {
          return errorResponse(`Method ${method} not allowed for export`, 405)
        }
        return await handleCustomerExport(supabaseClient, req, userRole)
      
      default:
        return errorResponse(`Unknown operation: ${operation}`, 400)
    }

  } catch (error) {
    console.error('Customer Manager Enhanced Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

// ============================================================================
// OPERATION HANDLERS
// ============================================================================

// Advanced Customer Search with Filters
async function handleCustomerSearch(supabaseClient: any, req: Request, userRole: any) {
  try {
    let filters: CustomerSearchFilters = {}
    
    if (req.method === 'GET') {
      const url = new URL(req.url)
      filters = {
        search: url.searchParams.get('search') || undefined,
        status: url.searchParams.get('status') as any || undefined,
        location_id: url.searchParams.get('location_id') || undefined,
        loyalty_status: url.searchParams.get('loyalty_status') as any || undefined,
        sort_by: url.searchParams.get('sort_by') as any || 'created_at',
        sort_order: url.searchParams.get('sort_order') as any || 'desc',
        limit: parseInt(url.searchParams.get('limit') || '50'),
        offset: parseInt(url.searchParams.get('offset') || '0'),
      }
    } else {
      filters = await req.json()
    }

    // Build base query
    let query = supabaseClient
      .from('customers')
      .select(`
        *,
        stamps(stamp_count, created_at),
        rewards(reward_type, stamps_used, redeemed_at)
      `)

    // Apply client isolation
    query = query.eq('client_id', userRole.client_id)

    // Apply location filter if location_manager or specified
    if (userRole.tier === 'location_manager' || filters.location_id) {
      const locationId = userRole.tier === 'location_manager' ? userRole.location_id : filters.location_id
      query = query.eq('location_id', locationId)
    }

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    }

    if (filters.date_range) {
      query = query.gte('created_at', filters.date_range.start)
        .lte('created_at', filters.date_range.end)
    }

    if (filters.stamp_range) {
      query = query.gte('total_stamps', filters.stamp_range.min)
        .lte('total_stamps', filters.stamp_range.max)
    }

    // Apply sorting
    query = query.order(filters.sort_by || 'created_at', { 
      ascending: filters.sort_order === 'asc' 
    })

    // Apply pagination
    query = query.range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1)

    const { data: customers, error } = await query

    if (error) {
      console.error('Customer search error:', error)
      return errorResponse('Failed to search customers')
    }

    // Enhance customers with analytics if requested
    const enhancedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const visitCount = customer.stamps?.length || 0
        const lastStamp = customer.stamps?.[0]?.created_at
        const totalRewards = customer.rewards?.length || 0

        const analytics = calculateCustomerAnalytics(customer, visitCount, lastStamp)

        return {
          ...customer,
          visit_count: visitCount,
          last_visit: lastStamp,
          total_rewards: totalRewards,
          analytics
        }
      })
    )

    // Apply loyalty status filter after enhancement
    let filteredCustomers = enhancedCustomers
    if (filters.loyalty_status) {
      filteredCustomers = enhancedCustomers.filter(customer => 
        customer.analytics?.loyalty_level === filters.loyalty_status
      )
    }

    return successResponse({
      customers: filteredCustomers,
      total_count: filteredCustomers.length,
      filters_applied: filters
    }, `Found ${filteredCustomers.length} customer(s)`)

  } catch (error) {
    console.error('Customer search handler error:', error)
    return errorResponse('Failed to search customers')
  }
}

// Bulk Operations Handler
async function handleBulkOperations(supabaseClient: any, req: Request, userRole: any) {
  try {
    const bulkOp: BulkOperation = await req.json()

    if (!bulkOp.operation || !bulkOp.customer_ids || bulkOp.customer_ids.length === 0) {
      return errorResponse('Operation and customer_ids are required')
    }

    if (bulkOp.customer_ids.length > 100) {
      return errorResponse('Maximum 100 customers per bulk operation')
    }

    // Verify all customers belong to user's scope
    let customerQuery = supabaseClient
      .from('customers')
      .select('id, client_id, location_id, name, total_stamps')
      .eq('client_id', userRole.client_id)
      .in('id', bulkOp.customer_ids)

    if (userRole.tier === 'location_manager') {
      customerQuery = customerQuery.eq('location_id', userRole.location_id)
    }

    const { data: customers, error: customerError } = await customerQuery

    if (customerError || !customers || customers.length !== bulkOp.customer_ids.length) {
      return errorResponse('Some customers not found or not accessible')
    }

    let results: any[] = []

    switch (bulkOp.operation) {
      case 'update_status':
        if (!bulkOp.data?.status) {
          return errorResponse('Status is required for update_status operation')
        }

        const { data: updatedCustomers, error: updateError } = await supabaseClient
          .from('customers')
          .update({ 
            status: bulkOp.data.status,
            updated_at: new Date().toISOString()
          })
          .in('id', bulkOp.customer_ids)
          .select()

        if (updateError) {
          return errorResponse('Failed to update customer status')
        }

        results = updatedCustomers
        break

      case 'add_stamps':
        if (!bulkOp.data?.stamp_count || bulkOp.data.stamp_count <= 0) {
          return errorResponse('Valid stamp_count is required for add_stamps operation')
        }

        // Add stamps to all customers
        const stampResults: any[] = []
        for (const customer of customers) {
          // Update customer total_stamps
          await supabaseClient
            .from('customers')
            .update({ 
              total_stamps: customer.total_stamps + bulkOp.data.stamp_count,
              updated_at: new Date().toISOString()
            })
            .eq('id', customer.id)

          // Create stamp record
          await supabaseClient
            .from('stamps')
            .insert({
              customer_id: customer.id,
              location_id: customer.location_id,
              client_id: customer.client_id,
              stamp_count: bulkOp.data.stamp_count,
              notes: bulkOp.data.notes || `Bulk operation: Added ${bulkOp.data.stamp_count} stamps`
            })

          stampResults.push({
            customer_id: customer.id,
            stamps_added: bulkOp.data.stamp_count
          })
        }
        results = stampResults
        break

      case 'delete':
        // Soft delete customers (set status to deleted)
        const { data: deletedCustomers, error: deleteError } = await supabaseClient
          .from('customers')
          .update({ 
            status: 'deleted',
            updated_at: new Date().toISOString()
          })
          .in('id', bulkOp.customer_ids)
          .select()

        if (deleteError) {
          return errorResponse('Failed to delete customers')
        }

        results = deletedCustomers
        break

      default:
        return errorResponse(`Unknown bulk operation: ${bulkOp.operation}`)
    }

    return successResponse({
      operation: bulkOp.operation,
      customers_affected: results.length,
      results: results
    }, `Bulk ${bulkOp.operation} completed successfully`)

  } catch (error) {
    console.error('Bulk operations handler error:', error)
    return errorResponse('Failed to perform bulk operation')
  }
}

// Customer Analytics Handler
async function handleCustomerAnalytics(supabaseClient: any, req: Request, userRole: any) {
  try {
    const url = new URL(req.url)
    const customerId = url.searchParams.get('customer_id')

    if (!customerId) {
      return errorResponse('customer_id parameter is required')
    }

    // Get customer with detailed data
    let customerQuery = supabaseClient
      .from('customers')
      .select(`
        *,
        stamps(stamp_count, created_at, amount),
        rewards(reward_type, stamps_used, redeemed_at)
      `)
      .eq('client_id', userRole.client_id)
      .eq('id', customerId)

    if (userRole.tier === 'location_manager') {
      customerQuery = customerQuery.eq('location_id', userRole.location_id)
    }

    const { data: customers, error } = await customerQuery.single()

    if (error || !customers) {
      return errorResponse('Customer not found or not accessible')
    }

    const customer = customers
    const stamps = customer.stamps || []
    const rewards = customer.rewards || []

    // Calculate detailed analytics
    const analytics = calculateDetailedAnalytics(customer, stamps, rewards)

    return successResponse({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        total_stamps: customer.total_stamps,
        status: customer.status,
        created_at: customer.created_at
      },
      analytics: analytics,
      summary: {
        total_visits: stamps.length,
        total_rewards_redeemed: rewards.length,
        account_age_days: Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        last_activity: stamps[0]?.created_at || customer.created_at
      }
    })

  } catch (error) {
    console.error('Customer analytics handler error:', error)
    return errorResponse('Failed to get customer analytics')
  }
}

// Customer Export Handler
async function handleCustomerExport(supabaseClient: any, req: Request, userRole: any) {
  try {
    const exportRequest: CustomerExport = await req.json()

    if (!exportRequest.format || !['csv', 'json'].includes(exportRequest.format)) {
      return errorResponse('Valid format (csv, json) is required')
    }

    // Use search functionality to get filtered customers
    const mockSearchRequest = {
      method: 'POST',
      json: () => Promise.resolve(exportRequest.filters || {})
    } as any

    const searchResult = await handleCustomerSearch(supabaseClient, mockSearchRequest, userRole)
    const searchData = await searchResult.json()

    if (!searchData.success) {
      return errorResponse('Failed to retrieve customer data for export')
    }

    const customers = searchData.data.customers

    let exportData
    if (exportRequest.format === 'csv') {
      // Convert to CSV format
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Total Stamps', 'Status', 'Created At', 'Last Visit']
      const csvRows = [headers.join(',')]

      customers.forEach((customer: any) => {
        const row = [
          customer.id,
          `"${customer.name}"`,
          customer.email || '',
          customer.phone || '',
          customer.total_stamps,
          customer.status,
          customer.created_at,
          customer.last_visit || ''
        ]
        csvRows.push(row.join(','))
      })

      exportData = csvRows.join('\n')
    } else {
      // JSON format
      exportData = JSON.stringify({
        export_date: new Date().toISOString(),
        total_customers: customers.length,
        filters_applied: exportRequest.filters,
        customers: customers
      }, null, 2)
    }

    return new Response(exportData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': exportRequest.format === 'csv' ? 'text/csv' : 'application/json',
        'Content-Disposition': `attachment; filename="customers_export_${Date.now()}.${exportRequest.format}"`
      }
    })

  } catch (error) {
    console.error('Customer export handler error:', error)
    return errorResponse('Failed to export customer data')
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateCustomerAnalytics(customer: any, visitCount: number, lastVisit?: string): CustomerAnalytics {
  const accountAgeMs = Date.now() - new Date(customer.created_at).getTime()
  const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24))
  
  const visitFrequency = accountAgeDays > 0 ? visitCount / accountAgeDays : 0
  const avgStampsPerVisit = visitCount > 0 ? customer.total_stamps / visitCount : 0
  
  const lastVisitDaysAgo = lastVisit 
    ? Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24))
    : accountAgeDays

  // Determine loyalty level
  let loyaltyLevel: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze'
  if (customer.total_stamps >= 100) loyaltyLevel = 'platinum'
  else if (customer.total_stamps >= 50) loyaltyLevel = 'gold'
  else if (customer.total_stamps >= 20) loyaltyLevel = 'silver'

  // Predict churn risk
  let churnRisk: 'low' | 'medium' | 'high' = 'low'
  if (lastVisitDaysAgo > 60) churnRisk = 'high'
  else if (lastVisitDaysAgo > 30) churnRisk = 'medium'

  const lifetimeValueScore = (customer.total_stamps * 2) + (visitCount * 5) + (loyaltyLevel === 'platinum' ? 50 : 0)

  return {
    customer_id: customer.id,
    visit_frequency: parseFloat(visitFrequency.toFixed(3)),
    average_stamps_per_visit: parseFloat(avgStampsPerVisit.toFixed(1)),
    total_spent_estimate: customer.total_stamps * 5, // Assuming $5 per stamp
    last_visit_days_ago: lastVisitDaysAgo,
    loyalty_level: loyaltyLevel,
    predicted_churn_risk: churnRisk,
    lifetime_value_score: lifetimeValueScore
  }
}

function calculateDetailedAnalytics(customer: any, stamps: any[], rewards: any[]) {
  const basic = calculateCustomerAnalytics(customer, stamps.length, stamps[0]?.created_at)
  
  // Additional detailed metrics
  const stampHistory = stamps.map(stamp => ({
    date: stamp.created_at,
    count: stamp.stamp_count,
    amount: stamp.amount || 0
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const rewardHistory = rewards.map(reward => ({
    date: reward.redeemed_at,
    type: reward.reward_type,
    stamps_used: reward.stamps_used
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const monthlyActivity = calculateMonthlyActivity(stamps)
  const engagementScore = calculateEngagementScore(basic, stamps.length, rewards.length)

  return {
    ...basic,
    stamp_history: stampHistory.slice(0, 10), // Last 10 stamp events
    reward_history: rewardHistory.slice(0, 5), // Last 5 rewards
    monthly_activity: monthlyActivity,
    engagement_score: engagementScore,
    trends: {
      stamps_trend: calculateTrend(stampHistory.slice(0, 5)),
      visit_trend: calculateVisitTrend(stampHistory)
    }
  }
}

function calculateMonthlyActivity(stamps: any[]) {
  const monthlyData: { [key: string]: number } = {}
  
  stamps.forEach(stamp => {
    const monthKey = new Date(stamp.created_at).toISOString().slice(0, 7) // YYYY-MM
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + stamp.stamp_count
  })

  return Object.entries(monthlyData)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12) // Last 12 months
    .map(([month, stamps]) => ({ month, stamps }))
}

function calculateEngagementScore(analytics: CustomerAnalytics, visitCount: number, rewardCount: number): number {
  let score = 0
  
  // Visit frequency component (0-40 points)
  score += Math.min(analytics.visit_frequency * 100, 40)
  
  // Loyalty level component (0-30 points)
  const loyaltyPoints = { bronze: 5, silver: 15, gold: 25, platinum: 30 }
  score += loyaltyPoints[analytics.loyalty_level]
  
  // Recency component (0-20 points)
  const recencyPoints = Math.max(0, 20 - (analytics.last_visit_days_ago / 3))
  score += recencyPoints
  
  // Reward engagement (0-10 points)
  score += Math.min(rewardCount * 2, 10)

  return Math.round(Math.min(score, 100))
}

function calculateTrend(recentStamps: any[]): 'increasing' | 'decreasing' | 'stable' {
  if (recentStamps.length < 3) return 'stable'
  
  const firstHalf = recentStamps.slice(0, Math.floor(recentStamps.length / 2))
  const secondHalf = recentStamps.slice(Math.floor(recentStamps.length / 2))
  
  const firstAvg = firstHalf.reduce((sum, s) => sum + s.count, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, s) => sum + s.count, 0) / secondHalf.length
  
  const difference = firstAvg - secondAvg
  if (Math.abs(difference) < 0.5) return 'stable'
  return difference > 0 ? 'increasing' : 'decreasing'
}

function calculateVisitTrend(stampHistory: any[]): 'increasing' | 'decreasing' | 'stable' {
  if (stampHistory.length < 4) return 'stable'
  
  const recent = stampHistory.slice(0, 2)
  const older = stampHistory.slice(2, 4)
  
  const recentDaysBetween = recent.length > 1 
    ? (new Date(recent[0].date).getTime() - new Date(recent[1].date).getTime()) / (1000 * 60 * 60 * 24)
    : 30
    
  const olderDaysBetween = older.length > 1 
    ? (new Date(older[0].date).getTime() - new Date(older[1].date).getTime()) / (1000 * 60 * 60 * 24)
    : 30

  if (Math.abs(recentDaysBetween - olderDaysBetween) < 5) return 'stable'
  return recentDaysBetween < olderDaysBetween ? 'increasing' : 'decreasing'
} 
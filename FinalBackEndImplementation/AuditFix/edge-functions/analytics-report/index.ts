// Analytics Report Edge Function - Compatible with Supabase Edge Functions
// Handles advanced analytics dashboard with aggregate metrics, location breakdown, and trend analysis
// Task T1.4: Advanced Analytics Dashboard Enhancements

/// <reference path="./deno.d.ts" />

// @ts-ignore: Deno deploy compatibility
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore: Deno deploy compatibility  
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

// Analytics interfaces
interface AggregateMetrics {
  total_customers: number
  active_customers_30d: number
  total_rewards: number
  total_stamps_issued: number
  growth_rate_30d: number
  revenue_estimate: number
  avg_stamps_per_customer: number
  reward_redemption_rate: number
}

interface LocationBreakdown {
  location_id: string
  location_name: string
  address: string
  city: string
  state: string
  customers: number
  active_customers_30d: number
  stamps_issued: number
  rewards_redeemed: number
  activity_rate: number
  revenue_estimate: number
  growth_rate: number
}

interface MonthlyGrowthData {
  month: string
  new_customers: number
  stamps_issued: number
  rewards_redeemed: number
  revenue_estimate: number
  growth_rate: number
}

interface RedemptionTrendData {
  month: string
  redemption_rate: number
  total_rewards: number
  total_stamps: number
}

interface RetentionCohortData {
  cohort_month: string
  customers_acquired: number
  month_1_retention: number
  month_3_retention: number
  month_6_retention: number
  month_12_retention: number
}

interface TrendData {
  monthly_growth: MonthlyGrowthData[]
  reward_redemption_trends: RedemptionTrendData[]
  retention_cohorts: RetentionCohortData[]
}

interface AnalyticsFilters {
  time_range: '30d' | '90d' | '6m' | '1y' | 'custom'
  start_date?: string
  end_date?: string
  location_ids?: string[]
  client_id?: string
}

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
    
    // Verify user authorization - superadmin, client_admin or location_staff can access analytics
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('tier, role_id, client_id, location_id')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      console.error('Role verification error:', roleError)
      return errorResponse('Access denied: No valid role found', 403)
    }

    // Only superadmin, client_admin, and location_staff can access analytics
    if (!['superadmin', 'client_admin', 'location_staff'].includes(userRole.tier)) {
      return errorResponse('Access denied: Insufficient permissions for analytics', 403)
    }

    console.log(`Analytics Report: ${method} request from user ${user.id} with role ${userRole.tier}`)

    // Parse query parameters
    const endpoint = url.searchParams.get('endpoint') || 'aggregate'
    const timeRange = url.searchParams.get('time_range') as AnalyticsFilters['time_range'] || '30d'
    const startDate = url.searchParams.get('start_date')
    const endDate = url.searchParams.get('end_date')
    const locationIds = url.searchParams.get('location_ids')?.split(',').filter(Boolean)
    const clientId = url.searchParams.get('client_id')

    // Build filters object
    const filters: AnalyticsFilters = {
      time_range: timeRange,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      location_ids: locationIds,
      client_id: clientId
    }

    // Apply role-based filtering
    if (userRole.tier === 'client_admin' && userRole.client_id) {
      filters.client_id = userRole.client_id
    } else if (userRole.tier === 'location_staff' && userRole.location_id) {
      filters.location_ids = [userRole.location_id]
    }

    // Route to appropriate handler based on endpoint
    switch (method) {
      case 'GET':
        switch (endpoint) {
          case 'aggregate':
            return await handleAggregateMetrics(supabaseClient, filters, userRole)
          case 'locations':
            return await handleLocationBreakdown(supabaseClient, filters, userRole)
          case 'trends':
            return await handleTrendAnalysis(supabaseClient, filters, userRole)
          default:
            return errorResponse(`Unknown endpoint: ${endpoint}`, 400)
        }
      
      default:
        return errorResponse(`Method ${method} not allowed`, 405)
    }

  } catch (error) {
    console.error('Analytics Report Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

// GET /analytics-report?endpoint=aggregate - Get aggregate metrics
async function handleAggregateMetrics(supabaseClient: any, filters: AnalyticsFilters, userRole: any) {
  try {
    console.log('Fetching aggregate metrics with filters:', filters)

    // Calculate date range
    const dateRange = calculateDateRange(filters)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Base query conditions
    let customerQuery = supabaseClient.from('customers').select('*', { count: 'exact' })
    let stampsQuery = supabaseClient.from('stamps').select('*', { count: 'exact' })
    let rewardsQuery = supabaseClient.from('rewards').select('*', { count: 'exact' })

    // Apply role-based filtering
    if (filters.client_id) {
      // Get locations for this client first
      const { data: clientLocations } = await supabaseClient
        .from('locations')
        .select('id')
        .eq('client_id', filters.client_id)

      const locationIds = clientLocations?.map(loc => loc.id) || []
      
      if (locationIds.length > 0) {
        customerQuery = customerQuery.in('location_id', locationIds)
        stampsQuery = stampsQuery.in('location_id', locationIds)
        rewardsQuery = rewardsQuery.in('location_id', locationIds)
      } else {
        // Client has no locations yet
        return jsonResponse({
          data: getEmptyAggregateMetrics()
        })
      }
    }

    if (filters.location_ids && filters.location_ids.length > 0) {
      customerQuery = customerQuery.in('location_id', filters.location_ids)
      stampsQuery = stampsQuery.in('location_id', filters.location_ids)
      rewardsQuery = rewardsQuery.in('location_id', filters.location_ids)
    }

    // Execute queries in parallel
    const [customersResult, stampsResult, rewardsResult] = await Promise.all([
      customerQuery,
      stampsQuery,
      rewardsQuery
    ])

    if (customersResult.error || stampsResult.error || rewardsResult.error) {
      console.error('Database query errors:', {
        customers: customersResult.error,
        stamps: stampsResult.error,
        rewards: rewardsResult.error
      })
      throw new Error('Failed to fetch analytics data')
    }

    const totalCustomers = customersResult.count || 0
    const totalStamps = stampsResult.count || 0
    const totalRewards = rewardsResult.count || 0

    // Calculate active customers (with activity in last 30 days)
    let activeCustomersQuery = supabaseClient
      .from('stamps')
      .select('customer_id', { count: 'exact' })
      .gte('created_at', thirtyDaysAgo)
      .not('customer_id', 'is', null)

    // Apply same filtering for active customers
    if (filters.client_id) {
      const { data: clientLocations } = await supabaseClient
        .from('locations')
        .select('id')
        .eq('client_id', filters.client_id)
      const locationIds = clientLocations?.map(loc => loc.id) || []
      if (locationIds.length > 0) {
        activeCustomersQuery = activeCustomersQuery.in('location_id', locationIds)
      }
    }

    if (filters.location_ids && filters.location_ids.length > 0) {
      activeCustomersQuery = activeCustomersQuery.in('location_id', filters.location_ids)
    }

    const { data: activeStamps } = await activeCustomersQuery
    const activeCustomerIds = new Set(activeStamps?.map(s => s.customer_id) || [])
    const activeCustomers30d = activeCustomerIds.size

    // Calculate growth rate (compare with previous period)
    const previousPeriodStart = new Date(new Date(dateRange.start).getTime() - (new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime())).toISOString()
    
    let previousCustomersQuery = supabaseClient
      .from('customers')
      .select('*', { count: 'exact' })
      .gte('created_at', previousPeriodStart)
      .lt('created_at', dateRange.start)

    // Apply same filtering for previous period
    if (filters.client_id) {
      const { data: clientLocations } = await supabaseClient
        .from('locations')
        .select('id')
        .eq('client_id', filters.client_id)
      const locationIds = clientLocations?.map(loc => loc.id) || []
      if (locationIds.length > 0) {
        previousCustomersQuery = previousCustomersQuery.in('location_id', locationIds)
      }
    }

    if (filters.location_ids && filters.location_ids.length > 0) {
      previousCustomersQuery = previousCustomersQuery.in('location_id', filters.location_ids)
    }

    const { count: previousCustomers } = await previousCustomersQuery
    const currentNewCustomers = totalCustomers
    const growthRate30d = previousCustomers && previousCustomers > 0 
      ? ((currentNewCustomers - previousCustomers) / previousCustomers) * 100 
      : 0

    // Calculate revenue estimate (stamps * average value)
    const avgStampValue = 1.50 // Average stamp value estimate
    const revenueEstimate = totalStamps * avgStampValue

    // Calculate other metrics
    const avgStampsPerCustomer = totalCustomers > 0 ? totalStamps / totalCustomers : 0
    const rewardRedemptionRate = totalStamps > 0 ? (totalRewards / totalStamps) * 100 : 0

    const metrics: AggregateMetrics = {
      total_customers: totalCustomers,
      active_customers_30d: activeCustomers30d,
      total_rewards: totalRewards,
      total_stamps_issued: totalStamps,
      growth_rate_30d: Math.round(growthRate30d * 100) / 100,
      revenue_estimate: Math.round(revenueEstimate * 100) / 100,
      avg_stamps_per_customer: Math.round(avgStampsPerCustomer * 100) / 100,
      reward_redemption_rate: Math.round(rewardRedemptionRate * 100) / 100
    }

    return jsonResponse({
      data: metrics,
      filters: filters,
      date_range: dateRange
    })

  } catch (error) {
    console.error('Error in handleAggregateMetrics:', error)
    return errorResponse('Failed to fetch aggregate metrics', 500)
  }
}

// GET /analytics-report?endpoint=locations - Get location breakdown
async function handleLocationBreakdown(supabaseClient: any, filters: AnalyticsFilters, userRole: any) {
  try {
    console.log('Fetching location breakdown with filters:', filters)

    // Get locations based on role
    let locationsQuery = supabaseClient
      .from('locations')
      .select('id, name, address, city, state, client_id')

    if (filters.client_id) {
      locationsQuery = locationsQuery.eq('client_id', filters.client_id)
    }

    if (filters.location_ids && filters.location_ids.length > 0) {
      locationsQuery = locationsQuery.in('id', filters.location_ids)
    }

    const { data: locations, error: locationsError } = await locationsQuery

    if (locationsError) {
      console.error('Error fetching locations:', locationsError)
      throw new Error('Failed to fetch locations')
    }

    if (!locations || locations.length === 0) {
      return jsonResponse({
        data: [],
        message: 'No locations found for the specified criteria'
      })
    }

    // Calculate metrics for each location
    const locationBreakdown: LocationBreakdown[] = await Promise.all(
      locations.map(async (location) => {
        // Get customers for this location
        const { count: customersCount } = await supabaseClient
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', location.id)

        // Get stamps for this location
        const { count: stampsCount } = await supabaseClient
          .from('stamps')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', location.id)

        // Get rewards for this location
        const { count: rewardsCount } = await supabaseClient
          .from('rewards')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', location.id)

        // Get active customers (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const { data: activeStamps } = await supabaseClient
          .from('stamps')
          .select('customer_id')
          .eq('location_id', location.id)
          .gte('created_at', thirtyDaysAgo)

        const activeCustomerIds = new Set(activeStamps?.map(s => s.customer_id) || [])
        const activeCustomers30d = activeCustomerIds.size

        // Calculate metrics
        const customers = customersCount || 0
        const stampsIssued = stampsCount || 0
        const rewardsRedeemed = rewardsCount || 0
        const activityRate = customers > 0 ? (activeCustomers30d / customers) * 100 : 0
        const revenueEstimate = stampsIssued * 1.50 // Average stamp value

        // Calculate growth rate (simplified)
        const growthRate = Math.random() * 20 - 5 // Mock data for now

        return {
          location_id: location.id,
          location_name: location.name || 'Unknown Location',
          address: location.address || '',
          city: location.city || '',
          state: location.state || '',
          customers,
          active_customers_30d: activeCustomers30d,
          stamps_issued: stampsIssued,
          rewards_redeemed: rewardsRedeemed,
          activity_rate: Math.round(activityRate * 100) / 100,
          revenue_estimate: Math.round(revenueEstimate * 100) / 100,
          growth_rate: Math.round(growthRate * 100) / 100
        }
      })
    )

    // Sort by customers descending
    locationBreakdown.sort((a, b) => b.customers - a.customers)

    return jsonResponse({
      data: locationBreakdown,
      filters: filters
    })

  } catch (error) {
    console.error('Error in handleLocationBreakdown:', error)
    return errorResponse('Failed to fetch location breakdown', 500)
  }
}

// GET /analytics-report?endpoint=trends - Get trend analysis
async function handleTrendAnalysis(supabaseClient: any, filters: AnalyticsFilters, userRole: any) {
  try {
    console.log('Fetching trend analysis with filters:', filters)

    const dateRange = calculateDateRange(filters)
    const months = generateMonthRange(dateRange.start, dateRange.end)

    // Generate monthly growth data
    const monthlyGrowth: MonthlyGrowthData[] = await Promise.all(
      months.map(async (month) => {
        const monthStart = month + '-01'
        const monthEnd = getMonthEnd(month)

        // Base queries
        let customersQuery = supabaseClient
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd)

        let stampsQuery = supabaseClient
          .from('stamps')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd)

        let rewardsQuery = supabaseClient
          .from('rewards')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd)

        // Apply role-based filtering
        if (filters.client_id) {
          const { data: clientLocations } = await supabaseClient
            .from('locations')
            .select('id')
            .eq('client_id', filters.client_id)
          const locationIds = clientLocations?.map(loc => loc.id) || []
          
          if (locationIds.length > 0) {
            customersQuery = customersQuery.in('location_id', locationIds)
            stampsQuery = stampsQuery.in('location_id', locationIds)
            rewardsQuery = rewardsQuery.in('location_id', locationIds)
          }
        }

        if (filters.location_ids && filters.location_ids.length > 0) {
          customersQuery = customersQuery.in('location_id', filters.location_ids)
          stampsQuery = stampsQuery.in('location_id', filters.location_ids)
          rewardsQuery = rewardsQuery.in('location_id', filters.location_ids)
        }

        const [customersResult, stampsResult, rewardsResult] = await Promise.all([
          customersQuery,
          stampsQuery,
          rewardsQuery
        ])

        const newCustomers = customersResult.count || 0
        const stampsIssued = stampsResult.count || 0
        const rewardsRedeemed = rewardsResult.count || 0
        const revenueEstimate = stampsIssued * 1.50

        // Calculate growth rate (compared to previous month)
        const growthRate = Math.random() * 30 - 10 // Mock calculation for now

        return {
          month: formatMonthLabel(month),
          new_customers: newCustomers,
          stamps_issued: stampsIssued,
          rewards_redeemed: rewardsRedeemed,
          revenue_estimate: Math.round(revenueEstimate * 100) / 100,
          growth_rate: Math.round(growthRate * 100) / 100
        }
      })
    )

    // Generate redemption trends
    const rewardRedemptionTrends: RedemptionTrendData[] = monthlyGrowth.map(month => ({
      month: month.month,
      redemption_rate: month.stamps_issued > 0 ? (month.rewards_redeemed / month.stamps_issued) * 100 : 0,
      total_rewards: month.rewards_redeemed,
      total_stamps: month.stamps_issued
    }))

    // Generate retention cohorts (simplified mock data)
    const retentionCohorts: RetentionCohortData[] = months.slice(0, 6).map((month, index) => ({
      cohort_month: formatMonthLabel(month),
      customers_acquired: monthlyGrowth[index]?.new_customers || 0,
      month_1_retention: 85 + Math.random() * 10,
      month_3_retention: 65 + Math.random() * 15,
      month_6_retention: 45 + Math.random() * 20,
      month_12_retention: 30 + Math.random() * 15
    }))

    const trendData: TrendData = {
      monthly_growth: monthlyGrowth,
      reward_redemption_trends: rewardRedemptionTrends,
      retention_cohorts: retentionCohorts
    }

    return jsonResponse({
      data: trendData,
      filters: filters,
      date_range: dateRange
    })

  } catch (error) {
    console.error('Error in handleTrendAnalysis:', error)
    return errorResponse('Failed to fetch trend analysis', 500)
  }
}

// Helper functions
function calculateDateRange(filters: AnalyticsFilters) {
  const now = new Date()
  let start: Date
  let end: Date = now

  if (filters.time_range === 'custom' && filters.start_date && filters.end_date) {
    start = new Date(filters.start_date)
    end = new Date(filters.end_date)
  } else {
    switch (filters.time_range) {
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '6m':
        start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  }
}

function generateMonthRange(startDate: string, endDate: string): string[] {
  const months: string[] = []
  const start = new Date(startDate + '-01')
  const end = new Date(endDate + '-01')

  let current = new Date(start)
  while (current <= end) {
    const year = current.getFullYear()
    const month = String(current.getMonth() + 1).padStart(2, '0')
    months.push(`${year}-${month}`)
    current.setMonth(current.getMonth() + 1)
  }

  return months.slice(-12) // Last 12 months max
}

function getMonthEnd(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  const date = new Date(parseInt(year), parseInt(month), 0) // Last day of month
  return date.toISOString().split('T')[0]
}

function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function getEmptyAggregateMetrics(): AggregateMetrics {
  return {
    total_customers: 0,
    active_customers_30d: 0,
    total_rewards: 0,
    total_stamps_issued: 0,
    growth_rate_30d: 0,
    revenue_estimate: 0,
    avg_stamps_per_customer: 0,
    reward_redemption_rate: 0
  }
} 
// @ts-ignore - Deno imports work in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno imports work in Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

interface TrendData {
  monthly_growth: Array<{
    month: string
    new_customers: number
    stamps_issued: number
    rewards_redeemed: number
    revenue_estimate: number
    growth_rate: number
  }>
  reward_redemption_trends: Array<{
    month: string
    redemption_rate: number
    total_rewards: number
    total_stamps: number
  }>
  retention_cohorts: Array<{
    cohort_month: string
    customers_acquired: number
    month_1_retention: number
    month_3_retention: number
    month_6_retention: number
    month_12_retention: number
  }>
}

interface AnalyticsFilters {
  time_range: '30d' | '90d' | '6m' | '1y' | 'custom'
  start_date?: string
  end_date?: string
  location_ids?: string[]
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

    // Get client_id from query params
    const url = new URL(req.url)
    const clientId = url.searchParams.get('client_id')
    
    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'client_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify user has client_admin role for this client
    const { data: adminCheck, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('role, client_id')
      .eq('user_id', user.id)
      .eq('client_id', clientId)
      .eq('role', 'client_admin')
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
            error: 'Forbidden: You are not authorized to view analytics for this client' 
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    const endpoint = url.searchParams.get('endpoint') || 'aggregate'

    // Parse filters
    const filters: AnalyticsFilters = {
      time_range: (url.searchParams.get('time_range') as any) || '30d',
      start_date: url.searchParams.get('start_date') || undefined,
      end_date: url.searchParams.get('end_date') || undefined,
      location_ids: url.searchParams.get('location_ids')?.split(',') || undefined
    }

    // Calculate date range
    const dateRange = calculateDateRange(filters)

    // Handle different analytics endpoints
    if (endpoint === 'aggregate') {
      return await handleAggregateMetrics(supabaseClient, clientId, dateRange)
    }
    
    if (endpoint === 'locations') {
      return await handleLocationBreakdown(supabaseClient, clientId, dateRange, filters.location_ids)
    }
    
    if (endpoint === 'trends') {
      return await handleTrendAnalysis(supabaseClient, clientId, dateRange)
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Analytics API Error:', error)
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

function calculateDateRange(filters: AnalyticsFilters): { start_date: string; end_date: string } {
  const now = new Date()
  let startDate: Date
  let endDate = new Date(now)

  if (filters.time_range === 'custom' && filters.start_date && filters.end_date) {
    startDate = new Date(filters.start_date)
    endDate = new Date(filters.end_date)
  } else {
    switch (filters.time_range) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '6m':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  return {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString()
  }
}

async function handleAggregateMetrics(supabaseClient: any, clientId: string, dateRange: { start_date: string; end_date: string }) {
  try {
    // Get all locations for this client
    const { data: locations, error: locationsError } = await supabaseClient
      .from('locations')
      .select('id')
      .eq('client_id', clientId)

    if (locationsError) {
      throw new Error(`Failed to fetch locations: ${locationsError.message}`)
    }

    const locationIds = locations.map((loc: any) => loc.id)

    if (locationIds.length === 0) {
      // No locations found, return empty metrics
      const emptyMetrics: AggregateMetrics = {
        total_customers: 0,
        active_customers_30d: 0,
        total_rewards: 0,
        total_stamps_issued: 0,
        growth_rate_30d: 0,
        revenue_estimate: 0,
        avg_stamps_per_customer: 0,
        reward_redemption_rate: 0
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: emptyMetrics,
          date_range: dateRange
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Total customers (all time)
    const { count: totalCustomers } = await supabaseClient
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .in('location_id', locationIds)

    // Active customers (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: activeCustomers30d } = await supabaseClient
      .from('stamps')
      .select('client_id', { count: 'exact', head: true })
      .in('location_id', locationIds)
      .gte('created_at', thirtyDaysAgo)
      .not('client_id', 'is', null)

    // Total stamps issued in date range
    const { count: totalStamps } = await supabaseClient
      .from('stamps')
      .select('*', { count: 'exact', head: true })
      .in('location_id', locationIds)
      .gte('created_at', dateRange.start_date)
      .lte('created_at', dateRange.end_date)

    // Total rewards redeemed in date range
    const { count: totalRewards } = await supabaseClient
      .from('rewards')
      .select('*', { count: 'exact', head: true })
      .in('location_id', locationIds)
      .gte('redeemed_at', dateRange.start_date)
      .lte('redeemed_at', dateRange.end_date)

    // Calculate growth rate (compare current period to previous period)
    const periodLength = new Date(dateRange.end_date).getTime() - new Date(dateRange.start_date).getTime()
    const previousPeriodStart = new Date(new Date(dateRange.start_date).getTime() - periodLength).toISOString()
    const previousPeriodEnd = dateRange.start_date

    const { count: previousPeriodCustomers } = await supabaseClient
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .in('location_id', locationIds)
      .gte('created_at', previousPeriodStart)
      .lt('created_at', previousPeriodEnd)

    const { count: currentPeriodCustomers } = await supabaseClient
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .in('location_id', locationIds)
      .gte('created_at', dateRange.start_date)
      .lte('created_at', dateRange.end_date)

    const growthRate = previousPeriodCustomers > 0 
      ? ((currentPeriodCustomers - previousPeriodCustomers) / previousPeriodCustomers) * 100 
      : 0

    // Calculate metrics
    const avgStampsPerCustomer = totalCustomers > 0 ? (totalStamps || 0) / totalCustomers : 0
    const rewardRedemptionRate = totalStamps > 0 ? ((totalRewards || 0) / (totalStamps || 1)) * 100 : 0
    const revenueEstimate = (totalStamps || 0) * 1.5 // Estimate $1.50 per stamp

    const metrics: AggregateMetrics = {
      total_customers: totalCustomers || 0,
      active_customers_30d: activeCustomers30d || 0,
      total_rewards: totalRewards || 0,
      total_stamps_issued: totalStamps || 0,
      growth_rate_30d: Math.round(growthRate * 100) / 100,
      revenue_estimate: Math.round(revenueEstimate * 100) / 100,
      avg_stamps_per_customer: Math.round(avgStampsPerCustomer * 100) / 100,
      reward_redemption_rate: Math.round(rewardRedemptionRate * 100) / 100
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: metrics,
        date_range: dateRange
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Aggregate metrics error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch aggregate metrics', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}

async function handleLocationBreakdown(supabaseClient: any, clientId: string, dateRange: { start_date: string; end_date: string }, locationIds?: string[]) {
  try {
    // Get locations for this client
    let locationsQuery = supabaseClient
      .from('locations')
      .select(`
        id,
        name,
        address,
        city,
        state
      `)
      .eq('client_id', clientId)

    if (locationIds && locationIds.length > 0) {
      locationsQuery = locationsQuery.in('id', locationIds)
    }

    const { data: locations, error: locationsError } = await locationsQuery

    if (locationsError) {
      throw new Error(`Failed to fetch locations: ${locationsError.message}`)
    }

    const breakdown: LocationBreakdown[] = []

    for (const location of locations) {
      // Total customers for this location
      const { count: totalCustomers } = await supabaseClient
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', location.id)

      // Active customers (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { count: activeCustomers30d } = await supabaseClient
        .from('stamps')
        .select('client_id', { count: 'exact', head: true })
        .eq('location_id', location.id)
        .gte('created_at', thirtyDaysAgo)
        .not('client_id', 'is', null)

      // Stamps issued in date range
      const { count: stampsIssued } = await supabaseClient
        .from('stamps')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', location.id)
        .gte('created_at', dateRange.start_date)
        .lte('created_at', dateRange.end_date)

      // Rewards redeemed in date range
      const { count: rewardsRedeemed } = await supabaseClient
        .from('rewards')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', location.id)
        .gte('redeemed_at', dateRange.start_date)
        .lte('redeemed_at', dateRange.end_date)

      // Calculate growth rate for this location
      const periodLength = new Date(dateRange.end_date).getTime() - new Date(dateRange.start_date).getTime()
      const previousPeriodStart = new Date(new Date(dateRange.start_date).getTime() - periodLength).toISOString()
      const previousPeriodEnd = dateRange.start_date

      const { count: previousCustomers } = await supabaseClient
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', location.id)
        .gte('created_at', previousPeriodStart)
        .lt('created_at', previousPeriodEnd)

      const { count: currentCustomers } = await supabaseClient
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', location.id)
        .gte('created_at', dateRange.start_date)
        .lte('created_at', dateRange.end_date)

      const growthRate = previousCustomers > 0 
        ? ((currentCustomers - previousCustomers) / previousCustomers) * 100 
        : 0

      // Calculate activity rate (active customers / total customers)
      const activityRate = totalCustomers > 0 ? (activeCustomers30d / totalCustomers) * 100 : 0

      breakdown.push({
        location_id: location.id,
        location_name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        customers: totalCustomers || 0,
        active_customers_30d: activeCustomers30d || 0,
        stamps_issued: stampsIssued || 0,
        rewards_redeemed: rewardsRedeemed || 0,
        activity_rate: Math.round(activityRate * 100) / 100,
        revenue_estimate: Math.round((stampsIssued || 0) * 1.5 * 100) / 100,
        growth_rate: Math.round(growthRate * 100) / 100
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: breakdown,
        date_range: dateRange
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Location breakdown error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch location breakdown', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}

async function handleTrendAnalysis(supabaseClient: any, clientId: string, dateRange: { start_date: string; end_date: string }) {
  try {
    // Get all locations for this client
    const { data: locations, error: locationsError } = await supabaseClient
      .from('locations')
      .select('id')
      .eq('client_id', clientId)

    if (locationsError) {
      throw new Error(`Failed to fetch locations: ${locationsError.message}`)
    }

    const locationIds = locations.map((loc: any) => loc.id)

    if (locationIds.length === 0) {
      const emptyTrends: TrendData = {
        monthly_growth: [],
        reward_redemption_trends: [],
        retention_cohorts: []
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: emptyTrends,
          date_range: dateRange
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Generate monthly growth data
    const monthlyGrowth = await generateMonthlyGrowth(supabaseClient, locationIds, dateRange)
    
    // Generate reward redemption trends
    const redemptionTrends = await generateRedemptionTrends(supabaseClient, locationIds, dateRange)
    
    // Generate retention cohorts
    const retentionCohorts = await generateRetentionCohorts(supabaseClient, locationIds, dateRange)

    const trends: TrendData = {
      monthly_growth: monthlyGrowth,
      reward_redemption_trends: redemptionTrends,
      retention_cohorts: retentionCohorts
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: trends,
        date_range: dateRange
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Trend analysis error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch trend analysis', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}

async function generateMonthlyGrowth(supabaseClient: any, locationIds: string[], dateRange: { start_date: string; end_date: string }) {
  const monthlyData = []
  const startDate = new Date(dateRange.start_date)
  const endDate = new Date(dateRange.end_date)

  // Generate data for each month in the range
  for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString()
    const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })

    // New customers this month
    const { count: newCustomers } = await supabaseClient
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .in('location_id', locationIds)
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)

    // Stamps issued this month
    const { count: stampsIssued } = await supabaseClient
      .from('stamps')
      .select('*', { count: 'exact', head: true })
      .in('location_id', locationIds)
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)

    // Rewards redeemed this month
    const { count: rewardsRedeemed } = await supabaseClient
      .from('rewards')
      .select('*', { count: 'exact', head: true })
      .in('location_id', locationIds)
      .gte('redeemed_at', monthStart)
      .lte('redeemed_at', monthEnd)

    // Calculate growth rate compared to previous month
    const prevMonthStart = new Date(date.getFullYear(), date.getMonth() - 1, 1).toISOString()
    const prevMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59).toISOString()

    const { count: prevMonthCustomers } = await supabaseClient
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .in('location_id', locationIds)
      .gte('created_at', prevMonthStart)
      .lte('created_at', prevMonthEnd)

    const growthRate = prevMonthCustomers > 0 
      ? ((newCustomers - prevMonthCustomers) / prevMonthCustomers) * 100 
      : 0

    monthlyData.push({
      month: monthLabel,
      new_customers: newCustomers || 0,
      stamps_issued: stampsIssued || 0,
      rewards_redeemed: rewardsRedeemed || 0,
      revenue_estimate: Math.round((stampsIssued || 0) * 1.5 * 100) / 100,
      growth_rate: Math.round(growthRate * 100) / 100
    })
  }

  return monthlyData
}

async function generateRedemptionTrends(supabaseClient: any, locationIds: string[], dateRange: { start_date: string; end_date: string }) {
  const redemptionData = []
  const startDate = new Date(dateRange.start_date)
  const endDate = new Date(dateRange.end_date)

  for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString()
    const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })

    const { count: totalStamps } = await supabaseClient
      .from('stamps')
      .select('*', { count: 'exact', head: true })
      .in('location_id', locationIds)
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)

    const { count: totalRewards } = await supabaseClient
      .from('rewards')
      .select('*', { count: 'exact', head: true })
      .in('location_id', locationIds)
      .gte('redeemed_at', monthStart)
      .lte('redeemed_at', monthEnd)

    const redemptionRate = totalStamps > 0 ? (totalRewards / totalStamps) * 100 : 0

    redemptionData.push({
      month: monthLabel,
      redemption_rate: Math.round(redemptionRate * 100) / 100,
      total_rewards: totalRewards || 0,
      total_stamps: totalStamps || 0
    })
  }

  return redemptionData
}

async function generateRetentionCohorts(supabaseClient: any, locationIds: string[], dateRange: { start_date: string; end_date: string }) {
  const cohortData = []
  const startDate = new Date(dateRange.start_date)
  const endDate = new Date(dateRange.end_date)

  // Generate cohorts for each month
  for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
    const cohortStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
    const cohortEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString()
    const cohortLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })

    // Get customers acquired in this cohort month
    const { data: cohortCustomers, error } = await supabaseClient
      .from('clients')
      .select('id, created_at')
      .in('location_id', locationIds)
      .gte('created_at', cohortStart)
      .lte('created_at', cohortEnd)

    if (error || !cohortCustomers || cohortCustomers.length === 0) {
      continue
    }

    const customersAcquired = cohortCustomers.length
    const customerIds = cohortCustomers.map((c: any) => c.id)

    // Calculate retention for different periods
    const retentionPeriods = [1, 3, 6, 12] // months
    const retentionRates: { [key: string]: number } = {}

    for (const months of retentionPeriods) {
      const retentionStart = new Date(date.getFullYear(), date.getMonth() + months, 1).toISOString()
      const retentionEnd = new Date(date.getFullYear(), date.getMonth() + months + 1, 0, 23, 59, 59).toISOString()

      // Check if retention period is in the future
      if (new Date(retentionStart) > new Date()) {
        retentionRates[`month_${months}_retention`] = 0
        continue
      }

      // Count customers who were active in the retention period
      const { count: activeCustomers } = await supabaseClient
        .from('stamps')
        .select('client_id', { count: 'exact', head: true })
        .in('client_id', customerIds)
        .in('location_id', locationIds)
        .gte('created_at', retentionStart)
        .lte('created_at', retentionEnd)

      const retentionRate = customersAcquired > 0 ? (activeCustomers / customersAcquired) * 100 : 0
      retentionRates[`month_${months}_retention`] = Math.round(retentionRate * 100) / 100
    }

    cohortData.push({
      cohort_month: cohortLabel,
      customers_acquired: customersAcquired,
      month_1_retention: retentionRates.month_1_retention || 0,
      month_3_retention: retentionRates.month_3_retention || 0,
      month_6_retention: retentionRates.month_6_retention || 0,
      month_12_retention: retentionRates.month_12_retention || 0
    })
  }

  return cohortData
} 
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsRequest {
  restaurantId: string
  reportType: 'overview' | 'customers' | 'engagement' | 'retention' | 'cohorts'
  dateRange: {
    start: string
    end: string
  }
  period?: 'daily' | 'weekly' | 'monthly'
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
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'POST') {
      const { restaurantId, reportType, dateRange, period = 'daily' } = await req.json() as AnalyticsRequest

      if (!restaurantId || !reportType || !dateRange) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Verify user has access to this restaurant
      const { data: restaurant } = await supabaseClient
        .from('restaurants')
        .select('user_id')
        .eq('id', restaurantId)
        .single()

      if (restaurant?.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      let reportData: any = {}

      switch (reportType) {
        case 'overview':
          reportData = await generateOverviewReport(supabaseClient, restaurantId, dateRange)
          break
        case 'customers':
          reportData = await generateCustomerReport(supabaseClient, restaurantId, dateRange)
          break
        case 'engagement':
          reportData = await generateEngagementReport(supabaseClient, restaurantId, dateRange, period)
          break
        case 'retention':
          reportData = await generateRetentionReport(supabaseClient, restaurantId, dateRange)
          break
        case 'cohorts':
          reportData = await generateCohortReport(supabaseClient, restaurantId, dateRange)
          break
        default:
          return new Response(
            JSON.stringify({ error: 'Invalid report type' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
      }

      return new Response(
        JSON.stringify({
          reportType,
          dateRange,
          period,
          generatedAt: new Date().toISOString(),
          data: reportData
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response('Method not allowed', { status: 405 })

  } catch (error) {
    console.error('Error generating analytics report:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function generateOverviewReport(supabase: any, restaurantId: string, dateRange: any) {
  // Get restaurant performance summary
  const { data: performance } = await supabase
    .from('restaurant_performance')
    .select('*')
    .eq('id', restaurantId)
    .single()

  // Get recent business metrics
  const { data: recentMetrics } = await supabase
    .from('business_metrics')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .gte('metric_date', dateRange.start)
    .lte('metric_date', dateRange.end)
    .eq('period_type', 'daily')
    .order('metric_date', { ascending: false })

  // Calculate trends
  const totalStamps = recentMetrics?.reduce((sum, m) => sum + (m.total_stamps || 0), 0) || 0
  const totalRewards = recentMetrics?.reduce((sum, m) => sum + (m.rewards_redeemed || 0), 0) || 0
  const totalNewCustomers = recentMetrics?.reduce((sum, m) => sum + (m.new_customers || 0), 0) || 0

  // Get top customers
  const { data: topCustomers } = await supabase
    .from('customer_insights')
    .select('name, email, lifetime_stamps, lifetime_rewards, customer_status')
    .eq('restaurant_id', restaurantId)
    .order('lifetime_stamps', { ascending: false })
    .limit(10)

  return {
    summary: {
      totalCustomers: performance?.total_customers || 0,
      activeCustomers: performance?.active_customers || 0,
      newCustomers30d: performance?.new_customers_30d || 0,
      totalStamps: performance?.total_stamps || 0,
      totalRewards: performance?.total_rewards || 0,
      retentionRate: performance?.customer_retention_rate || 0,
      avgStampsPerCustomer: performance?.avg_stamps_per_customer || 0
    },
    trends: {
      stampsInPeriod: totalStamps,
      rewardsInPeriod: totalRewards,
      newCustomersInPeriod: totalNewCustomers,
      dailyMetrics: recentMetrics || []
    },
    topCustomers: topCustomers || []
  }
}

async function generateCustomerReport(supabase: any, restaurantId: string, dateRange: any) {
  // Get detailed customer insights
  const { data: customers } = await supabase
    .from('customer_insights')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('lifetime_stamps', { ascending: false })

  // Customer segmentation
  const activeCustomers = customers?.filter(c => c.customer_status === 'Active') || []
  const atRiskCustomers = customers?.filter(c => c.customer_status === 'At Risk') || []
  const inactiveCustomers = customers?.filter(c => c.customer_status === 'Inactive') || []

  // New customers in date range
  const newCustomers = customers?.filter(c => {
    const joinedDate = new Date(c.joined_date)
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    return joinedDate >= startDate && joinedDate <= endDate
  }) || []

  return {
    totalCustomers: customers?.length || 0,
    segmentation: {
      active: {
        count: activeCustomers.length,
        percentage: customers?.length ? (activeCustomers.length / customers.length * 100).toFixed(1) : 0
      },
      atRisk: {
        count: atRiskCustomers.length,
        percentage: customers?.length ? (atRiskCustomers.length / customers.length * 100).toFixed(1) : 0
      },
      inactive: {
        count: inactiveCustomers.length,
        percentage: customers?.length ? (inactiveCustomers.length / customers.length * 100).toFixed(1) : 0
      }
    },
    newCustomersInPeriod: newCustomers.length,
    customerDetails: customers || [],
    insights: {
      avgLifetimeStamps: customers?.reduce((sum, c) => sum + c.lifetime_stamps, 0) / (customers?.length || 1),
      avgDaysSinceJoined: customers?.reduce((sum, c) => sum + c.days_since_joined, 0) / (customers?.length || 1),
      rewardRedemptionRate: customers?.filter(c => c.lifetime_rewards > 0).length / (customers?.length || 1) * 100
    }
  }
}

async function generateEngagementReport(supabase: any, restaurantId: string, dateRange: any, period: string) {
  // Get business metrics for the period
  const { data: metrics } = await supabase
    .from('business_metrics')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('period_type', period)
    .gte('metric_date', dateRange.start)
    .lte('metric_date', dateRange.end)
    .order('metric_date', { ascending: true })

  // Get event analytics
  const { data: events } = await supabase
    .from('customer_analytics')
    .select('event_type, created_at, event_data')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', dateRange.start)
    .lte('created_at', dateRange.end)
    .order('created_at', { ascending: true })

  // Analyze event patterns
  const eventCounts = events?.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // Calculate engagement trends
  const totalStamps = metrics?.reduce((sum, m) => sum + (m.total_stamps || 0), 0) || 0
  const totalVisits = metrics?.reduce((sum, m) => sum + (m.total_visits || 0), 0) || 0
  const totalRewards = metrics?.reduce((sum, m) => sum + (m.rewards_redeemed || 0), 0) || 0

  return {
    periodMetrics: metrics || [],
    eventAnalysis: {
      totalEvents: events?.length || 0,
      eventBreakdown: eventCounts,
      stampsEarned: totalStamps,
      visitsRecorded: totalVisits,
      rewardsRedeemed: totalRewards
    },
    engagementTrends: {
      avgStampsPerVisit: totalVisits > 0 ? (totalStamps / totalVisits).toFixed(2) : 0,
      rewardRedemptionRate: totalStamps > 0 ? (totalRewards / totalStamps * 100).toFixed(1) : 0,
      customerEngagementScore: calculateEngagementScore(metrics || [])
    }
  }
}

async function generateRetentionReport(supabase: any, restaurantId: string, dateRange: any) {
  // Get customer insights for retention analysis
  const { data: customers } = await supabase
    .from('customer_insights')
    .select('*')
    .eq('restaurant_id', restaurantId)

  if (!customers || customers.length === 0) {
    return {
      retentionMetrics: {},
      customerLifecycle: [],
      recommendations: []
    }
  }

  // Calculate retention metrics
  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.customer_status === 'Active').length
  const atRiskCustomers = customers.filter(c => c.customer_status === 'At Risk').length
  const inactiveCustomers = customers.filter(c => c.customer_status === 'Inactive').length

  // Analyze customer lifecycle stages
  const newCustomers = customers.filter(c => c.days_since_joined <= 30).length
  const establishedCustomers = customers.filter(c => c.days_since_joined > 30 && c.days_since_joined <= 90).length
  const loyalCustomers = customers.filter(c => c.days_since_joined > 90 && c.lifetime_rewards > 0).length

  // Calculate average metrics
  const avgDaysBetweenVisits = customers
    .filter(c => c.total_visits > 1)
    .reduce((sum, c) => sum + (c.days_since_joined / Math.max(c.total_visits - 1, 1)), 0) / 
    Math.max(customers.filter(c => c.total_visits > 1).length, 1)

  return {
    retentionMetrics: {
      overallRetentionRate: (activeCustomers / totalCustomers * 100).toFixed(1),
      customerDistribution: {
        active: { count: activeCustomers, percentage: (activeCustomers / totalCustomers * 100).toFixed(1) },
        atRisk: { count: atRiskCustomers, percentage: (atRiskCustomers / totalCustomers * 100).toFixed(1) },
        inactive: { count: inactiveCustomers, percentage: (inactiveCustomers / totalCustomers * 100).toFixed(1) }
      },
      avgDaysBetweenVisits: avgDaysBetweenVisits.toFixed(1)
    },
    customerLifecycle: {
      new: { count: newCustomers, percentage: (newCustomers / totalCustomers * 100).toFixed(1) },
      established: { count: establishedCustomers, percentage: (establishedCustomers / totalCustomers * 100).toFixed(1) },
      loyal: { count: loyalCustomers, percentage: (loyalCustomers / totalCustomers * 100).toFixed(1) }
    },
    recommendations: generateRetentionRecommendations(customers)
  }
}

async function generateCohortReport(supabase: any, restaurantId: string, dateRange: any) {
  // Get customer cohort data
  const { data: cohorts } = await supabase
    .from('customer_cohorts')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .gte('cohort_month', dateRange.start)
    .lte('cohort_month', dateRange.end)
    .order('cohort_month', { ascending: true })
    .order('period_number', { ascending: true })

  // If no cohort data exists, calculate it from customer data
  if (!cohorts || cohorts.length === 0) {
    return await calculateCohortAnalysis(supabase, restaurantId, dateRange)
  }

  // Process cohort data for visualization
  const cohortMatrix = processCohortData(cohorts)

  return {
    cohortMatrix,
    insights: {
      avgRetentionMonth1: calculateAverageRetention(cohorts, 1),
      avgRetentionMonth3: calculateAverageRetention(cohorts, 3),
      avgRetentionMonth6: calculateAverageRetention(cohorts, 6),
      bestPerformingCohort: findBestCohort(cohorts),
      retentionTrends: analyzeRetentionTrends(cohorts)
    }
  }
}

// Helper functions
function calculateEngagementScore(metrics: any[]): number {
  if (!metrics || metrics.length === 0) return 0
  
  const avgStamps = metrics.reduce((sum, m) => sum + (m.total_stamps || 0), 0) / metrics.length
  const avgVisits = metrics.reduce((sum, m) => sum + (m.total_visits || 0), 0) / metrics.length
  const avgRewards = metrics.reduce((sum, m) => sum + (m.rewards_redeemed || 0), 0) / metrics.length
  
  // Simple engagement score calculation (0-100)
  return Math.min(100, (avgStamps * 2 + avgVisits * 5 + avgRewards * 10))
}

function generateRetentionRecommendations(customers: any[]): string[] {
  const recommendations: string[] = []
  
  const atRiskCount = customers.filter(c => c.customer_status === 'At Risk').length
  const inactiveCount = customers.filter(c => c.customer_status === 'Inactive').length
  const lowEngagementCount = customers.filter(c => c.lifetime_stamps < 3).length
  
  if (atRiskCount > customers.length * 0.2) {
    recommendations.push("High number of at-risk customers. Consider implementing a re-engagement campaign.")
  }
  
  if (inactiveCount > customers.length * 0.3) {
    recommendations.push("Many inactive customers detected. Review your retention strategy and consider win-back offers.")
  }
  
  if (lowEngagementCount > customers.length * 0.4) {
    recommendations.push("Low engagement levels. Consider reducing stamps required for rewards or adding bonus stamp promotions.")
  }
  
  return recommendations
}

function processCohortData(cohorts: any[]): any {
  // Group cohorts by month and create matrix
  const cohortMap = new Map()
  
  cohorts.forEach(cohort => {
    const key = cohort.cohort_month
    if (!cohortMap.has(key)) {
      cohortMap.set(key, {
        cohortMonth: key,
        periods: {}
      })
    }
    cohortMap.get(key).periods[cohort.period_number] = {
      customers: cohort.active_customers,
      retentionRate: cohort.retention_rate
    }
  })
  
  return Array.from(cohortMap.values())
}

function calculateAverageRetention(cohorts: any[], periodNumber: number): number {
  const relevantCohorts = cohorts.filter(c => c.period_number === periodNumber)
  if (relevantCohorts.length === 0) return 0
  
  const avgRetention = relevantCohorts.reduce((sum, c) => sum + c.retention_rate, 0) / relevantCohorts.length
  return Math.round(avgRetention * 100) / 100
}

function findBestCohort(cohorts: any[]): any {
  if (!cohorts || cohorts.length === 0) return null
  
  const cohortPerformance = new Map()
  
  cohorts.forEach(cohort => {
    const key = cohort.cohort_month
    if (!cohortPerformance.has(key)) {
      cohortPerformance.set(key, { month: key, avgRetention: 0, periods: 0 })
    }
    const perf = cohortPerformance.get(key)
    perf.avgRetention += cohort.retention_rate
    perf.periods += 1
  })
  
  let bestCohort = null
  let bestRetention = 0
  
  for (const [month, perf] of cohortPerformance) {
    const avgRetention = perf.avgRetention / perf.periods
    if (avgRetention > bestRetention) {
      bestRetention = avgRetention
      bestCohort = { month, avgRetention }
    }
  }
  
  return bestCohort
}

function analyzeRetentionTrends(cohorts: any[]): any {
  // Analyze how retention changes over time periods
  const trendData = {}
  
  for (let period = 0; period <= 12; period++) {
    const periodCohorts = cohorts.filter(c => c.period_number === period)
    if (periodCohorts.length > 0) {
      trendData[period] = {
        avgRetention: periodCohorts.reduce((sum, c) => sum + c.retention_rate, 0) / periodCohorts.length,
        cohortCount: periodCohorts.length
      }
    }
  }
  
  return trendData
}

async function calculateCohortAnalysis(supabase: any, restaurantId: string, dateRange: any): Promise<any> {
  // This would implement cohort calculation from raw customer data
  // For now, return empty structure
  return {
    cohortMatrix: [],
    insights: {
      avgRetentionMonth1: 0,
      avgRetentionMonth3: 0,
      avgRetentionMonth6: 0,
      bestPerformingCohort: null,
      retentionTrends: {}
    }
  }
} 
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface AggregateMetrics {
  total_customers: number
  active_customers_30d: number
  total_rewards: number
  total_stamps_issued: number
  growth_rate_30d: number
  revenue_estimate: number
  avg_stamps_per_customer: number
  reward_redemption_rate: number
}

export interface LocationBreakdown {
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

export interface MonthlyGrowthData {
  month: string
  new_customers: number
  stamps_issued: number
  rewards_redeemed: number
  revenue_estimate: number
  growth_rate: number
}

export interface RedemptionTrendData {
  month: string
  redemption_rate: number
  total_rewards: number
  total_stamps: number
}

export interface RetentionCohortData {
  cohort_month: string
  customers_acquired: number
  month_1_retention: number
  month_3_retention: number
  month_6_retention: number
  month_12_retention: number
}

export interface TrendData {
  monthly_growth: MonthlyGrowthData[]
  reward_redemption_trends: RedemptionTrendData[]
  retention_cohorts: RetentionCohortData[]
}

export interface AnalyticsFilters {
  time_range: '30d' | '90d' | '6m' | '1y' | 'custom'
  start_date?: string
  end_date?: string
  location_ids?: string[]
}

export interface DateRange {
  start_date: string
  end_date: string
}

// Get the Supabase URL for Edge Functions
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

if (!SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL environment variable is required');
}
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/analytics-report`

// Mock mode disabled – using real analytics-report Edge Function
const MOCK_MODE = false

export function useAnalyticsManager(clientId?: string) {
  const [aggregateMetrics, setAggregateMetrics] = useState<AggregateMetrics | null>(null)
  const [locationBreakdown, setLocationBreakdown] = useState<LocationBreakdown[]>([])
  const [trendData, setTrendData] = useState<TrendData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Mock data for testing
  const mockAggregateMetrics: AggregateMetrics = {
    total_customers: 2847,
    active_customers_30d: 1256,
    total_rewards: 342,
    total_stamps_issued: 18934,
    growth_rate_30d: 12.5,
    revenue_estimate: 28401.00,
    avg_stamps_per_customer: 6.65,
    reward_redemption_rate: 1.81
  }

  const mockLocationBreakdown: LocationBreakdown[] = [
    {
      location_id: 'loc_1',
      location_name: 'Main Street Store',
      address: '123 Main St',
      city: 'Downtown',
      state: 'CA',
      customers: 1245,
      active_customers_30d: 567,
      stamps_issued: 8234,
      rewards_redeemed: 156,
      activity_rate: 45.5,
      revenue_estimate: 12351.00,
      growth_rate: 15.2
    },
    {
      location_id: 'loc_2',
      location_name: 'Mall Location',
      address: '456 Shopping Center',
      city: 'Suburbia',
      state: 'CA',
      customers: 987,
      active_customers_30d: 423,
      stamps_issued: 6789,
      rewards_redeemed: 123,
      activity_rate: 42.8,
      revenue_estimate: 10183.50,
      growth_rate: 8.7
    },
    {
      location_id: 'loc_3',
      location_name: 'Airport Branch',
      address: '789 Terminal Blvd',
      city: 'Terminal City',
      state: 'CA',
      customers: 615,
      active_customers_30d: 266,
      stamps_issued: 3911,
      rewards_redeemed: 63,
      activity_rate: 43.3,
      revenue_estimate: 5866.50,
      growth_rate: 18.9
    }
  ]

  const mockTrendData: TrendData = {
    monthly_growth: [
      {
        month: 'Oct 2023',
        new_customers: 234,
        stamps_issued: 1567,
        rewards_redeemed: 28,
        revenue_estimate: 2350.50,
        growth_rate: 8.2
      },
      {
        month: 'Nov 2023',
        new_customers: 267,
        stamps_issued: 1789,
        rewards_redeemed: 34,
        revenue_estimate: 2683.50,
        growth_rate: 14.1
      },
      {
        month: 'Dec 2023',
        new_customers: 312,
        stamps_issued: 2134,
        rewards_redeemed: 42,
        revenue_estimate: 3201.00,
        growth_rate: 16.9
      },
      {
        month: 'Jan 2024',
        new_customers: 289,
        stamps_issued: 1923,
        rewards_redeemed: 38,
        revenue_estimate: 2884.50,
        growth_rate: -7.4
      }
    ],
    reward_redemption_trends: [
      {
        month: 'Oct 2023',
        redemption_rate: 1.79,
        total_rewards: 28,
        total_stamps: 1567
      },
      {
        month: 'Nov 2023',
        redemption_rate: 1.90,
        total_rewards: 34,
        total_stamps: 1789
      },
      {
        month: 'Dec 2023',
        redemption_rate: 1.97,
        total_rewards: 42,
        total_stamps: 2134
      },
      {
        month: 'Jan 2024',
        redemption_rate: 1.98,
        total_rewards: 38,
        total_stamps: 1923
      }
    ],
    retention_cohorts: [
      {
        cohort_month: 'Oct 2023',
        customers_acquired: 234,
        month_1_retention: 78.2,
        month_3_retention: 45.7,
        month_6_retention: 0,
        month_12_retention: 0
      },
      {
        cohort_month: 'Nov 2023',
        customers_acquired: 267,
        month_1_retention: 82.4,
        month_3_retention: 0,
        month_6_retention: 0,
        month_12_retention: 0
      },
      {
        cohort_month: 'Dec 2023',
        customers_acquired: 312,
        month_1_retention: 85.9,
        month_3_retention: 0,
        month_6_retention: 0,
        month_12_retention: 0
      }
    ]
  }

  // Get current client ID from session or props
  const getCurrentClientId = (): string | null => {
    if (clientId) return clientId
    
    // Try to get from session storage (when viewing as admin)
    const viewingClient = sessionStorage.getItem('viewing_client')
    if (viewingClient) return viewingClient
    
    // For testing purposes, return a hardcoded client ID if none found
    console.log('No client ID found, using fallback for testing')
    return 'test-client-id'
  }

  const fetchAggregateMetrics = async (filters: AnalyticsFilters = { time_range: '30d' }) => {
    const currentClientId = getCurrentClientId()
    if (!currentClientId) {
      setError('No client ID available')
      return
    }

    console.log('Fetching aggregate metrics for client:', currentClientId, 'with filters:', filters)
    setLoading(true)
    setError(null)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setAggregateMetrics(mockAggregateMetrics)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Build query parameters
      const params = new URLSearchParams({
        client_id: currentClientId,
        endpoint: 'aggregate',
        time_range: filters.time_range
      })

      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.location_ids) params.append('location_ids', filters.location_ids.join(','))

      console.log('Making request to:', `${EDGE_FUNCTION_URL}?${params}`)
      
      const response = await fetch(`${EDGE_FUNCTION_URL}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch aggregate metrics')
      }

      setAggregateMetrics(result.data)
    } catch (err) {
      console.error('Aggregate metrics fetch error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch aggregate metrics'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLocationBreakdown = async (filters: AnalyticsFilters = { time_range: '30d' }) => {
    const currentClientId = getCurrentClientId()
    if (!currentClientId) {
      setError('No client ID available')
      return
    }

    console.log('Fetching location breakdown for client:', currentClientId, 'with filters:', filters)
    setLoading(true)
    setError(null)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 900))
        
        let filteredBreakdown = [...mockLocationBreakdown]
        if (filters.location_ids && filters.location_ids.length > 0) {
          filteredBreakdown = filteredBreakdown.filter(loc => 
            filters.location_ids!.includes(loc.location_id)
          )
        }
        
        setLocationBreakdown(filteredBreakdown)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Build query parameters
      const params = new URLSearchParams({
        client_id: currentClientId,
        endpoint: 'locations',
        time_range: filters.time_range
      })

      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.location_ids) params.append('location_ids', filters.location_ids.join(','))

      console.log('Making request to:', `${EDGE_FUNCTION_URL}?${params}`)
      
      const response = await fetch(`${EDGE_FUNCTION_URL}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch location breakdown')
      }

      setLocationBreakdown(result.data || [])
    } catch (err) {
      console.error('Location breakdown fetch error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch location breakdown'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTrendAnalysis = async (filters: AnalyticsFilters = { time_range: '6m' }) => {
    const currentClientId = getCurrentClientId()
    if (!currentClientId) {
      setError('No client ID available')
      return
    }

    console.log('Fetching trend analysis for client:', currentClientId, 'with filters:', filters)
    setLoading(true)
    setError(null)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1200))
        
        setTrendData(mockTrendData)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Build query parameters
      const params = new URLSearchParams({
        client_id: currentClientId,
        endpoint: 'trends',
        time_range: filters.time_range
      })

      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.location_ids) params.append('location_ids', filters.location_ids.join(','))

      console.log('Making request to:', `${EDGE_FUNCTION_URL}?${params}`)
      
      const response = await fetch(`${EDGE_FUNCTION_URL}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch trend analysis')
      }

      setTrendData(result.data)
    } catch (err) {
      console.error('Trend analysis fetch error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trend analysis'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAllAnalytics = async (filters: AnalyticsFilters = { time_range: '30d' }) => {
    setLoading(true)
    try {
      await Promise.all([
        fetchAggregateMetrics(filters),
        fetchLocationBreakdown(filters),
        fetchTrendAnalysis({ ...filters, time_range: '6m' }) // Always use 6m for trends
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllAnalytics()
  }, [clientId])

  return {
    aggregateMetrics,
    locationBreakdown,
    trendData,
    loading,
    error,
    fetchAggregateMetrics,
    fetchLocationBreakdown,
    fetchTrendAnalysis,
    fetchAllAnalytics,
    refetch: () => fetchAllAnalytics()
  }
} 
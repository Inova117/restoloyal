import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface LoyaltySettings {
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
  restaurant?: {
    id: string
    name: string
    client_id: string
  }
}

export interface Campaign {
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

export interface UpdateLoyaltySettingsData {
  stamps_required?: number
  reward_description?: string
  reward_value?: number
  stamps_per_dollar?: number
  auto_redeem?: boolean
  max_stamps_per_visit?: number
  stamp_expiry_days?: number
  minimum_purchase_amount?: number
}

export interface CreateCampaignData {
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

export interface CampaignFilters {
  status?: 'draft' | 'active' | 'paused' | 'expired'
  promo_type?: string
  limit?: number
  offset?: number
}

export interface CampaignPagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

// Get the Supabase URL for Edge Functions
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

if (!SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL environment variable is required');
}
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/loyalty-manager`

// Temporary mock mode for testing (set to false when Edge Function is deployed)
const MOCK_MODE = true

export function useLoyaltyManager(clientId?: string) {
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<CampaignPagination>({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  })
  const { toast } = useToast()

  // Mock data for testing
  const mockLoyaltySettings: LoyaltySettings[] = [
    {
      id: 'loyalty_1',
      restaurant_id: 'rest_1',
      stamps_required: 10,
      reward_description: 'Free medium pizza',
      reward_value: 15.99,
      stamps_per_dollar: 1.0,
      auto_redeem: false,
      max_stamps_per_visit: 5,
      stamp_expiry_days: 365,
      minimum_purchase_amount: 5.00,
      updated_at: '2024-01-20T10:00:00Z',
      updated_by: 'user_1',
      restaurant: {
        id: 'rest_1',
        name: 'Main Street Location',
        client_id: 'test-client-id'
      }
    },
    {
      id: 'loyalty_2',
      restaurant_id: 'rest_2',
      stamps_required: 8,
      reward_description: 'Free large drink',
      reward_value: 3.99,
      stamps_per_dollar: 1.5,
      auto_redeem: true,
      max_stamps_per_visit: 3,
      stamp_expiry_days: 180,
      minimum_purchase_amount: 10.00,
      updated_at: '2024-01-18T14:30:00Z',
      updated_by: 'user_2',
      restaurant: {
        id: 'rest_2',
        name: 'Mall Location',
        client_id: 'test-client-id'
      }
    }
  ]

  const mockCampaigns: Campaign[] = [
    {
      id: 'campaign_1',
      client_id: 'test-client-id',
      restaurant_id: 'rest_1',
      title: 'Double Stamp Weekend',
      description: 'Earn double stamps on all purchases this weekend!',
      promo_type: 'double_stamps',
      reward_config: {},
      start_date: '2024-01-26T00:00:00Z',
      end_date: '2024-01-28T23:59:59Z',
      eligible_locations: ['loc_1', 'loc_2'],
      status: 'active',
      usage_limit: 1000,
      usage_count: 245,
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
      created_by: 'user_1'
    },
    {
      id: 'campaign_2',
      client_id: 'test-client-id',
      title: 'New Customer Bonus',
      description: 'Get 5 bonus stamps when you make your first purchase!',
      promo_type: 'bonus_stamps',
      reward_config: {
        bonus_stamps: 5
      },
      start_date: '2024-01-15T00:00:00Z',
      end_date: '2024-02-15T23:59:59Z',
      eligible_locations: ['loc_1', 'loc_2', 'loc_3'],
      status: 'active',
      usage_count: 89,
      created_at: '2024-01-15T09:00:00Z',
      updated_at: '2024-01-15T09:00:00Z',
      created_by: 'user_1'
    },
    {
      id: 'campaign_3',
      client_id: 'test-client-id',
      restaurant_id: 'rest_2',
      title: 'Holiday Special',
      description: 'Get 20% off your order during the holiday season!',
      promo_type: 'discount',
      reward_config: {
        discount_percentage: 20
      },
      start_date: '2024-12-20T00:00:00Z',
      end_date: '2024-01-05T23:59:59Z',
      eligible_locations: ['loc_2'],
      status: 'expired',
      usage_limit: 500,
      usage_count: 456,
      created_at: '2024-12-15T10:00:00Z',
      updated_at: '2024-12-15T10:00:00Z',
      created_by: 'user_2'
    }
  ]

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

  const fetchLoyaltySettings = async (restaurantId?: string) => {
    const currentClientId = getCurrentClientId()
    if (!currentClientId) {
      setError('No client ID available')
      return
    }

    console.log('Fetching loyalty settings for client:', currentClientId, 'restaurant:', restaurantId)
    setLoading(true)
    setError(null)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600))
        
        let filteredSettings = [...mockLoyaltySettings]
        if (restaurantId) {
          filteredSettings = filteredSettings.filter(s => s.restaurant_id === restaurantId)
        }
        
        setLoyaltySettings(filteredSettings)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Build query parameters
      const params = new URLSearchParams({
        client_id: currentClientId,
        endpoint: 'loyalty'
      })

      if (restaurantId) params.append('restaurant_id', restaurantId)

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
        throw new Error(result.error || 'Failed to fetch loyalty settings')
      }

      setLoyaltySettings(result.data || [])
    } catch (err) {
      console.error('Loyalty settings fetch error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch loyalty settings'
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

  const updateLoyaltySettings = async (restaurantId: string, updateData: UpdateLoyaltySettingsData): Promise<boolean> => {
    const currentClientId = getCurrentClientId()
    if (!currentClientId) {
      toast({
        title: "Error",
        description: "No client ID available",
        variant: "destructive"
      })
      return false
    }

    setLoading(true)
    setError(null)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setLoyaltySettings(prev => prev.map(setting => 
          setting.restaurant_id === restaurantId 
            ? { ...setting, ...updateData, updated_at: new Date().toISOString() } 
            : setting
        ))
        
        toast({
          title: "Success",
          description: "Loyalty settings updated successfully (Mock Mode)"
        })
        
        return true
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${EDGE_FUNCTION_URL}?restaurant_id=${restaurantId}&client_id=${currentClientId}&endpoint=loyalty`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update loyalty settings')
      }

      // Update the settings in the list
      setLoyaltySettings(prev => prev.map(setting => 
        setting.restaurant_id === restaurantId ? { ...setting, ...result.data } : setting
      ))

      toast({
        title: "Success",
        description: result.message || "Loyalty settings updated successfully"
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update loyalty settings'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaigns = async (filters: CampaignFilters = {}) => {
    const currentClientId = getCurrentClientId()
    if (!currentClientId) {
      setError('No client ID available')
      return
    }

    console.log('Fetching campaigns for client:', currentClientId, 'with filters:', filters)
    setLoading(true)
    setError(null)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 700))
        
        // Apply filters to mock data
        let filteredCampaigns = [...mockCampaigns]
        
        if (filters.status) {
          filteredCampaigns = filteredCampaigns.filter(c => c.status === filters.status)
        }
        
        if (filters.promo_type) {
          filteredCampaigns = filteredCampaigns.filter(c => c.promo_type === filters.promo_type)
        }
        
        // Apply pagination
        const limit = filters.limit || 50
        const offset = filters.offset || 0
        const paginatedCampaigns = filteredCampaigns.slice(offset, offset + limit)
        
        setCampaigns(paginatedCampaigns)
        setPagination({
          total: filteredCampaigns.length,
          limit,
          offset,
          hasMore: filteredCampaigns.length > offset + limit
        })
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Build query parameters
      const params = new URLSearchParams({
        client_id: currentClientId,
        endpoint: 'campaigns',
        limit: (filters.limit || 50).toString(),
        offset: (filters.offset || 0).toString()
      })

      if (filters.status) params.append('status', filters.status)
      if (filters.promo_type) params.append('promo_type', filters.promo_type)

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
        throw new Error(result.error || 'Failed to fetch campaigns')
      }

      setCampaigns(result.data || [])
      setPagination(result.pagination || { total: 0, limit: 50, offset: 0, hasMore: false })
    } catch (err) {
      console.error('Campaigns fetch error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch campaigns'
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

  const createCampaign = async (campaignData: CreateCampaignData): Promise<boolean> => {
    const currentClientId = getCurrentClientId()
    if (!currentClientId) {
      toast({
        title: "Error",
        description: "No client ID available",
        variant: "destructive"
      })
      return false
    }

    setLoading(true)
    setError(null)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const newCampaign: Campaign = {
          id: `campaign_${Date.now()}`,
          client_id: currentClientId,
          ...campaignData,
          status: 'draft',
          usage_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'current_user'
        }
        
        setCampaigns(prev => [newCampaign, ...prev])
        
        toast({
          title: "Success",
          description: "Campaign created successfully (Mock Mode)"
        })
        
        return true
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${EDGE_FUNCTION_URL}?client_id=${currentClientId}&endpoint=campaigns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create campaign')
      }

      // Add the new campaign to the list
      setCampaigns(prev => [result.data, ...prev])

      toast({
        title: "Success",
        description: result.message || "Campaign created successfully"
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create campaign'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateCampaign = async (campaignId: string, updateData: Partial<Campaign>): Promise<boolean> => {
    const currentClientId = getCurrentClientId()
    if (!currentClientId) {
      toast({
        title: "Error",
        description: "No client ID available",
        variant: "destructive"
      })
      return false
    }

    setLoading(true)
    setError(null)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, ...updateData, updated_at: new Date().toISOString() } 
            : campaign
        ))
        
        toast({
          title: "Success",
          description: "Campaign updated successfully (Mock Mode)"
        })
        
        return true
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${EDGE_FUNCTION_URL}?campaign_id=${campaignId}&client_id=${currentClientId}&endpoint=campaigns`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update campaign')
      }

      // Update the campaign in the list
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId ? { ...campaign, ...result.data } : campaign
      ))

      toast({
        title: "Success",
        description: result.message || "Campaign updated successfully"
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update campaign'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoyaltySettings()
    fetchCampaigns()
  }, [clientId])

  return {
    loyaltySettings,
    campaigns,
    loading,
    error,
    pagination,
    fetchLoyaltySettings,
    updateLoyaltySettings,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    refetch: () => {
      fetchLoyaltySettings()
      fetchCampaigns()
    }
  }
} 
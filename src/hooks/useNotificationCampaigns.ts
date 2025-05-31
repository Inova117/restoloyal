import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

// TypeScript interfaces
export interface NotificationCampaign {
  id?: string
  client_id: string
  location_id?: string
  campaign_name: string
  campaign_type: 'push' | 'email' | 'sms' | 'multi'
  target_audience: 'all_customers' | 'location_customers' | 'active_customers' | 'inactive_customers' | 'high_value_customers'
  message_title: string
  message_content: string
  scheduled_for?: string
  send_immediately: boolean
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'partially_sent' | 'failed' | 'deleted'
  sent_count?: number
  failed_count?: number
  created_by?: string
  sent_at?: string
  completed_at?: string
  created_at?: string
  updated_at?: string
  metadata?: any
}

export interface CampaignTemplate {
  id: string
  client_id: string
  template_name: string
  template_type: 'push' | 'email' | 'sms' | 'multi'
  message_title: string
  message_content: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface CampaignAnalytics {
  campaign: NotificationCampaign
  analytics: {
    total_sent: number
    delivered: number
    failed: number
    opened: number
    clicked: number
    by_type: {
      push: number
      email: number
      sms: number
    }
    delivery_rate: string
    open_rate: string
    click_rate: string
  }
}

export interface NotificationLog {
  id: string
  campaign_id: string
  customer_id: string
  notification_type: 'push' | 'email' | 'sms'
  status: 'sent' | 'delivered' | 'failed' | 'opened' | 'clicked' | 'bounced'
  sent_at: string
  delivered_at?: string
  opened_at?: string
  clicked_at?: string
  error_message?: string
  external_id?: string
}

const MOCK_MODE = true // Set to false for production

// Mock data for development
const mockCampaigns: NotificationCampaign[] = [
  {
    id: 'camp_1',
    client_id: 'galletti-client-id',
    location_id: 'loc_1',
    campaign_name: 'Welcome New Customers',
    campaign_type: 'multi',
    target_audience: 'all_customers',
    message_title: 'Welcome to Galletti!',
    message_content: 'Thank you for joining our loyalty program! Earn stamps with every purchase.',
    send_immediately: false,
    status: 'sent',
    sent_count: 1247,
    failed_count: 23,
    created_by: 'user_1',
    sent_at: '2024-01-15T10:30:00Z',
    completed_at: '2024-01-15T10:45:00Z',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T10:45:00Z'
  },
  {
    id: 'camp_2',
    client_id: 'galletti-client-id',
    campaign_name: 'Weekend Special Promotion',
    campaign_type: 'push',
    target_audience: 'active_customers',
    message_title: 'Double Stamps Weekend!',
    message_content: 'Get double stamps on all purchases this weekend. Limited time offer!',
    send_immediately: false,
    status: 'scheduled',
    scheduled_for: '2024-01-20T08:00:00Z',
    created_by: 'user_1',
    created_at: '2024-01-18T14:30:00Z',
    updated_at: '2024-01-18T14:30:00Z'
  },
  {
    id: 'camp_3',
    client_id: 'galletti-client-id',
    location_id: 'loc_2',
    campaign_name: 'Inactive Customer Re-engagement',
    campaign_type: 'email',
    target_audience: 'inactive_customers',
    message_title: 'We miss you!',
    message_content: 'Come back and enjoy 20% off your next order. Your loyalty matters to us!',
    send_immediately: false,
    status: 'draft',
    created_by: 'user_1',
    created_at: '2024-01-19T11:15:00Z',
    updated_at: '2024-01-19T11:15:00Z'
  }
]

const mockTemplates: CampaignTemplate[] = [
  {
    id: 'temp_1',
    client_id: 'galletti-client-id',
    template_name: 'Welcome New Customer',
    template_type: 'multi',
    message_title: 'Welcome to Galletti!',
    message_content: 'Thank you for joining our loyalty program! Earn stamps with every purchase and get rewarded.',
    is_active: true,
    created_by: 'user_1',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z'
  },
  {
    id: 'temp_2',
    client_id: 'galletti-client-id',
    template_name: 'Reward Available',
    template_type: 'push',
    message_title: 'Your reward is ready!',
    message_content: 'You have earned a free item! Visit any Galletti location to redeem your reward.',
    is_active: true,
    created_by: 'user_1',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z'
  },
  {
    id: 'temp_3',
    client_id: 'galletti-client-id',
    template_name: 'Special Promotion',
    template_type: 'email',
    message_title: 'Limited Time Offer!',
    message_content: 'Get double stamps on all purchases this weekend. Don\'t miss out on this amazing deal!',
    is_active: true,
    created_by: 'user_1',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z'
  }
]

const mockAnalytics: CampaignAnalytics = {
  campaign: mockCampaigns[0],
  analytics: {
    total_sent: 1270,
    delivered: 1247,
    failed: 23,
    opened: 892,
    clicked: 234,
    by_type: {
      push: 1270,
      email: 1270,
      sms: 856
    },
    delivery_rate: '98.2',
    open_rate: '71.5',
    click_rate: '18.4'
  }
}

export const useNotificationCampaigns = () => {
  const [loading, setLoading] = useState(false)
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([])
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])

  // Create a new campaign
  const createCampaign = useCallback(async (campaignData: Omit<NotificationCampaign, 'id'>) => {
    setLoading(true)
    try {
      if (MOCK_MODE) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const newCampaign: NotificationCampaign = {
          ...campaignData,
          id: `camp_${Date.now()}`,
          status: campaignData.send_immediately ? 'sending' : 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'current_user'
        }
        
        setCampaigns(prev => [newCampaign, ...prev])
        
        toast.success(
          campaignData.send_immediately 
            ? 'Campaign created and sending initiated!' 
            : 'Campaign created successfully!'
        )
        
        return { success: true, campaign: newCampaign }
      }

      const { data, error } = await supabase.functions.invoke('notification-campaigns/create-campaign', {
        body: campaignData
      })

      if (error) throw error

      if (data.success) {
        setCampaigns(prev => [data.campaign, ...prev])
        toast.success(data.message)
        return { success: true, campaign: data.campaign }
      }

      throw new Error('Failed to create campaign')
    } catch (error: any) {
      console.error('Create campaign error:', error)
      toast.error(error.message || 'Failed to create campaign')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // Send a campaign immediately
  const sendCampaign = useCallback(async (campaignId: string) => {
    setLoading(true)
    try {
      if (MOCK_MODE) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId 
            ? { 
                ...campaign, 
                status: 'sending',
                sent_at: new Date().toISOString()
              }
            : campaign
        ))
        
        // Simulate completion after a delay
        setTimeout(() => {
          setCampaigns(prev => prev.map(campaign => 
            campaign.id === campaignId 
              ? { 
                  ...campaign, 
                  status: 'sent',
                  sent_count: Math.floor(Math.random() * 1000) + 500,
                  failed_count: Math.floor(Math.random() * 50),
                  completed_at: new Date().toISOString()
                }
              : campaign
          ))
        }, 3000)
        
        toast.success('Campaign sending initiated!')
        return { success: true }
      }

      const { data, error } = await supabase.functions.invoke('notification-campaigns/send-campaign', {
        body: { campaign_id: campaignId }
      })

      if (error) throw error

      if (data.success) {
        // Refresh campaigns list
        await fetchCampaigns()
        toast.success(data.message)
        return { success: true }
      }

      throw new Error('Failed to send campaign')
    } catch (error: any) {
      console.error('Send campaign error:', error)
      toast.error(error.message || 'Failed to send campaign')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // Schedule a campaign
  const scheduleCampaign = useCallback(async (campaignId: string, scheduledFor: string) => {
    setLoading(true)
    try {
      if (MOCK_MODE) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId 
            ? { 
                ...campaign, 
                status: 'scheduled',
                scheduled_for: scheduledFor,
                updated_at: new Date().toISOString()
              }
            : campaign
        ))
        
        toast.success('Campaign scheduled successfully!')
        return { success: true }
      }

      const { data, error } = await supabase.functions.invoke('notification-campaigns/schedule-campaign', {
        body: { campaign_id: campaignId, scheduled_for: scheduledFor }
      })

      if (error) throw error

      if (data.success) {
        await fetchCampaigns()
        toast.success(data.message)
        return { success: true }
      }

      throw new Error('Failed to schedule campaign')
    } catch (error: any) {
      console.error('Schedule campaign error:', error)
      toast.error(error.message || 'Failed to schedule campaign')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch campaigns
  const fetchCampaigns = useCallback(async (filters?: {
    client_id?: string
    location_id?: string
    status?: string
    limit?: number
    offset?: number
  }) => {
    setLoading(true)
    try {
      if (MOCK_MODE) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 600))
        
        let filteredCampaigns = [...mockCampaigns]
        
        if (filters?.status) {
          filteredCampaigns = filteredCampaigns.filter(c => c.status === filters.status)
        }
        
        if (filters?.location_id) {
          filteredCampaigns = filteredCampaigns.filter(c => c.location_id === filters.location_id)
        }
        
        setCampaigns(filteredCampaigns)
        return { success: true, campaigns: filteredCampaigns }
      }

      const params = new URLSearchParams()
      if (filters?.client_id) params.append('client_id', filters.client_id)
      if (filters?.location_id) params.append('location_id', filters.location_id)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const { data, error } = await supabase.functions.invoke(`notification-campaigns/campaigns?${params}`)

      if (error) throw error

      if (data.success) {
        setCampaigns(data.campaigns)
        return { success: true, campaigns: data.campaigns }
      }

      throw new Error('Failed to fetch campaigns')
    } catch (error: any) {
      console.error('Fetch campaigns error:', error)
      toast.error(error.message || 'Failed to fetch campaigns')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // Get campaign analytics
  const getCampaignAnalytics = useCallback(async (campaignId: string): Promise<CampaignAnalytics | null> => {
    setLoading(true)
    try {
      if (MOCK_MODE) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const campaign = mockCampaigns.find(c => c.id === campaignId)
        if (!campaign) {
          throw new Error('Campaign not found')
        }
        
        return {
          campaign,
          analytics: {
            total_sent: campaign.sent_count || 0,
            delivered: Math.floor((campaign.sent_count || 0) * 0.95),
            failed: campaign.failed_count || 0,
            opened: Math.floor((campaign.sent_count || 0) * 0.72),
            clicked: Math.floor((campaign.sent_count || 0) * 0.18),
            by_type: {
              push: campaign.campaign_type === 'push' || campaign.campaign_type === 'multi' ? (campaign.sent_count || 0) : 0,
              email: campaign.campaign_type === 'email' || campaign.campaign_type === 'multi' ? (campaign.sent_count || 0) : 0,
              sms: campaign.campaign_type === 'sms' || campaign.campaign_type === 'multi' ? Math.floor((campaign.sent_count || 0) * 0.8) : 0
            },
            delivery_rate: '95.2',
            open_rate: '72.1',
            click_rate: '18.3'
          }
        }
      }

      const { data, error } = await supabase.functions.invoke(`notification-campaigns/campaign-analytics?campaign_id=${campaignId}`)

      if (error) throw error

      if (data.success) {
        return data
      }

      throw new Error('Failed to fetch analytics')
    } catch (error: any) {
      console.error('Get campaign analytics error:', error)
      toast.error(error.message || 'Failed to fetch campaign analytics')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Update campaign
  const updateCampaign = useCallback(async (campaignId: string, updateData: Partial<NotificationCampaign>) => {
    setLoading(true)
    try {
      if (MOCK_MODE) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId 
            ? { 
                ...campaign, 
                ...updateData,
                updated_at: new Date().toISOString()
              }
            : campaign
        ))
        
        toast.success('Campaign updated successfully!')
        return { success: true }
      }

      const { data, error } = await supabase.functions.invoke('notification-campaigns/update-campaign', {
        body: { campaign_id: campaignId, ...updateData }
      })

      if (error) throw error

      if (data.success) {
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId ? data.campaign : campaign
        ))
        toast.success('Campaign updated successfully!')
        return { success: true, campaign: data.campaign }
      }

      throw new Error('Failed to update campaign')
    } catch (error: any) {
      console.error('Update campaign error:', error)
      toast.error(error.message || 'Failed to update campaign')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // Delete campaign
  const deleteCampaign = useCallback(async (campaignId: string) => {
    setLoading(true)
    try {
      if (MOCK_MODE) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 600))
        
        setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId))
        
        toast.success('Campaign deleted successfully!')
        return { success: true }
      }

      const { data, error } = await supabase.functions.invoke(`notification-campaigns/delete-campaign?campaign_id=${campaignId}`, {
        method: 'DELETE'
      })

      if (error) throw error

      if (data.success) {
        setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId))
        toast.success(data.message)
        return { success: true }
      }

      throw new Error('Failed to delete campaign')
    } catch (error: any) {
      console.error('Delete campaign error:', error)
      toast.error(error.message || 'Failed to delete campaign')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch templates
  const fetchTemplates = useCallback(async (clientId?: string) => {
    setLoading(true)
    try {
      if (MOCK_MODE) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 400))
        setTemplates(mockTemplates)
        return { success: true, templates: mockTemplates }
      }

      // In production, this would be a separate endpoint
      const params = clientId ? `?client_id=${clientId}` : ''
      const { data, error } = await supabase.functions.invoke(`notification-campaigns/templates${params}`)

      if (error) throw error

      if (data.success) {
        setTemplates(data.templates)
        return { success: true, templates: data.templates }
      }

      throw new Error('Failed to fetch templates')
    } catch (error: any) {
      console.error('Fetch templates error:', error)
      toast.error(error.message || 'Failed to fetch templates')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    // State
    loading,
    campaigns,
    templates,

    // Actions
    createCampaign,
    sendCampaign,
    scheduleCampaign,
    fetchCampaigns,
    getCampaignAnalytics,
    updateCampaign,
    deleteCampaign,
    fetchTemplates,

    // Utilities
    setCampaigns,
    setTemplates
  }
} 
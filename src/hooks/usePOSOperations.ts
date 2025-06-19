import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

// Mock mode flag - set to false when Edge Functions are deployed
const MOCK_MODE = false

export interface CustomerRegistrationRequest {
  qr_code?: string
  customer_data?: {
    name: string
    email: string
    phone: string
  }
  location_id: string
}

export interface AddStampRequest {
  customer_id: string
  location_id: string
  stamps_earned: number
  amount?: number
  notes?: string
}

export interface RedeemRewardRequest {
  customer_id: string
  location_id: string
  reward_type: string
  stamps_to_redeem: number
}

export interface CustomerLookupRequest {
  qr_code?: string
  phone?: string
  email?: string
  location_id: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  qr_code: string
  status: string
  total_stamps: number
  total_rewards: number
  stamps: number
  stamps_required: number
  last_visit: string
  total_visits: number
  created_at: string
}

export interface StampRecord {
  id: string
  customer_id: string
  location_id: string
  stamps_earned: number
  amount: number
  notes: string
  created_at: string
}

export interface RewardRecord {
  id: string
  customer_id: string
  location_id: string
  reward_type: string
  reward_value: string
  stamps_used: number
  redeemed_at: string
  status: string
}

export interface CustomerSummary {
  total_stamps: number
  available_rewards: number
  stamps_for_next_reward: number
  remaining_stamps?: number
}

export interface POSOperationResponse {
  success: boolean
  customer?: Customer
  stamp_record?: StampRecord
  reward_record?: RewardRecord
  customer_summary?: CustomerSummary
  customers?: Customer[]
  message?: string
  error?: string
}

// Mock data generators
const generateMockCustomer = (id?: string): Customer => ({
  id: id || `customer_${Date.now()}`,
  name: `Customer ${Math.floor(Math.random() * 1000)}`,
  email: `customer${Math.floor(Math.random() * 1000)}@example.com`,
  phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
  qr_code: `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  status: 'active',
  total_stamps: Math.floor(Math.random() * 20),
  total_rewards: Math.floor(Math.random() * 5),
  stamps: Math.floor(Math.random() * 20),
  stamps_required: 10,
  last_visit: new Date().toISOString(),
  total_visits: Math.floor(Math.random() * 10),
  created_at: new Date().toISOString()
})

const generateMockStampRecord = (customerId: string, locationId: string, stampsEarned: number): StampRecord => ({
  id: `stamp_${Date.now()}`,
  customer_id: customerId,
  location_id: locationId,
  stamps_earned: stampsEarned,
  amount: Math.random() * 50 + 10,
  notes: 'Mock transaction',
  created_at: new Date().toISOString()
})

const generateMockRewardRecord = (customerId: string, locationId: string, rewardType: string, stampsUsed: number): RewardRecord => ({
  id: `reward_${Date.now()}`,
  customer_id: customerId,
  location_id: locationId,
  reward_type: rewardType,
  reward_value: '$15.00',
  stamps_used: stampsUsed,
  redeemed_at: new Date().toISOString(),
  status: 'redeemed'
})

export const usePOSOperations = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const registerCustomer = async (request: CustomerRegistrationRequest): Promise<POSOperationResponse> => {
    setIsLoading(true)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        if (request.qr_code) {
          // Simulate existing customer lookup
          if (Math.random() > 0.7) {
            const existingCustomer = generateMockCustomer()
            existingCustomer.qr_code = request.qr_code

            toast({
              title: "Customer Found",
              description: `Welcome back, ${existingCustomer.name}!`,
            })

            return {
              success: true,
              customer: existingCustomer,
              message: 'Existing customer found and registered for visit'
            }
          }
        }

        // Create new customer
        if (!request.customer_data) {
          return {
            success: false,
            error: 'Customer data required for new registration'
          }
        }

        const newCustomer = generateMockCustomer()
        newCustomer.name = request.customer_data.name
        newCustomer.email = request.customer_data.email
        newCustomer.phone = request.customer_data.phone
        newCustomer.qr_code = request.qr_code || newCustomer.qr_code
        newCustomer.total_stamps = 0
        newCustomer.total_rewards = 0

        toast({
          title: "Customer Registered",
          description: `${newCustomer.name} has been registered successfully!`,
        })

        return {
          success: true,
          customer: newCustomer,
          message: 'New customer registered successfully'
        }
      }

      // Production mode - call actual Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pos-operations?operation=register-customer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      toast({
        title: "Success",
        description: data.message,
      })

      return data

    } catch (error) {
      console.error('Customer registration error:', error)
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      })
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const addStamp = async (request: AddStampRequest): Promise<POSOperationResponse> => {
    setIsLoading(true)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800))

        const stampRecord = generateMockStampRecord(request.customer_id, request.location_id, request.stamps_earned)
        const totalStamps = Math.floor(Math.random() * 50) + request.stamps_earned
        const stampsForReward = 10
        const availableRewards = Math.floor(totalStamps / stampsForReward)

        const customerSummary: CustomerSummary = {
          total_stamps: totalStamps,
          available_rewards: availableRewards,
          stamps_for_next_reward: stampsForReward - (totalStamps % stampsForReward)
        }

        toast({
          title: "Stamps Added",
          description: `Added ${request.stamps_earned} stamp(s). Total: ${totalStamps}`,
        })

        return {
          success: true,
          stamp_record: stampRecord,
          customer_summary: customerSummary,
          message: `Added ${request.stamps_earned} stamp(s) successfully`
        }
      }

      // Production mode - call actual Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pos-operations?operation=add-stamp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add stamp')
      }

      toast({
        title: "Success",
        description: data.message,
      })

      return data

    } catch (error) {
      console.error('Add stamp error:', error)
      toast({
        title: "Failed to Add Stamp",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      })
      return { success: false, error: error instanceof Error ? error.message : 'Failed to add stamp' }
    } finally {
      setIsLoading(false)
    }
  }

  const redeemReward = async (request: RedeemRewardRequest): Promise<POSOperationResponse> => {
    setIsLoading(true)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        const rewardRecord = generateMockRewardRecord(
          request.customer_id, 
          request.location_id, 
          request.reward_type, 
          request.stamps_to_redeem
        )

        const remainingStamps = Math.floor(Math.random() * 20)
        const stampsForReward = 10
        const availableRewards = Math.floor(remainingStamps / stampsForReward)

        const customerSummary: CustomerSummary = {
          total_stamps: remainingStamps,
          available_rewards: availableRewards,
          stamps_for_next_reward: stampsForReward - (remainingStamps % stampsForReward),
          remaining_stamps: remainingStamps
        }

        toast({
          title: "Reward Redeemed",
          description: `${request.reward_type} redeemed successfully!`,
        })

        return {
          success: true,
          reward_record: rewardRecord,
          customer_summary: customerSummary,
          message: `Reward redeemed successfully: ${request.reward_type}`
        }
      }

      // Production mode - call actual Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pos-operations?operation=redeem-reward`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem reward')
      }

      toast({
        title: "Success",
        description: data.message,
      })

      return data

    } catch (error) {
      console.error('Redeem reward error:', error)
      toast({
        title: "Failed to Redeem Reward",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      })
      return { success: false, error: error instanceof Error ? error.message : 'Failed to redeem reward' }
    } finally {
      setIsLoading(false)
    }
  }

  const lookupCustomer = async (request: CustomerLookupRequest): Promise<POSOperationResponse> => {
    setIsLoading(true)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600))

        // Simulate customer found/not found
        if (Math.random() > 0.3) {
          const customer = generateMockCustomer()
          if (request.qr_code) customer.qr_code = request.qr_code
          if (request.phone) customer.phone = request.phone
          if (request.email) customer.email = request.email

          return {
            success: true,
            customers: [customer]
          }
        } else {
          return {
            success: false,
            error: 'Customer not found'
          }
        }
      }

      // Production mode - call actual Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pos-operations?operation=customer-lookup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Customer lookup failed')
      }

      return data

    } catch (error) {
      console.error('Customer lookup error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Customer lookup failed' }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    registerCustomer,
    addStamp,
    redeemReward,
    lookupCustomer,
    isLoading
  }
} 
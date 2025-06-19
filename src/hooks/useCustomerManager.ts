import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface Customer {
  id: string
  restaurant_id: string
  location_id?: string
  name: string
  email?: string
  phone?: string
  qr_code: string
  stamps: number
  total_visits: number
  last_visit?: string
  customer_status: 'active' | 'inactive' | 'blocked'
  created_at: string
  updated_at: string
  location?: {
    id: string
    name: string
    address: string
  }
  restaurant?: {
    id: string
    name: string
    client_id: string
  }
  recent_stamps?: Array<{
    id: string
    amount: number
    notes?: string
    created_at: string
    added_by_name?: string
  }>
  recent_rewards?: Array<{
    id: string
    stamps_used: number
    description?: string
    value?: number
    created_at: string
    redeemed_by_name?: string
  }>
}

export interface CustomerFilters {
  location_id?: string
  search?: string
  status?: 'active' | 'inactive' | 'blocked'
  limit?: number
  offset?: number
}

export interface UpdateCustomerData {
  name?: string
  email?: string
  phone?: string
  customer_status?: 'active' | 'inactive' | 'blocked'
  location_id?: string
}

export interface CustomerPagination {
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
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/customer-manager`

// Temporary mock mode for testing (set to false when Edge Function is deployed)
const MOCK_MODE = false // ✅ Real Edge Function deployed

export function useCustomerManager(clientId?: string) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<CustomerPagination>({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  })
  const { toast } = useToast()

  // Mock data for testing
  const mockCustomers: Customer[] = [
    {
      id: 'customer_1',
      restaurant_id: 'rest_1',
      location_id: 'loc_1',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      qr_code: 'QR001',
      stamps: 8,
      total_visits: 15,
      last_visit: '2024-01-22T14:30:00Z',
      customer_status: 'active',
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-22T14:30:00Z',
      location: {
        id: 'loc_1',
        name: 'Main Street Store',
        address: '123 Main St, Downtown, CA'
      },
      restaurant: {
        id: 'rest_1',
        name: 'Galletti Pizza',
        client_id: 'test-client-id'
      }
    },
    {
      id: 'customer_2',
      restaurant_id: 'rest_1',
      location_id: 'loc_2',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '(555) 234-5678',
      qr_code: 'QR002',
      stamps: 12,
      total_visits: 22,
      last_visit: '2024-01-21T18:45:00Z',
      customer_status: 'active',
      created_at: '2024-01-05T09:15:00Z',
      updated_at: '2024-01-21T18:45:00Z',
      location: {
        id: 'loc_2',
        name: 'Mall Location',
        address: '456 Mall Ave, Shopping Center, CA'
      },
      restaurant: {
        id: 'rest_1',
        name: 'Galletti Pizza',
        client_id: 'test-client-id'
      }
    },
    {
      id: 'customer_3',
      restaurant_id: 'rest_1',
      location_id: 'loc_1',
      name: 'Mike Wilson',
      email: 'mike.wilson@email.com',
      phone: '(555) 345-6789',
      qr_code: 'QR003',
      stamps: 3,
      total_visits: 5,
      last_visit: '2024-01-20T12:20:00Z',
      customer_status: 'active',
      created_at: '2024-01-18T16:30:00Z',
      updated_at: '2024-01-20T12:20:00Z',
      location: {
        id: 'loc_1',
        name: 'Main Street Store',
        address: '123 Main St, Downtown, CA'
      },
      restaurant: {
        id: 'rest_1',
        name: 'Galletti Pizza',
        client_id: 'test-client-id'
      }
    },
    {
      id: 'customer_4',
      restaurant_id: 'rest_1',
      location_id: 'loc_3',
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '(555) 456-7890',
      qr_code: 'QR004',
      stamps: 0,
      total_visits: 1,
      last_visit: '2024-01-19T11:10:00Z',
      customer_status: 'inactive',
      created_at: '2024-01-19T11:10:00Z',
      updated_at: '2024-01-19T11:10:00Z',
      location: {
        id: 'loc_3',
        name: 'Airport Branch',
        address: '789 Airport Rd, Terminal City, CA'
      },
      restaurant: {
        id: 'rest_1',
        name: 'Galletti Pizza',
        client_id: 'test-client-id'
      }
    },
    {
      id: 'customer_5',
      restaurant_id: 'rest_1',
      location_id: 'loc_2',
      name: 'Robert Brown',
      email: 'robert.brown@email.com',
      phone: '(555) 567-8901',
      qr_code: 'QR005',
      stamps: 15,
      total_visits: 28,
      last_visit: '2024-01-15T20:00:00Z',
      customer_status: 'blocked',
      created_at: '2023-12-01T10:00:00Z',
      updated_at: '2024-01-15T20:00:00Z',
      location: {
        id: 'loc_2',
        name: 'Mall Location',
        address: '456 Mall Ave, Shopping Center, CA'
      },
      restaurant: {
        id: 'rest_1',
        name: 'Galletti Pizza',
        client_id: 'test-client-id'
      }
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

  const fetchCustomers = async (filters: CustomerFilters = {}) => {
    const currentClientId = getCurrentClientId()
    if (!currentClientId) {
      setError('No client ID available')
      return
    }

    console.log('Fetching customers for client:', currentClientId, 'with filters:', filters)
    setLoading(true)
    setError(null)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // Apply filters to mock data
        let filteredCustomers = [...mockCustomers]
        
        if (filters.location_id) {
          filteredCustomers = filteredCustomers.filter(c => c.location_id === filters.location_id)
        }
        
        if (filters.status) {
          filteredCustomers = filteredCustomers.filter(c => c.customer_status === filters.status)
        }
        
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          filteredCustomers = filteredCustomers.filter(c => 
            c.name.toLowerCase().includes(searchLower) ||
            c.email?.toLowerCase().includes(searchLower) ||
            c.phone?.includes(filters.search!)
          )
        }
        
        // Apply pagination
        const limit = filters.limit || 50
        const offset = filters.offset || 0
        const paginatedCustomers = filteredCustomers.slice(offset, offset + limit)
        
        setCustomers(paginatedCustomers)
        setPagination({
          total: filteredCustomers.length,
          limit,
          offset,
          hasMore: filteredCustomers.length > offset + limit
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
        limit: (filters.limit || 50).toString(),
        offset: (filters.offset || 0).toString()
      })

      if (filters.location_id) params.append('location_id', filters.location_id)
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)

      console.log('Making request to:', `${EDGE_FUNCTION_URL}?${params}`)
      
      const response = await fetch(`${EDGE_FUNCTION_URL}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)

      // Check if response is HTML (404 page) instead of JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        console.error('Non-JSON response received:', textResponse.substring(0, 200))
        throw new Error('Edge Function not found or not deployed. Please check if the customer-manager function is deployed.')
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch customers')
      }

      setCustomers(result.data || [])
      setPagination(result.pagination || { total: 0, limit: 50, offset: 0, hasMore: false })
    } catch (err) {
      console.error('Customer fetch error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers'
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

  const fetchCustomerById = async (customerId: string): Promise<Customer | null> => {
    const currentClientId = getCurrentClientId()
    if (!currentClientId) {
      toast({
        title: "Error",
        description: "No client ID available",
        variant: "destructive"
      })
      return null
    }

    setLoading(true)
    setError(null)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600))
        
        const customer = mockCustomers.find(c => c.id === customerId)
        if (!customer) {
          throw new Error('Customer not found')
        }
        
        // Add mock recent activity
        const customerWithActivity = {
          ...customer,
          recent_stamps: [
            {
              id: 'stamp_1',
              amount: 2,
              notes: 'Large pizza purchase',
              created_at: '2024-01-22T14:30:00Z',
              added_by_name: 'Store Manager'
            },
            {
              id: 'stamp_2',
              amount: 1,
              notes: 'Drink purchase',
              created_at: '2024-01-20T12:15:00Z',
              added_by_name: 'Cashier'
            }
          ],
          recent_rewards: [
            {
              id: 'reward_1',
              stamps_used: 10,
              description: 'Free medium pizza',
              value: 15.99,
              created_at: '2024-01-18T19:45:00Z',
              redeemed_by_name: 'Store Manager'
            }
          ]
        }
        
        return customerWithActivity
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${EDGE_FUNCTION_URL}?client_id=${currentClientId}&customer_id=${customerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch customer')
      }

      return result.data
    } catch (err) {
      console.error('Customer fetch error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customer'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateCustomer = async (customerId: string, updateData: UpdateCustomerData): Promise<boolean> => {
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
        
        setCustomers(prev => prev.map(customer => 
          customer.id === customerId ? { ...customer, ...updateData, updated_at: new Date().toISOString() } : customer
        ))
        
        toast({
          title: "Success",
          description: "Customer updated successfully (Mock Mode)"
        })
        
        return true
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${EDGE_FUNCTION_URL}?customer_id=${customerId}&client_id=${currentClientId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update customer')
      }

      // Update the customer in the list
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId ? { ...customer, ...result.data } : customer
      ))

      toast({
        title: "Success",
        description: result.message || "Customer updated successfully"
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update customer'
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
    fetchCustomers()
  }, [clientId])

  return {
    customers,
    loading,
    error,
    pagination,
    fetchCustomers,
    fetchCustomerById,
    updateCustomer,
    refetch: () => fetchCustomers()
  }
} 
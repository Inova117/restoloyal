import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface StaffMember {
  id: string
  user_id: string
  email: string
  full_name?: string
  role: 'client_admin' | 'restaurant_admin' | 'location_staff'
  client_id: string
  restaurant_id?: string
  restaurant_name?: string
  location_id?: string
  location_name?: string
  location_address?: string
  status: 'active' | 'suspended' | 'pending'
  invited_at: string
  last_login?: string
}

export interface InviteStaffData {
  email: string
  full_name?: string
  role: 'client_admin' | 'restaurant_admin' | 'location_staff'
  restaurant_id?: string
  location_id?: string
}

export interface UpdateStaffData {
  role?: 'client_admin' | 'restaurant_admin' | 'location_staff'
  restaurant_id?: string
  location_id?: string
  status?: 'active' | 'suspended' | 'pending'
}

// Get the Supabase URL for Edge Functions - verification moved inside functions
const getSupabaseURL = (): string => {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  if (!SUPABASE_URL) {
    throw new Error('VITE_SUPABASE_URL environment variable is required');
  }
  return SUPABASE_URL;
};

const getStaffURL = () => `${getSupabaseURL()}/functions/v1/staff-manager`;

// Temporary mock mode for testing (set to false when Edge Function is deployed)
const MOCK_MODE = true

export function useStaffManager(clientId?: string) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Mock data for testing
  const mockStaff: StaffMember[] = [
    {
      id: 'staff_1',
      user_id: 'user_1',
      email: 'john.manager@galletti.com',
      full_name: 'John Manager',
      role: 'client_admin',
      client_id: 'test-client-id',
      status: 'active',
      invited_at: '2024-01-15T10:30:00Z',
      last_login: '2024-01-20T14:22:00Z'
    },
    {
      id: 'staff_2',
      user_id: 'user_2',
      email: 'sarah.supervisor@galletti.com',
      full_name: 'Sarah Supervisor',
      role: 'restaurant_admin',
      client_id: 'test-client-id',
      restaurant_id: 'rest_1',
      restaurant_name: 'Downtown Location',
      status: 'active',
      invited_at: '2024-01-16T09:15:00Z',
      last_login: '2024-01-21T11:30:00Z'
    },
    {
      id: 'staff_3',
      user_id: 'user_3',
      email: 'mike.staff@galletti.com',
      full_name: 'Mike Staff',
      role: 'location_staff',
      client_id: 'test-client-id',
      location_id: 'loc_1',
      location_name: 'Main Street Store',
      location_address: '123 Main St, City, State',
      status: 'active',
      invited_at: '2024-01-17T14:45:00Z',
      last_login: '2024-01-22T08:15:00Z'
    },
    {
      id: 'staff_4',
      user_id: 'user_4',
      email: 'pending.user@galletti.com',
      full_name: 'Pending User',
      role: 'location_staff',
      client_id: 'test-client-id',
      location_id: 'loc_2',
      location_name: 'Mall Location',
      location_address: '456 Mall Ave, City, State',
      status: 'pending',
      invited_at: '2024-01-22T16:20:00Z'
    }
  ]

  // Get current client ID from session or props
  const getCurrentClientId = (): string | null => {
    if (clientId) return clientId
    
    // Try to get from session storage (when viewing as admin)
    const viewingClient = sessionStorage.getItem('viewing_client')
    if (viewingClient) return viewingClient
    
    // For testing purposes, return a hardcoded client ID if none found
    // TODO: Replace with proper client ID detection from user context
    console.log('No client ID found, using fallback for testing')
    return 'test-client-id'
  }

  const fetchStaff = async () => {
    const currentClientId = getCurrentClientId()
    if (!currentClientId) {
      setError('No client ID available')
      return
    }

    console.log('Fetching staff for client:', currentClientId)
    setLoading(true)
    setError(null)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800))
        setStaff(mockStaff)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

              const STAFF_URL = getStaffURL();
        console.log('Making request to:', `${STAFF_URL}?client_id=${currentClientId}`)
        
        const response = await fetch(`${STAFF_URL}?client_id=${currentClientId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      // Check if response is HTML (404 page) instead of JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        console.error('Non-JSON response received:', textResponse.substring(0, 200))
        throw new Error('Edge Function not found or not deployed. Please check if the staff-manager function is deployed.')
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch staff')
      }

      setStaff(result.data || [])
    } catch (err) {
      console.error('Staff fetch error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch staff'
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

  const inviteStaff = async (staffData: InviteStaffData): Promise<boolean> => {
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
        
        const newStaff: StaffMember = {
          id: `staff_${Date.now()}`,
          user_id: `user_${Date.now()}`,
          email: staffData.email,
          full_name: staffData.full_name || '',
          role: staffData.role,
          client_id: currentClientId,
          restaurant_id: staffData.restaurant_id,
          location_id: staffData.location_id,
          status: 'pending',
          invited_at: new Date().toISOString()
        }
        
        setStaff(prev => [newStaff, ...prev])
        
        toast({
          title: "Success",
          description: "Staff member invited successfully (Mock Mode)"
        })
        
        return true
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...staffData,
          client_id: currentClientId
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to invite staff member')
      }

      // Add the new staff member to the list
      setStaff(prev => [result.data, ...prev])

      toast({
        title: "Success",
        description: result.message || "Staff member invited successfully"
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite staff member'
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

  const updateStaff = async (staffId: string, updateData: UpdateStaffData): Promise<boolean> => {
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
        
        setStaff(prev => prev.map(member => 
          member.id === staffId ? { ...member, ...updateData } : member
        ))
        
        toast({
          title: "Success",
          description: "Staff member updated successfully (Mock Mode)"
        })
        
        return true
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${EDGE_FUNCTION_URL}?staff_id=${staffId}&client_id=${currentClientId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update staff member')
      }

      // Update the staff member in the list
      setStaff(prev => prev.map(member => 
        member.id === staffId ? { ...member, ...result.data } : member
      ))

      toast({
        title: "Success",
        description: result.message || "Staff member updated successfully"
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update staff member'
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

  const removeStaff = async (staffId: string): Promise<boolean> => {
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
        await new Promise(resolve => setTimeout(resolve, 600))
        
        setStaff(prev => prev.filter(member => member.id !== staffId))
        
        toast({
          title: "Success",
          description: "Staff member removed successfully (Mock Mode)"
        })
        
        return true
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${EDGE_FUNCTION_URL}?staff_id=${staffId}&client_id=${currentClientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove staff member')
      }

      // Remove the staff member from the list
      setStaff(prev => prev.filter(member => member.id !== staffId))

      toast({
        title: "Success",
        description: result.message || "Staff member removed successfully"
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove staff member'
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
    fetchStaff()
  }, [clientId])

  return {
    staff,
    loading,
    error,
    fetchStaff,
    inviteStaff,
    updateStaff,
    removeStaff
  }
} 
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface Location {
  id: string
  restaurant_id: string
  name: string
  address: string
  city: string
  state: string
  zip_code?: string
  phone?: string
  manager_name?: string
  manager_email?: string
  is_active: boolean
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
  restaurants?: {
    id: string
    name: string
    client_id: string
  }
}

export interface LocationCreate {
  restaurant_id: string
  name: string
  address: string
  city: string
  state: string
  zip_code?: string
  phone?: string
  manager_name?: string
  manager_email?: string
  latitude?: number
  longitude?: number
}

export interface LocationUpdate {
  name?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  phone?: string
  manager_name?: string
  manager_email?: string
  is_active?: boolean
  latitude?: number
  longitude?: number
}

// Temporary mock mode for testing (set to false when Edge Function is deployed)
const MOCK_MODE = false

export function useLocationManager(clientId?: string) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Mock data for testing
  const mockLocations: Location[] = [
    {
      id: 'loc_1',
      restaurant_id: 'rest_1',
      name: 'Main Street Store',
      address: '123 Main St',
      city: 'Downtown',
      state: 'CA',
      zip_code: '90210',
      phone: '(555) 123-4567',
      manager_name: 'John Manager',
      manager_email: 'john@galletti.com',
      is_active: true,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-20T14:22:00Z',
      restaurants: {
        id: 'rest_1',
        name: 'Galletti Pizza',
        client_id: 'test-client-id'
      }
    },
    {
      id: 'loc_2',
      restaurant_id: 'rest_1',
      name: 'Mall Location',
      address: '456 Mall Ave',
      city: 'Shopping Center',
      state: 'CA',
      zip_code: '90211',
      phone: '(555) 234-5678',
      manager_name: 'Sarah Manager',
      manager_email: 'sarah@galletti.com',
      is_active: true,
      created_at: '2024-01-16T09:15:00Z',
      updated_at: '2024-01-21T11:30:00Z',
      restaurants: {
        id: 'rest_1',
        name: 'Galletti Pizza',
        client_id: 'test-client-id'
      }
    },
    {
      id: 'loc_3',
      restaurant_id: 'rest_1',
      name: 'Airport Branch',
      address: '789 Airport Rd',
      city: 'Terminal City',
      state: 'CA',
      zip_code: '90212',
      phone: '(555) 345-6789',
      manager_name: 'Mike Manager',
      manager_email: 'mike@galletti.com',
      is_active: true,
      created_at: '2024-01-17T14:45:00Z',
      updated_at: '2024-01-22T08:15:00Z',
      restaurants: {
        id: 'rest_1',
        name: 'Galletti Pizza',
        client_id: 'test-client-id'
      }
    }
  ]

  // Fetch all locations for the client
  const fetchLocations = async (id?: string) => {
    const targetClientId = id || clientId
    if (!targetClientId) {
      setError('Client ID is required')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600))
        setLocations(mockLocations)
        return mockLocations
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/location-manager?client_id=${targetClientId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch locations')
      }

      setLocations(result.data || [])
      return result.data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch locations'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      return []
    } finally {
      setLoading(false)
    }
  }

  // Create a new location
  const createLocation = async (locationData: LocationCreate, id?: string) => {
    const targetClientId = id || clientId
    if (!targetClientId) {
      setError('Client ID is required')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // DIRECT DATABASE INSERT – bypass Edge Function
      const currentUser = await supabase.auth.getUser()
      if (!currentUser.data.user) {
        throw new Error('Not authenticated')
      }

      const insertData = {
        ...locationData,
        client_id: targetClientId,
        is_active: true
      }

      const { data: newLocation, error: insertError } = await supabase
        .from('locations')
        .insert([insertData])
        .select('*')
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      setLocations(prev => [...prev, newLocation as unknown as Location])

      toast({
        title: 'Location Created',
        description: `${newLocation.name} added successfully.`
      })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create location'
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

  // Update an existing location
  const updateLocation = async (locationId: string, updates: LocationUpdate, id?: string) => {
    const targetClientId = id || clientId
    if (!targetClientId) {
      setError('Client ID is required')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/location-manager?client_id=${targetClientId}&location_id=${locationId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates)
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update location')
      }

      // Update the location in the list
      setLocations(prev => 
        prev.map(location => 
          location.id === locationId ? result.data : location
        )
      )
      
      toast({
        title: "Success",
        description: result.message || "Location updated successfully"
      })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update location'
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

  // Delete a location
  const deleteLocation = async (locationId: string, id?: string) => {
    const targetClientId = id || clientId
    if (!targetClientId) {
      setError('Client ID is required')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/location-manager?client_id=${targetClientId}&location_id=${locationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete location')
      }

      // Remove the location from the list
      setLocations(prev => prev.filter(location => location.id !== locationId))
      
      toast({
        title: "Success",
        description: result.message || "Location deleted successfully"
      })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete location'
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

  // Auto-fetch locations when clientId changes
  useEffect(() => {
    if (clientId) {
      fetchLocations(clientId)
    }
  }, [clientId])

  return {
    locations,
    loading,
    error,
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    refetch: () => fetchLocations(clientId)
  }
}

// Helper hook to get available restaurants for a client
export function useClientRestaurants(clientId?: string) {
  const [restaurants, setRestaurants] = useState<Array<{id: string, name: string}>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!clientId) return

      setLoading(true)
      try {
        // Use the Edge Function approach to avoid TypeScript type issues
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        // For now, return empty array - this can be implemented as a separate endpoint
        // or the restaurants can be passed as props from the parent component
        setRestaurants([])
        
        // TODO: Implement restaurants endpoint or pass restaurants as props
        console.log('Fetching restaurants for client:', clientId)
      } catch (error) {
        console.error('Error fetching restaurants:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [clientId])

  return { restaurants, loading }
} 
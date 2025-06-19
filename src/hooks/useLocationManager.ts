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
  client_id?: string
  restaurant_id?: string // optional legacy field
  name: string
  address: string
  city: string
  state: string
  zip_code?: string
  phone?: string
  email?: string
  manager_name?: string
  latitude?: number
  longitude?: number
  settings?: any
}

export interface LocationUpdate {
  name?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string // Match actual DB schema
  phone?: string
  manager_name?: string
  email?: string // Match actual DB schema
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

  // Fetch all locations for the client - USE DIRECT DATABASE ACCESS
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

      // First, verify the user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Check if user is a superadmin first
      const { data: superadminData } = await supabase
        .from('superadmins')
        .select('id, email')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      let isSuperadmin = !!superadminData

      // If not superadmin, check if user is client admin for the target client
      if (!isSuperadmin) {
        const { data: clientAdmin, error: adminError } = await supabase
          .from('client_admins')
          .select('id, client_id')
          .eq('user_id', user.id)
          .eq('client_id', targetClientId)
          .eq('is_active', true)
          .single()

        if (adminError || !clientAdmin) {
          throw new Error('Access denied: You are not an admin for this client')
        }
      }

      // Now fetch locations - superadmins can see all, client admins see their client's
      let query = supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      // If not superadmin, filter by client_id
      if (!isSuperadmin) {
        query = query.eq('client_id', targetClientId)
      }

      const { data: locationsData, error: fetchError } = await query

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      // Transform data to match Location interface
      const transformedLocations = (locationsData || []).map(loc => ({
        id: loc.id,
        restaurant_id: loc.client_id, // Map client_id to restaurant_id for compatibility
        name: loc.name,
        address: loc.address,
        city: loc.city,
        state: loc.state || '',
        zip_code: (loc as any).zip_code ?? (loc as any).postal_code,
        phone: loc.phone,
        manager_name: loc.manager_name,
        manager_email: loc.email,
        is_active: loc.is_active,
        latitude: undefined, // Not in current schema
        longitude: undefined, // Not in current schema
        created_at: loc.created_at,
        updated_at: loc.updated_at,
        restaurants: {
          id: loc.client_id,
          name: 'Restaurant', // Placeholder - can be enhanced later
          client_id: loc.client_id
        }
      })) as Location[]

      setLocations(transformedLocations)
      return transformedLocations
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

  // Create a new location - USE DIRECT DATABASE ACCESS WITH VALIDATION
  const createLocation = async (locationData: LocationCreate, id?: string) => {
    const targetClientId = id || clientId
    if (!targetClientId) {
      setError('Client ID is required')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Check if user is a superadmin first
      const { data: superadminData } = await supabase
        .from('superadmins')
        .select('id, email')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      let isSuperadmin = !!superadminData
      let clientAdminId: string

      if (isSuperadmin) {
        // Superadmins can create locations for any client
        // We need to find any active client admin for this client to use as created_by_client_admin_id
        const { data: anyClientAdmin } = await supabase
          .from('client_admins')
          .select('id')
          .eq('client_id', targetClientId)
          .eq('is_active', true)
          .limit(1)
          .single()

        clientAdminId = anyClientAdmin ? anyClientAdmin.id : null as unknown as string
      } else {
        // Verify user is client admin for this client and get admin ID
        const { data: clientAdmin, error: adminError } = await supabase
          .from('client_admins')
          .select('id, client_id')
          .eq('user_id', user.id)
          .eq('client_id', targetClientId)
          .eq('is_active', true)
          .single()

        if (adminError || !clientAdmin) {
          throw new Error('Access denied: Only client admins can create locations')
        }
        clientAdminId = clientAdmin.id
      }

      // Validate required fields
      if (!locationData.name || !locationData.address || !locationData.city || !locationData.state) {
        throw new Error('Missing required fields: name, address, city, state')
      }

      // Check if location name already exists for this client
      const { data: existingLocation } = await supabase
        .from('locations')
        .select('id, name')
        .eq('client_id', targetClientId)
        .eq('name', locationData.name)
        .single()

      if (existingLocation) {
        throw new Error(`Location with name '${locationData.name}' already exists for this client`)
      }

      // Prepare location data with proper hierarchy fields
      const insertData = {
        client_id: targetClientId,
        name: locationData.name,
        address: locationData.address,
        city: locationData.city,
        state: locationData.state,
        zip_code: locationData.zip_code || null,
        country: 'US',
        phone: locationData.phone || null,
        email: locationData.email || null,
        manager_name: locationData.manager_name || null,
        is_active: true,
        settings: locationData.settings || {
          pos_integration: true,
          qr_code_enabled: true,
          auto_stamp_on_purchase: true,
          require_customer_phone: false
        },
        created_by_client_admin_id: clientAdminId // This is required for RLS
      }

      // Create the location using service role to bypass RLS temporarily
      const { data: newLocation, error: insertError } = await supabase
        .from('locations')
        .insert([insertData])
        .select('*')
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      // Log the creation in audit log
      await supabase
        .from('hierarchy_audit_log')
        .insert([{
          violation_type: 'location_creation',
          attempted_action: isSuperadmin ? 'create_location_via_superadmin' : 'create_location_via_hook',
          user_id: user.id,
          target_table: 'locations',
          target_data: {
            location_id: newLocation.id,
            location_name: newLocation.name,
            client_id: targetClientId,
            created_by_client_admin: clientAdminId,
            created_by_superadmin: isSuperadmin
          },
          error_message: `Location created successfully via ${isSuperadmin ? 'superadmin' : 'client admin'}`
        }])

      // Refresh locations list to include the new location
      await fetchLocations(targetClientId)
      
      toast({
        title: 'Location Created',
        description: `Location '${locationData.name}' created successfully.`
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

  // Update an existing location - USE DIRECT DATABASE ACCESS
  const updateLocation = async (locationId: string, updates: LocationUpdate, id?: string) => {
    const targetClientId = id || clientId
    if (!targetClientId) {
      setError('Client ID is required')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Check if user is a superadmin first
      const { data: superadminData } = await supabase
        .from('superadmins')
        .select('id, email')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      let isSuperadmin = !!superadminData

      // If not superadmin, verify user is client admin for this client
      if (!isSuperadmin) {
        const { data: clientAdmin, error: adminError } = await supabase
          .from('client_admins')
          .select('id, client_id')
          .eq('user_id', user.id)
          .eq('client_id', targetClientId)
          .eq('is_active', true)
          .single()

        if (adminError || !clientAdmin) {
          throw new Error('Access denied: Only client admins can update locations')
        }
      }

      // Use direct database access - superadmins can update any location, client admins their client's locations
      let updateQuery = supabase
        .from('locations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', locationId)

      // If not superadmin, also filter by client_id
      if (!isSuperadmin) {
        updateQuery = updateQuery.eq('client_id', targetClientId)
        }

      const { data: updatedLocation, error: updateError } = await updateQuery
        .select('*')
        .single()

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Update the location in the list
      setLocations(prev => 
        prev.map(location => 
          location.id === locationId ? {
            ...location,
            ...updates,
            updated_at: updatedLocation.updated_at
          } : location
        )
      )
      
      toast({
        title: "Success",
        description: "Location updated successfully"
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

  // Delete a location - USE DIRECT DATABASE ACCESS (soft delete)
  const deleteLocation = async (locationId: string, id?: string) => {
    const targetClientId = id || clientId
    if (!targetClientId) {
      setError('Client ID is required')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Check if user is a superadmin first
      const { data: superadminData } = await supabase
        .from('superadmins')
        .select('id, email')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      let isSuperadmin = !!superadminData

      // If not superadmin, verify user is client admin for this client
      if (!isSuperadmin) {
        const { data: clientAdmin, error: adminError } = await supabase
          .from('client_admins')
          .select('id, client_id')
          .eq('user_id', user.id)
          .eq('client_id', targetClientId)
          .eq('is_active', true)
          .single()

        if (adminError || !clientAdmin) {
          throw new Error('Access denied: Only client admins can delete locations')
        }
      }

      // Use direct database access - superadmins can delete any location, client admins their client's locations
      let deleteQuery = supabase
        .from('locations')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', locationId)

      // If not superadmin, also filter by client_id
      if (!isSuperadmin) {
        deleteQuery = deleteQuery.eq('client_id', targetClientId)
      }

      const { error: deleteError } = await deleteQuery

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      // Remove the location from the list
      setLocations(prev => prev.filter(location => location.id !== locationId))
      
      toast({
        title: "Success",
        description: "Location deleted successfully"
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
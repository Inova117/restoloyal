import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface ClientProfile {
  id: string
  name: string
  logo?: string
  theme?: {
    primary_color: string
    secondary_color: string
    accent_color: string
  }
  contact_email: string
  contact_phone?: string
  billing_address?: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  plan: 'trial' | 'business' | 'enterprise'
  status: 'active' | 'suspended' | 'trial'
  created_at: string
  updated_at: string
}

export interface ClientProfileUpdate {
  name?: string
  logo?: string
  theme?: {
    primary_color: string
    secondary_color: string
    accent_color: string
  }
  contact_email?: string
  contact_phone?: string
  billing_address?: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
}

export function useClientProfile(clientId?: string) {
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch client profile
  const fetchProfile = async (id?: string) => {
    const targetClientId = id || clientId
    if (!targetClientId) {
      setError('Client ID is required')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/Client-Profile?client_id=${targetClientId}`,
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
        throw new Error(result.error || 'Failed to fetch profile')
      }

      setProfile(result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile'
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

  // Update client profile
  const updateProfile = async (updates: ClientProfileUpdate, id?: string) => {
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/Client-Profile`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: targetClientId,
            ...updates
          })
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile')
      }

      setProfile(result.data)
      toast({
        title: "Success",
        description: result.message || "Profile updated successfully"
      })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
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

  // Auto-fetch profile when clientId changes
  useEffect(() => {
    if (clientId) {
      fetchProfile(clientId)
    }
  }, [clientId])

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    refetch: () => fetchProfile(clientId)
  }
}

// Helper hook to get current user's client ID (for client admins)
export function useCurrentClientId() {
  const [clientId, setClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getCurrentClientId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // For now, use session storage approach since TypeScript types need updating
        // The Edge Function will handle the proper authorization check
        const storedClientId = sessionStorage.getItem('current_client_id')
        if (storedClientId) {
          setClientId(storedClientId)
        }

        // TODO: Once Supabase types are updated, we can use direct queries:
        // const { data: userRole } = await supabase.rpc('get_user_client_id', { user_id: user.id })
        
      } catch (error) {
        console.error('Error fetching client ID:', error)
        // Fallback to session storage
        const storedClientId = sessionStorage.getItem('current_client_id')
        if (storedClientId) {
          setClientId(storedClientId)
        }
      } finally {
        setLoading(false)
      }
    }

    getCurrentClientId()
  }, [])

  return { clientId, loading }
} 
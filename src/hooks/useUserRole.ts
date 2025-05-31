import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export type UserRole = 
  | 'zerion_admin'          // ZerionCore platform admin - sees EVERYTHING
  | 'galletti_hq'           // Galletti corporate - sees all Galletti restaurants
  | 'restaurant_owner'      // Individual restaurant owner - sees their locations
  | 'location_staff'        // Staff at specific location - simple POS interface

export interface UserPermissions {
  // Access levels
  canViewAllClients: boolean        // ZerionCore only
  canViewAllRestaurants: boolean    // Galletti HQ and ZerionCore
  canViewOwnRestaurant: boolean     // Restaurant owners
  canViewLocationOnly: boolean      // Location staff
  
  // Specific permissions
  canManageClients: boolean
  canAddStamps: boolean
  canRedeemRewards: boolean
  canViewAnalytics: boolean
  canManageLocations: boolean
  canAccessCorporateData: boolean
  canManagePlatform: boolean        // ZerionCore only
  
  // Assigned access
  clientId?: string                 // For Galletti HQ
  restaurantId?: string
  locationId?: string
}

export interface UserRoleData {
  role: UserRole
  permissions: UserPermissions
  isLoading: boolean
  clientName?: string
  restaurantName?: string
}

export function useUserRole(): UserRoleData {
  const { user } = useAuth()
  const [roleData, setRoleData] = useState<UserRoleData>({
    role: 'location_staff',
    permissions: {
      canViewAllClients: false,
      canViewAllRestaurants: false,
      canViewOwnRestaurant: false,
      canViewLocationOnly: false,
      canManageClients: false,
      canAddStamps: false,
      canRedeemRewards: false,
      canViewAnalytics: false,
      canManageLocations: false,
      canAccessCorporateData: false,
      canManagePlatform: false
    },
    isLoading: true
  })

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRoleData(prev => ({ ...prev, isLoading: false }))
        return
      }

      try {
        // Check if user is ZerionCore admin (platform owner)
        const zerionAdminEmails = ['admin@zerioncore.com', 'platform@zerioncore.com', 'owner@zerioncore.com', 'martin@zerionstudio.com']
        if (zerionAdminEmails.includes(user.email || '')) {
          setRoleData({
            role: 'zerion_admin',
            permissions: {
              canViewAllClients: true,
              canViewAllRestaurants: true,
              canViewOwnRestaurant: false,
              canViewLocationOnly: false,
              canManageClients: true,
              canAddStamps: true,
              canRedeemRewards: true,
              canViewAnalytics: true,
              canManageLocations: true,
              canAccessCorporateData: true,
              canManagePlatform: true
            },
            isLoading: false,
            clientName: 'ZerionCore Platform'
          })
          return
        }

        // Check if user is Galletti HQ
        const gallettiHQEmails = ['admin@galletti.com', 'corporate@galletti.com', 'hq@galletti.com']
        if (gallettiHQEmails.includes(user.email || '')) {
          setRoleData({
            role: 'galletti_hq',
            permissions: {
              canViewAllClients: false,
              canViewAllRestaurants: true,
              canViewOwnRestaurant: false,
              canViewLocationOnly: false,
              canManageClients: false,
              canAddStamps: false,
              canRedeemRewards: false,
              canViewAnalytics: true,
              canManageLocations: true,
              canAccessCorporateData: true,
              canManagePlatform: false,
              clientId: 'galletti'
            },
            isLoading: false,
            clientName: 'Galletti Restaurant Group'
          })
          return
        }

        // Check if user owns a restaurant
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('id, name')
          .eq('user_id', user.id)
          .maybeSingle()

        if (restaurant) {
          // User is a restaurant owner
          setRoleData({
            role: 'restaurant_owner',
            permissions: {
              canViewAllClients: false,
              canViewAllRestaurants: false,
              canViewOwnRestaurant: true,
              canViewLocationOnly: false,
              canManageClients: true,
              canAddStamps: true,
              canRedeemRewards: true,
              canViewAnalytics: true,
              canManageLocations: true,
              canAccessCorporateData: false,
              canManagePlatform: false,
              restaurantId: restaurant.id
            },
            isLoading: false,
            restaurantName: restaurant.name
          })
          return
        }

        // Default to location staff (would check location assignment in real app)
        setRoleData({
          role: 'location_staff',
          permissions: {
            canViewAllClients: false,
            canViewAllRestaurants: false,
            canViewOwnRestaurant: false,
            canViewLocationOnly: true,
            canManageClients: true,
            canAddStamps: true,
            canRedeemRewards: true,
            canViewAnalytics: false,
            canManageLocations: false,
            canAccessCorporateData: false,
            canManagePlatform: false,
            locationId: 'location_1' // Would be assigned in real app
          },
          isLoading: false
        })

      } catch (error) {
        console.error('Error fetching user role:', error)
        setRoleData(prev => ({ ...prev, isLoading: false }))
      }
    }

    fetchUserRole()
  }, [user])

  return roleData
}

export function getRoleDisplayName(role: UserRole): string {
  const roleNames = {
    zerion_admin: 'ZerionCore Admin',
    galletti_hq: 'Galletti Corporate',
    restaurant_owner: 'Restaurant Owner',
    location_staff: 'Location Staff'
  }
  
  return roleNames[role] || 'Staff'
}

export function getAvailableTabs(role: UserRole): string[] {
  switch (role) {
    case 'zerion_admin':
      return ['platform', 'clients', 'analytics'] // Platform management
    
    case 'galletti_hq':
      return ['galletti_hq'] // Only corporate dashboard
    
    case 'restaurant_owner':
      return ['dashboard', 'clients', 'analytics', 'referrals', 'geopush', 'locations'] // Full restaurant management
    
    case 'location_staff':
      return ['pos'] // Simple POS interface
    
    default:
      return ['pos']
  }
} 
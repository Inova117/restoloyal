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
  isViewingAsAdmin?: boolean        // New flag to indicate super admin is viewing client dashboard
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
        // Check if super admin is viewing a client dashboard
        const isAdminContext = sessionStorage.getItem('zerion_admin_context') === 'true'
        const tempRole = sessionStorage.getItem('temp_role') as UserRole
        const viewingClient = sessionStorage.getItem('viewing_client')
        const tempClientName = sessionStorage.getItem('temp_client_name')

        // Check if client HQ is viewing a location dashboard
        const isLocationContext = sessionStorage.getItem('galletti_hq_context') === 'true'
        const viewingLocation = sessionStorage.getItem('viewing_location')
        const tempLocationName = sessionStorage.getItem('temp_location_name')
        const tempLocationId = sessionStorage.getItem('temp_location_id')

        // Check if user is forcing client admin view
        const forceClientAdmin = sessionStorage.getItem('force_client_admin') === 'true'

        // Debug logging
        console.log('Role detection debug:', {
          isLocationContext,
          tempRole,
          viewingLocation,
          tempLocationName,
          tempLocationId,
          userEmail: user.email,
          forceClientAdmin,
          userMetadata: user.user_metadata
        })

        // Force client admin view if requested and user has permission
        if (forceClientAdmin && user.user_metadata?.role === 'client_admin') {
          console.log('Forcing client admin view')
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
              canManagePlatform: false
            },
            isLoading: false,
            clientName: user.user_metadata?.client_name || 'Client Dashboard'
          })
          return
        }

        // Check if user is ZerionCore admin (platform owner)
        const zerionAdminEmails = ['admin@zerioncore.com', 'platform@zerioncore.com', 'owner@zerioncore.com', 'martin@zerionstudio.com']
        const isZerionAdmin = zerionAdminEmails.includes(user.email || '')

        // Check if user is Galletti HQ
        const gallettiHQEmails = ['admin@galletti.com', 'corporate@galletti.com', 'hq@galletti.com']
        const isGallettiHQ = gallettiHQEmails.includes(user.email || '')

        // Handle location view context (client HQ viewing location) - CHECK THIS FIRST
        if (isLocationContext && tempRole === 'location_staff' && (isGallettiHQ || isZerionAdmin)) {
          console.log('Detected location context, switching to location staff view')
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
              locationId: tempLocationId || 'location_1'
            },
            isLoading: false,
            restaurantName: tempLocationName || 'Location Dashboard',
            isViewingAsAdmin: true
          })
          return
        }

        if (isAdminContext && tempRole && isZerionAdmin) {
          // Super admin is viewing a client dashboard
          if (tempRole === 'galletti_hq') {
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
              clientName: 'Galletti Restaurant Group',
              isViewingAsAdmin: true
            })
            return
          } else if (tempRole === 'restaurant_owner') {
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
                restaurantId: 'demo_restaurant'
              },
              isLoading: false,
              restaurantName: tempClientName || 'Demo Restaurant',
              isViewingAsAdmin: true
            })
            return
          }
        }

        if (isZerionAdmin) {
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

        // Check if user has roles in user_roles table - general solution
        try {
          const userRolesResponse = await (supabase as any).from('user_roles').select('*').eq('user_id', user.id).eq('status', 'active')
          const userRoles = userRolesResponse.data
          
          console.log('User roles query result:', userRolesResponse)
          console.log('User metadata:', user.user_metadata)

          if (userRoles && userRoles.length > 0) {
            // Check if user has client_admin role
            const clientAdminRole = userRoles.find((role: any) => role.role === 'client_admin')
            
            if (clientAdminRole) {
              console.log('Found client_admin role in user_roles table')
              setRoleData({
                role: 'galletti_hq', // Use galletti_hq layout for client_admin
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
                  canManagePlatform: false
                },
                isLoading: false,
                clientName: 'Client Dashboard'
              })
              return
            }
          }

          // Fallback: Check user metadata for client_admin role
          if (user.user_metadata?.role === 'client_admin') {
            console.log('Found client_admin role in user metadata')
            setRoleData({
              role: 'galletti_hq', // Use galletti_hq layout for client_admin
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
                canManagePlatform: false
              },
              isLoading: false,
              clientName: user.user_metadata?.client_name || 'Client Dashboard'
            })
            return
          }
        } catch (error) {
          console.log('Error checking user roles:', error)
        }

        // Default to location staff
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
            canManagePlatform: false
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

export function returnToPlatform(): void {
  // Clear temporary role data and return to platform
  sessionStorage.removeItem('zerion_admin_context')
  sessionStorage.removeItem('temp_role')
  sessionStorage.removeItem('viewing_client')
  sessionStorage.removeItem('temp_client_name')
  sessionStorage.removeItem('galletti_hq_context')
  sessionStorage.removeItem('viewing_location')
  sessionStorage.removeItem('temp_location_name')
  sessionStorage.removeItem('temp_location_id')
  sessionStorage.removeItem('temp_restaurant_id')
  sessionStorage.removeItem('force_client_admin')
  window.location.reload()
}

export function returnToHQ(): void {
  // Clear location context and return to client HQ
  sessionStorage.removeItem('galletti_hq_context')
  sessionStorage.removeItem('temp_role')
  sessionStorage.removeItem('viewing_location')
  sessionStorage.removeItem('temp_location_name')
  sessionStorage.removeItem('temp_location_id')
  sessionStorage.removeItem('temp_restaurant_id')
  window.location.reload()
}

export function switchToLocationView(locationData: {
  locationId: string
  locationName: string
  restaurantId: string
  role: UserRole
}): void {
  // Set session storage for location view context
  sessionStorage.setItem('galletti_hq_context', 'true')
  sessionStorage.setItem('temp_role', 'location_staff')
  sessionStorage.setItem('viewing_location', locationData.locationId)
  sessionStorage.setItem('temp_location_name', locationData.locationName)
  sessionStorage.setItem('temp_location_id', locationData.locationId)
  sessionStorage.setItem('temp_restaurant_id', locationData.restaurantId)
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
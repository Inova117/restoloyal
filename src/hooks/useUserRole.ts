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

// ============================================================================
// 🔒 SECURITY FIX: Dynamic role detection with SAFE FALLBACKS
// ============================================================================

/**
 * Check if user is a platform admin via multiple fallback mechanisms
 * SAFE MIGRATION: Prevents total access loss
 */
function checkPlatformAdminRole(userEmail: string): boolean {
  // Method 1: Environment variables (preferred)
  const adminEmailsEnv = import.meta.env.VITE_PLATFORM_ADMIN_EMAILS || ''
  const adminEmails = adminEmailsEnv.split(',').map((email: string) => email.trim()).filter(Boolean)
  
  if (adminEmails.length > 0) {
    if (adminEmails.includes(userEmail)) {
      return true
    }
  }
  
  // Method 2: Safe fallback to prevent total access loss
  // These emails maintain access during migration
  const emergencyAdmins = [
    'admin@zerioncore.com', 
    'platform@zerioncore.com', 
    'owner@zerioncore.com', 
    'martin@zerionstudio.com'
  ]
  
  if (emergencyAdmins.includes(userEmail)) {
    return true
  }
  
  return false
}

/**
 * Check if user is a client admin with safe fallbacks
 * SAFE MIGRATION: Maintains existing functionality
 */
function checkClientAdminRole(userEmail: string): { isClientAdmin: boolean, clientId?: string, clientName?: string } {
  // Method 1: Environment variables (preferred)
  const gallettiEmailsEnv = import.meta.env.VITE_GALLETTI_ADMIN_EMAILS || ''
  const gallettiEmails = gallettiEmailsEnv.split(',').map((email: string) => email.trim()).filter(Boolean)
  
  if (gallettiEmails.length > 0) {
    if (gallettiEmails.includes(userEmail)) {
      return {
        isClientAdmin: true,
        clientId: 'galletti',
        clientName: 'Galletti Restaurant Chain'
      }
    }
  }
  
  // Method 2: Safe fallback to prevent access loss
  const emergencyGallettiEmails = ['admin@galletti.com', 'corporate@galletti.com', 'hq@galletti.com']
  if (emergencyGallettiEmails.includes(userEmail)) {
    return {
      isClientAdmin: true,
      clientId: 'galletti',
      clientName: 'Galletti Restaurant Chain'
    }
  }

  return { isClientAdmin: false }
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
        // Check session flags first
        const isLocationContext = sessionStorage.getItem('galletti_hq_context') === 'true'
        const tempRole = sessionStorage.getItem('temp_role') as UserRole
        const tempLocationName = sessionStorage.getItem('temp_location_name')
        const tempLocationId = sessionStorage.getItem('temp_location_id')
        const forceClientAdmin = sessionStorage.getItem('force_client_admin') === 'true'
        const forceLocationStaff = sessionStorage.getItem('force_location_staff') === 'true'

        // Force location staff view if requested (return from client admin)
        if (forceLocationStaff && user.user_metadata?.role === 'client_admin') {
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
            isLoading: false,
            restaurantName: user.user_metadata?.client_name || 'Staff Dashboard'
          })
          return
        }

        // Force client admin view if requested and user has permission
        if (forceClientAdmin && user.user_metadata?.role === 'client_admin') {
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

        // 🔒 SECURITY FIX: Use environment-based role detection
        const isPlatformAdmin = checkPlatformAdminRole(user.email || '')
        const clientAdminCheck = checkClientAdminRole(user.email || '')

        // Handle location view context (client HQ viewing location)
        if (isLocationContext && tempRole === 'location_staff' && (clientAdminCheck.isClientAdmin || isPlatformAdmin)) {
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

        // Check admin context for platform admins
        const isAdminContext = sessionStorage.getItem('zerion_admin_context') === 'true'
        if (isAdminContext && tempRole && isPlatformAdmin) {
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
              clientName: sessionStorage.getItem('temp_client_name') || 'Client Dashboard',
              isViewingAsAdmin: true
            })
            return
          }
        }

        // Platform admin role
        if (isPlatformAdmin) {
          setRoleData({
            role: 'zerion_admin',
            permissions: {
              canViewAllClients: true,
              canViewAllRestaurants: true,
              canViewOwnRestaurant: true,
              canViewLocationOnly: true,
              canManageClients: true,
              canAddStamps: true,
              canRedeemRewards: true,
              canViewAnalytics: true,
              canManageLocations: true,
              canAccessCorporateData: true,
              canManagePlatform: true
            },
            isLoading: false
          })
          return
        }

        // Client admin role
        if (clientAdminCheck.isClientAdmin) {
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
              clientId: clientAdminCheck.clientId
            },
            isLoading: false,
            clientName: clientAdminCheck.clientName
          })
          return
        }

        // Check for restaurant ownership
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, name')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!restaurantError && restaurantData) {
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
              canManageLocations: false,
              canAccessCorporateData: false,
              canManagePlatform: false,
              restaurantId: restaurantData.id
            },
            isLoading: false,
            restaurantName: restaurantData.name
          })
          return
        }

        // Check user_roles table for existing system
        const { data: userRoleData, error: userRoleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!userRoleError && userRoleData && userRoleData.role === 'restaurant_admin') {
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
              canManageLocations: false,
              canAccessCorporateData: false,
              canManagePlatform: false
            },
            isLoading: false,
            restaurantName: 'My Restaurant'
          })
          return
        }

        // Check user metadata for client_admin fallback
        if (user.user_metadata?.role === 'client_admin') {
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
          isLoading: false,
          restaurantName: 'Staff Dashboard'
        })

      } catch (error) {
        // Secure fallback - never expose error details
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
          isLoading: false,
          restaurantName: 'Staff Dashboard'
        })
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
  sessionStorage.removeItem('force_location_staff')
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
  sessionStorage.removeItem('force_location_staff')
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
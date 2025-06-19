import { useState, useEffect } from 'react'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from '../contexts/AuthContext'
import type { UserTier, Superadmin, ClientAdmin, LocationStaff, Customer } from '../types/database'

export type UserRole = UserTier

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
  role: UserRole | null
  roleData: Superadmin | ClientAdmin | LocationStaff | Customer | null
  loading: boolean
  error: string | null
}

/**
 * TEMPORARY FIX: Check if user is a platform admin via safe fallbacks
 * This avoids database queries that might fail due to schema issues
 */
function checkPlatformAdminRole(userEmail: string): boolean {
  // Method 1: Environment variables (preferred)
  const adminEmailsEnv = import.meta.env.VITE_PLATFORM_ADMIN_EMAILS || ''
  const adminEmails = adminEmailsEnv.split(',').map((email: string) => email.trim()).filter(Boolean)
  
  if (adminEmails.length > 0 && adminEmails.includes(userEmail)) {
    return true
  }
  
  // Method 2: Safe fallback to prevent total access loss
  const emergencyAdmins = [
    'admin@zerioncore.com', 
    'platform@zerioncore.com', 
    'owner@zerioncore.com', 
    'martin@zerionstudio.com'
  ]
  
  return emergencyAdmins.includes(userEmail)
}

/**
 * TEMPORARY FIX: Check if user is a client admin with safe fallbacks
 */
function checkClientAdminRole(userEmail: string): { isClientAdmin: boolean, clientId?: string, clientName?: string } {
  // Method 1: Environment variables (preferred)
  const gallettiEmailsEnv = import.meta.env.VITE_GALLETTI_ADMIN_EMAILS || ''
  const gallettiEmails = gallettiEmailsEnv.split(',').map((email: string) => email.trim()).filter(Boolean)
  
  if (gallettiEmails.length > 0 && gallettiEmails.includes(userEmail)) {
    return {
      isClientAdmin: true,
      clientId: 'galletti',
      clientName: 'Galletti Restaurant Chain'
    }
  }
  
  // Method 2: Safe fallback
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

export const useUserRole = (): UserRoleData => {
  const { user } = useAuth()
  const [role, setRole] = useState<UserRole | null>(null)
  const [roleData, setRoleData] = useState<Superadmin | ClientAdmin | LocationStaff | Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const determineUserRole = async () => {
      if (!user) {
        setRole(null)
        setRoleData(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        console.log('🔍 TEMP FIX: Determining user role for:', user.email)

        // TEMPORARY FIX: Use email-based detection to avoid database schema issues
        if (checkPlatformAdminRole(user.email || '')) {
          console.log('✅ TEMP FIX: User identified as superadmin via email')
          setRole('superadmin')
          
          // Create mock superadmin data
          setRoleData({
            id: 'temp-superadmin-id',
            user_id: user.id,
            name: user.user_metadata?.name || user.email || 'Platform Admin',
            email: user.email || '',
            phone: null,
            is_active: true,
            last_login: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as Superadmin)
        } else {
          const clientCheck = checkClientAdminRole(user.email || '')
          if (clientCheck.isClientAdmin) {
            console.log('✅ TEMP FIX: User identified as client_admin via email')
            setRole('client_admin')
            
            // Create mock client admin data with all required properties
            setRoleData({
              id: 'temp-client-admin-id',
              user_id: user.id,
              client_id: clientCheck.clientId || 'galletti',
              name: user.user_metadata?.name || user.email || 'Client Admin',
              email: user.email || '',
              phone: null,
              is_active: true,
              permissions: {},
              created_by_superadmin_id: 'temp-superadmin-id',
              last_login: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as any) // Use any to bypass strict type checking for this temporary fix
          } else {
            console.log('⚠️ TEMP FIX: User role not recognized, defaulting to location_staff')
            setRole('location_staff')
            
            // Create mock location staff data with all required properties
            setRoleData({
              id: 'temp-staff-id',
              user_id: user.id,
              location_id: 'default-location',
              client_id: 'default-client',
              name: user.user_metadata?.name || user.email || 'Staff Member',
              email: user.email || '',
              phone: null,
              is_active: true,
              permissions: {},
              created_by_client_admin_id: 'temp-client-admin-id',
              last_login: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as any) // Use any to bypass strict type checking for this temporary fix
          }
        }

      } catch (error) {
        console.error('🚨 TEMP FIX: Error in role determination:', error)
        setError('Failed to determine user role')
        
        // Emergency fallback: if anything fails, at least give superadmin access to prevent lockout
        if (checkPlatformAdminRole(user.email || '')) {
          setRole('superadmin')
          setRoleData({
            id: 'emergency-superadmin-id',
            user_id: user.id,
            name: 'Emergency Admin',
            email: user.email || '',
            phone: null,
            is_active: true,
            last_login: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as Superadmin)
        }
      } finally {
        setLoading(false)
      }
    }

    determineUserRole()
  }, [user])

  return { role, roleData, loading, error }
}

// Helper functions remain the same as the original
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    superadmin: 'Platform Administrator',
    client_admin: 'Restaurant Chain Manager',
    location_staff: 'Location Staff',
    customer: 'Customer'
  }
  return roleNames[role] || 'Unknown Role'
}

export function returnToPlatform(): void {
  window.location.hash = '/platform'
}

export function returnToHQ(): void {
  window.location.hash = '/hq'
}

export function returnToLocation(): void {
  window.location.hash = '/location'
}

export function switchToLocationView(locationData: {
  locationId: string
  locationName: string
  restaurantId: string
  role: UserRole
}): void {
  const params = new URLSearchParams({
    locationId: locationData.locationId,
    locationName: locationData.locationName,
    restaurantId: locationData.restaurantId,
    role: locationData.role
  })
  window.location.hash = `/location?${params.toString()}`
}

export function getAvailableTabs(role: UserRole | null): string[] {
  if (!role) return []
  
  const tabsByRole: Record<UserRole, string[]> = {
    superadmin: ['analytics', 'clients', 'locations', 'staff', 'platform'],
    client_admin: ['analytics', 'locations', 'staff', 'customers'],
    location_staff: ['pos', 'customers', 'analytics'],
    customer: ['loyalty', 'rewards']
  }
  
  return tabsByRole[role] || []
}

export function canAccessFeature(role: UserRole | null, feature: string): boolean {
  if (!role) return false
  
  const featuresByRole: Record<UserRole, string[]> = {
    superadmin: ['all'],
    client_admin: ['manage_locations', 'view_analytics', 'manage_staff'],
    location_staff: ['add_stamps', 'redeem_rewards', 'view_customers'],
    customer: ['view_loyalty', 'redeem_rewards']
  }
  
  return featuresByRole[role]?.includes(feature) || featuresByRole[role]?.includes('all') || false
}

export function getUserClientContext(roleData: any): { clientId?: string; locationId?: string } {
  if (!roleData) return {}
  
  return {
    clientId: roleData.client_id,
    locationId: roleData.location_id
  }
} 
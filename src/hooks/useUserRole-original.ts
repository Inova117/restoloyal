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

        // Check user_roles table first for the most accurate role (with fallback handling)
        let userRoleData = null
        let userRoleError = null
        
        try {
          const result = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()
          
          userRoleData = result.data
          userRoleError = result.error
        } catch (err) {
          console.warn('user_roles table not accessible, using fallback detection:', err)
          userRoleError = err
        }

        if (userRoleData && !userRoleError) {
          const userTier = userRoleData.tier as UserTier
          setRole(userTier)

          // Fetch specific role data based on tier
          switch (userTier) {
            case 'superadmin':
              const { data: superadminData } = await supabase
                .from('superadmins')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .single()
              setRoleData(superadminData as Superadmin)
              break

            case 'client_admin':
              const { data: clientAdminData } = await supabase
                .from('client_admins')
                .select(`
                  *,
                  clients (
                    id,
                    name,
                    slug,
                    status
                  )
                `)
                .eq('user_id', user.id)
                .eq('is_active', true)
                .single()
              setRoleData(clientAdminData as ClientAdmin)
              break

            case 'location_staff':
              const { data: locationStaffData } = await supabase
                .from('location_staff')
                .select(`
                  *,
                  locations (
                    id,
                    name,
                    client_id,
                    is_active
                  ),
                  clients (
                    id,
                    name,
                    slug
                  )
                `)
                .eq('user_id', user.id)
                .eq('is_active', true)
                .single()
              setRoleData(locationStaffData as LocationStaff)
              break

            case 'customer':
              const { data: customerData } = await supabase
                .from('customers')
                .select(`
                  *,
                  locations (
                    id,
                    name,
                    client_id
                  ),
                  clients (
                    id,
                    name
                  )
                `)
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single()
              setRoleData(customerData as Customer)
              break

            default:
              setError('Unknown user tier')
              break
          }
        } else {
          // Fallback: Check individual tables if user_roles doesn't exist
          await checkIndividualTables()
        }
      } catch (err) {
        console.error('Error determining user role:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    const checkIndividualTables = async () => {
      if (!user) return

      // Check superadmins first (highest priority)
      const { data: superadminData } = await supabase
        .from('superadmins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (superadminData) {
        setRole('superadmin')
        setRoleData(superadminData as Superadmin)
        return
      }

      // Check client_admins
      const { data: clientAdminData } = await supabase
        .from('client_admins')
        .select(`
          *,
          clients (
            id,
            name,
            slug,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (clientAdminData) {
        setRole('client_admin')
        setRoleData(clientAdminData as ClientAdmin)
        return
      }

      // Check location_staff
      const { data: locationStaffData } = await supabase
        .from('location_staff')
        .select(`
          *,
          locations (
            id,
            name,
            client_id,
            is_active
          ),
          clients (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (locationStaffData) {
        setRole('location_staff')
        setRoleData(locationStaffData as LocationStaff)
        return
      }

      // Check customers (lowest priority)
      const { data: customerData } = await supabase
        .from('customers')
        .select(`
          *,
          locations (
            id,
            name,
            client_id
          ),
          clients (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (customerData) {
        setRole('customer')
        setRoleData(customerData as Customer)
        return
      }

      // No role found
      setError('User has no assigned role in the system')
    }

    determineUserRole()
  }, [user])

  return { role, roleData, loading, error }
}

export function getRoleDisplayName(role: UserRole): string {
  const roleNames = {
    superadmin: 'Platform Administrator',
    client_admin: 'Client Administrator',
    location_staff: 'Location Staff',
    customer: 'Customer'
  }
  
  return roleNames[role] || 'User'
}

export function returnToPlatform(): void {
  // For superadmin returning to platform view
  window.location.href = '/';
}

export function returnToHQ(): void {
  // For client admin returning to HQ view
  window.location.href = '/';
}

export function returnToLocation(): void {
  // For location staff returning to location view
  window.location.href = '/';
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

export function getAvailableTabs(role: UserRole | null): string[] {
  switch (role) {
    case 'superadmin':
      return ['platform', 'clients', 'analytics', 'settings']
    
    case 'client_admin':
      return ['dashboard', 'locations', 'staff', 'customers', 'analytics', 'settings']
    
    case 'location_staff':
      return ['dashboard', 'customers', 'stamps', 'rewards', 'analytics']
    
    case 'customer':
      return ['loyalty', 'rewards', 'history']
    
    default:
      return []
  }
}

export function canAccessFeature(role: UserRole | null, feature: string): boolean {
  const rolePermissions = {
    superadmin: ['all'],
    client_admin: ['manage_locations', 'manage_staff', 'view_analytics', 'manage_customers', 'export_data'],
    location_staff: ['manage_customers', 'add_stamps', 'redeem_rewards', 'view_basic_analytics'],
    customer: ['view_loyalty', 'view_rewards', 'view_history']
  }

  if (!role) return false
  
  const permissions = rolePermissions[role]
  return permissions.includes('all') || permissions.includes(feature)
}

export function getUserClientContext(roleData: any): { clientId?: string; locationId?: string } {
  if (!roleData) return {}

  switch (roleData.tier || roleData.role) {
    case 'superadmin':
      return {} // Superadmin has access to all clients
    case 'client_admin':
      return { clientId: roleData.client_id }
    case 'location_staff':
      return { clientId: roleData.client_id, locationId: roleData.location_id }
    case 'customer':
      return { clientId: roleData.client_id, locationId: roleData.location_id }
    default:
      return {}
  }
} 
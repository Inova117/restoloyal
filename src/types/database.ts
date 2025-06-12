// ============================================================================
// DATABASE TYPES - UPDATED FOR FINALBACKENDIMPLEMENTATION
// ============================================================================
// This file contains application-level type definitions that match our 
// 4-tier hierarchy schema: superadmins, clients, client_admins, locations, 
// location_staff, customers, stamps, rewards, user_roles, hierarchy_audit_log
// ============================================================================

import type { Tables } from '@/integrations/supabase/types'

// Core entity types from database tables
export type Superadmin = Tables<'superadmins'>
export type Client = Tables<'clients'>
export type ClientAdmin = Tables<'client_admins'>
export type Location = Tables<'locations'>
export type LocationStaff = Tables<'location_staff'>
export type Customer = Tables<'customers'>
export type Stamp = Tables<'stamps'>
export type Reward = Tables<'rewards'>
export type UserRole = Tables<'user_roles'>
export type HierarchyAuditLog = Tables<'hierarchy_audit_log'>

// Legacy type aliases for backward compatibility during transition
export type PlatformClient = Client // Alias for old platform_clients references

// User tier enumeration matching database enum
export type UserTier = 'SUPERADMIN' | 'CLIENT' | 'LOCATION' | 'CUSTOMER'

// Application-specific interfaces
export interface CustomerWithLocation extends Customer {
  location?: {
    id: string
    name: string
    city: string
    state: string | null
  }
}

export interface StampWithDetails extends Stamp {
  customer?: {
    id: string
    name: string
  }
  location?: {
    id: string
    name: string
  }
}

export interface RewardWithDetails extends Reward {
  customer?: {
    id: string
    name: string
  }
  location?: {
    id: string
    name: string
  }
}

export interface LocationWithClient extends Location {
  client?: {
    id: string
    name: string
    business_type: string | null
  }
}

export interface ClientAdminWithClient extends ClientAdmin {
  client?: {
    id: string
    name: string
    business_type: string | null
  }
}

export interface LocationStaffWithDetails extends LocationStaff {
  location?: {
    id: string
    name: string
    city: string
  }
  client?: {
    id: string
    name: string
  }
}

// Statistics and analytics interfaces
export interface ClientStats {
  id: string
  name: string
  totalLocations: number
  totalCustomers: number
  totalStamps: number
  totalRewards: number
  monthlyRevenue: number
  growthRate: number
}

export interface LocationStats {
  id: string
  name: string
  customerCount: number
  stampsIssued: number
  rewardsRedeemed: number
  monthlyActivity: number
}

export interface PlatformMetrics {
  totalClients: number
  totalLocations: number
  totalCustomers: number
  totalStamps: number
  totalRewards: number
  monthlyRevenue: number
  growthRate: number
  activeUsersToday: number
}

// Form data interfaces for creating/updating entities
export interface CreateClientData {
  name: string
  slug: string
  email?: string
  phone?: string
  business_type?: string
  settings?: any
}

export interface CreateLocationData {
  client_id: string
  name: string
  address: string
  city: string
  state?: string
  postal_code?: string
  country: string
  phone?: string
  email?: string
  manager_name?: string
  settings?: any
}

export interface CreateCustomerData {
  client_id: string
  location_id: string
  name: string
  email?: string
  phone?: string
  qr_code: string
}

export interface CreateStampData {
  customer_id: string
  location_id: string
  client_id: string
  stamp_count?: number
  notes?: string
}

export interface CreateRewardData {
  customer_id: string
  location_id: string
  client_id: string
  reward_type: string
  description?: string
  stamps_used: number
  value?: number
}

// Utility types for filters and queries
export interface TableFilters {
  search?: string
  status?: string
  client_id?: string
  location_id?: string
  created_after?: string
  created_before?: string
  limit?: number
  offset?: number
}

export interface ClientFilters extends TableFilters {
  business_type?: string
}

export interface CustomerFilters extends TableFilters {
  min_stamps?: number
  max_stamps?: number
}

export interface StampFilters extends TableFilters {
  customer_id?: string
  min_stamp_count?: number
}

export interface RewardFilters extends TableFilters {
  customer_id?: string
  reward_type?: string
  status?: 'pending' | 'redeemed' | 'expired'
}

// Export commonly used types for external consumption
export {
  type Tables,
  type Database,
  type Enums
} from '@/integrations/supabase/types' 
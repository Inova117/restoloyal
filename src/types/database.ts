// ============================================================================
// DATABASE TYPES - 4-TIER HIERARCHY RESTAURANT LOYALTY PLATFORM
// ============================================================================
// These types match exactly with FinalBackEndImplementation schema
// ============================================================================

export type UserTier = 'superadmin' | 'client_admin' | 'location_staff' | 'customer'

// ============================================================================
// TIER 1: SUPERADMINS
// ============================================================================
export interface Superadmin {
  id: string
  user_id: string
  email: string
  name: string
  phone?: string
  is_active: boolean
  is_bootstrap: boolean
  bootstrap_method?: 'sql_script' | 'superadmin_creation'
  created_at: string
  updated_at: string
}

// ============================================================================
// TIER 2: CLIENTS & CLIENT ADMINS
// ============================================================================
export interface Client {
  id: string
  name: string
  slug: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country: string
  business_type: 'restaurant_chain' | 'single_restaurant' | 'franchise'
  status: 'active' | 'inactive' | 'suspended'
  created_by_superadmin_id: string
  settings: {
    stamps_required_for_reward?: number
    allow_cross_location_stamps?: boolean
    auto_expire_stamps_days?: number
    customer_can_view_history?: boolean
  }
  created_at: string
  updated_at: string
}

export interface ClientAdmin {
  id: string
  user_id: string
  client_id: string
  email: string
  name: string
  role: 'admin' | 'manager'
  is_active: boolean
  created_by_superadmin_id: string
  permissions: {
    can_create_locations?: boolean
    can_create_staff?: boolean
    can_view_analytics?: boolean
    can_manage_settings?: boolean
    can_manage_rewards?: boolean
    can_export_data?: boolean
  }
  created_at: string
  updated_at: string
}

// ============================================================================
// TIER 3: LOCATIONS & LOCATION STAFF
// ============================================================================
export interface Location {
  id: string
  client_id: string
  name: string
  address: string
  city: string
  state: string
  zip_code?: string
  country: string
  phone?: string
  email?: string
  is_active: boolean
  timezone: string
  settings: Record<string, any>
  created_by_client_admin_id: string
  created_at: string
  updated_at: string
}

export interface LocationStaff {
  id: string
  user_id: string
  location_id: string
  client_id: string
  email: string
  name: string
  phone?: string
  role: 'manager' | 'staff' | 'pos_operator'
  is_active: boolean
  created_by_client_admin_id: string
  permissions: {
    can_create_customers?: boolean
    can_manage_loyalty?: boolean
    can_view_analytics?: boolean
    can_export_data?: boolean
  }
  created_at: string
  updated_at: string
}

// ============================================================================
// TIER 4: CUSTOMERS
// ============================================================================
export interface Customer {
  id: string
  client_id: string
  location_id: string
  name: string
  email?: string
  phone?: string
  qr_code: string
  customer_number: string
  total_stamps: number
  total_visits: number
  total_rewards: number
  last_visit?: string
  status: 'active' | 'inactive' | 'suspended'
  created_by_staff_id: string
  notes?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// LOYALTY SYSTEM
// ============================================================================
export interface Stamp {
  id: string
  customer_id: string
  location_id: string
  client_id: string
  stamps_earned: number
  transaction_amount?: number
  notes?: string
  created_by_staff_id: string
  created_at: string
}

export interface Reward {
  id: string
  customer_id: string
  location_id: string
  client_id: string
  stamps_used: number
  reward_type: string
  reward_description: string
  reward_value?: number
  notes?: string
  created_by_staff_id: string
  redeemed_at: string
  created_at: string
}

// ============================================================================
// SYSTEM TABLES
// ============================================================================
export interface UserRole {
  id: string
  user_id: string
  tier: UserTier
  tier_specific_id: string
  is_active: boolean
  created_by_user_id: string
  created_at: string
  updated_at: string
}

export interface HierarchyAuditLog {
  id: string
  violation_type: string
  attempted_action: string
  user_id?: string
  target_table?: string
  target_data?: Record<string, any>
  error_message?: string
  created_at: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================
export interface DatabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface FilterParams {
  client_id?: string
  location_id?: string
  status?: string
  created_after?: string
  created_before?: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================
export interface DashboardMetrics {
  total_customers: number
  total_stamps_issued: number
  total_rewards_redeemed: number
  active_locations: number
  monthly_transactions: number
  growth_rate: number
}

export interface LocationMetrics extends DashboardMetrics {
  location_id: string
  location_name: string
}

export interface ClientMetrics extends DashboardMetrics {
  client_id: string
  client_name: string
  total_locations: number
} 
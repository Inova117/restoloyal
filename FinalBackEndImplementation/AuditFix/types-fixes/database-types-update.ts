// ============================================================================
// DATABASE TYPES UPDATE - AUDIT FIX
// ============================================================================
// Interfaces faltantes y correcciones de tipos para eliminar (supabase as any)
// ============================================================================

import { Database } from '../../../src/integrations/supabase/types'

// ============================================================================
// USER ROLE INTERFACES
// ============================================================================

export interface UserRole {
  id: string
  user_id: string
  tier: 'superadmin' | 'client_admin' | 'location_staff' | 'customer'
  role_id: string
  client_id: string | null
  location_id: string | null
  created_at: string
  updated_at: string
}

export interface UserRoleData {
  id: string
  tier: 'superadmin' | 'client_admin' | 'location_staff' | 'customer'
  role_id: string
  client_id?: string | null
  location_id?: string | null
  user_id: string
  created_at: string
  updated_at: string
}

// ============================================================================
// PLATFORM METRICS INTERFACES
// ============================================================================

export interface PlatformMetrics {
  totalClients: number
  totalLocations: number
  totalCustomers: number
  totalStamps: number
  totalRewards: number
  activeClients: number
  activeLocations: number
  monthlyGrowth: number
  revenue: number
  conversionRate: number
}

export interface ClientMetrics {
  clientId: string
  clientName: string
  locationsCount: number
  customersCount: number
  staffCount: number
  stampsCount: number
  rewardsCount: number
  revenue: number
  growthRate: number
  lastActivity: string
}

// ============================================================================
// ACTIVITY INTERFACES
// ============================================================================

export interface ActivityItem {
  id: string
  type: 'client_created' | 'location_created' | 'customer_registered' | 'stamp_added' | 'reward_redeemed' | 'staff_invited'
  title: string
  description: string
  user_id?: string
  client_id?: string
  location_id?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ActivityFeed {
  items: ActivityItem[]
  total: number
  hasMore: boolean
  nextCursor?: string
}

// ============================================================================
// TYPED SUPABASE CLIENT INTERFACES
// ============================================================================

export type SupabaseClient = Database
export type Tables = Database['public']['Tables']
export type TableRow<T extends keyof Tables> = Tables[T]['Row']
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert']
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update']

// ============================================================================
// QUERY RESPONSE INTERFACES
// ============================================================================

export interface QueryResponse<T> {
  data: T | null
  error: {
    message: string
    code?: string
    details?: string
  } | null
  count?: number | null
}

export interface CountResponse {
  count: number | null
  error: {
    message: string
    code?: string
  } | null
}

// ============================================================================
// CLIENT MANAGEMENT INTERFACES
// ============================================================================

export interface ClientWithStats {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  business_type: string | null
  status: string
  settings: any
  created_at: string
  updated_at: string
  // Computed stats
  locationsCount: number
  customersCount: number
  staffCount: number
  stampsCount: number
  rewardsCount: number
  revenue: number
}

export interface LocationWithStats {
  id: string
  client_id: string
  name: string
  address: string
  city: string
  state: string | null
  postal_code: string | null
  country: string
  phone: string | null
  email: string | null
  manager_name: string | null
  is_active: boolean
  settings: any
  created_at: string
  updated_at: string
  // Computed stats
  customersCount: number
  staffCount: number
  stampsCount: number
  rewardsCount: number
}

// ============================================================================
// TYPED QUERY BUILDERS
// ============================================================================

export interface TypedQueryBuilder<T extends keyof Tables> {
  select: (columns?: string) => TypedQueryBuilder<T>
  insert: (values: TableInsert<T> | TableInsert<T>[]) => TypedQueryBuilder<T>
  update: (values: TableUpdate<T>) => TypedQueryBuilder<T>
  delete: () => TypedQueryBuilder<T>
  eq: (column: keyof TableRow<T>, value: any) => TypedQueryBuilder<T>
  neq: (column: keyof TableRow<T>, value: any) => TypedQueryBuilder<T>
  gt: (column: keyof TableRow<T>, value: any) => TypedQueryBuilder<T>
  gte: (column: keyof TableRow<T>, value: any) => TypedQueryBuilder<T>
  lt: (column: keyof TableRow<T>, value: any) => TypedQueryBuilder<T>
  lte: (column: keyof TableRow<T>, value: any) => TypedQueryBuilder<T>
  like: (column: keyof TableRow<T>, pattern: string) => TypedQueryBuilder<T>
  ilike: (column: keyof TableRow<T>, pattern: string) => TypedQueryBuilder<T>
  is: (column: keyof TableRow<T>, value: null | boolean) => TypedQueryBuilder<T>
  in: (column: keyof TableRow<T>, values: any[]) => TypedQueryBuilder<T>
  order: (column: keyof TableRow<T>, options?: { ascending?: boolean }) => TypedQueryBuilder<T>
  limit: (count: number) => TypedQueryBuilder<T>
  range: (from: number, to: number) => TypedQueryBuilder<T>
  single: () => Promise<QueryResponse<TableRow<T>>>
  maybeSingle: () => Promise<QueryResponse<TableRow<T> | null>>
  then: (onResolve: (value: QueryResponse<TableRow<T>[]>) => any) => Promise<any>
}

// ============================================================================
// ENVIRONMENT VARIABLES INTERFACES
// ============================================================================

export interface EnvironmentConfig {
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
  VITE_PLATFORM_ADMIN_EMAILS: string
  VITE_GALLETTI_ADMIN_EMAILS: string
  SUPABASE_SERVICE_ROLE_KEY: string
  VITE_APP_NAME: string
  VITE_APP_URL: string
}

// ============================================================================
// ERROR INTERFACES
// ============================================================================

export interface SupabaseError {
  message: string
  code?: string
  details?: string
  hint?: string
}

export interface ApiError {
  error: SupabaseError
  status: number
  statusText: string
}

// ============================================================================
// EXPORT ALL TYPES FROM SUPABASE
// ============================================================================

export type {
  Database,
  Tables as SupabaseTables,
  Json
} from '../../../src/integrations/supabase/types' 
// ============================================================================
// LOYALTY MANAGER EDGE FUNCTION - TYPE DEFINITIONS
// Restaurant Loyalty Platform - TypeScript Definitions
// ============================================================================

// ============================================================================
// CORE LOYALTY INTERFACES
// ============================================================================

export interface LoyaltySettings {
  id: string
  client_id: string
  location_id?: string | null
  stamps_to_reward: number
  reward_description: string
  reward_value: number
  auto_redeem: boolean
  max_stamps_per_visit: number
  stamp_value: number
  welcome_bonus_stamps: number
  birthday_bonus_stamps: number
  referral_bonus_stamps: number
  is_active: boolean
  created_at: string
  updated_at: string
  locations?: {
    id: string
    name: string
    address: string
    city: string
    state: string
  }
  clients?: {
    id: string
    name: string
    slug: string
  }
}

export interface StampTransaction {
  id: string
  customer_id: string
  location_id: string
  client_id: string
  stamps_added: number
  stamps_used: number
  transaction_type: 'earned' | 'redeemed' | 'bonus' | 'expired' | 'manual_adjustment'
  reference_type: 'purchase' | 'reward_redemption' | 'welcome_bonus' | 'birthday' | 'referral' | 'manual'
  reference_id?: string | null
  notes?: string | null
  added_by_user_id: string
  added_by_name: string
  value_amount?: number | null
  created_at: string
  customers?: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  locations?: {
    id: string
    name: string
    address: string
    city: string
  }
}

export interface RewardRedemption {
  id: string
  customer_id: string
  location_id: string
  client_id: string
  stamps_used: number
  reward_description: string
  reward_value: number
  redemption_code?: string | null
  redeemed_by_user_id: string
  redeemed_by_name: string
  status: 'pending' | 'redeemed' | 'expired' | 'cancelled'
  expires_at?: string | null
  created_at: string
  updated_at: string
}

export interface CustomerLoyaltyStatus {
  customer_id: string
  current_stamps: number
  lifetime_stamps: number
  total_rewards_redeemed: number
  last_stamp_date: string
  loyalty_level: 'bronze' | 'silver' | 'gold' | 'platinum'
  next_reward_stamps: number
  stamps_to_next_reward: number
}

export interface Customer {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  current_stamps: number
  lifetime_stamps: number
  total_visits: number
  total_rewards_redeemed: number
  last_visit?: string | null
  created_at: string
  status: 'active' | 'inactive' | 'blocked'
  loyalty_level?: 'bronze' | 'silver' | 'gold' | 'platinum'
  stamps_to_next_reward?: number
  can_redeem_reward?: boolean
  eligible_rewards?: number
}

// ============================================================================
// REQUEST/RESPONSE INTERFACES
// ============================================================================

export interface AddStampRequest {
  customer_id: string
  stamps_to_add: number
  notes?: string
  reference_type?: 'purchase' | 'welcome_bonus' | 'birthday' | 'referral' | 'manual'
}

export interface AddStampResponse {
  success: boolean
  data?: {
    transaction_id: string
    customer: Customer
    stamps_added: number
    new_stamp_total: number
    can_redeem_reward: boolean
    eligible_rewards: number
    stamps_to_next_reward: number
  }
  message?: string
  error?: string
}

export interface RedeemRewardRequest {
  customer_id: string
  custom_reward_description?: string
  custom_reward_value?: number
}

export interface RedeemRewardResponse {
  success: boolean
  data?: {
    redemption_id: string
    transaction_id: string
    customer: Customer
    stamps_used: number
    remaining_stamps: number
    reward_description: string
    reward_value: number
    redemption_code: string
    can_redeem_another: boolean
  }
  message?: string
  error?: string
}

export interface UpdateLoyaltySettingsRequest {
  stamps_to_reward?: number
  reward_description?: string
  reward_value?: number
  auto_redeem?: boolean
  max_stamps_per_visit?: number
  stamp_value?: number
  welcome_bonus_stamps?: number
  birthday_bonus_stamps?: number
  referral_bonus_stamps?: number
  is_active?: boolean
}

export interface LoyaltySettingsResponse {
  success: boolean
  data?: LoyaltySettings
  message?: string
  error?: string
}

export interface CustomerLoyaltyStatusResponse {
  success: boolean
  data?: {
    customer: Customer
    settings: LoyaltySettings
    recent_transactions: StampTransaction[]
    recent_rewards: RewardRedemption[]
    analytics: {
      average_stamps_per_visit: number
      days_since_last_visit: number | null
      account_age_days: number
      redemption_rate: number
    }
  }
  message?: string
  error?: string
}

export interface TransactionHistoryRequest {
  client_id: string
  location_id?: string
  customer_id?: string
  limit?: number
  offset?: number
}

export interface TransactionHistoryResponse {
  success: boolean
  data?: {
    transactions: StampTransaction[]
    pagination: {
      total: number
      limit: number
      offset: number
      has_more: boolean
    }
  }
  message?: string
  error?: string
}

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

export interface AuthValidationResult {
  user: any | null
  error?: string
}

export interface UserRole {
  tier: string
  role_id: string
  client_id: string
  location_id?: string
}

export interface UserRoleResult {
  role: string
  client_id?: string
  location_id?: string
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

export type LoyaltyManagerEndpoint = 
  | 'settings'           // GET/POST - Loyalty program settings
  | 'add-stamp'          // POST - Add stamps to customer
  | 'redeem-reward'      // POST - Redeem customer reward
  | 'customer-status'    // GET - Get customer loyalty status
  | 'history'            // GET - Transaction history

// ============================================================================
// ANALYTICS & METRICS
// ============================================================================

export interface LoyaltyAnalytics {
  total_stamps_issued: number
  total_rewards_redeemed: number
  active_customers_30d: number
  average_stamps_per_customer: number
  reward_redemption_rate: number
  top_customers: Array<{
    customer_id: string
    customer_name: string
    lifetime_stamps: number
    total_rewards: number
  }>
  monthly_trends: Array<{
    month: string
    stamps_issued: number
    rewards_redeemed: number
    new_customers: number
  }>
}

export interface CustomerSegment {
  segment: 'bronze' | 'silver' | 'gold' | 'platinum' | 'inactive'
  count: number
  percentage: number
  total_stamps: number
  total_rewards: number
  average_visit_frequency: number
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface LoyaltyError {
  code: string
  message: string
  details?: any
  timestamp: string
}

export type LoyaltyErrorCode = 
  | 'CUSTOMER_NOT_FOUND'
  | 'INSUFFICIENT_STAMPS'
  | 'INVALID_STAMP_COUNT'
  | 'SETTINGS_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'INVALID_REQUEST'
  | 'DATABASE_ERROR'
  | 'AUTHENTICATION_FAILED'

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export interface BulkStampOperation {
  operation: 'add_stamps'
  customer_ids: string[]
  stamps_to_add: number
  notes?: string
  reference_type?: string
}

export interface BulkRewardOperation {
  operation: 'redeem_rewards'
  customer_ids: string[]
  custom_reward_description?: string
  custom_reward_value?: number
}

export interface BulkOperationResponse {
  success: boolean
  data?: {
    processed: number
    successful: number
    failed: number
    results: Array<{
      customer_id: string
      success: boolean
      error?: string
      data?: any
    }>
  }
  message?: string
  error?: string
}

// ============================================================================
// LOYALTY CAMPAIGNS
// ============================================================================

export interface LoyaltyCampaign {
  id: string
  client_id: string
  location_id?: string | null
  name: string
  description: string
  campaign_type: 'bonus_stamps' | 'double_stamps' | 'special_reward' | 'referral_bonus'
  bonus_multiplier?: number | null
  bonus_stamps?: number | null
  special_reward_description?: string | null
  special_reward_value?: number | null
  start_date: string
  end_date: string
  is_active: boolean
  target_segments?: string[] | null
  usage_limit_per_customer?: number | null
  total_usage_limit?: number | null
  current_usage: number
  created_at: string
  updated_at: string
}

export interface CampaignEligibility {
  customer_id: string
  eligible_campaigns: LoyaltyCampaign[]
  applied_bonuses: Array<{
    campaign_id: string
    campaign_name: string
    bonus_amount: number
    applied_at: string
  }>
}

// ============================================================================
// LOYALTY LEVELS & TIERS
// ============================================================================

export interface LoyaltyLevel {
  level: 'bronze' | 'silver' | 'gold' | 'platinum'
  min_lifetime_stamps: number
  benefits: string[]
  bonus_multiplier: number
  special_rewards?: string[]
}

export interface LoyaltyProgram {
  id: string
  client_id: string
  name: string
  description: string
  levels: LoyaltyLevel[]
  settings: LoyaltySettings
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// NOTIFICATIONS & COMMUNICATIONS
// ============================================================================

export interface LoyaltyNotification {
  type: 'stamp_added' | 'reward_available' | 'reward_redeemed' | 'level_up' | 'campaign_bonus'
  customer_id: string
  title: string
  message: string
  data?: any
  channels: ('push' | 'email' | 'sms')[]
  scheduled_at?: string
  sent_at?: string
  status: 'pending' | 'sent' | 'failed'
}

// ============================================================================
// REPORTING & EXPORTS
// ============================================================================

export interface LoyaltyReport {
  report_type: 'customer_activity' | 'reward_usage' | 'stamp_transactions' | 'loyalty_analytics'
  client_id: string
  location_id?: string
  date_from: string
  date_to: string
  filters?: Record<string, any>
  format: 'json' | 'csv' | 'pdf'
}

export interface LoyaltyReportResponse {
  success: boolean
  data?: {
    report_id: string
    download_url?: string
    data?: any[]
    summary?: {
      total_records: number
      date_range: string
      generated_at: string
    }
  }
  message?: string
  error?: string
}

// ============================================================================
// INTEGRATIONS
// ============================================================================

export interface POSIntegration {
  transaction_id: string
  customer_identifier: string // QR code, phone, email
  location_id: string
  amount: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  stamps_earned?: number
  automatic_rewards?: boolean
}

export interface POSIntegrationResponse {
  success: boolean
  data?: {
    customer: Customer
    stamps_added: number
    rewards_available: number
    automatic_redemption?: {
      redeemed: boolean
      redemption_code?: string
      reward_description: string
    }
  }
  message?: string
  error?: string
}

// ============================================================================
// DENO ENVIRONMENT
// ============================================================================

declare global {
  namespace Deno {
    interface Env {
      SUPABASE_URL: string
      SUPABASE_SERVICE_ROLE_KEY: string
      SUPABASE_ANON_KEY: string
    }
  }
}

export interface DenoRequestInit extends RequestInit {
  headers?: Record<string, string>
} 
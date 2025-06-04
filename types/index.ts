// ============================================================================
// CORE TYPE DEFINITIONS
// Restaurant Loyalty Platform - Type Safety Implementation
// ============================================================================

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export type UserRole = 
  | 'zerion_admin'          // ZerionCore platform admin - sees EVERYTHING
  | 'galletti_hq'           // Galletti corporate - sees all Galletti restaurants
  | 'restaurant_owner'      // Individual restaurant owner - sees their locations
  | 'location_staff'        // Staff at specific location - simple POS interface

export interface User {
  id: string;
  email: string;
  role?: UserRole;
  user_metadata?: UserMetadata;
  created_at: string;
  updated_at: string;
}

export interface UserMetadata {
  role?: UserRole;
  client_name?: string;
  restaurant_id?: string;
  location_id?: string;
  full_name?: string;
  avatar_url?: string;
}

export interface UserPermissions {
  // Access levels
  canViewAllClients: boolean;
  canViewAllRestaurants: boolean;
  canViewOwnRestaurant: boolean;
  canViewLocationOnly: boolean;
  
  // Specific permissions
  canManageClients: boolean;
  canAddStamps: boolean;
  canRedeemRewards: boolean;
  canViewAnalytics: boolean;
  canManageLocations: boolean;
  canAccessCorporateData: boolean;
  canManagePlatform: boolean;
  
  // Assigned access
  clientId?: string;
  restaurantId?: string;
  locationId?: string;
}

export interface UserRoleData {
  role: UserRole;
  permissions: UserPermissions;
  isLoading: boolean;
  clientName?: string;
  restaurantName?: string;
  isViewingAsAdmin?: boolean;
}

// ============================================================================
// PLATFORM & CLIENT TYPES
// ============================================================================

export type SubscriptionPlan = 'trial' | 'business' | 'enterprise';
export type SubscriptionStatus = 'active' | 'suspended' | 'trial' | 'cancelled';

export interface Client {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: Address;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  settings: ClientSettings;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientSettings {
  company_name?: string;
  logo_url?: string;
  support_email?: string;
  website_url?: string;
  default_stamps_per_dollar?: number;
  default_stamps_for_reward?: number;
  default_reward_value?: number;
  theme_colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

// ============================================================================
// LOCATION & RESTAURANT TYPES
// ============================================================================

export type LocationStatus = 'active' | 'inactive' | 'maintenance' | 'pending';

export interface Location {
  id: string;
  client_id: string;
  name: string;
  address: Address;
  phone?: string;
  email?: string;
  timezone: string;
  settings: LocationSettings;
  status: LocationStatus;
  operating_hours: OperatingHours;
  pos_settings: POSSettings;
  loyalty_settings: LoyaltySettings;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LocationSettings {
  manager_name?: string;
  manager_email?: string;
  max_daily_transactions?: number;
  require_customer_phone?: boolean;
  auto_backup_enabled?: boolean;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface POSSettings {
  require_manager_approval: boolean;
  allow_cash_payments: boolean;
  allow_card_payments: boolean;
  allow_mobile_payments: boolean;
  receipt_footer_text: string;
  auto_print_receipts: boolean;
  tax_rate?: number;
}

export interface LoyaltySettings {
  stamps_per_dollar: number;
  stamps_for_reward: number;
  reward_value: number;
  auto_redeem: boolean;
  max_stamps_per_transaction?: number;
  reward_expiry_days?: number;
}

// ============================================================================
// STAFF & ROLES TYPES
// ============================================================================

export type StaffRole = 'cashier' | 'manager' | 'supervisor' | 'server';
export type StaffStatus = 'active' | 'inactive' | 'suspended';

export interface LocationStaff {
  id: string;
  user_id: string;
  location_id: string;
  client_id: string;
  email: string;
  name: string;
  role: StaffRole;
  permissions: StaffPermissions;
  shift_schedule?: ShiftSchedule;
  status: StaffStatus;
  last_login?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffPermissions {
  pos_access: boolean;
  can_process_orders: boolean;
  can_issue_stamps: boolean;
  can_redeem_rewards: boolean;
  can_view_analytics: boolean;
  can_manage_inventory: boolean;
  can_manage_staff: boolean;
  can_void_transactions: boolean;
  can_apply_discounts: boolean;
}

export interface ShiftSchedule {
  monday?: ShiftTime;
  tuesday?: ShiftTime;
  wednesday?: ShiftTime;
  thursday?: ShiftTime;
  friday?: ShiftTime;
  saturday?: ShiftTime;
  sunday?: ShiftTime;
}

export interface ShiftTime {
  start: string;
  end: string;
  break_start?: string;
  break_end?: string;
}

// ============================================================================
// CUSTOMER & LOYALTY TYPES
// ============================================================================

export type CustomerStatus = 'active' | 'inactive' | 'blocked';

export interface Customer {
  id: string;
  client_id: string;
  email?: string;
  phone?: string;
  name?: string;
  date_of_birth?: string;
  preferences: CustomerPreferences;
  loyalty_points: number;
  stamps_count: number;
  total_visits: number;
  total_spent: number;
  last_visit?: string;
  referral_code?: string;
  referred_by?: string;
  status: CustomerStatus;
  created_at: string;
  updated_at: string;
}

export interface CustomerPreferences {
  communication_method?: 'email' | 'sms' | 'push';
  marketing_opt_in?: boolean;
  favorite_items?: string[];
  dietary_restrictions?: string[];
  preferred_location_id?: string;
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'gift_card' | 'loyalty_points';
export type TransactionStatus = 'completed' | 'pending' | 'cancelled' | 'refunded';

export interface Transaction {
  id: string;
  client_id: string;
  location_id: string;
  customer_id?: string;
  staff_id?: string;
  amount: number;
  items: TransactionItem[];
  payment_method: PaymentMethod;
  loyalty_points_earned: number;
  loyalty_points_redeemed: number;
  stamps_earned: number;
  stamps_redeemed: number;
  status: TransactionStatus;
  receipt_number?: string;
  notes?: string;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  modifiers?: ItemModifier[];
}

export interface ItemModifier {
  name: string;
  price: number;
}

// ============================================================================
// LOYALTY PROGRAM TYPES
// ============================================================================

export type LoyaltyProgramType = 'points' | 'visits' | 'cashback' | 'stamps';
export type LoyaltyProgramStatus = 'active' | 'inactive' | 'draft';

export interface LoyaltyProgram {
  id: string;
  client_id: string;
  name: string;
  type: LoyaltyProgramType;
  rules: LoyaltyRules;
  rewards: LoyaltyReward[];
  status: LoyaltyProgramStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyRules {
  points_per_dollar?: number;
  stamps_per_dollar?: number;
  stamps_for_reward?: number;
  cashback_percentage?: number;
  minimum_purchase?: number;
  maximum_points_per_transaction?: number;
}

export interface LoyaltyReward {
  id: string;
  type: 'discount' | 'free_item' | 'cashback' | 'points_multiplier';
  name: string;
  description: string;
  value: number;
  threshold: number;
  expiry_days?: number;
  max_uses_per_customer?: number;
  conditions?: RewardConditions;
}

export interface RewardConditions {
  minimum_purchase?: number;
  valid_days?: string[];
  valid_locations?: string[];
  excluded_items?: string[];
}

// ============================================================================
// CAMPAIGN & NOTIFICATION TYPES
// ============================================================================

export type CampaignType = 'promotion' | 'notification' | 'referral' | 'email' | 'push';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface Campaign {
  id: string;
  client_id: string;
  name: string;
  type: CampaignType;
  content: CampaignContent;
  target_audience: TargetAudience;
  schedule?: CampaignSchedule;
  status: CampaignStatus;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignContent {
  subject?: string;
  message: string;
  image_url?: string;
  call_to_action?: CallToAction;
  personalization?: Record<string, string>;
}

export interface CallToAction {
  text: string;
  url?: string;
  action_type: 'visit_store' | 'redeem_offer' | 'view_menu' | 'custom';
}

export interface TargetAudience {
  customer_segments?: string[];
  location_ids?: string[];
  min_visits?: number;
  max_visits?: number;
  min_spent?: number;
  last_visit_days?: number;
  has_email?: boolean;
  has_phone?: boolean;
}

export interface CampaignSchedule {
  send_immediately?: boolean;
  send_at?: string;
  recurring?: RecurringSchedule;
}

export interface RecurringSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  days_of_week?: number[];
  day_of_month?: number;
  time: string;
  end_date?: string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface AnalyticsMetrics {
  total_revenue: number;
  total_transactions: number;
  unique_customers: number;
  average_order_value: number;
  loyalty_points_issued: number;
  stamps_issued: number;
  rewards_redeemed: number;
  customer_retention_rate: number;
  period_start: string;
  period_end: string;
}

export interface LocationAnalytics extends AnalyticsMetrics {
  location_id: string;
  location_name: string;
  daily_breakdown: DailyMetrics[];
  top_items: PopularItem[];
  peak_hours: HourlyMetrics[];
}

export interface DailyMetrics {
  date: string;
  revenue: number;
  transactions: number;
  customers: number;
  stamps_issued: number;
}

export interface PopularItem {
  name: string;
  quantity_sold: number;
  revenue: number;
  category: string;
}

export interface HourlyMetrics {
  hour: number;
  transaction_count: number;
  revenue: number;
  average_wait_time?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ============================================================================
// FORM & UI TYPES
// ============================================================================

export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
  lastUpdated?: string;
}

export interface FilterOptions {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  location_id?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} 
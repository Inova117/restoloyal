// ============================================================================
// DENO TYPE DEFINITIONS - POS OPERATIONS EDGE FUNCTION
// ============================================================================
// Task T3.1: POS Operations for Location Staff
// Support for Deno runtime and Supabase Edge Functions
// ============================================================================

// POS Operations specific types
export interface CustomerLookupQuery {
  qr_code?: string;
  phone?: string;
  email?: string;
  name?: string;
}

export interface RegisterCustomerData {
  name: string;
  email?: string;
  phone?: string;
  location_id: string;
  initial_stamps?: number;
}

export interface AddStampData {
  customer_id: string;
  location_id: string;
  stamp_count?: number;
  notes?: string;
  staff_id: string;
}

export interface RedeemRewardData {
  customer_id: string;
  location_id: string;
  reward_type: string;
  description?: string;
  stamps_used: number;
  staff_id: string;
}

export interface CustomerProfile {
  id: string;
  client_id: string;
  location_id: string;
  name: string;
  email?: string;
  phone?: string;
  qr_code: string;
  total_stamps: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface POSOperationResult {
  customer: CustomerProfile;
  operation_type: string;
  stamps_before?: number;
  stamps_after?: number;
  rewards_available?: number;
  loyalty_status?: 'active' | 'reward_available' | 'max_rewards';
}

export type LoyaltyStatus = 'active' | 'reward_available' | 'max_rewards';

export interface StaffInfo {
  id: string;
  location_id: string;
  client_id: string;
  name: string;
  is_active: boolean;
  locations?: {
    id: string;
    name: string;
    client_id: string;
    is_active: boolean;
  };
} 
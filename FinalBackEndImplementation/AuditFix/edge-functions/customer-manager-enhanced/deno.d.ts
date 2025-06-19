// ============================================================================
// DENO TYPE DEFINITIONS - CUSTOMER MANAGER ENHANCED EDGE FUNCTION
// ============================================================================
// Task T2.1: Customer Manager Enhancements
// Support for advanced customer management operations
// ============================================================================

// Enhanced Customer Manager specific types
export interface CustomerSearchFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'suspended';
  location_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
  stamp_range?: {
    min: number;
    max: number;
  };
  loyalty_status?: 'active' | 'reward_available' | 'max_rewards';
  sort_by?: 'name' | 'created_at' | 'total_stamps' | 'last_visit';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface BulkOperation {
  operation: 'update_status' | 'add_stamps' | 'export' | 'delete';
  customer_ids: string[];
  data?: {
    status?: string;
    stamp_count?: number;
    notes?: string;
  };
}

export interface CustomerAnalytics {
  customer_id: string;
  visit_frequency: number;
  average_stamps_per_visit: number;
  total_spent_estimate: number;
  last_visit_days_ago: number;
  loyalty_level: 'bronze' | 'silver' | 'gold' | 'platinum';
  predicted_churn_risk: 'low' | 'medium' | 'high';
  lifetime_value_score: number;
}

export interface EnhancedCustomer {
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
  last_visit?: string;
  visit_count: number;
  analytics?: CustomerAnalytics;
}

export interface CustomerExport {
  format: 'csv' | 'json' | 'xlsx';
  filters?: CustomerSearchFilters;
  include_analytics?: boolean;
}

export interface DetailedAnalytics extends CustomerAnalytics {
  stamp_history: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
  reward_history: Array<{
    date: string;
    type: string;
    stamps_used: number;
  }>;
  monthly_activity: Array<{
    month: string;
    stamps: number;
  }>;
  engagement_score: number;
  trends: {
    stamps_trend: 'increasing' | 'decreasing' | 'stable';
    visit_trend: 'increasing' | 'decreasing' | 'stable';
  };
}

export type LoyaltyLevel = 'bronze' | 'silver' | 'gold' | 'platinum';
export type ChurnRisk = 'low' | 'medium' | 'high';
export type TrendDirection = 'increasing' | 'decreasing' | 'stable'; 
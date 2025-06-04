// ============================================================================
// RESTAURANT SERVICE
// Restaurant Loyalty Platform - Restaurant Management Service
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { BaseService } from '../base/BaseService';
import type { ApiResponse, FilterOptions } from '../../../types';

// ============================================================================
// RESTAURANT SERVICE TYPES
// ============================================================================

export interface RestaurantData {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
  // Restaurant specific fields
  cuisine_type?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  // Loyalty program settings
  loyalty_program: {
    stamps_to_reward: number;
    reward_description: string;
    stamp_value: number;
    is_active: boolean;
  };
  // Business metrics
  total_customers: number;
  total_stamps_issued: number;
  total_rewards_redeemed: number;
  monthly_revenue: number;
  locations_count: number;
  staff_count: number;
}

export interface LocationData {
  id: string;
  restaurant_id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  // Location specific
  latitude?: number;
  longitude?: number;
  manager_name?: string;
  operating_hours?: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  // Metrics
  customer_count: number;
  monthly_transactions: number;
  staff_count: number;
}

export interface StaffMemberData {
  id: string;
  restaurant_id: string;
  location_id?: string;
  user_id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'manager' | 'staff' | 'cashier';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  // Staff specific
  hire_date?: string;
  permissions: {
    can_issue_stamps: boolean;
    can_redeem_rewards: boolean;
    can_view_analytics: boolean;
    can_manage_customers: boolean;
  };
}

export interface CreateRestaurantData {
  name: string;
  description?: string;
  client_id: string;
  cuisine_type?: string;
  phone?: string;
  email?: string;
  website?: string;
  loyalty_program: {
    stamps_to_reward: number;
    reward_description: string;
    stamp_value: number;
  };
}

export interface UpdateRestaurantData {
  name?: string;
  description?: string;
  cuisine_type?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  loyalty_program?: {
    stamps_to_reward?: number;
    reward_description?: string;
    stamp_value?: number;
    is_active?: boolean;
  };
  status?: 'active' | 'inactive' | 'pending';
}

export interface CreateLocationData {
  restaurant_id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  manager_name?: string;
  operating_hours?: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
}

export interface CreateStaffMemberData {
  restaurant_id: string;
  location_id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'manager' | 'staff' | 'cashier';
  hire_date?: string;
  permissions: {
    can_issue_stamps: boolean;
    can_redeem_rewards: boolean;
    can_view_analytics: boolean;
    can_manage_customers: boolean;
  };
}

export interface RestaurantFilters extends FilterOptions {
  client_id?: string;
  status?: 'active' | 'inactive' | 'pending' | 'all';
  cuisine_type?: string;
  created_after?: string;
  created_before?: string;
}

// ============================================================================
// RESTAURANT SERVICE CLASS
// ============================================================================

export class RestaurantService extends BaseService {
  constructor() {
    super('RestaurantService');
  }

  /**
   * Get the Edge Function API URL
   */
  private getApiUrl(functionName: string): string {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL is not configured');
    }
    return `${supabaseUrl}/functions/v1/${functionName}`;
  }

  /**
   * Get authentication headers for API calls
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  }

  // ============================================================================
  // RESTAURANT MANAGEMENT
  // ============================================================================

  /**
   * Get restaurants with optional filtering (uses client-administration Edge Function)
   */
  async getRestaurants(filters?: RestaurantFilters): Promise<ApiResponse<RestaurantData[]>> {
    return this.executeQuery(
      async () => {
        const params = new URLSearchParams({
          endpoint: 'restaurants',
          page: (filters?.page || 1).toString(),
          limit: (filters?.limit || 20).toString()
        });
        
        if (filters?.client_id) {
          params.append('client_id', filters.client_id);
        }
        if (filters?.search) {
          params.append('search', filters.search);
        }
        if (filters?.status && filters.status !== 'all') {
          params.append('status', filters.status);
        }

        const response = await fetch(`${this.getApiUrl('client-administration')}?${params}`, {
          headers: await this.getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'API call failed');
        }

        // Transform Edge Function response to match our interface
        const transformedData = (result.data || []).map((restaurant: any) => ({
          id: restaurant.id,
          name: restaurant.name,
          description: restaurant.description,
          client_id: restaurant.client_id,
          status: restaurant.status || 'active',
          created_at: restaurant.created_at,
          updated_at: restaurant.updated_at,
          cuisine_type: restaurant.cuisine_type,
          phone: restaurant.phone,
          email: restaurant.email,
          website: restaurant.website,
          logo_url: restaurant.logo_url,
          loyalty_program: restaurant.loyalty_program || {
            stamps_to_reward: 10,
            reward_description: 'Free item',
            stamp_value: 1,
            is_active: true
          },
          total_customers: restaurant.total_customers || 0,
          total_stamps_issued: restaurant.total_stamps_issued || 0,
          total_rewards_redeemed: restaurant.total_rewards_redeemed || 0,
          monthly_revenue: restaurant.monthly_revenue || 0,
          locations_count: restaurant.locations_count || 0,
          staff_count: restaurant.staff_count || 0
        }));

        return { data: transformedData, error: null };
      },
      'Get Restaurants',
      this.sanitizeForLogging(filters || {})
    );
  }

  /**
   * Get restaurant by ID
   */
  async getRestaurantById(id: string): Promise<ApiResponse<RestaurantData>> {
    const validationError = this.validateRequiredFields(
      { id },
      ['id'],
      'Get Restaurant By ID'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeQuery(
      async () => {
        const response = await fetch(`${this.getApiUrl('client-administration')}?endpoint=restaurant&restaurant_id=${id}`, {
          headers: await this.getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'API call failed');
        }

        return { data: result.data, error: null };
      },
      'Get Restaurant By ID',
      { restaurantId: this.sanitizeForLogging({ id }) }
    );
  }

  /**
   * Create a new restaurant
   */
  async createRestaurant(data: CreateRestaurantData): Promise<ApiResponse<RestaurantData>> {
    // Validate required fields
    const validationError = this.validateRequiredFields(
      data,
      ['name', 'client_id'],
      'Create Restaurant'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeMutation(
      async () => {
        const response = await fetch(`${this.getApiUrl('client-administration')}`, {
          method: 'POST',
          headers: await this.getAuthHeaders(),
          body: JSON.stringify({
            endpoint: 'restaurant',
            data: {
              ...data,
              loyalty_program: {
                ...data.loyalty_program,
                is_active: true
              }
            }
          })
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'API call failed');
        }

        return { data: result.data, error: null };
      },
      'Create Restaurant',
      this.sanitizeForLogging(data)
    );
  }

  /**
   * Update an existing restaurant
   */
  async updateRestaurant(id: string, data: UpdateRestaurantData): Promise<ApiResponse<RestaurantData>> {
    const validationError = this.validateRequiredFields(
      { id },
      ['id'],
      'Update Restaurant'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeMutation(
      async () => {
        const response = await fetch(`${this.getApiUrl('client-administration')}`, {
          method: 'PUT',
          headers: await this.getAuthHeaders(),
          body: JSON.stringify({
            endpoint: 'restaurant',
            restaurant_id: id,
            data
          })
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'API call failed');
        }

        return { data: result.data, error: null };
      },
      'Update Restaurant',
      { restaurant_id: id, ...this.sanitizeForLogging(data) }
    );
  }

  /**
   * Delete a restaurant
   */
  async deleteRestaurant(id: string): Promise<ApiResponse<null>> {
    const validationError = this.validateRequiredFields(
      { id },
      ['id'],
      'Delete Restaurant'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeMutation(
      async () => {
        const response = await fetch(`${this.getApiUrl('client-administration')}`, {
          method: 'DELETE',
          headers: await this.getAuthHeaders(),
          body: JSON.stringify({
            endpoint: 'restaurant',
            restaurant_id: id
          })
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'API call failed');
        }

        return { data: null, error: null };
      },
      'Delete Restaurant',
      { restaurant_id: id }
    );
  }

  // ============================================================================
  // LOCATION MANAGEMENT
  // ============================================================================

  /**
   * Get locations for a restaurant
   */
  async getRestaurantLocations(restaurantId: string): Promise<ApiResponse<LocationData[]>> {
    const validationError = this.validateRequiredFields(
      { restaurantId },
      ['restaurantId'],
      'Get Restaurant Locations'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeQuery(
      async () => {
        const response = await fetch(`${this.getApiUrl('client-administration')}?endpoint=locations&restaurant_id=${restaurantId}`, {
          headers: await this.getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'API call failed');
        }

        return { data: result.data || [], error: null };
      },
      'Get Restaurant Locations',
      { restaurantId: this.sanitizeForLogging({ restaurantId }) }
    );
  }

  /**
   * Create a new location
   */
  async createLocation(data: CreateLocationData): Promise<ApiResponse<LocationData>> {
    const validationError = this.validateRequiredFields(
      data,
      ['restaurant_id', 'name', 'address', 'city', 'country'],
      'Create Location'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeMutation(
      async () => {
        const response = await fetch(`${this.getApiUrl('location-manager')}`, {
          method: 'POST',
          headers: await this.getAuthHeaders(),
          body: JSON.stringify({
            endpoint: 'location',
            data: {
              ...data,
              status: 'active'
            }
          })
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'API call failed');
        }

        return { data: result.data, error: null };
      },
      'Create Location',
      this.sanitizeForLogging(data)
    );
  }

  // ============================================================================
  // STAFF MANAGEMENT
  // ============================================================================

  /**
   * Get staff members for a restaurant
   */
  async getRestaurantStaff(restaurantId: string, locationId?: string): Promise<ApiResponse<StaffMemberData[]>> {
    const validationError = this.validateRequiredFields(
      { restaurantId },
      ['restaurantId'],
      'Get Restaurant Staff'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeQuery(
      async () => {
        const params = new URLSearchParams({
          endpoint: 'staff',
          restaurant_id: restaurantId
        });
        
        if (locationId) {
          params.append('location_id', locationId);
        }

        const response = await fetch(`${this.getApiUrl('staff-manager')}?${params}`, {
          headers: await this.getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'API call failed');
        }

        return { data: result.data || [], error: null };
      },
      'Get Restaurant Staff',
      { restaurantId: this.sanitizeForLogging({ restaurantId }), locationId }
    );
  }

  /**
   * Create a new staff member
   */
  async createStaffMember(data: CreateStaffMemberData): Promise<ApiResponse<StaffMemberData>> {
    const validationError = this.validateRequiredFields(
      data,
      ['restaurant_id', 'name', 'email', 'role'],
      'Create Staff Member'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeMutation(
      async () => {
        const response = await fetch(`${this.getApiUrl('staff-manager')}`, {
          method: 'POST',
          headers: await this.getAuthHeaders(),
          body: JSON.stringify({
            endpoint: 'staff',
            data: {
              ...data,
              status: 'active'
            }
          })
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'API call failed');
        }

        return { data: result.data, error: null };
      },
      'Create Staff Member',
      this.sanitizeForLogging(data)
    );
  }

  /**
   * Get restaurant analytics and metrics
   */
  async getRestaurantAnalytics(restaurantId: string, period = '30d'): Promise<ApiResponse<any>> {
    const validationError = this.validateRequiredFields(
      { restaurantId },
      ['restaurantId'],
      'Get Restaurant Analytics'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeQuery(
      async () => {
        const response = await fetch(`${this.getApiUrl('analytics-report')}?restaurant_id=${restaurantId}&period=${period}`, {
          headers: await this.getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'API call failed');
        }

        return { data: result.data, error: null };
      },
      'Get Restaurant Analytics',
      { restaurantId: this.sanitizeForLogging({ restaurantId }), period }
    );
  }
}

// Create singleton instance
export const restaurantService = new RestaurantService();
export default restaurantService; 
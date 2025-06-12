// ============================================================================
// RESTAURANT SERVICE - DEPRECATED PLACEHOLDER
// ============================================================================
// This service has been deprecated as our FinalBackEndImplementation schema
// uses a simplified hierarchy: clients → locations (no separate restaurants)
// 
// For restaurant/business functionality, use:
// - ClientService for business-level operations  
// - LocationService for individual location operations
// ============================================================================

import { BaseService } from '../base/BaseService';
import type { ApiResponse } from '../../../types';

// Placeholder types to prevent TypeScript errors during transition
export interface RestaurantData {
  id: string;
  name: string;
  client_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  cuisine_type?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  loyalty_program: {
    stamps_to_reward: number;
    reward_description: string;
    stamp_value: number;
    is_active: boolean;
  };
  total_customers: number;
  total_stamps_issued: number;
  total_rewards_redeemed: number;
  monthly_revenue: number;
  locations_count: number;
  staff_count: number;
}

export interface RestaurantFilters {
  client_id?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LocationData {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
}

export interface StaffMemberData {
  id: string;
  name: string;
  email: string;
  role: string;
  location_id: string;
}

export interface CreateLocationData {
  restaurant_id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
}

export interface UpdateLocationData {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface CreateStaffMemberData {
  restaurant_id: string;
  location_id?: string;
  name: string;
  email: string;
  role: string;
}

export class RestaurantService extends BaseService {
  constructor() {
    super('RestaurantService (Deprecated)');
    console.warn('RestaurantService is deprecated. Use ClientService for business operations or LocationService for location operations.');
  }

  async getRestaurants(): Promise<ApiResponse<RestaurantData[]>> {
    return {
      success: false,
      error: {
        code: 'SERVICE_DEPRECATED',
        message: 'RestaurantService is deprecated. Use ClientService instead.'
      }
    };
  }

  async getRestaurantById(): Promise<ApiResponse<RestaurantData>> {
    return {
      success: false,
      error: {
        code: 'SERVICE_DEPRECATED',
        message: 'RestaurantService is deprecated. Use ClientService instead.'
      }
    };
  }

  async createRestaurant(): Promise<ApiResponse<RestaurantData>> {
    return {
      success: false,
      error: {
        code: 'SERVICE_DEPRECATED',
        message: 'RestaurantService is deprecated. Use ClientService instead.'
      }
    };
  }

  async updateRestaurant(): Promise<ApiResponse<RestaurantData>> {
    return {
      success: false,
      error: {
        code: 'SERVICE_DEPRECATED',
        message: 'RestaurantService is deprecated. Use ClientService instead.'
      }
    };
  }

  async deleteRestaurant(): Promise<ApiResponse<null>> {
    return {
      success: false,
      error: {
        code: 'SERVICE_DEPRECATED',
        message: 'RestaurantService is deprecated. Use ClientService instead.'
      }
    };
  }

  async getRestaurantLocations(): Promise<ApiResponse<LocationData[]>> {
    return {
      success: false,
      error: {
        code: 'SERVICE_DEPRECATED',
        message: 'RestaurantService is deprecated.'
      }
    };
  }

  async createLocation(): Promise<ApiResponse<LocationData>> {
    return {
      success: false,
      error: {
        code: 'SERVICE_DEPRECATED',
        message: 'RestaurantService is deprecated.'
      }
    };
  }

  async getRestaurantStaff(): Promise<ApiResponse<StaffMemberData[]>> {
    return {
      success: false,
      error: {
        code: 'SERVICE_DEPRECATED',
        message: 'RestaurantService is deprecated.'
      }
    };
  }

  async createStaffMember(): Promise<ApiResponse<StaffMemberData>> {
    return {
      success: false,
      error: {
        code: 'SERVICE_DEPRECATED',
        message: 'RestaurantService is deprecated.'
      }
    };
  }
}

export const restaurantService = new RestaurantService();
export default restaurantService; 
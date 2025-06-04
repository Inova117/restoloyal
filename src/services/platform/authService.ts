// ============================================================================
// AUTH SERVICE
// Restaurant Loyalty Platform - Authentication & Authorization Service
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { BaseService } from '../base/BaseService';
import type { ApiResponse } from '../../../types';

// ============================================================================
// AUTH SERVICE TYPES
// ============================================================================

export interface UserInfo {
  id: string;
  email: string;
  roles: Array<{
    id: string;
    role: 'zerion_admin' | 'client_admin' | 'restaurant_owner' | 'location_staff';
    client_id?: string;
    restaurant_id?: string;
    location_id?: string;
    status: 'active' | 'inactive';
  }>;
  is_platform_admin: boolean;
  platform_admin_role?: string;
  permissions: Record<string, any>;
  verified: boolean;
}

export interface UserPermissions {
  platform: Record<string, any>;
  staff: Array<{
    permissions: Record<string, any>;
    location_id: string;
  }>;
  computed_permissions: {
    can_manage_platform: boolean;
    can_manage_clients: boolean;
    can_view_all_data: boolean;
    locations_access: string[];
  };
}

// ============================================================================
// AUTH SERVICE CLASS
// ============================================================================

export class AuthService extends BaseService {
  constructor() {
    super('AuthService');
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

  /**
   * Verify current user and get user info
   */
  async verifyUser(): Promise<ApiResponse<UserInfo>> {
    return this.executeQuery(
      async () => {
        const response = await fetch(`${this.getApiUrl('auth-management')}?endpoint=verify`, {
          headers: await this.getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'User verification failed');
        }

        return { data: result.data, error: null };
      },
      'Verify User'
    );
  }

  /**
   * Get user roles
   */
  async getUserRoles(): Promise<ApiResponse<any[]>> {
    return this.executeQuery(
      async () => {
        const response = await fetch(`${this.getApiUrl('auth-management')}?endpoint=roles`, {
          headers: await this.getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to get user roles');
        }

        return { data: result.data, error: null };
      },
      'Get User Roles'
    );
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(): Promise<ApiResponse<UserPermissions>> {
    return this.executeQuery(
      async () => {
        const response = await fetch(`${this.getApiUrl('auth-management')}?endpoint=permissions`, {
          headers: await this.getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to get user permissions');
        }

        return { data: result.data, error: null };
      },
      'Get User Permissions'
    );
  }

  /**
   * Check if user has specific role
   */
  async hasRole(role: string): Promise<boolean> {
    try {
      const result = await this.getUserRoles();
      if (!result.success || !result.data) return false;
      
      return result.data.some((userRole: any) => userRole.role === role && userRole.status === 'active');
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  }

  /**
   * Check if user is platform admin
   */
  async isPlatformAdmin(): Promise<boolean> {
    try {
      const result = await this.verifyUser();
      if (!result.success || !result.data) return false;
      
      return result.data.is_platform_admin;
    } catch (error) {
      console.error('Error checking platform admin status:', error);
      return false;
    }
  }

  /**
   * Get current user session
   */
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        success: false,
        error: {
          code: 'SESSION_ERROR',
          message: 'Failed to get current session',
          details: { error: error.message }
        }
      };
    }

    return {
      success: true,
      data: session
    };
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<ApiResponse<null>> {
    return this.executeQuery(
      async () => {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          throw new Error(error.message);
        }

        return { data: null, error: null };
      },
      'Sign Out'
    );
  }
}

// Create and export instance
export const authService = new AuthService(); 
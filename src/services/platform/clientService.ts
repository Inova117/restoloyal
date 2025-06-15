// ============================================================================
// CLIENT SERVICE
// Restaurant Loyalty Platform - Client Management Service
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { BaseService } from '../base/BaseService';
import type { 
  ApiResponse, 
  SubscriptionPlan, 
  SubscriptionStatus,
  FilterOptions 
} from '../../../types';

// ============================================================================
// CLIENT SERVICE TYPES
// ============================================================================

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  subscription_plan: SubscriptionPlan;
  contact_email: string;
  contact_phone?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  subscription_plan?: SubscriptionPlan;
  contact_email?: string;
  contact_phone?: string;
}

export interface ClientFilters extends FilterOptions {
  subscription_plan?: SubscriptionPlan | 'all';
  subscription_status?: SubscriptionStatus | 'all';
  created_after?: string;
  created_before?: string;
}

export interface ClientData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  // Additional computed fields
  subscription_plan?: SubscriptionPlan;
  subscription_status?: SubscriptionStatus;
  contact_email?: string;
  contact_phone?: string;
  restaurant_count?: number;
  location_count?: number;
  customer_count?: number;
  monthly_revenue?: number;
  growth_rate?: number;
}

export interface ClientMetrics {
  id: string;
  name: string;
  restaurant_count: number;
  location_count: number;
  customer_count: number;
  monthly_revenue: number;
  growth_rate: number;
  total_transactions: number;
  stamps_issued: number;
  rewards_redeemed: number;
  last_activity: string;
}

// ============================================================================
// CLIENT SERVICE CLASS
// ============================================================================

export class ClientService extends BaseService {
  constructor() {
    super('ClientService');
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
   * Get all clients with optional filtering (using platform-management Edge Function)
   */
  async getClients(filters?: ClientFilters): Promise<ApiResponse<ClientData[]>> {
    // Check permissions - only platform admins can view all clients
    const hasPermission = await this.checkPermissions('zerion_admin');
    if (!hasPermission) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to view clients'
        }
      };
    }

    return this.executeQuery(
      async () => {
        const params = new URLSearchParams({
          endpoint: 'clients',
          page: (filters?.page || 1).toString(),
          limit: (filters?.limit || 20).toString()
        });
        
        if (filters?.search) {
          params.append('search', filters.search);
        }

        const response = await fetch(`${this.getApiUrl('Platform-Management')}?${params}`, {
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
        const transformedData = (result.data || []).map((client: any) => ({
          id: client.id,
          name: client.name,
          email: client.contact_email,
          phone: client.contact_phone,
          created_at: client.join_date,
          updated_at: client.join_date,
          subscription_plan: client.plan as SubscriptionPlan,
          subscription_status: client.status as SubscriptionStatus,
          contact_email: client.contact_email,
          contact_phone: client.contact_phone,
          restaurant_count: client.restaurant_count,
          location_count: client.location_count,
          customer_count: client.customer_count,
          monthly_revenue: client.monthly_revenue,
          growth_rate: client.growth_rate
        }));

        return { data: transformedData, error: null };
      },
      'Get Clients',
      this.sanitizeForLogging(filters || {})
    );
  }

  /**
   * Get client dashboard data (using client-administration Edge Function)
   */
  async getClientDashboard(clientId: string): Promise<ApiResponse<any>> {
    const validationError = this.validateRequiredFields(
      { clientId },
      ['clientId'],
      'Get Client Dashboard'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeQuery(
      async () => {
        const response = await fetch(`${this.getApiUrl('Platform-Management')}?endpoint=dashboard&client_id=${clientId}`, {
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
      'Get Client Dashboard',
      { clientId: this.sanitizeForLogging({ clientId }) }
    );
  }

  /**
   * Get client restaurants (using client-administration Edge Function)
   */
  async getClientRestaurants(clientId: string): Promise<ApiResponse<any[]>> {
    const validationError = this.validateRequiredFields(
      { clientId },
      ['clientId'],
      'Get Client Restaurants'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeQuery(
      async () => {
        const response = await fetch(`${this.getApiUrl('Platform-Management')}?endpoint=restaurants&client_id=${clientId}`, {
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
      'Get Client Restaurants',
      { clientId: this.sanitizeForLogging({ clientId }) }
    );
  }

  /**
   * Get client analytics (using client-administration Edge Function)
   */
  async getClientAnalytics(clientId: string, period = '30d'): Promise<ApiResponse<any>> {
    const validationError = this.validateRequiredFields(
      { clientId },
      ['clientId'],
      'Get Client Analytics'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeQuery(
      async () => {
        const response = await fetch(`${this.getApiUrl('Platform-Management')}?endpoint=analytics&client_id=${clientId}&period=${period}`, {
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
      'Get Client Analytics',
      { clientId: this.sanitizeForLogging({ clientId }), period }
    );
  }

  /**
   * Get a single client by ID (fallback to direct Supabase for now)
   */
  async getClientById(id: string): Promise<ApiResponse<ClientData>> {
    const validationError = this.validateRequiredFields(
      { id },
      ['id'],
      'Get Client By ID'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeQuery(
      async () => {
        const result = await supabase
          .from('clients')
          .select(`
            id,
            name,
            email,
            phone,
            created_at,
            updated_at
          `)
          .eq('id', id)
          .single();

        // Transform data to match our interface
        if (result.data) {
          const transformedData = {
            id: result.data.id,
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone,
            created_at: result.data.created_at,
            updated_at: result.data.updated_at,
            subscription_plan: 'trial' as SubscriptionPlan,
            subscription_status: 'active' as SubscriptionStatus,
            contact_email: result.data.email || '',
            contact_phone: result.data.phone || '',
            restaurant_count: 1,
            location_count: 0,
            customer_count: 0,
            monthly_revenue: 0,
            growth_rate: 0
          };
          
          return { data: transformedData, error: null };
        }

        return result;
      },
      'Get Client By ID',
      this.sanitizeForLogging({ id })
    );
  }

  /**
   * Create a new client
   * Note: Simplified for current schema
   */
  async createClient(data: CreateClientData): Promise<ApiResponse<ClientData>> {
    // Check permissions
    const hasPermission = await this.checkPermissions('zerion_admin');
    if (!hasPermission) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to create clients'
        }
      };
    }

    // Validate required fields
    const validationError = this.validateRequiredFields(
      data,
      ['name', 'email', 'contact_email'],
      'Create Client'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeMutation(
      async () => {
        // DIRECT DATABASE INSERT - WORKING SOLUTION
        const clientData = {
          name: data.name,
          slug: data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
          email: data.contact_email,
          phone: data.contact_phone || null,
          business_type: 'restaurant_chain',
          status: 'active'
        };

        const result = await supabase
          .from('clients')
          .insert([clientData])
          .select()
          .single();

        if (result.error) {
          throw new Error(result.error.message);
        }

        // Transform response to match interface
        const transformedData = {
          id: result.data.id,
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone,
          created_at: result.data.created_at,
          updated_at: result.data.updated_at,
          subscription_plan: data.subscription_plan,
          subscription_status: 'trial' as SubscriptionStatus,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone || '',
          restaurant_count: 1,
          location_count: 0,
          customer_count: 0,
          monthly_revenue: 0,
          growth_rate: 0
        };

        return { data: transformedData, error: null };
      },
      'Create Client',
      this.sanitizeForLogging(data)
    );
  }

  /**
   * Update an existing client
   */
  async updateClient(id: string, data: UpdateClientData): Promise<ApiResponse<ClientData>> {
    // Check permissions
    const hasPermission = await this.checkPermissions('zerion_admin');
    if (!hasPermission) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to update clients'
        }
      };
    }

    const validationError = this.validateRequiredFields(
      { id },
      ['id'],
      'Update Client'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeMutation(
      async () => {
        const updateData = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          updated_at: new Date().toISOString()
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key as keyof typeof updateData] === undefined) {
            delete updateData[key as keyof typeof updateData];
          }
        });

        const result = await supabase
          .from('clients')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        // Transform response
        if (result.data) {
          const transformedData = {
            ...result.data,
            subscription_plan: data.subscription_plan || 'trial' as SubscriptionPlan,
            subscription_status: 'active' as SubscriptionStatus,
            contact_email: data.contact_email || result.data.email || '',
            contact_phone: data.contact_phone || result.data.phone || '',
            restaurant_count: 1,
            location_count: 0,
            customer_count: 0,
            monthly_revenue: 0,
            growth_rate: 0
          };
          
          return { data: transformedData, error: null };
        }

        return result;
      },
      'Update Client',
      { client_id: id, ...this.sanitizeForLogging(data) }
    );
  }

  /**
   * Delete a client
   */
  async deleteClient(id: string): Promise<ApiResponse<null>> {
    // Check permissions
    const hasPermission = await this.checkPermissions('zerion_admin');
    if (!hasPermission) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to delete clients'
        }
      };
    }

    const validationError = this.validateRequiredFields(
      { id },
      ['id'],
      'Delete Client'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeMutation(
      async () => {
        return supabase
          .from('clients')
          .delete()
          .eq('id', id);
      },
      'Delete Client',
      { client_id: id }
    );
  }

  /**
   * Get client metrics and analytics
   * Note: Simplified version for current schema
   */
  async getClientMetrics(id: string): Promise<ApiResponse<ClientMetrics>> {
    const validationError = this.validateRequiredFields(
      { id },
      ['id'],
      'Get Client Metrics'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeQuery(
      async () => {
        // Get client basic info
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id, name')
          .eq('id', id)
          .single();

        if (clientError) throw clientError;

        // For now, return mock metrics
        // In the future, this would calculate real metrics from related tables
        const metrics: ClientMetrics = {
          id: client.id,
          name: client.name,
          restaurant_count: 1,
          location_count: 0,
          customer_count: 0,
          monthly_revenue: 0,
          growth_rate: 0,
          total_transactions: 0,
          stamps_issued: 0,
          rewards_redeemed: 0,
          last_activity: new Date().toISOString()
        };

        return { data: metrics, error: null };
      },
      'Get Client Metrics',
      { client_id: id }
    );
  }

  /**
   * Send invitation email to client
   */
  async sendClientInvitation(clientId: string, email: string): Promise<ApiResponse<null>> {
    // Check permissions
    const hasPermission = await this.checkPermissions('zerion_admin');
    if (!hasPermission) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to send invitations'
        }
      };
    }

    const validationError = this.validateRequiredFields(
      { clientId, email },
      ['clientId', 'email'],
      'Send Client Invitation'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeQuery(
      async () => {
        // Get client info
        const { data: client } = await supabase
          .from('clients')
          .select('name')
          .eq('id', clientId)
          .single();

        if (!client) {
          throw new Error('Client not found');
        }

        // In a real implementation, this would send an email
        // For now, we'll just log the action
        return { data: null, error: null };
      },
      'Send Client Invitation',
      { client_id: clientId, email }
    );
  }

  /**
   * Get client activity feed
   * Note: Simplified version for current schema
   */
  async getClientActivity(clientId: string, limit: number = 10): Promise<ApiResponse<any[]>> {
    const validationError = this.validateRequiredFields(
      { clientId },
      ['clientId'],
      'Get Client Activity'
    );

    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.executeQuery(
      async () => {
        // For now, return mock activity
        // In the future, this would get real activity from related tables
        const activity = [
          {
            id: '1',
            type: 'client_created',
            description: 'Client account created',
            timestamp: new Date().toISOString(),
            amount: null,
            customer: null
          }
        ];

        return { data: activity, error: null };
      },
      'Get Client Activity',
      { client_id: clientId, limit }
    );
  }
}

// Create singleton instance
export const clientService = new ClientService();
export default clientService; 
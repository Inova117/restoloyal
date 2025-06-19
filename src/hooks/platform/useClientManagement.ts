// ============================================================================
// USE CLIENT MANAGEMENT HOOK - MODERN CLIENT/LOCATION HIERARCHY
// Restaurant Loyalty Platform - Client Management Hook for 4-tier system
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { clientService, type ClientData } from '../../services/platform';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../use-toast';
import type { Location, LocationStaff, ClientDataForRestaurantView } from '../../types/database';

// ============================================================================
// DATA TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Transform backend Client data to RestaurantData format for the dashboard
 */
const transformClientToRestaurantData = (client: ClientData): ClientDataForRestaurantView => {
  // Since ClientData doesn't have settings, we'll use defaults for now
  // This can be enhanced when we have a proper client settings system
  
  return {
    // Map core client fields that exist in backend
    id: client.id,
    name: client.name,
    slug: client.name.toLowerCase().replace(/[^a-z0-9]/g, '-'), // Generate slug from name
    email: client.email,
    phone: client.phone,
    business_type: 'restaurant_chain', // Default for restaurant view
    status: 'active', // Default status
    settings: null, // JSON field in backend
    created_at: client.created_at,
    updated_at: client.updated_at,
    
    // Extended fields for restaurant dashboard
    cuisine_type: 'american', // Default cuisine type
    description: `${client.name} restaurant`,
    website: '',
    
    // Loyalty program configuration with defaults
    loyalty_program: {
      stamps_to_reward: 10,
      reward_description: 'Free item after 10 stamps',
      stamp_value: 1.0,
      is_active: client.subscription_status === 'active'
    },
    
    // Computed metrics (will be populated by separate queries)
    total_customers: client.customer_count || 0,
    total_stamps_issued: 0,
    total_rewards_redeemed: 0,
    monthly_revenue: client.monthly_revenue || 0,
    locations_count: client.location_count || 0,
    staff_count: 0
  };
};

/**
 * Load aggregated metrics for a client
 */
const loadClientMetrics = async (clientId: string) => {
  try {
    // Load locations count
    const { count: locationsCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('is_active', true);

    // Load customers count
    const { count: customersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'active');

    // Load staff count
    const { count: staffCount } = await supabase
      .from('location_staff')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('is_active', true);

    // Load stamps count
    const { count: stampsCount } = await supabase
      .from('stamps')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId);

    // Load rewards count
    const { count: rewardsCount } = await supabase
      .from('rewards')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId);

    return {
      locations_count: locationsCount || 0,
      total_customers: customersCount || 0,
      staff_count: staffCount || 0,
      total_stamps_issued: stampsCount || 0,
      total_rewards_redeemed: rewardsCount || 0,
      monthly_revenue: 0 // TODO: Calculate from actual transaction data
    };
  } catch (error) {
    console.error('Error loading client metrics:', error);
    return {
      locations_count: 0,
      total_customers: 0,
      staff_count: 0,
      total_stamps_issued: 0,
      total_rewards_redeemed: 0,
      monthly_revenue: 0
    };
  }
};

// ============================================================================
// HOOK TYPES FOR MODERN SCHEMA
// ============================================================================

export interface UseClientManagementOptions {
  autoLoad?: boolean;
  clientId?: string;
  refreshInterval?: number;
  showToasts?: boolean;
}

export interface UseClientManagementReturn {
  // Client data (modern approach)
  clients: ClientDataForRestaurantView[];
  selectedClient: ClientDataForRestaurantView | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Client operations
  loadClients: (filters?: any) => Promise<void>;
  selectClient: (client: ClientDataForRestaurantView | null) => void;
  createClient: (data: any) => Promise<boolean>;
  updateClient: (id: string, data: any) => Promise<boolean>;
  deleteClient: (id: string) => Promise<boolean>;
  
  // Location operations
  locations: Location[];
  loadLocations: (clientId: string) => Promise<void>;
  createLocation: (data: any) => Promise<boolean>;
  
  // Staff operations
  staff: LocationStaff[];
  loadStaff: (clientId: string, locationId?: string) => Promise<void>;
  createStaffMember: (data: any) => Promise<boolean>;
  
  // Utility functions
  refreshData: () => Promise<void>;
  getClientById: (id: string) => ClientDataForRestaurantView | undefined;
  clientCount: number;
}

export const useClientManagement = (
  options: UseClientManagementOptions = {}
): UseClientManagementReturn => {
  const {
    autoLoad = true,
    clientId,
    refreshInterval,
    showToasts = true
  } = options;

  const { toast } = useToast();

  // State management
  const [clients, setClients] = useState<ClientDataForRestaurantView[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientDataForRestaurantView | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [staff, setStaff] = useState<LocationStaff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load clients with proper transformation
  const loadClients = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await clientService.getClients(filters);

      if (response.success && response.data) {
        // Transform client data to restaurant format
        const transformedClients = await Promise.all(
          response.data.map(async (client) => {
            const restaurantData = transformClientToRestaurantData(client);
            
            // Load metrics for each client
            const metrics = await loadClientMetrics(client.id);
            
            return {
              ...restaurantData,
              ...metrics
            };
          })
        );

        setClients(transformedClients);
        setLastUpdated(new Date());
        
        if (showToasts && filters?.search) {
          toast({
            title: 'Restaurants Loaded',
            description: `Found ${transformedClients.length} restaurants.`
          });
        }
      } else {
        const errorMessage = response.error?.message || 'Failed to load restaurants';
        setError(errorMessage);
        
        if (showToasts) {
          toast({
            title: 'Error Loading Restaurants',
            description: errorMessage,
            variant: 'destructive'
          });
        }
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred while loading restaurants';
      setError(errorMessage);
      
      console.error('Restaurant Management Hook Error:', err);
      
      if (showToasts) {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [clientId, showToasts, toast]);

  // Load locations for a client
  const loadLocations = useCallback(async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (err) {
      console.error('Error loading locations:', err);
    }
  }, []);

  // Load staff for a client
  const loadStaff = useCallback(async (clientId: string, locationId?: string) => {
    try {
      let query = supabase
        .from('location_staff')
        .select(`
          *,
          locations (
            id,
            name
          )
        `)
        .eq('client_id', clientId)
        .eq('is_active', true);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      console.error('Error loading staff:', err);
    }
  }, []);

  // Create a new client
  const createClient = useCallback(async (data: any): Promise<boolean> => {
    try {
      const response = await clientService.createClient(data);
      
      if (response.success) {
        await loadClients();
        
        if (showToasts) {
          toast({
            title: 'Restaurant Created',
            description: `${data.name} has been created successfully.`
          });
        }
        
        return true;
      } else {
        const errorMessage = response.error?.message || 'Failed to create restaurant';
        
        if (showToasts) {
          toast({
            title: 'Error Creating Restaurant',
            description: errorMessage,
            variant: 'destructive'
          });
        }
        
        return false;
      }
    } catch (err) {
      console.error('Error creating restaurant:', err);
      
      if (showToasts) {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while creating the restaurant',
          variant: 'destructive'
        });
      }
      
      return false;
    }
  }, [loadClients, showToasts, toast]);

  // Update a client
  const updateClient = useCallback(async (id: string, data: any): Promise<boolean> => {
    try {
      const response = await clientService.updateClient(id, data);
      
      if (response.success) {
        await loadClients();
        
        if (selectedClient && selectedClient.id === id && response.data) {
          const transformedData = transformClientToRestaurantData(response.data);
          setSelectedClient(transformedData);
        }
        
        if (showToasts) {
          toast({
            title: 'Restaurant Updated',
            description: 'Restaurant has been updated successfully.'
          });
        }
        
        return true;
      } else {
        const errorMessage = response.error?.message || 'Failed to update restaurant';
        
        if (showToasts) {
          toast({
            title: 'Error Updating Restaurant',
            description: errorMessage,
            variant: 'destructive'
          });
        }
        
        return false;
      }
    } catch (err) {
      console.error('Error updating restaurant:', err);
      
      if (showToasts) {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while updating the restaurant',
          variant: 'destructive'
        });
      }
      
      return false;
    }
  }, [loadClients, selectedClient, showToasts, toast]);

  // Delete a client
  const deleteClient = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await clientService.deleteClient(id);
      
      if (response.success) {
        await loadClients();
        
        if (selectedClient && selectedClient.id === id) {
          setSelectedClient(null);
        }
        
        if (showToasts) {
          toast({
            title: 'Restaurant Deleted',
            description: 'Restaurant has been deleted successfully.'
          });
        }
        
        return true;
      } else {
        const errorMessage = response.error?.message || 'Failed to delete restaurant';
        
        if (showToasts) {
          toast({
            title: 'Error Deleting Restaurant',
            description: errorMessage,
            variant: 'destructive'
          });
        }
        
        return false;
      }
    } catch (err) {
      console.error('Error deleting restaurant:', err);
      
      if (showToasts) {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while deleting the restaurant',
          variant: 'destructive'
        });
      }
      
      return false;
    }
  }, [loadClients, selectedClient, showToasts, toast]);

  // Create location
  const createLocation = useCallback(async (data: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('locations')
        .insert([data]);

      if (error) throw error;

      if (showToasts) {
        toast({
          title: 'Location Created',
          description: `${data.name} has been created successfully.`
        });
      }

      return true;
    } catch (err) {
      console.error('Error creating location:', err);
      
      if (showToasts) {
        toast({
          title: 'Error',
          description: 'Failed to create location',
          variant: 'destructive'
        });
      }
      
      return false;
    }
  }, [showToasts, toast]);

  // Create staff member
  const createStaffMember = useCallback(async (data: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('location_staff')
        .insert([data]);

      if (error) throw error;

      if (showToasts) {
        toast({
          title: 'Staff Member Created',
          description: `${data.name} has been added successfully.`
        });
      }

      return true;
    } catch (err) {
      console.error('Error creating staff member:', err);
      
      if (showToasts) {
        toast({
          title: 'Error',
          description: 'Failed to create staff member',
          variant: 'destructive'
        });
      }
      
      return false;
    }
  }, [showToasts, toast]);

  // Select client
  const selectClient = useCallback((client: ClientDataForRestaurantView | null) => {
    setSelectedClient(client);
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await loadClients();
    if (selectedClient) {
      await loadLocations(selectedClient.id);
      await loadStaff(selectedClient.id);
    }
  }, [loadClients, selectedClient, loadLocations, loadStaff]);

  // Get client by ID
  const getClientById = useCallback((id: string) => {
    return clients.find(c => c.id === id);
  }, [clients]);

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoad) {
      loadClients();
    }
  }, [autoLoad, loadClients]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refreshData]);

  return {
    clients,
    selectedClient,
    locations,
    staff,
    loading,
    error,
    lastUpdated,
    loadClients,
    selectClient,
    createClient,
    updateClient,
    deleteClient,
    loadLocations,
    createLocation,
    loadStaff,
    createStaffMember,
    refreshData,
    getClientById,
    clientCount: clients.length
  };
};

export default useClientManagement; 
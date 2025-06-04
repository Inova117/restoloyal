// ============================================================================
// USE RESTAURANT MANAGEMENT HOOK
// Restaurant Loyalty Platform - Restaurant Management Hook
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { restaurantService, type RestaurantData, type RestaurantFilters, type LocationData, type StaffMemberData } from '@/services/platform';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface UseRestaurantManagementOptions {
  autoLoad?: boolean;
  clientId?: string;
  refreshInterval?: number;
  showToasts?: boolean;
}

export interface UseRestaurantManagementReturn {
  // Restaurant data
  restaurants: RestaurantData[];
  selectedRestaurant: RestaurantData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Restaurant operations
  loadRestaurants: (filters?: RestaurantFilters) => Promise<void>;
  selectRestaurant: (restaurant: RestaurantData | null) => void;
  createRestaurant: (data: any) => Promise<boolean>;
  updateRestaurant: (id: string, data: any) => Promise<boolean>;
  deleteRestaurant: (id: string) => Promise<boolean>;
  
  // Location operations
  locations: LocationData[];
  loadLocations: (restaurantId: string) => Promise<void>;
  createLocation: (data: any) => Promise<boolean>;
  
  // Staff operations
  staff: StaffMemberData[];
  loadStaff: (restaurantId: string, locationId?: string) => Promise<void>;
  createStaffMember: (data: any) => Promise<boolean>;
  
  // Utility functions
  refreshData: () => Promise<void>;
  getRestaurantById: (id: string) => RestaurantData | undefined;
  restaurantCount: number;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export const useRestaurantManagement = (options: UseRestaurantManagementOptions = {}): UseRestaurantManagementReturn => {
  const {
    autoLoad = true,
    clientId,
    refreshInterval,
    showToasts = true
  } = options;

  // State management
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantData | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [staff, setStaff] = useState<StaffMemberData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { toast } = useToast();

  // Load restaurants from service
  const loadRestaurants = useCallback(async (filters?: RestaurantFilters) => {
    setLoading(true);
    setError(null);

    try {
      const mergedFilters = {
        ...filters,
        client_id: filters?.client_id || clientId,
        limit: filters?.limit || 50
      };

      const response = await restaurantService.getRestaurants(mergedFilters);

      if (response.success && response.data) {
        setRestaurants(response.data);
        setLastUpdated(new Date());
        
        if (showToasts && filters?.search) {
          toast({
            title: 'Restaurants Loaded',
            description: `Found ${response.data.length} restaurants.`
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

  // Load locations for a restaurant
  const loadLocations = useCallback(async (restaurantId: string) => {
    try {
      const response = await restaurantService.getRestaurantLocations(restaurantId);
      if (response.success && response.data) {
        setLocations(response.data);
      } else {
        console.error('Failed to load locations:', response.error);
      }
    } catch (err) {
      console.error('Error loading locations:', err);
    }
  }, []);

  // Load staff for a restaurant
  const loadStaff = useCallback(async (restaurantId: string, locationId?: string) => {
    try {
      const response = await restaurantService.getRestaurantStaff(restaurantId, locationId);
      if (response.success && response.data) {
        setStaff(response.data);
      } else {
        console.error('Failed to load staff:', response.error);
      }
    } catch (err) {
      console.error('Error loading staff:', err);
    }
  }, []);

  // Select a restaurant
  const selectRestaurant = useCallback((restaurant: RestaurantData | null) => {
    setSelectedRestaurant(restaurant);
    
    if (restaurant) {
      // Auto-load locations and staff when a restaurant is selected
      loadLocations(restaurant.id);
      loadStaff(restaurant.id);
    } else {
      setLocations([]);
      setStaff([]);
    }
  }, [loadLocations, loadStaff]);

  // Create a new restaurant
  const createRestaurant = useCallback(async (data: any): Promise<boolean> => {
    try {
      const response = await restaurantService.createRestaurant(data);
      
      if (response.success) {
        // Refresh the restaurants list
        await loadRestaurants();
        
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
  }, [loadRestaurants, showToasts, toast]);

  // Update a restaurant
  const updateRestaurant = useCallback(async (id: string, data: any): Promise<boolean> => {
    try {
      const response = await restaurantService.updateRestaurant(id, data);
      
      if (response.success) {
        // Refresh the restaurants list
        await loadRestaurants();
        
        // Update selected restaurant if it's the one being updated
        if (selectedRestaurant && selectedRestaurant.id === id && response.data) {
          setSelectedRestaurant(response.data);
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
  }, [loadRestaurants, selectedRestaurant, showToasts, toast]);

  // Delete a restaurant
  const deleteRestaurant = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await restaurantService.deleteRestaurant(id);
      
      if (response.success) {
        // Refresh the restaurants list
        await loadRestaurants();
        
        // Clear selected restaurant if it's the one being deleted
        if (selectedRestaurant && selectedRestaurant.id === id) {
          setSelectedRestaurant(null);
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
  }, [loadRestaurants, selectedRestaurant, showToasts, toast]);

  // Create a location
  const createLocation = useCallback(async (data: any): Promise<boolean> => {
    try {
      const response = await restaurantService.createLocation(data);
      
      if (response.success) {
        // Refresh locations for the restaurant
        await loadLocations(data.restaurant_id);
        
        if (showToasts) {
          toast({
            title: 'Location Created',
            description: `${data.name} location has been created successfully.`
          });
        }
        
        return true;
      } else {
        const errorMessage = response.error?.message || 'Failed to create location';
        
        if (showToasts) {
          toast({
            title: 'Error Creating Location',
            description: errorMessage,
            variant: 'destructive'
          });
        }
        
        return false;
      }
    } catch (err) {
      console.error('Error creating location:', err);
      
      if (showToasts) {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while creating the location',
          variant: 'destructive'
        });
      }
      
      return false;
    }
  }, [loadLocations, showToasts, toast]);

  // Create a staff member
  const createStaffMember = useCallback(async (data: any): Promise<boolean> => {
    try {
      const response = await restaurantService.createStaffMember(data);
      
      if (response.success) {
        // Refresh staff for the restaurant
        await loadStaff(data.restaurant_id, data.location_id);
        
        if (showToasts) {
          toast({
            title: 'Staff Member Added',
            description: `${data.name} has been added successfully.`
          });
        }
        
        return true;
      } else {
        const errorMessage = response.error?.message || 'Failed to create staff member';
        
        if (showToasts) {
          toast({
            title: 'Error Adding Staff Member',
            description: errorMessage,
            variant: 'destructive'
          });
        }
        
        return false;
      }
    } catch (err) {
      console.error('Error creating staff member:', err);
      
      if (showToasts) {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while adding the staff member',
          variant: 'destructive'
        });
      }
      
      return false;
    }
  }, [loadStaff, showToasts, toast]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await loadRestaurants();
    
    if (selectedRestaurant) {
      await loadLocations(selectedRestaurant.id);
      await loadStaff(selectedRestaurant.id);
    }
  }, [loadRestaurants, selectedRestaurant, loadLocations, loadStaff]);

  // Get restaurant by ID
  const getRestaurantById = useCallback((id: string): RestaurantData | undefined => {
    return restaurants.find(restaurant => restaurant.id === id);
  }, [restaurants]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadRestaurants();
    }
  }, [autoLoad, loadRestaurants]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        loadRestaurants();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, loadRestaurants]);

  return {
    // Restaurant data
    restaurants,
    selectedRestaurant,
    loading,
    error,
    lastUpdated,
    
    // Restaurant operations
    loadRestaurants,
    selectRestaurant,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    
    // Location operations
    locations,
    loadLocations,
    createLocation,
    
    // Staff operations
    staff,
    loadStaff,
    createStaffMember,
    
    // Utility functions
    refreshData,
    getRestaurantById,
    restaurantCount: restaurants.length
  };
}; 
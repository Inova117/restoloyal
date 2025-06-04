// ============================================================================
// PLATFORM SERVICES INDEX
// Restaurant Loyalty Platform - Service Layer Exports
// ============================================================================

export { PlatformService } from './platformService';
export { ClientService } from './clientService';
export { AuthService, authService } from './authService';
export { RestaurantService } from './restaurantService';

// Export types
export type { 
  PlatformMetrics,
  PlatformSettings
} from './platformService';

export type {
  CreateClientData,
  UpdateClientData,
  ClientFilters,
  ClientData,
  ClientMetrics
} from './clientService';

export type {
  UserInfo,
  UserPermissions
} from './authService';

export type {
  RestaurantData,
  LocationData,
  StaffMemberData,
  CreateRestaurantData,
  UpdateRestaurantData,
  CreateLocationData,
  CreateStaffMemberData,
  RestaurantFilters
} from './restaurantService';

// Create and export service instances
import { PlatformService } from './platformService';
import { ClientService } from './clientService';
import { RestaurantService } from './restaurantService';

export const platformService = new PlatformService();
export const clientService = new ClientService();
export const restaurantService = new RestaurantService(); 
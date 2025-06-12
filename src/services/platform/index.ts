// ============================================================================
// PLATFORM SERVICES INDEX - UPDATED FOR FINALBACKENDIMPLEMENTATION
// ============================================================================
// This file exports all platform services that work with our 4-tier hierarchy
// schema: superadmins, clients, client_admins, locations, location_staff, 
// customers, stamps, rewards, user_roles, hierarchy_audit_log
// ============================================================================

// Core platform services
export { PlatformService } from './platformService';
export { ClientService } from './clientService';
export { AuthService } from './authService';

// DEPRECATED: Restaurant service (use ClientService instead)
export { RestaurantService, restaurantService } from './restaurantService';

// Service types
export type {
  PlatformMetrics,
  PlatformSettings
} from './platformService';

export type {
  ClientData,
  CreateClientData,
  UpdateClientData,
  ClientFilters,
  ClientMetrics
} from './clientService';

export type {
  UserInfo
} from './authService';

// DEPRECATED: Restaurant types (use Client types instead)
export type {
  RestaurantData,
  RestaurantFilters,
  LocationData,
  StaffMemberData
} from './restaurantService';

// Service instances
import { PlatformService } from './platformService';
import { ClientService } from './clientService';
import { AuthService } from './authService';

export const platformService = new PlatformService();
export const clientService = new ClientService();
export const authService = new AuthService(); 
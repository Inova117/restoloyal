// ============================================================================
// BASE SERVICE CLASS
// Restaurant Loyalty Platform - Service Layer Foundation
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { logError, logInfo, logWarn } from '@/lib/logger';
import type { ApiResponse, ApiError } from '../../../types';

export abstract class BaseService {
  protected serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Execute a database operation with proper error handling and logging
   */
  protected async executeQuery<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    operationName: string,
    context?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    
    try {
      logInfo(
        `${this.serviceName}: Starting ${operationName}`,
        context,
        this.serviceName
      );

      const { data, error } = await operation();

      const duration = performance.now() - startTime;

      if (error) {
        logError(
          `${this.serviceName}: ${operationName} failed`,
          {
            error_message: error.message,
            error_code: error.code,
            operation: operationName,
            duration_ms: duration,
            context
          },
          this.serviceName
        );

        return {
          success: false,
          error: this.formatError(error),
          message: `Failed to ${operationName.toLowerCase()}`
        };
      }

      logInfo(
        `${this.serviceName}: ${operationName} completed successfully`,
        {
          operation: operationName,
          duration_ms: duration,
          result_count: Array.isArray(data) ? data.length : data ? 1 : 0
        },
        this.serviceName
      );

      return {
        success: true,
        data: data as T,
        message: `${operationName} completed successfully`
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      
      logError(
        `${this.serviceName}: Unexpected error in ${operationName}`,
        {
          error,
          operation: operationName,
          duration_ms: duration,
          context
        },
        this.serviceName
      );

      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'An unexpected error occurred',
          details: { operation: operationName }
        },
        message: 'An unexpected error occurred'
      };
    }
  }

  /**
   * Execute a mutation (insert/update/delete) with optimistic updates support
   */
  protected async executeMutation<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    operationName: string,
    context?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    return this.executeQuery(operation, operationName, context);
  }

  /**
   * Format Supabase errors into consistent API error format
   */
  private formatError(error: any): ApiError {
    // Handle Supabase specific errors
    if (error.code) {
      switch (error.code) {
        case 'PGRST116':
          return {
            code: 'NOT_FOUND',
            message: 'The requested resource was not found',
            details: { supabase_code: error.code }
          };
        case 'PGRST301':
          return {
            code: 'PERMISSION_DENIED',
            message: 'You do not have permission to perform this action',
            details: { supabase_code: error.code }
          };
        case '23505':
          return {
            code: 'DUPLICATE_ENTRY',
            message: 'A record with this information already exists',
            details: { supabase_code: error.code }
          };
        case '23503':
          return {
            code: 'FOREIGN_KEY_VIOLATION',
            message: 'Cannot delete record due to existing dependencies',
            details: { supabase_code: error.code }
          };
        default:
          return {
            code: 'DATABASE_ERROR',
            message: error.message || 'A database error occurred',
            details: { supabase_code: error.code }
          };
      }
    }

    // Handle network errors
    if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection error. Please check your internet connection.',
        details: { error_type: 'network' }
      };
    }

    // Generic error fallback
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: { error_type: 'unknown' }
    };
  }

  /**
   * Get current user from Supabase auth
   */
  protected async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      logWarn(
        `${this.serviceName}: Failed to get current user`,
        { error_message: error.message },
        this.serviceName
      );
      return null;
    }

    return user;
  }

  /**
   * Check if user has required permissions
   */
  protected async checkPermissions(requiredRole?: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    
    if (!user) {
      logWarn(
        `${this.serviceName}: Permission check failed - no user`,
        { required_role: requiredRole },
        this.serviceName
      );
      return false;
    }

    // If no specific role required, just check if user is authenticated
    if (!requiredRole) {
      return true;
    }

    // Check user role from metadata
    const userRole = user.user_metadata?.role;
    
    if (!userRole) {
      logWarn(
        `${this.serviceName}: Permission check failed - no role in metadata`,
        { 
          user_id: user.id.substring(0, 8) + '...',
          required_role: requiredRole 
        },
        this.serviceName
      );
      return false;
    }

    // Define role hierarchy
    const roleHierarchy = {
      'location_staff': 1,
      'restaurant_owner': 2,
      'galletti_hq': 3,
      'zerion_admin': 4
    };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    const hasPermission = userLevel >= requiredLevel;

    if (!hasPermission) {
      logWarn(
        `${this.serviceName}: Permission denied`,
        {
          user_role: userRole,
          required_role: requiredRole,
          user_level: userLevel,
          required_level: requiredLevel
        },
        this.serviceName
      );
    }

    return hasPermission;
  }

  /**
   * Build query filters for RLS (Row Level Security)
   */
  protected buildRLSFilters(user: any): Record<string, any> {
    const filters: Record<string, any> = {};
    
    if (!user) return filters;

    const userRole = user.user_metadata?.role;
    
    switch (userRole) {
      case 'zerion_admin':
        // Platform admin can see everything - no filters
        break;
        
      case 'galletti_hq':
        // Client admin can only see their client's data
        const clientName = user.user_metadata?.client_name;
        if (clientName) {
          filters.client_name = clientName;
        }
        break;
        
      case 'restaurant_owner':
        // Restaurant owner can only see their restaurant's data
        const restaurantId = user.user_metadata?.restaurant_id;
        if (restaurantId) {
          filters.restaurant_id = restaurantId;
        }
        break;
        
      case 'location_staff':
        // Location staff can only see their location's data
        const locationId = user.user_metadata?.location_id;
        if (locationId) {
          filters.location_id = locationId;
        }
        break;
    }

    return filters;
  }

  /**
   * Validate required fields in data object
   */
  protected validateRequiredFields<T extends Record<string, any>>(
    data: T,
    requiredFields: (keyof T)[],
    operationName: string
  ): ApiError | null {
    const missingFields = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null || data[field] === ''
    );

    if (missingFields.length > 0) {
      logWarn(
        `${this.serviceName}: Validation failed for ${operationName}`,
        {
          missing_fields: missingFields,
          operation: operationName
        },
        this.serviceName
      );

      return {
        code: 'VALIDATION_ERROR',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        details: { missing_fields: missingFields }
      };
    }

    return null;
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  protected sanitizeForLogging<T extends Record<string, any>>(data: T): Partial<T> {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }

    return sanitized;
  }
}

export default BaseService; 
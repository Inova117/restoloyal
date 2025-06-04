// ============================================================================
// USE PLATFORM METRICS HOOK
// Restaurant Loyalty Platform - Platform Metrics State Hook
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { platformService, type PlatformMetrics } from '@/services/platform/platformService';
import { logInfo, logError } from '@/lib/logger';

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface UsePlatformMetricsReturn {
  // State
  metrics: PlatformMetrics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions
  loadMetrics: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  
  // Computed values
  isHealthy: boolean;
  growthTrend: 'up' | 'down' | 'stable';
  revenueFormatted: string;
}

export interface UsePlatformMetricsOptions {
  autoLoad?: boolean;
  refreshInterval?: number; // in milliseconds
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function usePlatformMetrics(options: UsePlatformMetricsOptions = {}): UsePlatformMetricsReturn {
  const { autoLoad = true, refreshInterval } = options;
  const { toast } = useToast();

  // State
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load platform metrics from the service
  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      logInfo('Loading platform metrics', {}, 'usePlatformMetrics');

      const response = await platformService.getPlatformMetrics();

      if (response.success && response.data) {
        setMetrics(response.data);
        setLastUpdated(new Date());
        logInfo('Platform metrics loaded successfully', { 
          totalClients: response.data.totalClients,
          monthlyRevenue: response.data.monthlyRevenue 
        }, 'usePlatformMetrics');
      } else {
        const errorMessage = response.error?.message || 'Failed to load platform metrics';
        setError(errorMessage);
        logError('Failed to load platform metrics', { error: response.error }, 'usePlatformMetrics');
        
        toast({
          title: 'Error Loading Metrics',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred while loading platform metrics';
      setError(errorMessage);
      logError('Unexpected error loading platform metrics', { error: err }, 'usePlatformMetrics');
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Refresh metrics (same as load but with user feedback)
  const refreshMetrics = useCallback(async () => {
    logInfo('Refreshing platform metrics', {}, 'usePlatformMetrics');
    
    await loadMetrics();
    
    if (!error) {
      toast({
        title: 'Metrics Refreshed',
        description: 'Platform metrics have been updated successfully.'
      });
    }
  }, [loadMetrics, error, toast]);

  // Computed values
  const isHealthy = metrics?.platformHealth.status === 'healthy';
  
  const growthTrend: 'up' | 'down' | 'stable' = 
    !metrics ? 'stable' :
    metrics.growthRate > 5 ? 'up' :
    metrics.growthRate < -5 ? 'down' :
    'stable';

  const revenueFormatted = metrics 
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(metrics.monthlyRevenue)
    : '$0';

  // Auto-load metrics on mount
  useEffect(() => {
    if (autoLoad) {
      loadMetrics();
    }
  }, [autoLoad, loadMetrics]);

  // Set up refresh interval if specified
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        logInfo('Auto-refreshing platform metrics', { interval: refreshInterval }, 'usePlatformMetrics');
        loadMetrics();
      }, refreshInterval);

      return () => {
        clearInterval(interval);
      };
    }
  }, [refreshInterval, loadMetrics]);

  return {
    // State
    metrics,
    loading,
    error,
    lastUpdated,
    
    // Actions
    loadMetrics,
    refreshMetrics,
    
    // Computed values
    isHealthy,
    growthTrend,
    revenueFormatted
  };
}

export default usePlatformMetrics; 
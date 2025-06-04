// ============================================================================
// USE PLATFORM ACTIVITY HOOK
// Restaurant Loyalty Platform - Platform Activity Management Hook
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { platformService } from '@/services/platform';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  user_name?: string;
  client_name?: string;
}

export interface UsePlatformActivityOptions {
  autoLoad?: boolean;
  refreshInterval?: number;
  limit?: number;
  showToasts?: boolean;
}

export interface UsePlatformActivityReturn {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshActivity: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export const usePlatformActivity = (options: UsePlatformActivityOptions = {}): UsePlatformActivityReturn => {
  const {
    autoLoad = true,
    refreshInterval,
    limit = 50,
    showToasts = false
  } = options;

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  // Load platform activity from Edge Function
  const loadActivity = useCallback(async (showToast = false, append = false) => {
    if (!append) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await platformService.getPlatformActivity(limit);

      if (response.success && response.data) {
        const newActivities = response.data.map((item: any) => ({
          id: item.id || `activity-${Date.now()}-${Math.random()}`,
          type: item.type || 'system_event',
          title: item.title || item.description || 'Platform Activity',
          description: item.description || 'No description available',
          severity: item.severity || 'low',
          created_at: item.created_at || item.timestamp || new Date().toISOString(),
          user_name: item.user_name,
          client_name: item.client_name
        }));

        if (append) {
          setActivities(prev => [...prev, ...newActivities]);
        } else {
          setActivities(newActivities);
        }
        
        setLastUpdated(new Date());
        setHasMore(newActivities.length === limit);
        
        if (showToast && showToasts) {
          toast({
            title: 'Activity Refreshed',
            description: `Loaded ${newActivities.length} activity items.`
          });
        }
      } else {
        const errorMessage = response.error?.message || 'Failed to load platform activity';
        setError(errorMessage);
        
        if (showToasts) {
          toast({
            title: 'Error Loading Activity',
            description: errorMessage,
            variant: 'destructive'
          });
        }
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred while loading activity';
      setError(errorMessage);
      
      console.error('Platform Activity Hook Error:', err);
      
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
  }, [limit, showToasts, toast]);

  // Refresh activity (public method)
  const refreshActivity = useCallback(async () => {
    await loadActivity(true, false);
  }, [loadActivity]);

  // Load more activity (for pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadActivity(false, true);
  }, [hasMore, loading, loadActivity]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadActivity();
    }
  }, [autoLoad, loadActivity]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        loadActivity();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, loadActivity]);

  return {
    activities,
    loading,
    error,
    lastUpdated,
    refreshActivity,
    loadMore,
    hasMore
  };
}; 
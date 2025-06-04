// ============================================================================
// ACTIVITY TAB COMPONENT
// Restaurant Loyalty Platform - Platform Activity Feed
// ============================================================================

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Activity, RefreshCw, Filter } from 'lucide-react';
import { usePlatformActivity, type ActivityItem } from '@/hooks/platform/usePlatformActivity';
import { StatusBadge } from '@/components/platform/shared/StatusBadge';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface ActivityTabProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ActivityItemProps {
  activity: ActivityItem;
}

// ============================================================================
// ACTIVITY ITEM COMPONENT
// ============================================================================

const ActivityItemComponent: React.FC<ActivityItemProps> = ({ activity }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'client_signup':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'restaurant_added':
        return <Activity className="h-4 w-4 text-green-600" />;
      case 'system_update':
        return <Activity className="h-4 w-4 text-purple-600" />;
      case 'payment_processed':
        return <Activity className="h-4 w-4 text-green-600" />;
      case 'issue_resolved':
        return <Activity className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      low: { label: 'Low', variant: 'subtle' as const, status: 'active' as const },
      medium: { label: 'Medium', variant: 'default' as const, status: 'warning' as const },
      high: { label: 'High', variant: 'default' as const, status: 'warning' as const },
      critical: { label: 'Critical', variant: 'default' as const, status: 'critical' as const }
    };

    const config = severityConfig[severity as keyof typeof severityConfig];
    if (!config) return null;

    return (
      <StatusBadge 
        status={config.status}
        label={config.label}
        variant={config.variant}
        size="sm"
      />
    );
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="mt-0.5">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <p className="text-xs text-gray-500">
            {new Date(activity.created_at).toLocaleString()}
          </p>
          {activity.client_name && (
            <Badge variant="outline" className="text-xs">
              {activity.client_name}
            </Badge>
          )}
          {activity.user_name && (
            <Badge variant="outline" className="text-xs">
              {activity.user_name}
            </Badge>
          )}
          {getSeverityBadge(activity.severity)}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ACTIVITY TAB COMPONENT
// ============================================================================

export const ActivityTab: React.FC<ActivityTabProps> = ({
  className,
  autoRefresh = false,
  refreshInterval = 30000 // 30 seconds
}) => {
  const { 
    activities, 
    loading, 
    error, 
    lastUpdated, 
    refreshActivity,
    loadMore,
    hasMore
  } = usePlatformActivity({ 
    autoLoad: true, 
    refreshInterval: autoRefresh ? refreshInterval : undefined,
    limit: 50,
    showToasts: true
  });

  // Loading state
  if (loading && activities.length === 0) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
              </div>
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                  <div className="h-4 w-4 bg-gray-200 rounded mt-0.5"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="flex gap-2">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && activities.length === 0) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-red-600">
                <Activity className="h-12 w-12 mx-auto mb-4" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Failed to Load Activity
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={refreshActivity} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SectionErrorBoundary name="Activity Tab">
      <div className={cn('space-y-6', className)}>
        {/* Activity Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Platform Activity Feed
                </CardTitle>
                <CardDescription>
                  Real-time activity across the platform
                  {lastUpdated && (
                    <span className="block text-xs text-gray-500 mt-1">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={refreshActivity} disabled={loading}>
                  <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Activity List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>
              Latest platform events and updates ({activities.length} items)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
                <p className="text-gray-600">
                  Recent platform activity will appear here once events start occurring.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <ActivityItemComponent key={activity.id} activity={activity} />
                ))}
                
                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center pt-4 border-t">
                    <Button variant="outline" onClick={loadMore} disabled={loading}>
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More Activity'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auto-refresh indicator */}
        {autoRefresh && (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              <Bell className="h-3 w-3 inline mr-1" />
              Auto-refreshing every {Math.floor(refreshInterval / 1000)} seconds
            </p>
          </div>
        )}
      </div>
    </SectionErrorBoundary>
  );
};

export default ActivityTab; 
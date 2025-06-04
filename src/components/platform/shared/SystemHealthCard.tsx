// ============================================================================
// SYSTEM HEALTH CARD COMPONENT
// Restaurant Loyalty Platform - Real-time System Health Monitor
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Server, Database, Wifi } from 'lucide-react';
import { platformService } from '@/services/platform';
import { StatusBadge } from '@/components/platform/shared/StatusBadge';
import { cn } from '@/lib/utils';

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface SystemHealthCardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: string;
  description: string;
  icon: React.ReactNode;
}

interface SystemHealth {
  overall_status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  response_time: number;
  active_connections: number;
  last_updated: string;
  services: Array<{
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    response_time: number;
  }>;
}

// ============================================================================
// SYSTEM HEALTH CARD COMPONENT
// ============================================================================

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({
  className,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load system health from Edge Function
  const loadSystemHealth = async (showToast = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await platformService.getSystemHealth();

      if (response.success && response.data) {
        setHealth(response.data);
        setLastUpdated(new Date());
      } else {
        const errorMessage = response.error?.message || 'Failed to load system health';
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred while loading system health';
      setError(errorMessage);
      console.error('System Health Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadSystemHealth(true);
  };

  // Auto-load on mount
  useEffect(() => {
    loadSystemHealth();
  }, []);

  // Set up auto-refresh interval
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        loadSystemHealth();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Get health metrics from health data
  const getHealthMetrics = (health: SystemHealth): HealthMetric[] => {
    return [
      {
        name: 'System Uptime',
        status: health.uptime > 99 ? 'healthy' : health.uptime > 95 ? 'warning' : 'critical',
        value: `${health.uptime.toFixed(2)}%`,
        description: 'System availability',
        icon: <Server className="h-4 w-4" />
      },
      {
        name: 'Response Time',
        status: health.response_time < 200 ? 'healthy' : health.response_time < 500 ? 'warning' : 'critical',
        value: `${health.response_time}ms`,
        description: 'Average API response time',
        icon: <Wifi className="h-4 w-4" />
      },
      {
        name: 'Active Connections',
        status: health.active_connections < 1000 ? 'healthy' : health.active_connections < 5000 ? 'warning' : 'critical',
        value: health.active_connections.toLocaleString(),
        description: 'Current database connections',
        icon: <Database className="h-4 w-4" />
      }
    ];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Loading state
  if (loading && !health) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error && !health) {
    return (
      <Card className={cn('border-red-200', className)}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-red-600">
              <XCircle className="h-12 w-12 mx-auto mb-4" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                System Health Unavailable
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) return null;

  const metrics = getHealthMetrics(health);

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(health.overall_status)}
              System Health
              <StatusBadge 
                status={health.overall_status as any} 
                label={health.overall_status.toUpperCase()}
                size="sm"
              />
            </CardTitle>
            <CardDescription>
              Real-time system performance metrics
              {lastUpdated && (
                <span className="block text-xs text-gray-500 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Main Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {metrics.map((metric) => (
            <div 
              key={metric.name}
              className={cn(
                'p-3 border rounded-lg',
                getStatusColor(metric.status)
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {metric.icon}
                <span className="font-medium text-sm">{metric.name}</span>
              </div>
              <div className="text-2xl font-bold mb-1">{metric.value}</div>
              <p className="text-xs opacity-75">{metric.description}</p>
            </div>
          ))}
        </div>

        {/* Services Status */}
        {health.services && health.services.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-3">Service Status</h4>
            <div className="space-y-2">
              {health.services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(service.status)}
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>Uptime: {service.uptime.toFixed(1)}%</span>
                    <span>Response: {service.response_time}ms</span>
                    <StatusBadge 
                      status={service.status as any} 
                      label={service.status}
                      size="sm"
                      variant="subtle"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 
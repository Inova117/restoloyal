// ============================================================================
// ANALYTICS TAB COMPONENT
// Restaurant Loyalty Platform - Platform Analytics and Insights
// ============================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Building, 
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Target,
  Zap
} from 'lucide-react';
import { usePlatformMetrics } from '@/hooks/platform/usePlatformMetrics';
import { MetricsCard } from '@/components/platform/shared/MetricsCard';
import { StatusBadge } from '@/components/platform/shared/StatusBadge';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface AnalyticsTabProps {
  className?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

interface ChartPlaceholderProps {
  title: string;
  description: string;
  height?: number;
  type: 'line' | 'bar' | 'pie' | 'area';
}

// ============================================================================
// ANALYTICS CARD COMPONENT
// ============================================================================

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  };

  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <Card className={cn('border-l-4', colorClasses[color])}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <Icon className={cn('h-5 w-5', `text-${color}-600`)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="flex items-center gap-2">
            {isPositive && <TrendingUp className="h-4 w-4 text-green-600" />}
            {isNegative && <TrendingDown className="h-4 w-4 text-red-600" />}
            <span className={cn(
              'text-sm font-medium',
              isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
            )}>
              {isPositive && '+'}
              {change.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500">{changeLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// CHART PLACEHOLDER COMPONENT
// ============================================================================

const ChartPlaceholder: React.FC<ChartPlaceholderProps> = ({
  title,
  description,
  height = 300,
  type
}) => {
  const getChartIcon = () => {
    switch (type) {
      case 'line':
        return <TrendingUp className="h-8 w-8 text-gray-400" />;
      case 'bar':
        return <BarChart3 className="h-8 w-8 text-gray-400" />;
      case 'pie':
        return <Target className="h-8 w-8 text-gray-400" />;
      case 'area':
        return <Zap className="h-8 w-8 text-gray-400" />;
      default:
        return <BarChart3 className="h-8 w-8 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200"
          style={{ height: `${height}px` }}
        >
          <div className="text-center space-y-3">
            {getChartIcon()}
            <div>
              <p className="text-sm font-medium text-gray-600">Chart Coming Soon</p>
              <p className="text-xs text-gray-500">
                {type.charAt(0).toUpperCase() + type.slice(1)} chart will be implemented here
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// ANALYTICS TAB COMPONENT
// ============================================================================

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  className,
  timeRange = '30d'
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const { metrics, loading, error, refreshMetrics } = usePlatformMetrics({ autoLoad: true });

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  // Loading state
  if (loading && !metrics) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && !metrics) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-red-600">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Failed to Load Analytics
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={refreshMetrics} variant="outline">
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
    <SectionErrorBoundary name="Analytics Tab">
      <div className={cn('space-y-6', className)}>
        {/* Header and Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Platform Analytics
                </CardTitle>
                <CardDescription>
                  Comprehensive insights and performance metrics
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  {timeRangeOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={selectedTimeRange === option.value ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedTimeRange(option.value as any)}
                      className="text-xs"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={refreshMetrics}>
                  <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnalyticsCard
            title="Total Revenue"
            value={`$${(metrics?.monthlyRevenue || 0).toLocaleString()}`}
            change={metrics?.growthRate || 0}
            changeLabel="vs last month"
            icon={DollarSign}
            color="green"
          />
          <AnalyticsCard
            title="Active Clients"
            value={metrics?.totalClients || 0}
            change={15.2}
            changeLabel="vs last month"
            icon={Building}
            color="blue"
          />
          <AnalyticsCard
            title="End Customers"
            value={metrics?.totalEndCustomers || 0}
            change={8.7}
            changeLabel="vs last month"
            icon={Users}
            color="purple"
          />
          <AnalyticsCard
            title="Transactions"
            value={metrics?.systemStats?.totalTransactions || 0}
            change={12.3}
            changeLabel="vs last month"
            icon={Zap}
            color="orange"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartPlaceholder
            title="Revenue Trends"
            description="Monthly revenue growth over time"
            type="line"
            height={350}
          />
          <ChartPlaceholder
            title="Client Growth"
            description="New client acquisitions by month"
            type="bar"
            height={350}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartPlaceholder
            title="Subscription Distribution"
            description="Breakdown of subscription plans"
            type="pie"
            height={300}
          />
          <div className="lg:col-span-2">
            <ChartPlaceholder
              title="Platform Activity"
              description="Daily active users and transactions"
              type="area"
              height={300}
            />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricsCard
            title="Platform Health"
            value={`${metrics?.platformHealth.uptime || 0}%`}
            description="System uptime"
            icon={Eye}
            status="positive"
            trend={{
              value: 0.1,
              label: 'last week'
            }}
          />
          <MetricsCard
            title="Response Time"
            value={`${metrics?.platformHealth.responseTime || 0}ms`}
            description="Average API response"
            icon={Zap}
            status="positive"
            trend={{
              value: -5.2,
              label: 'improvement'
            }}
          />
          <MetricsCard
            title="Error Rate"
            value={`${((metrics?.systemStats?.errorRate || 0) * 100).toFixed(2)}%`}
            description="System error rate"
            icon={Target}
            status={((metrics?.systemStats?.errorRate || 0) * 100) < 1 ? 'positive' : 'warning'}
            trend={{
              value: -12.5,
              label: 'vs last week'
            }}
          />
        </div>

        {/* System Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>System Statistics</CardTitle>
            <CardDescription>Detailed platform performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {(metrics?.systemStats?.totalStampsIssued || 0).toLocaleString()}
                </div>
                <p className="text-xs text-blue-700 mt-1">Stamps Issued</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(metrics?.systemStats?.totalRewardsRedeemed || 0).toLocaleString()}
                </div>
                <p className="text-xs text-green-700 mt-1">Rewards Redeemed</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics?.systemStats?.averageSessionTime || 0}min
                </div>
                <p className="text-xs text-purple-700 mt-1">Avg Session</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {(metrics?.systemStats?.apiCalls || 0).toLocaleString()}
                </div>
                <p className="text-xs text-orange-700 mt-1">API Calls</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {metrics?.platformHealth.activeConnections || 0}
                </div>
                <p className="text-xs text-red-700 mt-1">Active Connections</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {metrics?.totalRestaurants || 0}
                </div>
                <p className="text-xs text-gray-700 mt-1">Total Restaurants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SectionErrorBoundary>
  );
};

export default AnalyticsTab; 
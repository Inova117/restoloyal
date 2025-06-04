// ============================================================================
// TOP CLIENTS TAB COMPONENT
// Restaurant Loyalty Platform - Top Performing Clients Display
// ============================================================================

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, TrendingUp, TrendingDown, Users, Store, DollarSign, Calendar } from 'lucide-react';
import { usePlatformMetrics } from '@/hooks/platform/usePlatformMetrics';
import { StatusBadge } from '@/components/platform/shared/StatusBadge';
import { MetricsCard } from '@/components/platform/shared/MetricsCard';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface TopClientsTabProps {
  className?: string;
  onClientSelect?: (clientId: string) => void;
}

interface TopClientCardProps {
  client: {
    id: string;
    name: string;
    restaurantCount: number;
    customerCount: number;
    monthlyRevenue: number;
    growthRate: number;
    status: 'active' | 'trial' | 'suspended';
    joinDate: string;
  };
  rank: number;
  onSelect?: (clientId: string) => void;
}

// ============================================================================
// TOP CLIENT CARD COMPONENT
// ============================================================================

const TopClientCard: React.FC<TopClientCardProps> = ({ client, rank, onSelect }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Crown className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Crown className="h-5 w-5 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
  };

  const getTrendIcon = (growthRate: number) => {
    if (growthRate > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (growthRate < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
              {getRankIcon(rank)}
            </div>
            <div>
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                {client.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Joined {formatDate(client.joinDate)}
              </CardDescription>
            </div>
          </div>
          <StatusBadge status={client.status} />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Store className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-700 font-medium">Restaurants</span>
            </div>
            <div className="text-xl font-bold text-blue-600">
              {client.restaurantCount}
            </div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">Customers</span>
            </div>
            <div className="text-xl font-bold text-green-600">
              {client.customerCount.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Monthly Revenue</span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(client.monthlyRevenue)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {getTrendIcon(client.growthRate)}
              <span className="text-sm font-medium text-gray-700">Growth Rate</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={cn(
                'text-lg font-bold',
                client.growthRate > 0 ? 'text-green-600' : 
                client.growthRate < 0 ? 'text-red-600' : 'text-gray-600'
              )}>
                {client.growthRate > 0 && '+'}
                {client.growthRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <Button 
          className="w-full mt-4" 
          variant="outline"
          onClick={() => onSelect?.(client.id)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// TOP CLIENTS TAB COMPONENT
// ============================================================================

export const TopClientsTab: React.FC<TopClientsTabProps> = ({
  className,
  onClientSelect
}) => {
  const { metrics, loading, error, refreshMetrics } = usePlatformMetrics({ autoLoad: true });

  // Loading state
  if (loading && !metrics) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-12 bg-gray-200 rounded-lg"></div>
                    <div className="h-12 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded"></div>
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
                <Crown className="h-12 w-12 mx-auto mb-4" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Failed to Load Top Clients
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={refreshMetrics} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topClients = metrics?.topClients || [];

  return (
    <SectionErrorBoundary name="Top Clients Tab">
      <div className={cn('space-y-6', className)}>
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricsCard
            title="Total Clients"
            value={metrics?.totalClients || 0}
            icon={Users}
            size="sm"
            variant="compact"
          />
          <MetricsCard
            title="Avg Revenue"
            value={topClients.length > 0 
              ? `$${Math.round(topClients.reduce((sum, client) => sum + client.monthlyRevenue, 0) / topClients.length)}`
              : '$0'
            }
            icon={DollarSign}
            size="sm"
            variant="compact"
          />
          <MetricsCard
            title="Avg Growth"
            value={topClients.length > 0 
              ? `${(topClients.reduce((sum, client) => sum + client.growthRate, 0) / topClients.length).toFixed(1)}%`
              : '0%'
            }
            icon={TrendingUp}
            size="sm"
            variant="compact"
            status="positive"
          />
          <MetricsCard
            title="Active Clients"
            value={topClients.filter(client => client.status === 'active').length}
            icon={Crown}
            size="sm"
            variant="compact"
            status="positive"
          />
        </div>

        {/* Top Clients Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Top Performing Clients</h2>
              <p className="text-gray-600">Ranked by monthly revenue and growth performance</p>
            </div>
            <Button onClick={refreshMetrics} variant="outline" disabled={loading}>
              Refresh Rankings
            </Button>
          </div>

          {topClients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topClients.map((client, index) => (
                <TopClientCard
                  key={client.id}
                  client={client}
                  rank={index + 1}
                  onSelect={onClientSelect}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <Crown className="h-16 w-16 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      No Clients Found
                    </h3>
                    <p className="text-gray-600">
                      Top performing clients will appear here once you have active clients on the platform.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SectionErrorBoundary>
  );
};

export default TopClientsTab; 
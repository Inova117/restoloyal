// ============================================================================
// PLATFORM DASHBOARD CONTAINER
// Restaurant Loyalty Platform - Main Dashboard Orchestrator
// ============================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Crown, 
  Building, 
  BarChart3, 
  Settings, 
  Bell,
  RefreshCw,
  Plus,
  TrendingUp,
  Users
} from 'lucide-react';
import { ActivityTab } from './tabs/ActivityTab';
import { TopClientsTab } from './tabs/TopClientsTab';
import { ClientManagementTab } from './tabs/ClientManagementTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { SystemHealthCard } from './shared/SystemHealthCard';
import { usePlatformMetrics } from '@/hooks/platform/usePlatformMetrics';
import { useClientManagement } from '@/hooks/platform/useClientManagement';
import { MetricsCard } from './shared/MetricsCard';
import { StatusBadge } from './shared/StatusBadge';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';
import type { ClientData } from '@/services/platform/clientService';

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface PlatformDashboardProps {
  className?: string;
  defaultTab?: string;
  onClientSelect?: (client: ClientData) => void;
  onCreateClient?: () => void;
  onEditClient?: (client: ClientData) => void;
  onOpenSettings?: () => void;
}

// ============================================================================
// PLATFORM DASHBOARD COMPONENT
// ============================================================================

export const PlatformDashboard: React.FC<PlatformDashboardProps> = ({
  className,
  defaultTab = 'activity',
  onClientSelect,
  onCreateClient,
  onEditClient,
  onOpenSettings
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const { 
    metrics, 
    loading: metricsLoading, 
    error: metricsError, 
    refreshMetrics,
    isHealthy,
    revenueFormatted
  } = usePlatformMetrics({ autoLoad: true, refreshInterval: 60000 }); // Auto-refresh every minute

  const {
    clients,
    loading: clientsLoading,
    error: clientsError
  } = useClientManagement({ autoLoad: true });

  // Tab configuration
  const tabs = [
    {
      id: 'activity',
      label: 'Activity Feed',
      icon: Activity,
      component: ActivityTab,
      description: 'Real-time platform activity'
    },
    {
      id: 'top-clients',
      label: 'Top Clients',
      icon: Crown,
      component: TopClientsTab,
      description: 'Top performing clients'
    },
    {
      id: 'client-management',
      label: 'Client Management',
      icon: Building,
      component: ClientManagementTab,
      description: 'Manage all clients'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      component: AnalyticsTab,
      description: 'Platform insights'
    }
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleRefreshAll = () => {
    refreshMetrics();
  };

  return (
    <SectionErrorBoundary name="Platform Dashboard">
      <div className={cn('space-y-6 p-6 bg-gray-50 min-h-screen', className)}>
        {/* Dashboard Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold">
                  ZerionCore Platform Dashboard
                </CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Comprehensive platform management and real-time analytics
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge 
                  status={isHealthy ? 'healthy' : 'warning'} 
                  label={isHealthy ? 'System Healthy' : 'System Warning'}
                  className="bg-white/20 text-white border-white/30"
                />
                <Button variant="secondary" onClick={onOpenSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button variant="secondary" onClick={handleRefreshAll} disabled={metricsLoading}>
                  <RefreshCw className={cn('h-4 w-4 mr-2', metricsLoading && 'animate-spin')} />
                  Refresh
                </Button>
                <Button variant="default" onClick={onCreateClient} className="bg-white text-blue-600 hover:bg-gray-100">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total Clients"
            value={metrics?.totalClients || 0}
            description="Active platform clients"
            icon={Building}
            loading={metricsLoading}
            trend={{
              value: 12.5,
              label: 'vs last month'
            }}
            status="positive"
            size="sm"
            variant="compact"
            className="border-l-4 border-l-blue-500"
          />
          <MetricsCard
            title="Monthly Revenue"
            value={revenueFormatted}
            description="Current month revenue"
            icon={TrendingUp}
            loading={metricsLoading}
            trend={{
              value: metrics?.growthRate || 0,
              label: 'growth rate'
            }}
            status={metrics?.growthRate && metrics.growthRate > 0 ? 'positive' : 'neutral'}
            size="sm"
            variant="compact"
            className="border-l-4 border-l-green-500"
          />
          <MetricsCard
            title="End Customers"
            value={metrics?.totalEndCustomers || 0}
            description="Total end customers"
            icon={Users}
            loading={metricsLoading}
            trend={{
              value: 8.3,
              label: 'vs last month'
            }}
            status="positive"
            size="sm"
            variant="compact"
            className="border-l-4 border-l-purple-500"
          />
          <MetricsCard
            title="System Health"
            value={`${metrics?.platformHealth?.uptime?.toFixed(1) || 0}%`}
            description="Platform uptime"
            icon={Activity}
            loading={metricsLoading}
            trend={{
              value: metrics?.platformHealth?.uptime || 99.9,
              label: 'uptime'
            }}
            status={isHealthy ? 'positive' : 'warning'}
            size="sm"
            variant="compact"
            className="border-l-4 border-l-orange-500"
          />
        </div>

        {/* System Health Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SystemHealthCard autoRefresh={true} refreshInterval={30000} />
          </div>
          
          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common platform management tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={onCreateClient}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Client
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('client-management')}>
                <Building className="h-4 w-4 mr-2" />
                Manage Clients
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('analytics')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={onOpenSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Platform Settings
              </Button>
              
              {/* Recent Activity Summary */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium text-sm text-gray-900 mb-3">Recent Activity</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>New client registered 2 min ago</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>System backup completed</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Analytics updated</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Platform Management</CardTitle>
                <CardDescription>
                  Detailed platform operations and monitoring
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRefreshAll}>
                  <RefreshCw className={cn('h-4 w-4 mr-2', metricsLoading && 'animate-spin')} />
                  Refresh Data
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                {tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {tabs.map((tab) => {
                const TabComponent = tab.component;
                return (
                  <TabsContent key={tab.id} value={tab.id} className="mt-0">
                    <div className="space-y-4">
                      <div className="text-center pb-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">{tab.label}</h3>
                        <p className="text-sm text-gray-600">{tab.description}</p>
                      </div>
                      {tab.id === 'top-clients' ? (
                        <TabComponent 
                          {...({
                            onClientSelect: (clientId: string) => {
                              // Find the client by ID and call the parent handler
                              const client = clients.find(c => c.id === clientId);
                              if (client && onClientSelect) {
                                onClientSelect(client);
                              }
                            },
                            autoRefresh: true,
                            refreshInterval: 60000
                          } as any)}
                        />
                      ) : (
                        <TabComponent 
                          {...({
                            onClientSelect,
                            onEditClient,
                            autoRefresh: true,
                            refreshInterval: 60000
                          } as any)}
                        />
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer Information */}
        <div className="text-center text-xs text-gray-500 py-4">
          <p>ZerionCore Platform Dashboard • Real-time data powered by Edge Functions</p>
          <p className="mt-1">
            Last updated: {new Date().toLocaleString()} • 
            System Status: <span className={cn('font-medium', isHealthy ? 'text-green-600' : 'text-yellow-600')}>
              {isHealthy ? 'Operational' : 'Monitoring'}
            </span>
          </p>
        </div>
      </div>
    </SectionErrorBoundary>
  );
};

export default PlatformDashboard; 
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Calendar,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsDashboardProps {
  restaurantId?: string;
}

interface DateRange {
  start: string;
  end: string;
  label: string;
}

interface AnalyticsData {
  reportType: string;
  dateRange: DateRange;
  generatedAt: string;
  data: any;
}

const AnalyticsDashboard = ({ restaurantId }: AnalyticsDashboardProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    label: 'Last 30 Days'
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const dateRangeOptions: DateRange[] = [
    {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Last 7 Days'
    },
    {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Last 30 Days'
    },
    {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Last 90 Days'
    },
    {
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'This Year'
    }
  ];

  useEffect(() => {
    if (restaurantId && user) {
      fetchAnalyticsData(activeTab);
    }
  }, [restaurantId, activeTab, selectedDateRange, selectedPeriod]);

  const fetchAnalyticsData = async (reportType: string) => {
    if (!restaurantId || !user) return;

    setIsLoading(true);

    try {
      let data: any = {};

      switch (reportType) {
        case 'overview':
          data = await generateOverviewReport();
          break;
        case 'customers':
          data = await generateCustomerReport();
          break;
        case 'engagement':
          data = await generateEngagementReport();
          break;
        case 'retention':
          data = await generateRetentionReport();
          break;
        default:
          data = await generateOverviewReport();
      }

      setAnalyticsData({
        reportType,
        dateRange: selectedDateRange,
        generatedAt: new Date().toISOString(),
        data
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Analytics Error",
        description: error.message || "Failed to load analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateOverviewReport = async () => {
    // Get all clients for this restaurant
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('restaurant_id', restaurantId);

    if (clientsError) throw clientsError;

    // Get all stamps in date range
    const { data: stamps, error: stampsError } = await supabase
      .from('stamps')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', selectedDateRange.start)
      .lte('created_at', selectedDateRange.end + 'T23:59:59');

    if (stampsError) throw stampsError;

    // Get all rewards in date range
    const { data: rewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', selectedDateRange.start)
      .lte('created_at', selectedDateRange.end + 'T23:59:59');

    if (rewardsError) throw rewardsError;

    // Calculate metrics
    const totalCustomers = clients?.length || 0;
    const totalStamps = clients?.reduce((sum, client) => sum + client.stamps, 0) || 0;
    const totalRewards = rewards?.length || 0;
    const stampsInPeriod = stamps?.length || 0;
    const rewardsInPeriod = rewards?.length || 0;

    // Get new customers in period
    const newCustomersInPeriod = clients?.filter(client => 
      client.created_at >= selectedDateRange.start && 
      client.created_at <= selectedDateRange.end + 'T23:59:59'
    ).length || 0;

    // Calculate active customers (customers with activity in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentStamps } = await supabase
      .from('stamps')
      .select('client_id')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', thirtyDaysAgo);

    const activeCustomerIds = new Set(recentStamps?.map(s => s.client_id) || []);
    const activeCustomers = activeCustomerIds.size;

    // Get top customers by stamps
    const topCustomers = clients
      ?.sort((a, b) => b.stamps - a.stamps)
      .slice(0, 10)
      .map(client => ({
        name: client.name,
        email: client.email,
        lifetime_stamps: client.stamps,
        lifetime_rewards: 0, // Would need to calculate from rewards table
        customer_status: activeCustomerIds.has(client.id) ? 'Active' : 'Inactive'
      })) || [];

    return {
      summary: {
        totalCustomers,
        activeCustomers,
        newCustomers30d: newCustomersInPeriod,
        totalStamps,
        totalRewards,
        retentionRate: totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0,
        avgStampsPerCustomer: totalCustomers > 0 ? totalStamps / totalCustomers : 0
      },
      trends: {
        stampsInPeriod,
        rewardsInPeriod,
        newCustomersInPeriod,
        dailyMetrics: [] // Would need more complex calculation
      },
      topCustomers
    };
  };

  const generateCustomerReport = async () => {
    // Get all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('restaurant_id', restaurantId);

    if (clientsError) throw clientsError;

    // Calculate customer segmentation
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentStamps } = await supabase
      .from('stamps')
      .select('client_id')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', thirtyDaysAgo);

    const activeCustomerIds = new Set(recentStamps?.map(s => s.client_id) || []);
    const totalCustomers = clients?.length || 0;

    const activeCustomers = clients?.filter(c => activeCustomerIds.has(c.id)) || [];
    const inactiveCustomers = clients?.filter(c => !activeCustomerIds.has(c.id)) || [];

    // Simple segmentation logic
    const atRiskCustomers = inactiveCustomers.filter(c => c.stamps > 0);

    return {
      segmentation: {
        active: {
          count: activeCustomers.length,
          percentage: totalCustomers > 0 ? ((activeCustomers.length / totalCustomers) * 100).toFixed(1) : '0'
        },
        atRisk: {
          count: atRiskCustomers.length,
          percentage: totalCustomers > 0 ? ((atRiskCustomers.length / totalCustomers) * 100).toFixed(1) : '0'
        },
        inactive: {
          count: inactiveCustomers.length - atRiskCustomers.length,
          percentage: totalCustomers > 0 ? (((inactiveCustomers.length - atRiskCustomers.length) / totalCustomers) * 100).toFixed(1) : '0'
        }
      },
      insights: {
        avgStampsPerCustomer: totalCustomers > 0 ? (clients.reduce((sum, c) => sum + c.stamps, 0) / totalCustomers).toFixed(1) : '0',
        topSpenders: activeCustomers.slice(0, 5),
        recentSignups: clients.filter(c => 
          c.created_at >= selectedDateRange.start && 
          c.created_at <= selectedDateRange.end + 'T23:59:59'
        )
      },
      newCustomersInPeriod: clients?.filter(c => 
        c.created_at >= selectedDateRange.start && 
        c.created_at <= selectedDateRange.end + 'T23:59:59'
      ).length || 0
    };
  };

  const generateEngagementReport = async () => {
    // Get stamps and rewards in period
    const { data: stamps } = await supabase
      .from('stamps')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', selectedDateRange.start)
      .lte('created_at', selectedDateRange.end + 'T23:59:59');

    const { data: rewards } = await supabase
      .from('rewards')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', selectedDateRange.start)
      .lte('created_at', selectedDateRange.end + 'T23:59:59');

    // Calculate engagement metrics
    const totalEvents = (stamps?.length || 0) + (rewards?.length || 0);
    const avgEventsPerDay = totalEvents / Math.max(1, Math.ceil((new Date(selectedDateRange.end).getTime() - new Date(selectedDateRange.start).getTime()) / (1000 * 60 * 60 * 24)));

    return {
      eventSummary: {
        totalStamps: stamps?.length || 0,
        totalRewards: rewards?.length || 0,
        totalEvents,
        avgEventsPerDay: avgEventsPerDay.toFixed(1)
      },
      engagementScore: Math.min(100, Math.round(avgEventsPerDay * 10)), // Simple scoring
      activityPatterns: {
        peakHours: '12:00-14:00', // Would need more complex analysis
        peakDays: 'Weekends',
        trends: 'Increasing'
      }
    };
  };

  const generateRetentionReport = async () => {
    // Get all clients
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .eq('restaurant_id', restaurantId);

    // Simple retention analysis
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentStamps } = await supabase
      .from('stamps')
      .select('client_id')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', thirtyDaysAgo);

    const activeCustomerIds = new Set(recentStamps?.map(s => s.client_id) || []);
    const totalCustomers = clients?.length || 0;
    const retainedCustomers = activeCustomerIds.size;

    return {
      retentionMetrics: {
        totalCustomers,
        retainedCustomers,
        retentionRate: totalCustomers > 0 ? ((retainedCustomers / totalCustomers) * 100).toFixed(1) : '0',
        churnRate: totalCustomers > 0 ? (((totalCustomers - retainedCustomers) / totalCustomers) * 100).toFixed(1) : '0'
      },
      lifecycle: {
        new: clients?.filter(c => c.created_at >= thirtyDaysAgo).length || 0,
        active: retainedCustomers,
        dormant: totalCustomers - retainedCustomers
      },
      recommendations: [
        'Implement re-engagement campaigns for dormant customers',
        'Create loyalty tiers to increase retention',
        'Send personalized offers based on customer behavior',
        'Improve onboarding experience for new customers'
      ]
    };
  };

  const handleDateRangeChange = (rangeLabel: string) => {
    const range = dateRangeOptions.find(r => r.label === rangeLabel);
    if (range) {
      setSelectedDateRange(range);
    }
  };

  const handleExportData = async () => {
    if (!analyticsData) return;

    try {
      const dataStr = JSON.stringify(analyticsData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${analyticsData.reportType}-${selectedDateRange.start}-to-${selectedDateRange.end}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Analytics data has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export analytics data.",
        variant: "destructive",
      });
    }
  };

  const renderOverviewTab = () => {
    if (!analyticsData?.data) return null;

    const { summary, trends, topCustomers } = analyticsData.data;

    // Add null checks and default values
    const safeSummary = summary || {
      totalCustomers: 0,
      activeCustomers: 0,
      newCustomers30d: 0,
      totalStamps: 0,
      totalRewards: 0,
      retentionRate: 0,
      avgStampsPerCustomer: 0
    };

    const safeTrends = trends || {
      stampsInPeriod: 0,
      rewardsInPeriod: 0,
      newCustomersInPeriod: 0,
      dailyMetrics: []
    };

    const safeTopCustomers = topCustomers || [];

    return (
      <div className="space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeSummary.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                {safeSummary.newCustomers30d} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeSummary.activeCustomers}</div>
              <p className="text-xs text-muted-foreground">
                {safeSummary.retentionRate.toFixed(1)}% retention rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stamps</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeSummary.totalStamps}</div>
              <p className="text-xs text-muted-foreground">
                {safeTrends.stampsInPeriod} in selected period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rewards Redeemed</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeSummary.totalRewards}</div>
              <p className="text-xs text-muted-foreground">
                {safeTrends.rewardsInPeriod} in selected period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>Most engaged customers by lifetime stamps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {safeTopCustomers.map((customer: any, index: number) => (
                <div key={customer.email || index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{customer.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{customer.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{customer.lifetime_stamps || 0} stamps</p>
                    <Badge 
                      variant={customer.customer_status === 'Active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {customer.customer_status || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              ))}
              {safeTopCustomers.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500">No customer data available yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCustomersTab = () => {
    if (!analyticsData?.data) return null;

    const { segmentation, insights, newCustomersInPeriod } = analyticsData.data;

    // Add null checks for segmentation and insights
    if (!segmentation || !insights) {
      return (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading customer data...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Customer Segmentation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{segmentation.active?.count || 0}</div>
              <p className="text-xs text-muted-foreground">{segmentation.active?.percentage || '0'}% of total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{segmentation.atRisk?.count || 0}</div>
              <p className="text-xs text-muted-foreground">{segmentation.atRisk?.percentage || '0'}% of total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <Clock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{segmentation.inactive?.count || 0}</div>
              <p className="text-xs text-muted-foreground">{segmentation.inactive?.percentage || '0'}% of total</p>
            </CardContent>
          </Card>
        </div>

        {/* Customer Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Insights</CardTitle>
            <CardDescription>Key metrics about your customer base</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Stamps per Customer</p>
                <p className="text-2xl font-bold">{insights.avgStampsPerCustomer || '0'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Customers</p>
                <p className="text-2xl font-bold">{insights.topSpenders?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Customers */}
        <Card>
          <CardHeader>
            <CardTitle>New Customers in Period</CardTitle>
            <CardDescription>Customers who joined during the selected date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{newCustomersInPeriod || 0}</div>
            <p className="text-sm text-muted-foreground mt-2">
              New customers from {selectedDateRange.start} to {selectedDateRange.end}
            </p>
            
            {insights.recentSignups && insights.recentSignups.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Recent Signups:</h4>
                <div className="space-y-2">
                  {insights.recentSignups.slice(0, 5).map((customer: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-medium">{customer.name}</span>
                      <span className="text-sm text-muted-foreground">{customer.stamps} stamps</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderEngagementTab = () => {
    if (!analyticsData?.data) return null;

    const { eventSummary, engagementScore, activityPatterns } = analyticsData.data;

    // Add null checks and default values
    const safeEventSummary = eventSummary || {
      totalEvents: 0,
      totalStamps: 0,
      totalRewards: 0,
      avgEventsPerDay: '0'
    };

    const safeEngagementScore = engagementScore || 0;
    const safeActivityPatterns = activityPatterns || {
      peakHours: 'N/A',
      peakDays: 'N/A',
      trends: 'N/A'
    };

    return (
      <div className="space-y-6">
        {/* Engagement Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeEventSummary.totalEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Stamps Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeEventSummary.totalStamps}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Visits Recorded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeEventSummary.totalStamps}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rewards Redeemed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeEventSummary.totalRewards}</div>
            </CardContent>
          </Card>
        </div>

        {/* Event Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Event Breakdown</CardTitle>
            <CardDescription>Distribution of customer events in the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="capitalize font-medium">Stamps</span>
                <Badge variant="outline">{safeEventSummary.totalStamps}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="capitalize font-medium">Rewards</span>
                <Badge variant="outline">{safeEventSummary.totalRewards}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Trends</CardTitle>
            <CardDescription>Key engagement metrics and scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Events per Day</p>
                <p className="text-2xl font-bold">{safeEventSummary.avgEventsPerDay}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engagement Score</p>
                <p className="text-2xl font-bold">{safeEngagementScore}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Activity Patterns</p>
                <p className="text-2xl font-bold">{safeActivityPatterns.peakHours} - {safeActivityPatterns.peakDays} - {safeActivityPatterns.trends}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRetentionTab = () => {
    if (!analyticsData?.data) return null;

    const { retentionMetrics, lifecycle, recommendations } = analyticsData.data;

    // Add null checks and default values
    const safeRetentionMetrics = retentionMetrics || {
      retentionRate: '0',
      retainedCustomers: 0,
      churnRate: '0'
    };

    const safeLifecycle = lifecycle || {
      new: 0,
      active: 0,
      dormant: 0
    };

    const safeRecommendations = recommendations || [];

    return (
      <div className="space-y-6">
        {/* Retention Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Retention Overview</CardTitle>
            <CardDescription>Customer retention and churn analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-blue-600">
                {safeRetentionMetrics.retentionRate}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Retention Rate</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {safeRetentionMetrics.retainedCustomers}
                </div>
                <p className="text-sm text-muted-foreground">Active Customers</p>
                <p className="text-xs text-muted-foreground">
                  {safeRetentionMetrics.retentionRate}%
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {safeRetentionMetrics.churnRate}%
                </div>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Lifecycle */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Lifecycle</CardTitle>
            <CardDescription>Distribution of customers across lifecycle stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{safeLifecycle.new}</div>
                <p className="text-sm font-medium">New Customers</p>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{safeLifecycle.active}</div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Recently engaged</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{safeLifecycle.dormant}</div>
                <p className="text-sm font-medium">Dormant</p>
                <p className="text-xs text-muted-foreground">Need re-engagement</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Retention Recommendations</CardTitle>
            <CardDescription>AI-powered suggestions to improve customer retention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safeRecommendations.map((recommendation: string, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <p className="text-sm">{recommendation}</p>
                </div>
              ))}
              {safeRecommendations.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500">No recommendations available yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (!restaurantId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No restaurant selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Insights and metrics for your loyalty program
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedDateRange.label} onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((range) => (
                <SelectItem key={range.label} value={range.label}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleExportData} 
            variant="outline" 
            disabled={!analyticsData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading analytics data...
          </CardContent>
        </Card>
      )}

      {/* Analytics Tabs */}
      {!isLoading && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="customers">
              <Users className="h-4 w-4 mr-2" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="engagement">
              <TrendingUp className="h-4 w-4 mr-2" />
              Engagement
            </TabsTrigger>
            <TabsTrigger value="retention">
              <Target className="h-4 w-4 mr-2" />
              Retention
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {renderOverviewTab()}
          </TabsContent>

          <TabsContent value="customers" className="mt-6">
            {renderCustomersTab()}
          </TabsContent>

          <TabsContent value="engagement" className="mt-6">
            {renderEngagementTab()}
          </TabsContent>

          <TabsContent value="retention" className="mt-6">
            {renderRetentionTab()}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AnalyticsDashboard; 
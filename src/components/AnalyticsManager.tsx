import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAnalyticsManager, type AnalyticsFilters } from '@/hooks/useAnalyticsManager'
import { useLocationManager } from '@/hooks/useLocationManager'
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  DollarSign,
  Target,
  Activity,
  Calendar,
  MapPin,
  RefreshCw,
  Filter,
  Download,
  Eye,
  Percent,
  Star,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

interface AnalyticsManagerProps {
  clientId?: string
}

export default function AnalyticsManager({ clientId }: AnalyticsManagerProps) {
  const { 
    aggregateMetrics, 
    locationBreakdown, 
    trendData, 
    loading, 
    fetchAllAnalytics,
    fetchAggregateMetrics,
    fetchLocationBreakdown,
    fetchTrendAnalysis
  } = useAnalyticsManager(clientId)
  
  const { locations } = useLocationManager(clientId)
  
  const [filters, setFilters] = useState<AnalyticsFilters>({
    time_range: '30d',
    location_ids: []
  })

  const [customDateRange, setCustomDateRange] = useState({
    start_date: '',
    end_date: ''
  })

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { 
      ...filters, 
      [key]: value === "all" || value === "" ? undefined : value 
    } as AnalyticsFilters
    
    if (key === 'time_range' && value === 'custom') {
      newFilters.start_date = customDateRange.start_date
      newFilters.end_date = customDateRange.end_date
    }
    
    setFilters(newFilters)
    fetchAllAnalytics(newFilters)
  }

  const handleCustomDateChange = () => {
    if (customDateRange.start_date && customDateRange.end_date) {
      const newFilters = {
        ...filters,
        time_range: 'custom' as const,
        start_date: customDateRange.start_date,
        end_date: customDateRange.end_date
      }
      setFilters(newFilters)
      fetchAllAnalytics(newFilters)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`
  }

  const getGrowthIcon = (rate: number) => {
    if (rate > 0) return <ArrowUp className="w-4 h-4 text-green-600" />
    if (rate < 0) return <ArrowDown className="w-4 h-4 text-red-600" />
    return <div className="w-4 h-4" />
  }

  const getGrowthColor = (rate: number) => {
    if (rate > 0) return 'text-green-600'
    if (rate < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getTimeRangeLabel = (timeRange: string) => {
    const labels = {
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days',
      '6m': 'Last 6 Months',
      '1y': 'Last Year',
      'custom': 'Custom Range'
    }
    return labels[timeRange] || timeRange
  }

  if (loading && !aggregateMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => fetchAllAnalytics(filters)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="time_range">Time Range</Label>
              <Select value={filters.time_range} onValueChange={(value) => handleFilterChange('time_range', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="6m">Last 6 Months</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {filters.time_range === 'custom' && (
              <>
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={customDateRange.start_date}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={customDateRange.end_date}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleCustomDateChange} disabled={!customDateRange.start_date || !customDateRange.end_date}>
                    Apply Range
                  </Button>
                </div>
              </>
            )}
            
            {filters.time_range !== 'custom' && (
              <div>
                <Label htmlFor="locations">Filter by Locations</Label>
                <Select value={filters.location_ids?.length > 0 ? 'selected' : 'all'} onValueChange={() => {}}>
                  <SelectTrigger>
                    <SelectValue placeholder={`${filters.location_ids?.length || 0} locations selected`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Showing data for: <span className="font-medium">{getTimeRangeLabel(filters.time_range)}</span>
            {filters.location_ids && filters.location_ids.length > 0 && (
              <span> • {filters.location_ids.length} location(s) selected</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <Eye className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="locations">
            <MapPin className="w-4 h-4 mr-2" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Aggregate Metrics */}
          {aggregateMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(aggregateMetrics.total_customers)}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {getGrowthIcon(aggregateMetrics.growth_rate_30d)}
                    <span className={`ml-1 ${getGrowthColor(aggregateMetrics.growth_rate_30d)}`}>
                      {formatPercentage(aggregateMetrics.growth_rate_30d)} from last period
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Customers (30d)</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(aggregateMetrics.active_customers_30d)}</div>
                  <p className="text-xs text-muted-foreground">
                    {((aggregateMetrics.active_customers_30d / aggregateMetrics.total_customers) * 100).toFixed(1)}% of total customers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue Estimate</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(aggregateMetrics.revenue_estimate)}</div>
                  <p className="text-xs text-muted-foreground">
                    Based on stamp activity
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Stamps Issued</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(aggregateMetrics.total_stamps_issued)}</div>
                  <p className="text-xs text-muted-foreground">
                    {aggregateMetrics.avg_stamps_per_customer.toFixed(1)} avg per customer
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rewards Redeemed</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(aggregateMetrics.total_rewards)}</div>
                  <p className="text-xs text-muted-foreground">
                    {aggregateMetrics.reward_redemption_rate.toFixed(1)}% redemption rate
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
              <CardDescription>Important metrics and observations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aggregateMetrics && (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Customer Growth</p>
                        <p className="text-xs text-gray-600">
                          {aggregateMetrics.growth_rate_30d > 0 ? 'Growing' : aggregateMetrics.growth_rate_30d < 0 ? 'Declining' : 'Stable'} at {formatPercentage(aggregateMetrics.growth_rate_30d)} rate
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Engagement Rate</p>
                        <p className="text-xs text-gray-600">
                          {((aggregateMetrics.active_customers_30d / aggregateMetrics.total_customers) * 100).toFixed(1)}% of customers active in last 30 days
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Loyalty Performance</p>
                        <p className="text-xs text-gray-600">
                          {aggregateMetrics.reward_redemption_rate.toFixed(1)}% of stamps converted to rewards
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Location Performance</h3>
            <p className="text-sm text-gray-600">Compare metrics across all locations</p>
          </div>

          <div className="grid gap-6">
            {locationBreakdown.map((location) => (
              <Card key={location.location_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{location.location_name}</CardTitle>
                      <CardDescription>{location.address}, {location.city}, {location.state}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getGrowthIcon(location.growth_rate)}
                      <span className={`text-sm font-medium ${getGrowthColor(location.growth_rate)}`}>
                        {formatPercentage(location.growth_rate)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{formatNumber(location.customers)}</div>
                      <p className="text-xs text-gray-500">Total Customers</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{formatNumber(location.active_customers_30d)}</div>
                      <p className="text-xs text-gray-500">Active (30d)</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{formatNumber(location.stamps_issued)}</div>
                      <p className="text-xs text-gray-500">Stamps Issued</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{formatNumber(location.rewards_redeemed)}</div>
                      <p className="text-xs text-gray-500">Rewards</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">{formatCurrency(location.revenue_estimate)}</div>
                      <p className="text-xs text-gray-500">Revenue Est.</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Activity Rate:</span>
                      <span className="font-medium">{location.activity_rate.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Trend Analysis</h3>
            <p className="text-sm text-gray-600">Historical performance and growth patterns</p>
          </div>

          {trendData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Growth</CardTitle>
                  <CardDescription>Customer acquisition and revenue trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trendData.monthly_growth.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{month.month}</p>
                          <p className="text-sm text-gray-600">{formatNumber(month.new_customers)} new customers</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(month.revenue_estimate)}</p>
                          <div className="flex items-center gap-1">
                            {getGrowthIcon(month.growth_rate)}
                            <span className={`text-sm ${getGrowthColor(month.growth_rate)}`}>
                              {formatPercentage(month.growth_rate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Redemption Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Reward Redemption Trends</CardTitle>
                  <CardDescription>Monthly redemption rates and activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trendData.reward_redemption_trends.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{month.month}</p>
                          <p className="text-sm text-gray-600">{formatNumber(month.total_stamps)} stamps issued</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatNumber(month.total_rewards)} rewards</p>
                          <p className="text-sm text-purple-600">{month.redemption_rate.toFixed(2)}% rate</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Retention Cohorts */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Customer Retention Cohorts</CardTitle>
                  <CardDescription>Customer retention rates by acquisition month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Cohort Month</th>
                          <th className="text-center p-2">Customers</th>
                          <th className="text-center p-2">Month 1</th>
                          <th className="text-center p-2">Month 3</th>
                          <th className="text-center p-2">Month 6</th>
                          <th className="text-center p-2">Month 12</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trendData.retention_cohorts.map((cohort, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 font-medium">{cohort.cohort_month}</td>
                            <td className="p-2 text-center">{formatNumber(cohort.customers_acquired)}</td>
                            <td className="p-2 text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                {cohort.month_1_retention.toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="p-2 text-center">
                              {cohort.month_3_retention > 0 ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {cohort.month_3_retention.toFixed(1)}%
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {cohort.month_6_retention > 0 ? (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                  {cohort.month_6_retention.toFixed(1)}%
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {cohort.month_12_retention > 0 ? (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                  {cohort.month_12_retention.toFixed(1)}%
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 
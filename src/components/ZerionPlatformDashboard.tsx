import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building2, 
  Users, 
  Store, 
  TrendingUp, 
  DollarSign,
  MapPin,
  Crown,
  Settings,
  BarChart3,
  Shield,
  Plus,
  Eye
} from 'lucide-react'

interface Client {
  id: string
  name: string
  type: 'restaurant_chain' | 'single_restaurant'
  status: 'active' | 'trial' | 'suspended'
  restaurants: number
  locations: number
  customers: number
  monthlyRevenue: number
  joinDate: string
  plan: string
}

interface PlatformStats {
  totalClients: number
  totalRestaurants: number
  totalLocations: number
  totalCustomers: number
  monthlyRevenue: number
  activeUsers: number
}

export default function ZerionPlatformDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [clients, setClients] = useState<Client[]>([])
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalClients: 0,
    totalRestaurants: 0,
    totalLocations: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
    activeUsers: 0
  })

  useEffect(() => {
    // Simulate loading platform data
    const mockClients: Client[] = [
      {
        id: 'galletti',
        name: 'Galletti Restaurant Group',
        type: 'restaurant_chain',
        status: 'active',
        restaurants: 47,
        locations: 312,
        customers: 284750,
        monthlyRevenue: 12450000,
        joinDate: '2024-01-15',
        plan: 'Enterprise'
      },
      {
        id: 'demo_pizza',
        name: 'Demo Pizza Palace',
        type: 'single_restaurant',
        status: 'trial',
        restaurants: 1,
        locations: 3,
        customers: 1250,
        monthlyRevenue: 45000,
        joinDate: '2024-02-01',
        plan: 'Professional'
      },
      {
        id: 'test_burgers',
        name: 'Test Burger Kingdom',
        type: 'restaurant_chain',
        status: 'active',
        restaurants: 8,
        locations: 24,
        customers: 18500,
        monthlyRevenue: 320000,
        joinDate: '2024-01-20',
        plan: 'Business'
      }
    ]

    setClients(mockClients)

    // Calculate platform stats
    const stats: PlatformStats = {
      totalClients: mockClients.length,
      totalRestaurants: mockClients.reduce((sum, client) => sum + client.restaurants, 0),
      totalLocations: mockClients.reduce((sum, client) => sum + client.locations, 0),
      totalCustomers: mockClients.reduce((sum, client) => sum + client.customers, 0),
      monthlyRevenue: mockClients.reduce((sum, client) => sum + client.monthlyRevenue, 0),
      activeUsers: mockClients.filter(c => c.status === 'active').length
    }

    setPlatformStats(stats)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600'
      case 'trial': return 'bg-blue-600'
      case 'suspended': return 'bg-red-600'
      default: return 'bg-gray-600'
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

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {platformStats.activeUsers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(platformStats.totalRestaurants)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(platformStats.totalLocations)} locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(platformStats.totalCustomers)}</div>
            <p className="text-xs text-muted-foreground">
              Across all clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(platformStats.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Platform-wide
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+24.5%</div>
            <p className="text-xs text-muted-foreground">
              Month over month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">99.9%</div>
            <p className="text-xs text-muted-foreground">
              Uptime this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Platform Activity</CardTitle>
          <CardDescription>Latest events across all clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="font-medium">New client onboarded: Demo Pizza Palace</span>
              </div>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="font-medium">Galletti added 3 new locations</span>
              </div>
              <span className="text-sm text-gray-500">5 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <span className="font-medium">Platform update deployed successfully</span>
              </div>
              <span className="text-sm text-gray-500">1 day ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderClients = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Client Management</h3>
          <p className="text-sm text-gray-600">Manage all restaurant clients on the platform</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="grid gap-6">
        {clients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {client.type.replace('_', ' ')}
                      </Badge>
                      <Badge className={`text-xs text-white ${getStatusColor(client.status)}`}>
                        {client.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Joined {new Date(client.joinDate).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-1" />
                    Manage
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{client.restaurants}</div>
                  <p className="text-xs text-gray-500">Restaurants</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{client.locations}</div>
                  <p className="text-xs text-gray-500">Locations</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{formatNumber(client.customers)}</div>
                  <p className="text-xs text-gray-500">Customers</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(client.monthlyRevenue)}</div>
                  <p className="text-xs text-gray-500">Monthly Revenue</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{client.plan}</div>
                  <p className="text-xs text-gray-500">Plan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Platform Analytics</h3>
        <p className="text-sm text-gray-600">Comprehensive analytics across all clients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Monthly revenue across all clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Revenue chart would go here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Growth</CardTitle>
            <CardDescription>New clients and expansion over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Growth chart would go here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Clients</CardTitle>
          <CardDescription>Clients ranked by revenue and growth</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clients
              .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
              .map((client, index) => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.restaurants} restaurants, {client.locations} locations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(client.monthlyRevenue)}</p>
                    <p className="text-sm text-gray-500">{formatNumber(client.customers)} customers</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Building2 className="w-4 h-4 mr-2" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          {renderClients()}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          {renderAnalytics()}
        </TabsContent>
      </Tabs>
    </div>
  )
} 
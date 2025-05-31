import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import CorporateStaffManagement from '@/components/CorporateStaffManagement'
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Plus,
  Edit,
  Settings,
  BarChart3,
  DollarSign,
  Globe,
  Shield,
  Crown,
  Target,
  Award,
  Activity,
  MapPin,
  UserCheck,
  Briefcase,
  FileText,
  Download,
  Filter,
  Search,
  Calendar
} from 'lucide-react'

interface RestaurantLocation {
  id: string
  restaurant_id: string
  brand_name: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  phone: string
  manager_name: string
  manager_email: string
  status: 'active' | 'inactive' | 'pending'
  customers: number
  monthly_revenue: number
  created_at: string
  updated_at: string
}

interface CorporateStats {
  total_brands: number
  total_franchises: number
  total_locations: number
  total_customers: number
  total_revenue: number
  active_subscriptions: number
  monthly_growth: number
  top_performing_locations: Array<{
    location_name: string
    brand_name: string
    revenue: number
    growth_rate: number
    customer_count: number
  }>
  recent_activity: Array<{
    type: 'new_location' | 'location_update' | 'milestone' | 'staff_change'
    description: string
    timestamp: string
    location_name?: string
  }>
}

interface BillingInfo {
  subscription_tier: 'starter' | 'professional' | 'enterprise'
  monthly_cost: number
  locations_included: number
  overage_cost: number
  next_billing_date: string
  payment_status: 'active' | 'overdue' | 'cancelled'
}

export default function GallettiHQDashboard() {
  const [corporateStats, setCorporateStats] = useState<CorporateStats | null>(null)
  const [locations, setLocations] = useState<RestaurantLocation[]>([])
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  
  const { toast } = useToast()

  useEffect(() => {
    loadCorporateData()
  }, [])

  const loadCorporateData = async () => {
    setLoading(true)
    try {
      // Simulate loading corporate data since this is a demo
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simulated corporate statistics
      const simulatedStats: CorporateStats = {
        total_brands: 6,
        total_franchises: 312,
        total_locations: 1847,
        total_customers: 284750,
        total_revenue: 12450000,
        active_subscriptions: 1847,
        monthly_growth: 8.5,
        top_performing_locations: [
          { location_name: 'Macuz - Times Square', brand_name: 'Pizza Palace', revenue: 185000, growth_rate: 15.2, customer_count: 2850 },
          { location_name: 'Burger Kingdom - Hollywood', brand_name: 'Burger Kingdom', revenue: 172000, growth_rate: 12.8, customer_count: 2640 },
          { location_name: 'Coffee Corner - Downtown', brand_name: 'Coffee Corner', revenue: 156000, growth_rate: 18.5, customer_count: 3200 },
          { location_name: 'Taco Fiesta - Austin Central', brand_name: 'Taco Fiesta', revenue: 148000, growth_rate: 9.3, customer_count: 2180 },
          { location_name: 'Sushi Express - Marina', brand_name: 'Sushi Express', revenue: 142000, growth_rate: 22.1, customer_count: 1950 }
        ],
        recent_activity: [
          { type: 'new_location', description: 'New Pizza Palace location opened in Brooklyn', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), location_name: 'Pizza Palace - Brooklyn Heights' },
          { type: 'milestone', description: 'Coffee Corner Downtown reached 5,000 customers', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), location_name: 'Coffee Corner - Downtown' },
          { type: 'location_update', description: 'Burger Kingdom Hollywood completed renovation', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), location_name: 'Burger Kingdom - Hollywood' },
          { type: 'staff_change', description: 'New manager assigned to Taco Fiesta Austin Central', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), location_name: 'Taco Fiesta - Austin Central' }
        ]
      }

      // Simulated location data
      const simulatedLocations: RestaurantLocation[] = [
        {
          id: '1',
          restaurant_id: 'pizza-palace',
          brand_name: 'Pizza Palace',
          name: 'Pizza Palace - Times Square',
          address: '123 Broadway',
          city: 'New York',
          state: 'NY',
          zip_code: '10001',
          phone: '(212) 555-0101',
          manager_name: 'John Manager',
          manager_email: 'john@pizzapalace.com',
          status: 'active',
          customers: 2850,
          monthly_revenue: 185000,
          created_at: '2023-01-15T00:00:00Z',
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          restaurant_id: 'pizza-palace',
          brand_name: 'Pizza Palace',
          name: 'Pizza Palace - Brooklyn',
          address: '456 Flatbush Ave',
          city: 'Brooklyn',
          state: 'NY',
          zip_code: '11201',
          phone: '(718) 555-0102',
          manager_name: 'Jane Manager',
          manager_email: 'jane@pizzapalace.com',
          status: 'active',
          customers: 2340,
          monthly_revenue: 156000,
          created_at: '2023-02-20T00:00:00Z',
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          restaurant_id: 'burger-kingdom',
          brand_name: 'Burger Kingdom',
          name: 'Burger Kingdom - Hollywood',
          address: '789 Sunset Blvd',
          city: 'Los Angeles',
          state: 'CA',
          zip_code: '90028',
          phone: '(323) 555-0103',
          manager_name: 'Mike Manager',
          manager_email: 'mike@burgerkingdom.com',
          status: 'active',
          customers: 2640,
          monthly_revenue: 172000,
          created_at: '2023-03-10T00:00:00Z',
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          restaurant_id: 'coffee-corner',
          brand_name: 'Coffee Corner',
          name: 'Coffee Corner - Downtown',
          address: '321 Main St',
          city: 'Seattle',
          state: 'WA',
          zip_code: '98101',
          phone: '(206) 555-0104',
          manager_name: 'Sarah Manager',
          manager_email: 'sarah@coffeecorner.com',
          status: 'active',
          customers: 3200,
          monthly_revenue: 156000,
          created_at: '2023-04-05T00:00:00Z',
          updated_at: new Date().toISOString()
        },
        {
          id: '5',
          restaurant_id: 'taco-fiesta',
          brand_name: 'Taco Fiesta',
          name: 'Taco Fiesta - Austin Central',
          address: '654 Congress Ave',
          city: 'Austin',
          state: 'TX',
          zip_code: '78701',
          phone: '(512) 555-0105',
          manager_name: 'Carlos Manager',
          manager_email: 'carlos@tacofiesta.com',
          status: 'active',
          customers: 2180,
          monthly_revenue: 148000,
          created_at: '2023-05-12T00:00:00Z',
          updated_at: new Date().toISOString()
        },
        {
          id: '6',
          restaurant_id: 'healthy-bowls',
          brand_name: 'Healthy Bowls',
          name: 'Healthy Bowls - Miami Beach',
          address: '987 Ocean Drive',
          city: 'Miami Beach',
          state: 'FL',
          zip_code: '33139',
          phone: '(305) 555-0106',
          manager_name: 'Lisa Manager',
          manager_email: 'lisa@healthybowls.com',
          status: 'pending',
          customers: 450,
          monthly_revenue: 28000,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      // Simulated billing information
      const simulatedBilling: BillingInfo = {
        subscription_tier: 'enterprise',
        monthly_cost: 24750,
        locations_included: 2000,
        overage_cost: 15,
        next_billing_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        payment_status: 'active'
      }

      setCorporateStats(simulatedStats)
      setLocations(simulatedLocations)
      setBillingInfo(simulatedBilling)

      toast({
        title: "Corporate Data Loaded",
        description: "Galletti HQ dashboard data loaded successfully (simulated)",
      })
    } catch (error) {
      console.error('Error loading corporate data:', error)
      toast({
        title: "Error",
        description: "Failed to load corporate data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_location': return <Building2 className="h-4 w-4 text-blue-600" />
      case 'location_update': return <Crown className="h-4 w-4 text-purple-600" />
      case 'staff_change': return <UserCheck className="h-4 w-4 text-green-600" />
      case 'milestone': return <Award className="h-4 w-4 text-yellow-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.brand_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || location.status === statusFilter
    const matchesBrand = brandFilter === 'all' || location.brand_name === brandFilter
    return matchesSearch && matchesStatus && matchesBrand
  })

  const uniqueBrands = Array.from(new Set(locations.map(location => location.brand_name)))

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

  if (loading && !corporateStats) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Galletti HQ Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Corporate Overview Stats */}
      {corporateStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{corporateStats.total_brands}</div>
              <p className="text-xs text-muted-foreground">
                {corporateStats.total_franchises} franchises
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{corporateStats.total_locations}</div>
              <p className="text-xs text-muted-foreground">
                {corporateStats.active_subscriptions} active subscriptions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(corporateStats.total_customers)}</div>
              <p className="text-xs text-muted-foreground">
                Across all locations
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(corporateStats.total_revenue)}</div>
              <p className="text-xs text-green-600">
                +{corporateStats.monthly_growth}% from last month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="locations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="analytics">Corporate Analytics</TabsTrigger>
          <TabsTrigger value="billing">Billing & Subscriptions</TabsTrigger>
          <TabsTrigger value="staff">Corporate Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[180px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {uniqueBrands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <Card key={location.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{location.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{location.brand_name}</p>
                        {getStatusBadge(location.status)}
                      </div>
                    </div>
                  </div>
                  <CardDescription>
                    {location.address}, {location.city}, {location.state} {location.zip_code}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Manager</p>
                      <p className="font-semibold">{location.manager_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-semibold">{location.phone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Customers</p>
                      <p className="font-semibold">{formatNumber(location.customers)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Monthly Revenue</p>
                      <p className="font-semibold">{formatCurrency(location.monthly_revenue)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Locations */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Locations</CardTitle>
                <CardDescription>Locations ranked by monthly revenue and growth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {corporateStats?.top_performing_locations.map((location, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{location.location_name}</p>
                          <p className="text-sm text-muted-foreground">{location.brand_name} • {formatNumber(location.customer_count)} customers</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(location.revenue)}</p>
                        <p className="text-sm text-green-600">+{location.growth_rate}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest location activity across all brands</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {corporateStats?.recent_activity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          {billingInfo && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Overview</CardTitle>
                  <CardDescription>Current billing and subscription details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Plan</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      {billingInfo.subscription_tier.charAt(0).toUpperCase() + billingInfo.subscription_tier.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Cost</span>
                    <span className="font-semibold">{formatCurrency(billingInfo.monthly_cost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Locations Included</span>
                    <span className="font-semibold">{formatNumber(billingInfo.locations_included)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overage Cost</span>
                    <span className="font-semibold">{formatCurrency(billingInfo.overage_cost)}/location</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Next Billing</span>
                    <span className="font-semibold">{new Date(billingInfo.next_billing_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Payment Status</span>
                    <Badge className={billingInfo.payment_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {billingInfo.payment_status.charAt(0).toUpperCase() + billingInfo.payment_status.slice(1)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Usage Analytics</CardTitle>
                  <CardDescription>Current usage vs. subscription limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Locations Used</span>
                      <span className="text-sm">{corporateStats?.total_locations} / {billingInfo.locations_included}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (corporateStats?.total_locations || 0) / billingInfo.locations_included * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-4 space-y-2">
                    <Button className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      View Detailed Invoice
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Corporate Staff Management</CardTitle>
              <CardDescription>Manage corporate team members and their access permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <CorporateStaffManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
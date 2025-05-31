import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { switchToLocationView } from '@/hooks/useUserRole'
import StaffManager from './StaffManager'
import CustomerManager from './CustomerManager'
import { LocationManager } from './LocationManager'
import LoyaltyManager from './LoyaltyManager'
import AnalyticsManager from './AnalyticsManager'
import DataExportManager from './DataExportManager'
import NotificationCampaignsManager from './NotificationCampaignsManager'
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Plus,
  Edit,
  Settings,
  BarChart3,
  DollarSign,
  MapPin,
  Target,
  Award,
  Activity,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  Search,
  Filter,
  Trash2,
  UserPlus,
  Shield,
  Clock,
  Key,
  Eye,
  ExternalLink,
  Download,
  Send
} from 'lucide-react'

interface RestaurantLocation {
  id: string
  restaurant_id: string
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
  stamps_issued: number
  rewards_redeemed: number
  created_at: string
  updated_at: string
}

interface LocationStaff {
  id: string
  location_id: string
  name: string
  email: string
  role: 'manager' | 'cashier' | 'supervisor'
  permissions: {
    can_process_orders: boolean
    can_issue_stamps: boolean
    can_redeem_rewards: boolean
    can_view_analytics: boolean
    can_manage_inventory: boolean
    can_manage_staff: boolean
  }
  status: 'active' | 'inactive'
  last_login: string
  created_at: string
}

interface LocationSettings {
  id: string
  location_id: string
  operating_hours: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
  loyalty_settings: {
    stamps_per_dollar: number
    stamps_for_reward: number
    reward_value: number
    auto_redeem: boolean
  }
  pos_settings: {
    require_manager_approval: boolean
    allow_cash_payments: boolean
    allow_card_payments: boolean
    allow_mobile_payments: boolean
    receipt_footer_text: string
  }
}

interface LocationStats {
  total_locations: number
  active_locations: number
  total_customers: number
  total_revenue: number
  total_stamps: number
  total_rewards: number
  monthly_growth: number
  top_performing_locations: Array<{
    location_name: string
    revenue: number
    growth_rate: number
    customer_count: number
    stamps_issued: number
  }>
  recent_activity: Array<{
    type: 'new_customer' | 'location_update' | 'milestone' | 'staff_change'
    description: string
    timestamp: string
    location_name?: string
  }>
}

export default function GallettiHQDashboard() {
  const [locationStats, setLocationStats] = useState<LocationStats | null>(null)
  const [locations, setLocations] = useState<RestaurantLocation[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddLocationDialog, setShowAddLocationDialog] = useState(false)
  const [showManageLocationDialog, setShowManageLocationDialog] = useState(false)
  const [managingLocation, setManagingLocation] = useState<RestaurantLocation | null>(null)
  const [locationStaff, setLocationStaff] = useState<LocationStaff[]>([])
  const [locationSettings, setLocationSettings] = useState<LocationSettings | null>(null)
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false)
  
  // Settings form state
  const [corporateSettings, setCorporateSettings] = useState({
    companyName: 'Galletti Foods',
    logoUrl: '',
    supportEmail: 'support@galletti.com',
    websiteUrl: 'https://galletti.com',
    defaultStampsPerDollar: 1,
    defaultStampsForReward: 10,
    defaultRewardValue: 15.00
  })
  
  // New location form state
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    manager_name: '',
    manager_email: ''
  })

  // New staff form state
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'cashier' as 'manager' | 'cashier' | 'supervisor',
    permissions: {
      can_process_orders: true,
      can_issue_stamps: true,
      can_redeem_rewards: true,
      can_view_analytics: false,
      can_manage_inventory: false,
      can_manage_staff: false
    }
  })
  
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'customers', label: 'Customers', icon: UserCheck },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'loyalty', label: 'Loyalty', icon: Award },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'export', label: 'Data Export', icon: Download },
    { id: 'notifications', label: 'Notifications', icon: Send },
  ]

  useEffect(() => {
    loadLocationData()
  }, [])

  const loadLocationData = async () => {
    setLoading(true)
    try {
      // Simulate loading location data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Load persisted locations from localStorage
      const persistedLocations = JSON.parse(localStorage.getItem('galletti_locations') || '[]')
      setLocations(persistedLocations)
      
      // Calculate stats from persisted data
      const stats: LocationStats = {
        total_locations: persistedLocations.length,
        active_locations: persistedLocations.filter((l: RestaurantLocation) => l.status === 'active').length,
        total_customers: persistedLocations.reduce((sum: number, l: RestaurantLocation) => sum + l.customers, 0),
        total_revenue: persistedLocations.reduce((sum: number, l: RestaurantLocation) => sum + l.monthly_revenue, 0),
        total_stamps: persistedLocations.reduce((sum: number, l: RestaurantLocation) => sum + l.stamps_issued, 0),
        total_rewards: persistedLocations.reduce((sum: number, l: RestaurantLocation) => sum + l.rewards_redeemed, 0),
        monthly_growth: 12.5,
        top_performing_locations: persistedLocations
          .sort((a: RestaurantLocation, b: RestaurantLocation) => b.monthly_revenue - a.monthly_revenue)
          .slice(0, 5)
          .map((l: RestaurantLocation) => ({
            location_name: l.name,
            revenue: l.monthly_revenue,
            growth_rate: Math.random() * 20 - 5, // Random growth rate for demo
            customer_count: l.customers,
            stamps_issued: l.stamps_issued
          })),
        recent_activity: []
      }
      
      setLocationStats(stats)
    } catch (error) {
      console.error('Error loading location data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLocation = async () => {
    if (!newLocation.name || !newLocation.address || !newLocation.city) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const location: RestaurantLocation = {
        id: Date.now().toString(),
        restaurant_id: 'galletti-main',
        ...newLocation,
        status: 'pending',
        customers: 0,
        monthly_revenue: 0,
        stamps_issued: 0,
        rewards_redeemed: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Save to localStorage for persistence
      const existingLocations = JSON.parse(localStorage.getItem('galletti_locations') || '[]')
      const updatedLocations = [...existingLocations, location]
      localStorage.setItem('galletti_locations', JSON.stringify(updatedLocations))
      
      setLocations(prev => [...prev, location])
      setShowAddLocationDialog(false)
      setNewLocation({
        name: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        phone: '',
        manager_name: '',
        manager_email: ''
      })
      
      toast({
        title: "Success",
        description: "New location added successfully (demo data persisted)"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add location",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManageLocation = async (location: RestaurantLocation) => {
    setManagingLocation(location)
    setLoading(true)
    
    try {
      // Simulate loading location staff and settings
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Clean staff data - ready for real data
      const cleanStaff: LocationStaff[] = []
      
      setLocationStaff(cleanStaff)
    } catch (error) {
      console.error('Error loading location details:', error)
      toast({
        title: "Error",
        description: "Failed to load location details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewLocationDashboard = (location: RestaurantLocation) => {
    // Navigate to location-specific POS dashboard using role switching
    console.log('Navigating to location dashboard:', location.name, location.id)
    
    toast({
      title: "Opening Location Dashboard",
      description: `Switching to ${location.name} POS interface...`
    })
    
    // Switch to location view with the specific location data
    switchToLocationView({
      locationId: location.id,
      locationName: location.name,
      restaurantId: location.restaurant_id,
      role: 'location_staff'
    })
    
    // Debug: Check if session storage was set
    console.log('Session storage after setting:', {
      galletti_hq_context: sessionStorage.getItem('galletti_hq_context'),
      temp_role: sessionStorage.getItem('temp_role'),
      viewing_location: sessionStorage.getItem('viewing_location'),
      temp_location_name: sessionStorage.getItem('temp_location_name')
    })
    
    // Force a page refresh to trigger the role change
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email || !managingLocation) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const staff: LocationStaff = {
        id: Date.now().toString(),
        location_id: managingLocation.id,
        ...newStaff,
        status: 'active',
        last_login: '',
        created_at: new Date().toISOString()
      }
      
      setLocationStaff(prev => [...prev, staff])
      setShowAddStaffDialog(false)
      setNewStaff({
        name: '',
        email: '',
        role: 'cashier',
        permissions: {
          can_process_orders: true,
          can_issue_stamps: true,
          can_redeem_rewards: true,
          can_view_analytics: false,
          can_manage_inventory: false,
          can_manage_staff: false
        }
      })
      
      toast({
        title: "Success",
        description: "Staff member added successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add staff member",
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

  const getRoleBadge = (role: string) => {
    const colors = {
      manager: 'bg-purple-100 text-purple-800',
      supervisor: 'bg-blue-100 text-blue-800',
      cashier: 'bg-green-100 text-green-800'
    }
    return (
      <Badge className={colors[role] || 'bg-gray-100 text-gray-800'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
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
    return new Intl.NumberFormat().format(num)
  }

  const filteredLocations = locations.filter((location) => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.manager_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || location.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Add handler for updating location settings
  const updateLocationSettings = (updates: Partial<LocationSettings>) => {
    if (locationSettings) {
      setLocationSettings({ ...locationSettings, ...updates })
    }
  }

  const updateLoyaltySettings = (field: keyof LocationSettings['loyalty_settings'], value: number | boolean) => {
    if (locationSettings) {
      setLocationSettings({
        ...locationSettings,
        loyalty_settings: {
          ...locationSettings.loyalty_settings,
          [field]: value
        }
      })
    }
  }

  const updatePOSSettings = (field: keyof LocationSettings['pos_settings'], value: string | boolean) => {
    if (locationSettings) {
      setLocationSettings({
        ...locationSettings,
        pos_settings: {
          ...locationSettings.pos_settings,
          [field]: value
        }
      })
    }
  }

  const updateOperatingHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    if (locationSettings) {
      setLocationSettings({
        ...locationSettings,
        operating_hours: {
          ...locationSettings.operating_hours,
          [day]: {
            ...locationSettings.operating_hours[day as keyof typeof locationSettings.operating_hours],
            [field]: value
          }
        }
      })
    }
  }

  if (loading && !locationStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading location data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Galletti Foods HQ</h1>
              <p className="text-sm text-gray-600">Restaurant chain management dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Multi-Location Management</p>
                <p className="text-xs text-gray-500">Tier 2 Access</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Location Overview Stats */}
        {locationStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Locations</CardTitle>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{locationStats.total_locations}</div>
                <p className="text-xs text-green-600 mt-1">
                  {locationStats.active_locations} active
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(locationStats.total_customers)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Across all locations
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(locationStats.total_revenue)}</div>
                <p className="text-xs text-green-600 mt-1">
                  +{locationStats.monthly_growth}% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Loyalty Program</CardTitle>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(locationStats.total_stamps)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatNumber(locationStats.total_rewards)} rewards redeemed
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="locations" className="space-y-6">
          <div className="border-b border-gray-200">
            <TabsList className="flex overflow-x-auto scrollbar-hide space-x-1 px-1 py-1 bg-transparent h-auto">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-gray-100 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 min-w-fit"
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
              <TabsTrigger 
                value="settings"
                className="flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-gray-100 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 min-w-fit"
              >
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="locations" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Location Management</h3>
                <p className="text-sm text-gray-600">Manage all restaurant locations</p>
              </div>
              <Dialog open={showAddLocationDialog} onOpenChange={setShowAddLocationDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white text-gray-900">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900">Add New Location</DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Add a new restaurant location to your network
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-gray-700">Location Name *</Label>
                      <Input
                        id="name"
                        value={newLocation.name}
                        onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Downtown Location"
                        className="bg-white border-gray-300 text-gray-900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address" className="text-gray-700">Address *</Label>
                      <Input
                        id="address"
                        value={newLocation.address}
                        onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Street address"
                        className="bg-white border-gray-300 text-gray-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="city" className="text-gray-700">City *</Label>
                        <Input
                          id="city"
                          value={newLocation.city}
                          onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="City"
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-gray-700">State</Label>
                        <Input
                          id="state"
                          value={newLocation.state}
                          onChange={(e) => setNewLocation(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="State"
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="zip" className="text-gray-700">ZIP Code</Label>
                      <Input
                        id="zip"
                        value={newLocation.zip_code}
                        onChange={(e) => setNewLocation(prev => ({ ...prev, zip_code: e.target.value }))}
                        placeholder="ZIP Code"
                        className="bg-white border-gray-300 text-gray-900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-gray-700">Phone</Label>
                      <Input
                        id="phone"
                        value={newLocation.phone}
                        onChange={(e) => setNewLocation(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(555) 123-4567"
                        className="bg-white border-gray-300 text-gray-900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="manager_name" className="text-gray-700">Manager Name</Label>
                      <Input
                        id="manager_name"
                        value={newLocation.manager_name}
                        onChange={(e) => setNewLocation(prev => ({ ...prev, manager_name: e.target.value }))}
                        placeholder="Manager name"
                        className="bg-white border-gray-300 text-gray-900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="manager_email" className="text-gray-700">Manager Email</Label>
                      <Input
                        id="manager_email"
                        type="email"
                        value={newLocation.manager_email}
                        onChange={(e) => setNewLocation(prev => ({ ...prev, manager_email: e.target.value }))}
                        placeholder="manager@email.com"
                        className="bg-white border-gray-300 text-gray-900"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddLocation} disabled={loading} className="flex-1">
                        {loading ? 'Adding...' : 'Add Location'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddLocationDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Locations Grid */}
            <div className="grid gap-6">
              {filteredLocations.map((location) => (
                <Card key={location.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 cursor-pointer flex-1"
                        onClick={() => handleViewLocationDashboard(location)}
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {location.name}
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span>{location.address}, {location.city}, {location.state}</span>
                            {getStatusBadge(location.status)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleManageLocation(location)}
                          disabled={loading}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{formatNumber(location.customers)}</div>
                        <p className="text-xs text-gray-500">Customers</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(location.monthly_revenue)}</div>
                        <p className="text-xs text-gray-500">Monthly Revenue</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{formatNumber(location.stamps_issued)}</div>
                        <p className="text-xs text-gray-500">Stamps Issued</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{formatNumber(location.rewards_redeemed)}</div>
                        <p className="text-xs text-gray-500">Rewards Redeemed</p>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600">{location.manager_name}</div>
                        <p className="text-xs text-gray-500">Manager</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <StaffManager />
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <CustomerManager clientId="galletti-client-id" />
          </TabsContent>

          <TabsContent value="loyalty" className="space-y-6">
            <LoyaltyManager clientId="galletti-foods" />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsManager clientId="galletti-foods" />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <DataExportManager />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationCampaignsManager clientId="galletti-client-id" />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Business Overview</h3>
              <p className="text-sm text-gray-600">Key metrics and insights for your restaurant network</p>
            </div>

            {locationStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Growth</CardTitle>
                    <CardDescription>Total customers across all locations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{formatNumber(locationStats.total_customers)}</div>
                    <p className="text-sm text-green-600 mt-2">+{locationStats.monthly_growth}% this month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Performance</CardTitle>
                    <CardDescription>Monthly revenue across network</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{formatCurrency(locationStats.total_revenue)}</div>
                    <p className="text-sm text-gray-600 mt-2">Average per location: {formatCurrency(locationStats.total_revenue / locationStats.active_locations)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Loyalty Engagement</CardTitle>
                    <CardDescription>Stamps and rewards activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">{formatNumber(locationStats.total_stamps)}</div>
                    <p className="text-sm text-gray-600 mt-2">{formatNumber(locationStats.total_rewards)} rewards redeemed</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold">Corporate Settings</h4>
              <p className="text-sm text-gray-600">Manage brand-wide settings and platform configuration</p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Brand Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input 
                      value={corporateSettings.companyName}
                      onChange={(e) => setCorporateSettings(prev => ({ ...prev, companyName: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Brand Logo URL</Label>
                    <Input 
                      placeholder="https://example.com/logo.png"
                      value={corporateSettings.logoUrl}
                      onChange={(e) => setCorporateSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Support Email</Label>
                    <Input 
                      type="email"
                      value={corporateSettings.supportEmail}
                      onChange={(e) => setCorporateSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Website URL</Label>
                    <Input 
                      value={corporateSettings.websiteUrl}
                      onChange={(e) => setCorporateSettings(prev => ({ ...prev, websiteUrl: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Global Loyalty Defaults</CardTitle>
                  <CardDescription>Default settings applied to new locations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Default Stamps per Dollar</Label>
                      <Input 
                        type="number" 
                        value={corporateSettings.defaultStampsPerDollar}
                        onChange={(e) => setCorporateSettings(prev => ({ ...prev, defaultStampsPerDollar: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Default Stamps for Reward</Label>
                      <Input 
                        type="number" 
                        value={corporateSettings.defaultStampsForReward}
                        onChange={(e) => setCorporateSettings(prev => ({ ...prev, defaultStampsForReward: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Default Reward Value ($)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={corporateSettings.defaultRewardValue}
                      onChange={(e) => setCorporateSettings(prev => ({ ...prev, defaultRewardValue: parseFloat(e.target.value) || 0 }))}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Enable loyalty program for new locations</Label>
                    <Switch checked={true} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Platform Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable customer notifications</Label>
                    <Switch checked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Allow location-specific campaigns</Label>
                    <Switch checked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Enable data export for locations</Label>
                    <Switch checked={false} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require HQ approval for new staff</Label>
                    <Switch checked={false} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Subscription & Billing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Current Plan</Label>
                      <Input 
                        value="Enterprise"
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Billing Cycle</Label>
                      <Input 
                        value="Annual"
                        readOnly
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Next Billing Date</Label>
                    <Input 
                      value="2024-12-01"
                      readOnly
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auto-renewal enabled</Label>
                    <Switch checked={true} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Location Management Dialog */}
        <Dialog open={showManageLocationDialog} onOpenChange={setShowManageLocationDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900">
                <Settings className="w-5 h-5" />
                Manage {managingLocation?.name}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Manage staff access, permissions, and location settings
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="staff" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                <TabsTrigger value="staff" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">
                  <Users className="w-4 h-4 mr-2" />
                  Staff & Access
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">
                  <Settings className="w-4 h-4 mr-2" />
                  Location Settings
                </TabsTrigger>
                <TabsTrigger value="hours" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">
                  <Clock className="w-4 h-4 mr-2" />
                  Operating Hours
                </TabsTrigger>
              </TabsList>

              <TabsContent value="staff" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Staff Management</h4>
                    <p className="text-sm text-gray-600">Manage who can access this location's POS system</p>
                  </div>
                  <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Staff
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-white text-gray-900">
                      <DialogHeader>
                        <DialogTitle className="text-gray-900">Add Staff Member</DialogTitle>
                        <DialogDescription className="text-gray-600">
                          Add a new staff member to {managingLocation?.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="staff_name" className="text-gray-700">Full Name *</Label>
                          <Input
                            id="staff_name"
                            value={newStaff.name}
                            onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="John Doe"
                            className="bg-white border-gray-300 text-gray-900"
                          />
                        </div>
                        <div>
                          <Label htmlFor="staff_email" className="text-gray-700">Email *</Label>
                          <Input
                            id="staff_email"
                            type="email"
                            value={newStaff.email}
                            onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="john.doe@galletti.com"
                            className="bg-white border-gray-300 text-gray-900"
                          />
                        </div>
                        <div>
                          <Label htmlFor="staff_role" className="text-gray-700">Role</Label>
                          <Select value={newStaff.role} onValueChange={(value: 'manager' | 'cashier' | 'supervisor') => setNewStaff(prev => ({ ...prev, role: value }))}>
                            <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-300">
                              <SelectItem value="cashier" className="text-gray-900">Cashier</SelectItem>
                              <SelectItem value="supervisor" className="text-gray-900">Supervisor</SelectItem>
                              <SelectItem value="manager" className="text-gray-900">Manager</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-gray-700">Permissions</Label>
                          <div className="space-y-2">
                            {Object.entries(newStaff.permissions).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between">
                                <Label htmlFor={key} className="text-sm text-gray-700">
                                  {key.replace(/_/g, ' ').replace(/^can /, '').replace(/\b\w/g, l => l.toUpperCase())}
                                </Label>
                                <Switch
                                  id={key}
                                  checked={value}
                                  onCheckedChange={(checked) => 
                                    setNewStaff(prev => ({
                                      ...prev,
                                      permissions: { ...prev.permissions, [key]: checked }
                                    }))
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleAddStaff} disabled={loading} className="flex-1">
                            {loading ? 'Adding...' : 'Add Staff'}
                          </Button>
                          <Button variant="outline" onClick={() => setShowAddStaffDialog(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-4">
                  {locationStaff.map((staff) => (
                    <Card key={staff.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <UserCheck className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{staff.name}</p>
                                {getRoleBadge(staff.role)}
                              </div>
                              <p className="text-sm text-gray-600">{staff.email}</p>
                              <p className="text-xs text-gray-500">
                                Last login: {staff.last_login ? new Date(staff.last_login).toLocaleString() : 'Never'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Key className="w-4 h-4 mr-1" />
                              Permissions
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          {Object.entries(staff.permissions).map(([key, value]) => (
                            <div key={key} className={`flex items-center gap-1 ${value ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              {key.replace(/_/g, ' ').replace(/^can /, '')}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">POS & Loyalty Settings</h4>
                  <p className="text-sm text-gray-600">Configure payment methods and loyalty program settings</p>
                </div>

                {locationSettings && (
                  <div className="space-y-6">
                    <Card className="bg-white border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-base text-gray-900">Payment Methods</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-700">Accept Cash Payments</Label>
                          <Switch 
                            checked={locationSettings.pos_settings.allow_cash_payments}
                            onCheckedChange={(checked) => updatePOSSettings('allow_cash_payments', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-700">Accept Card Payments</Label>
                          <Switch 
                            checked={locationSettings.pos_settings.allow_card_payments}
                            onCheckedChange={(checked) => updatePOSSettings('allow_card_payments', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-700">Accept Mobile Payments</Label>
                          <Switch 
                            checked={locationSettings.pos_settings.allow_mobile_payments}
                            onCheckedChange={(checked) => updatePOSSettings('allow_mobile_payments', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-700">Require Manager Approval for Large Orders</Label>
                          <Switch 
                            checked={locationSettings.pos_settings.require_manager_approval}
                            onCheckedChange={(checked) => updatePOSSettings('require_manager_approval', checked)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-base text-gray-900">Loyalty Program</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-700">Stamps per Dollar</Label>
                            <Input 
                              type="number" 
                              value={locationSettings.loyalty_settings.stamps_per_dollar}
                              onChange={(e) => updateLoyaltySettings('stamps_per_dollar', parseFloat(e.target.value) || 0)}
                              className="mt-1 bg-white border-gray-300 text-gray-900"
                            />
                          </div>
                          <div>
                            <Label className="text-gray-700">Stamps for Reward</Label>
                            <Input 
                              type="number" 
                              value={locationSettings.loyalty_settings.stamps_for_reward}
                              onChange={(e) => updateLoyaltySettings('stamps_for_reward', parseInt(e.target.value) || 0)}
                              className="mt-1 bg-white border-gray-300 text-gray-900"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-700">Reward Value ($)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={locationSettings.loyalty_settings.reward_value}
                            onChange={(e) => updateLoyaltySettings('reward_value', parseFloat(e.target.value) || 0)}
                            className="mt-1 bg-white border-gray-300 text-gray-900"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-700">Auto-redeem rewards when available</Label>
                          <Switch 
                            checked={locationSettings.loyalty_settings.auto_redeem}
                            onCheckedChange={(checked) => updateLoyaltySettings('auto_redeem', checked)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-base text-gray-900">Receipt Settings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div>
                          <Label className="text-gray-700">Receipt Footer Text</Label>
                          <Textarea 
                            value={locationSettings.pos_settings.receipt_footer_text}
                            onChange={(e) => updatePOSSettings('receipt_footer_text', e.target.value)}
                            className="mt-1 bg-white border-gray-300 text-gray-900"
                            placeholder="Thank you message or social media handles"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="hours" className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Operating Hours</h4>
                  <p className="text-sm text-gray-600">Set the operating hours for this location</p>
                </div>

                {locationSettings && (
                  <div className="space-y-4">
                    {Object.entries(locationSettings.operating_hours).map(([day, hours]) => (
                      <Card key={day} className="bg-white border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-20">
                                <Label className="font-medium capitalize text-gray-700">{day}</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch 
                                  checked={!hours.closed}
                                  onCheckedChange={(checked) => updateOperatingHours(day, 'closed', !checked)}
                                />
                                <span className="text-sm text-gray-600">
                                  {hours.closed ? 'Closed' : 'Open'}
                                </span>
                              </div>
                            </div>
                            {!hours.closed && (
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="time" 
                                  value={hours.open}
                                  onChange={(e) => updateOperatingHours(day, 'open', e.target.value)}
                                  className="w-32 bg-white border-gray-300 text-gray-900"
                                />
                                <span className="text-gray-500">to</span>
                                <Input 
                                  type="time" 
                                  value={hours.close}
                                  onChange={(e) => updateOperatingHours(day, 'close', e.target.value)}
                                  className="w-32 bg-white border-gray-300 text-gray-900"
                                />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowManageLocationDialog(false)}>
                Cancel
              </Button>
              <Button>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 
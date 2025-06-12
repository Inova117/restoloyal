import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { 
  MapPin, 
  Building2, 
  Users, 
  TrendingUp, 
  Plus,
  Edit,
  Trash2,
  Star,
  Clock,
  Phone,
  Mail,
  Settings,
  BarChart3,
  UserCheck,
  Route,
  Target,
  Award,
  Activity
} from 'lucide-react'

interface Location {
  id: string
  restaurant_id: string
  name: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  phone?: string
  email?: string
  latitude?: number
  longitude?: number
  stamps_required: number
  reward_description?: string
  timezone: string
  operating_hours?: any
  is_active: boolean
  is_primary: boolean
  logo_url?: string
  brand_color: string
  custom_settings?: any
  created_at: string
  updated_at: string
  location_managers?: Array<{ count: number }>
  clients?: Array<{ count: number }>
}

interface LocationManager {
  id: string
  location_id: string
  user_id?: string
  restaurant_id: string
  name: string
  email: string
  phone?: string
  role: 'manager' | 'staff' | 'admin'
  permissions?: any
  is_active: boolean
  created_at: string
  updated_at: string
}

interface LocationPerformance {
  total_customers: number
  new_customers: number
  returning_customers: number
  stamps_issued: number
  rewards_redeemed: number
  customer_visits: number
  average_stamps_per_visit: number
  customer_retention_rate: number
}

interface CrossLocationAnalytics {
  location_metrics: Array<{
    location_id: string
    location_name: string
    total_customers: number
    recent_visits: number
    unique_recent_customers: number
    stamps_earned: number
    rewards_redeemed: number
  }>
  cross_location_summary: {
    total_locations: number
    active_locations: number
    mobile_customers: number
    total_active_customers: number
    mobility_rate: string
  }
}

export default function MultiLocationDashboard() {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [locationManagers, setLocationManagers] = useState<LocationManager[]>([])
  const [crossLocationAnalytics, setCrossLocationAnalytics] = useState<CrossLocationAnalytics | null>(null)
  const [locationPerformance, setLocationPerformance] = useState<LocationPerformance | null>(null)
  const [loading, setLoading] = useState(false)
  const [showLocationDialog, setShowLocationDialog] = useState(false)
  const [showManagerDialog, setShowManagerDialog] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editingManager, setEditingManager] = useState<LocationManager | null>(null)
  
  const { toast } = useToast()

  // Get current restaurant
  const [restaurantId, setRestaurantId] = useState<string>('')

  useEffect(() => {
    const getCurrentRestaurant = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Get client admin data to find the client_id
        const { data: clientAdmin } = await (supabase as any)
          .from('client_admins')
          .select('client_id')
          .eq('user_id', user.id)
          .single()
        
        if (clientAdmin) {
          setRestaurantId(clientAdmin.client_id)
        }
      }
    }
    getCurrentRestaurant()
  }, [])

  useEffect(() => {
    if (restaurantId) {
      loadLocations()
      loadCrossLocationAnalytics()
    }
  }, [restaurantId])

  useEffect(() => {
    if (selectedLocation) {
      loadLocationManagers(selectedLocation.id)
      loadLocationPerformance(selectedLocation.id)
    }
  }, [selectedLocation])

  const loadLocations = async () => {
    try {
      // Simulate loading locations data since Edge Functions don't exist
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Clean locations data - ready for real data
      const cleanLocations: Location[] = []
      
      setLocations(cleanLocations)
    } catch (error) {
      console.error('Error loading locations:', error)
      toast({
        title: "Error",
        description: "Failed to load locations",
        variant: "destructive"
      })
    }
  }

  const loadLocationManagers = async (locationId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Clean managers data - ready for real data
      const cleanManagers: LocationManager[] = []
      
      setLocationManagers(cleanManagers)
    } catch (error) {
      console.error('Error loading managers:', error)
    }
  }

  const loadLocationPerformance = async (locationId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Clean performance data - ready for real data
      const cleanPerformance: LocationPerformance = {
        total_customers: 0,
        new_customers: 0,
        returning_customers: 0,
        stamps_issued: 0,
        rewards_redeemed: 0,
        customer_visits: 0,
        average_stamps_per_visit: 0,
        customer_retention_rate: 0
      }
      
      setLocationPerformance(cleanPerformance)
    } catch (error) {
      console.error('Error loading performance:', error)
    }
  }

  const loadCrossLocationAnalytics = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Clean analytics data - ready for real data
      const cleanAnalytics: CrossLocationAnalytics = {
        location_metrics: [],
        cross_location_summary: {
          total_locations: 0,
          active_locations: 0,
          mobile_customers: 0,
          total_active_customers: 0,
          mobility_rate: '0%'
        }
      }
      
      setCrossLocationAnalytics(cleanAnalytics)
    } catch (error) {
      console.error('Error loading cross-location analytics:', error)
    }
  }

  const handleCreateLocation = async (locationData: Partial<Location>) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newLocation: Location = {
        id: Date.now().toString(),
        restaurant_id: restaurantId,
        name: locationData.name || '',
        address: locationData.address || '',
        city: locationData.city || '',
        state: locationData.state || '',
        zip_code: locationData.zip_code || '',
        country: locationData.country || 'USA',
        phone: locationData.phone || '',
        email: locationData.email || '',
        latitude: locationData.latitude || 0,
        longitude: locationData.longitude || 0,
        stamps_required: locationData.stamps_required || 10,
        reward_description: locationData.reward_description || '',
        timezone: locationData.timezone || 'America/New_York',
        operating_hours: locationData.operating_hours || {},
        is_active: true,
        is_primary: false,
        logo_url: locationData.logo_url || '',
        brand_color: locationData.brand_color || '#3B82F6',
        custom_settings: locationData.custom_settings || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        location_managers: [{ count: 0 }],
        clients: [{ count: 0 }]
      }
      
      setLocations(prev => [...prev, newLocation])
      
      toast({
        title: "Success",
        description: `Location "${locationData.name}" created successfully (simulated)`
      })
      setShowLocationDialog(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create location",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateLocation = async (locationId: string, locationData: Partial<Location>) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setLocations(prev => prev.map(location => 
        location.id === locationId 
          ? { ...location, ...locationData, updated_at: new Date().toISOString() }
          : location
      ))
      
      toast({
        title: "Success",
        description: "Location updated successfully (simulated)"
      })
      setShowLocationDialog(false)
      setEditingLocation(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return
    
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setLocations(prev => prev.filter(location => location.id !== locationId))
      
      toast({
        title: "Success",
        description: "Location deleted successfully (simulated)"
      })
      
      if (selectedLocation?.id === locationId) {
        setSelectedLocation(null)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateManager = async (managerData: Partial<LocationManager>) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newManager: LocationManager = {
        id: Date.now().toString(),
        location_id: selectedLocation?.id || '',
        user_id: `user_${Date.now()}`,
        restaurant_id: restaurantId,
        name: managerData.name || '',
        email: managerData.email || '',
        phone: managerData.phone || '',
        role: managerData.role || 'staff',
        permissions: managerData.permissions || {},
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setLocationManagers(prev => [...prev, newManager])
      
      toast({
        title: "Success",
        description: `Manager "${managerData.name}" added successfully (simulated)`
      })
      setShowManagerDialog(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add manager",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateManager = async (managerId: string, managerData: Partial<LocationManager>) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setLocationManagers(prev => prev.map(manager => 
        manager.id === managerId 
          ? { ...manager, ...managerData, updated_at: new Date().toISOString() }
          : manager
      ))
      
      toast({
        title: "Success",
        description: "Manager updated successfully (simulated)"
      })
      setShowManagerDialog(false)
      setEditingManager(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update manager",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteManager = async (managerId: string) => {
    if (!confirm('Are you sure you want to remove this manager?')) return
    
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setLocationManagers(prev => prev.filter(manager => manager.id !== managerId))
      
      toast({
        title: "Success",
        description: "Manager removed successfully (simulated)"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove manager",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      staff: 'bg-green-100 text-green-800'
    }
    return (
      <Badge className={colors[role] || 'bg-gray-100 text-gray-800'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  if (!restaurantId) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Multi-Location Management</h1>
          <p className="text-muted-foreground">Manage your restaurant locations, staff, and cross-location analytics</p>
        </div>
        <Button onClick={() => setShowLocationDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Cross-Location Overview */}
      {crossLocationAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{crossLocationAnalytics.cross_location_summary.total_locations}</div>
              <p className="text-xs text-muted-foreground">
                {crossLocationAnalytics.cross_location_summary.active_locations} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mobile Customers</CardTitle>
              <Route className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{crossLocationAnalytics.cross_location_summary.mobile_customers}</div>
              <p className="text-xs text-muted-foreground">
                {crossLocationAnalytics.cross_location_summary.mobility_rate}% mobility rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{crossLocationAnalytics.cross_location_summary.total_active_customers}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {crossLocationAnalytics.location_metrics.reduce((sum, l) => sum + l.recent_visits, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total visits</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="locations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="analytics">Cross-Location Analytics</TabsTrigger>
          <TabsTrigger value="management">Staff Management</TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Locations List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Locations</CardTitle>
                <CardDescription>Select a location to view details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedLocation?.id === location.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedLocation(location)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{location.name}</h3>
                            {location.is_primary && <Star className="h-4 w-4 text-yellow-500" />}
                          </div>
                          <p className="text-sm text-muted-foreground">{location.city}, {location.state}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant={location.is_active ? "default" : "secondary"}>
                            {location.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{location.clients?.[0]?.count || 0} customers</span>
                        <span>{location.location_managers?.[0]?.count || 0} staff</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Location Details */}
            {selectedLocation && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedLocation.name}
                        {selectedLocation.is_primary && <Star className="h-5 w-5 text-yellow-500" />}
                      </CardTitle>
                      <CardDescription>{selectedLocation.address}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingLocation(selectedLocation)
                          setShowLocationDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!selectedLocation.is_primary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLocation(selectedLocation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Location Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedLocation.address}, {selectedLocation.city}, {selectedLocation.state}</span>
                      </div>
                      {selectedLocation.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedLocation.phone}</span>
                        </div>
                      )}
                      {selectedLocation.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedLocation.email}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedLocation.stamps_required} stamps required</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Timezone: {selectedLocation.timezone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  {locationPerformance && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Performance (Last 30 Days)</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{locationPerformance.total_customers}</div>
                          <div className="text-sm text-muted-foreground">Total Customers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{locationPerformance.customer_visits}</div>
                          <div className="text-sm text-muted-foreground">Visits</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{locationPerformance.stamps_issued}</div>
                          <div className="text-sm text-muted-foreground">Stamps Issued</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{locationPerformance.rewards_redeemed}</div>
                          <div className="text-sm text-muted-foreground">Rewards</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {crossLocationAnalytics && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Location Performance Comparison</CardTitle>
                  <CardDescription>Compare performance across all locations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {crossLocationAnalytics.location_metrics.map((location) => (
                      <div key={location.location_id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">{location.location_name}</h3>
                          <Badge variant="outline">{location.total_customers} customers</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Recent Visits:</span>
                            <div className="font-medium">{location.recent_visits}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Unique Customers:</span>
                            <div className="font-medium">{location.unique_recent_customers}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Stamps Earned:</span>
                            <div className="font-medium">{location.stamps_earned}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rewards Redeemed:</span>
                            <div className="font-medium">{location.rewards_redeemed}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          {selectedLocation && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Staff Management - {selectedLocation.name}</CardTitle>
                    <CardDescription>Manage staff and managers for this location</CardDescription>
                  </div>
                  <Button onClick={() => setShowManagerDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {locationManagers.map((manager) => (
                    <div key={manager.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{manager.name}</h3>
                            {getRoleBadge(manager.role)}
                            {!manager.is_active && <Badge variant="secondary">Inactive</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{manager.email}</p>
                          {manager.phone && (
                            <p className="text-sm text-muted-foreground">{manager.phone}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingManager(manager)
                              setShowManagerDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteManager(manager.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {locationManagers.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No staff assigned to this location</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Location Dialog */}
      <LocationDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        location={editingLocation}
        onSave={editingLocation ? 
          (data) => handleUpdateLocation(editingLocation.id, data) : 
          handleCreateLocation
        }
        loading={loading}
      />

      {/* Manager Dialog */}
      <ManagerDialog
        open={showManagerDialog}
        onOpenChange={setShowManagerDialog}
        manager={editingManager}
        onSave={editingManager ? 
          (data) => handleUpdateManager(editingManager.id, data) : 
          handleCreateManager
        }
        loading={loading}
      />
    </div>
  )
}

// Location Dialog Component
function LocationDialog({ 
  open, 
  onOpenChange, 
  location, 
  onSave, 
  loading 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  location: Location | null
  onSave: (data: Partial<Location>) => void
  loading: boolean
}) {
  const [formData, setFormData] = useState<Partial<Location>>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    stamps_required: 10,
    reward_description: '',
    timezone: 'UTC',
    is_active: true,
    is_primary: false,
    brand_color: '#3B82F6'
  })

  useEffect(() => {
    if (location) {
      setFormData(location)
    } else {
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        phone: '',
        email: '',
        stamps_required: 10,
        reward_description: '',
        timezone: 'UTC',
        is_active: true,
        is_primary: false,
        brand_color: '#3B82F6'
      })
    }
  }, [location, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{location ? 'Edit Location' : 'Add New Location'}</DialogTitle>
          <DialogDescription>
            {location ? 'Update location details' : 'Create a new restaurant location'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="stamps_required">Stamps Required</Label>
              <Input
                id="stamps_required"
                type="number"
                value={formData.stamps_required}
                onChange={(e) => setFormData(prev => ({ ...prev, stamps_required: parseInt(e.target.value) || 10 }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reward_description">Reward Description</Label>
            <Textarea
              id="reward_description"
              value={formData.reward_description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, reward_description: e.target.value }))}
              placeholder="Describe what customers get when they complete their stamp card..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active Location</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_primary"
                checked={formData.is_primary}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_primary: checked }))}
              />
              <Label htmlFor="is_primary">Primary Location</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : location ? 'Update Location' : 'Create Location'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Manager Dialog Component
function ManagerDialog({ 
  open, 
  onOpenChange, 
  manager, 
  onSave, 
  loading 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  manager: LocationManager | null
  onSave: (data: Partial<LocationManager>) => void
  loading: boolean
}) {
  const [formData, setFormData] = useState<Partial<LocationManager>>({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    is_active: true
  })

  useEffect(() => {
    if (manager) {
      setFormData(manager)
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'staff',
        is_active: true
      })
    }
  }, [manager, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{manager ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
          <DialogDescription>
            {manager ? 'Update staff member details' : 'Add a new staff member to this location'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'manager' | 'staff' | 'admin') => 
                setFormData(prev => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : manager ? 'Update Staff' : 'Add Staff'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import type { Client } from '@/types/database'
import {
  Building2,
  Users,
  DollarSign,
  Activity,
  MapPin,
  Plus,
  Eye,
  Edit,
  Server,
  Shield,
  Globe,
  Monitor
} from 'lucide-react'

interface PlatformMetrics {
  totalClients: number
  totalLocations: number
  totalCustomers: number
  monthlyRevenue: number
}

interface ZerionPlatformDashboardProps {
  // Remove unused props or make them optional for future use
}

export default function ZerionPlatformDashboard() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const { toast } = useToast()

  const [newClient, setNewClient] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    businessType: 'restaurant_chain' as 'restaurant_chain' | 'single_restaurant' | 'franchise',
    address: '',
    city: '',
    state: '',
    country: 'US'
  })

  useEffect(() => {
    loadPlatformMetrics()
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const { data: clientsData, error } = await (supabase as any)
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error loading clients:', error)
        setClients([])
      } else {
        setClients(clientsData || [])
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      setClients([])
    }
  }

  const loadPlatformMetrics = async () => {
    setLoading(true)
    try {
      const { data: allClients } = await (supabase as any)
        .from('clients')
        .select('*')
      
      const { data: allLocations } = await (supabase as any)
        .from('locations')
        .select('*')
      
      const { data: allCustomers } = await (supabase as any)
        .from('customers')
        .select('*')

      const totalClients = allClients?.length || 0
      const totalLocations = allLocations?.length || 0
      const totalCustomers = allCustomers?.length || 0
      const monthlyRevenue = totalCustomers * 25

      setMetrics({
        totalClients,
        totalLocations,
        totalCustomers,
        monthlyRevenue
      })
    } catch (error) {
      console.error('Error loading platform metrics:', error)
      setMetrics({
        totalClients: 0,
        totalLocations: 0,
        totalCustomers: 0,
        monthlyRevenue: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.contactEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-client', {
        body: {
          name: newClient.name,
          slug: newClient.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
          email: newClient.contactEmail,
          phone: newClient.contactPhone,
          address: newClient.address,
          city: newClient.city,
          state: newClient.state,
          country: newClient.country,
          business_type: newClient.businessType,
          settings: {
            stamps_required_for_reward: 10,
            allow_cross_location_stamps: true,
            auto_expire_stamps_days: 365,
            customer_can_view_history: true
          }
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to create client')
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create client')
      }

      toast({
        title: "Client Created",
        description: `${newClient.name} has been successfully added to the platform.`,
      })

      setNewClient({
        name: '',
        contactEmail: '',
        contactPhone: '',
        businessType: 'restaurant_chain' as 'restaurant_chain' | 'single_restaurant' | 'franchise',
        address: '',
        city: '',
        state: '',
        country: 'US'
      })

      await loadClients()
      await loadPlatformMetrics()

    } catch (error) {
      console.error('Error creating client:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create client",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Building2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{formatNumber(metrics?.totalClients || 0)}</div>
                <p className="text-xs text-blue-600">Active business accounts</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
                <MapPin className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{formatNumber(metrics?.totalLocations || 0)}</div>
                <p className="text-xs text-green-600">Physical store locations</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">{formatNumber(metrics?.totalCustomers || 0)}</div>
                <p className="text-xs text-purple-600">End customers across all clients</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">{formatCurrency(metrics?.monthlyRevenue || 0)}</div>
                <p className="text-xs text-yellow-600">Estimated platform revenue</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Platform Health
              </CardTitle>
              <CardDescription>System status and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <span className="text-sm text-green-600">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm text-green-600">99.9%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Client</CardTitle>
              <CardDescription>Create a new business account on the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Business Name *</Label>
                  <Input
                    id="clientName"
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={newClient.contactEmail}
                    onChange={(e) => setNewClient(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="admin@business.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={newClient.contactPhone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select
                    value={newClient.businessType}
                    onValueChange={(value: 'restaurant_chain' | 'single_restaurant' | 'franchise') => 
                      setNewClient(prev => ({ ...prev, businessType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant_chain">Restaurant Chain</SelectItem>
                      <SelectItem value="single_restaurant">Single Restaurant</SelectItem>
                      <SelectItem value="franchise">Franchise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddClient} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Create Client
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Clients</CardTitle>
              <CardDescription>Manage all business accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{client.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {client.business_type} • {client.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(client.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Platform infrastructure and technical details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      <span className="font-medium">Database</span>
                    </div>
                    <p className="text-sm text-muted-foreground">PostgreSQL with Supabase</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">Security</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Row Level Security (RLS) enabled</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="font-medium">API</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Edge Functions deployed</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span className="font-medium">Monitoring</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Real-time analytics active</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
 
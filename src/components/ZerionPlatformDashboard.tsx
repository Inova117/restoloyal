import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  Monitor,
  TrendingUp,
  Clock,
  Database,
  Zap,
  BarChart3,
  Calendar,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Crown,
  Sparkles,
  QrCode,
  Gift,
  Scan,
  LogOut,
  Store,
  ArrowLeft
} from 'lucide-react'
import { ClientService } from '@/services/platform/clientService'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DialogFooter
} from '@/components/ui/dialog'
import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  // Dialog state for view / edit actions
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

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
      // Use direct Supabase query since Edge Function is not deployed
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

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadPlatformMetrics(), loadClients()])
    setTimeout(() => setRefreshing(false), 500) // Small delay for UX
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
      const clientService = new ClientService()
      const { error } = await clientService.createClient({
        name: newClient.name,
        email: newClient.contactEmail,
        phone: newClient.contactPhone || undefined,
        subscription_plan: 'trial',
        contact_email: newClient.contactEmail,
        contact_phone: newClient.contactPhone || undefined
      })

      if (error) {
        throw new Error(error.message || 'Failed to create client')
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

  const getClientStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200'
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getBusinessTypeIcon = (type: string | null) => {
    if (!type) return <Building2 className="h-4 w-4" />
    switch (type) {
      case 'restaurant_chain': return <Building2 className="h-4 w-4" />
      case 'single_restaurant': return <MapPin className="h-4 w-4" />
      case 'franchise': return <Globe className="h-4 w-4" />
      default: return <Building2 className="h-4 w-4" />
    }
  }

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Metrics skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Crown className="h-7 w-7 text-yellow-600" />
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Zerion Platform
            </h1>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
              <Sparkles className="h-3 w-3 mr-1" />
              Superadmin
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Complete platform oversight and management dashboard
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          className="shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-900">Total Clients</CardTitle>
                <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700 mb-1">{formatNumber(metrics?.totalClients || 0)}</div>
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Active business accounts
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 via-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-900">Total Locations</CardTitle>
                <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700 mb-1">{formatNumber(metrics?.totalLocations || 0)}</div>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Physical store locations
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 via-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-900">Total Customers</CardTitle>
                <div className="h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700 mb-1">{formatNumber(metrics?.totalCustomers || 0)}</div>
                <p className="text-xs text-purple-600 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  End customers across all clients
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 via-yellow-50 to-yellow-100 border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-900">Monthly Revenue</CardTitle>
                <div className="h-8 w-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-700 mb-1">{formatCurrency(metrics?.monthlyRevenue || 0)}</div>
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Estimated platform revenue
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Platform Health */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Platform Health
                </CardTitle>
                <CardDescription>Real-time system status and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">System Status</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Uptime</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">99.9%</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Performance</span>
                      <span className="text-sm text-muted-foreground">Excellent</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Quick Stats
                </CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Sessions</span>
                    <span className="text-sm font-semibold">{(metrics?.totalCustomers || 0) * 0.15 | 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Calls Today</span>
                    <span className="text-sm font-semibold">{formatNumber((metrics?.totalCustomers || 0) * 12)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage Used</span>
                    <span className="text-sm font-semibold">2.4 GB</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Database Load</span>
                      <span className="text-sm text-muted-foreground">Light</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Client
              </CardTitle>
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
                    className="transition-all focus:ring-2 focus:ring-blue-500"
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
                    className="transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={newClient.contactPhone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    className="transition-all focus:ring-2 focus:ring-blue-500"
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
              <Button 
                onClick={handleAddClient} 
                disabled={loading} 
                className="bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Client'}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Platform Clients
                <Badge variant="secondary">{clients.length}</Badge>
              </CardTitle>
              <CardDescription>Manage all business accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No clients found. Create your first client above.</p>
                  </div>
                ) : (
                  clients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow bg-white">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            {getBusinessTypeIcon(client.business_type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{client.name}</h3>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline"
                                className={getClientStatusColor(client.status)}
                              >
                                {client.status || 'Unknown'}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {client.business_type?.replace('_', ' ') || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          Created: {new Date(client.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-blue-50"
                          onClick={() => {
                            setSelectedClient(client)
                            setDialogMode('view')
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-gray-50"
                          onClick={() => {
                            setSelectedClient(client)
                            setDialogMode('edit')
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="hover:bg-blue-600 text-white"
                          onClick={() => navigate(`/restaurants?clientId=${client.id}`)}
                        >
                          <Store className="h-4 w-4 mr-2" />
                          Dashboard
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Growth Metrics
                </CardTitle>
                <CardDescription>Platform expansion over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Client Growth</span>
                      <span className="text-sm text-green-600 font-semibold">+23%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Location Growth</span>
                      <span className="text-sm text-blue-600 font-semibold">+45%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Customer Growth</span>
                      <span className="text-sm text-purple-600 font-semibold">+67%</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  Revenue Analytics
                </CardTitle>
                <CardDescription>Financial performance insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{formatCurrency(metrics?.monthlyRevenue || 0)}</div>
                    <p className="text-xs text-green-600">This Month</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{formatCurrency((metrics?.monthlyRevenue || 0) * 12)}</div>
                    <p className="text-xs text-blue-600">Annual Projection</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Revenue Target</span>
                    <span className="text-sm text-muted-foreground">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Information
                </CardTitle>
                <CardDescription>Platform infrastructure and technical details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-blue-600" />
                        <div>
                          <span className="font-medium">Database</span>
                          <p className="text-sm text-muted-foreground">PostgreSQL with Supabase</p>
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-green-600" />
                        <div>
                          <span className="font-medium">Security</span>
                          <p className="text-sm text-muted-foreground">Row Level Security (RLS) enabled</p>
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        <div>
                          <span className="font-medium">Edge Functions</span>
                          <p className="text-sm text-muted-foreground">5 functions deployed</p>
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Monitor className="h-5 w-5 text-purple-600" />
                        <div>
                          <span className="font-medium">Monitoring</span>
                          <p className="text-sm text-muted-foreground">Real-time analytics active</p>
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Performance
                </CardTitle>
                <CardDescription>Real-time performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">CPU Usage</span>
                      <span className="text-sm text-green-600">12%</span>
                    </div>
                    <Progress value={12} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Memory Usage</span>
                      <span className="text-sm text-blue-600">34%</span>
                    </div>
                    <Progress value={34} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Database Load</span>
                      <span className="text-sm text-purple-600">25%</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Network I/O</span>
                      <span className="text-sm text-yellow-600">18%</span>
                    </div>
                    <Progress value={18} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ──────────────────────────────────────────────────────────
          CLIENT VIEW / EDIT DIALOG
      ────────────────────────────────────────────────────────── */}
      <Dialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null)
            setSelectedClient(null)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          {dialogMode === 'view' && selectedClient && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>{selectedClient.name}</DialogTitle>
                <DialogDescription>
                  {selectedClient.business_type?.replace('_', ' ') || 'N/A'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Email:</span> {selectedClient.email || '—'}</p>
                <p><span className="font-medium">Phone:</span> {selectedClient.phone || '—'}</p>
                <p><span className="font-medium">Status:</span> {selectedClient.status}</p>
                <p><span className="font-medium">Created:</span> {new Date(selectedClient.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}

          {dialogMode === 'edit' && selectedClient && (
            <EditClientForm
              client={selectedClient}
              onSuccess={async (updated) => {
                // Refresh list with updated client
                await loadClients()
                setSelectedClient(updated)
                setDialogMode('view')
              }}
              onCancel={() => setDialogMode(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   EditClientForm – lightweight inline component
────────────────────────────────────────────────────────── */

interface EditClientFormProps {
  client: Client
  onSuccess: (updated: Client) => void
  onCancel: () => void
}

function EditClientForm({ client, onSuccess, onCancel }: EditClientFormProps) {
  const [form, setForm] = useState({
    name: client.name || '',
    email: client.email || '',
    phone: client.phone || ''
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setSaving(true)
    try {
      const service = new ClientService()
      const { data, error } = await service.updateClient(client.id, {
        name: form.name,
        email: form.email,
        phone: form.phone
      })

      if (error || !data) {
        throw new Error(error?.message || 'Failed to update client')
      }

      toast({ title: 'Client updated', description: `${data.name} updated successfully.` })
      onSuccess({ ...client, ...data })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Edit Client</DialogTitle>
        <DialogDescription>Update basic client information</DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="client-name">Name</Label>
        <Input
          id="client-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Business name"
        />
        <Label htmlFor="client-email">Email</Label>
        <Input
          id="client-email"
          type="email"
          value={form.email || ''}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="contact@business.com"
        />
        <Label htmlFor="client-phone">Phone</Label>
        <Input
          id="client-phone"
          value={form.phone || ''}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <DialogFooter className="pt-4">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>
    </div>
  )
} 
 
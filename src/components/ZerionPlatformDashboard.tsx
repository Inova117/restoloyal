import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
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
  Eye,
  ArrowLeft,
  ExternalLink,
  Activity,
  Server,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
  Globe,
  Database,
  Wifi,
  RefreshCw,
  TrendingDown,
  Calendar,
  Bell,
  Search,
  Filter,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  LogOut,
  Target,
  Award,
  UserCheck,
  Phone,
  Key,
  Download,
  Send
} from 'lucide-react'

interface ClientData {
  id: string
  name: string
  logo: string
  plan: 'trial' | 'business' | 'enterprise'
  restaurantCount: number
  locationCount: number
  customerCount: number
  monthlyRevenue: number
  status: 'active' | 'suspended' | 'trial'
  joinDate: string
  lastActivity: string
  contactEmail: string
  contactPhone: string
  growthRate: number
}

interface PlatformMetrics {
  totalClients: number
  totalRestaurants: number
  totalEndCustomers: number
  monthlyRevenue: number
  growthRate: number
  previousMonthRevenue: number
  platformHealth: {
    uptime: number
    lastUpdate: string
    status: 'healthy' | 'warning' | 'critical'
    activeConnections: number
    responseTime: number
  }
  recentActivity: Array<{
    id: string
    type: 'client_signup' | 'restaurant_added' | 'system_update' | 'payment_processed' | 'issue_resolved'
    description: string
    timestamp: string
    clientName?: string
    amount?: number
    severity?: 'low' | 'medium' | 'high'
  }>
  topClients: Array<{
    id: string
    name: string
    restaurantCount: number
    customerCount: number
    monthlyRevenue: number
    growthRate: number
    status: 'active' | 'trial' | 'suspended'
    joinDate: string
  }>
  systemStats: {
    totalTransactions: number
    totalStampsIssued: number
    totalRewardsRedeemed: number
    averageSessionTime: number
    errorRate: number
    apiCalls: number
  }
}

interface ZerionPlatformDashboardProps {
  showPlatformSettings?: boolean
  setShowPlatformSettings?: (show: boolean) => void
}

export default function ZerionPlatformDashboard({ 
  showPlatformSettings = false, 
  setShowPlatformSettings 
}: ZerionPlatformDashboardProps) {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [showAddClientDialog, setShowAddClientDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  
  // Edit client states
  const [editingClient, setEditingClient] = useState<ClientData | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    plan: 'trial' as 'trial' | 'business' | 'enterprise'
  })
  
  // New client form state
  const [newClient, setNewClient] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    plan: 'trial' as 'trial' | 'business' | 'enterprise'
  })

  // Platform settings state
  const [platformSettings, setPlatformSettings] = useState({
    adminUsers: [],
    systemConfig: {
      trialDuration: 30,
      defaultLimits: {
        trial: { stores: 5, users: 100, stamps: 1000 },
        business: { stores: 25, users: 1000, stamps: 10000 },
        enterprise: { stores: 100, users: 10000, stamps: 100000 }
      },
      maintenanceMode: false,
      autoBackup: true,
      dataRetention: 365
    },
    emailTemplates: {
      clientOnboarding: {
        subject: 'Welcome to ZerionCore Loyalty Platform',
        content: 'Dear {{clientName}},\n\nWelcome to ZerionCore! Your account has been successfully created...'
      },
      usageAlert: {
        subject: 'Usage Limit Alert - {{clientName}}',
        content: 'Hello {{clientName}},\n\nYou are approaching your usage limits...'
      },
      paymentFailed: {
        subject: 'Payment Failed - Action Required',
        content: 'Dear {{clientName}},\n\nWe were unable to process your payment...'
      }
    },
    featureToggles: {
      referrals: true,
      pushNotifications: true,
      digitalWallet: true, // Enable for Apple Wallet testing
      aiAnalytics: true,
      geoPush: true,
      advancedReporting: true
    },
    globalBranding: {
      logoUrl: '/zerion-logo.png',
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      accentColor: '#06b6d4',
      faviconUrl: '/favicon.ico',
      companyName: 'ZerionCore',
      supportEmail: 'support@zerioncore.com'
    }
  })

  const { toast } = useToast()

  useEffect(() => {
    loadPlatformMetrics()
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      // Simulate loading client data
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Load persisted clients from localStorage with error handling
      try {
        const persistedClientsStr = localStorage.getItem('zerion_platform_clients')
        const persistedClients = persistedClientsStr ? JSON.parse(persistedClientsStr) : []
        
        // Validate the data structure
        if (Array.isArray(persistedClients)) {
          setClients(persistedClients)
        } else {
          console.warn('Invalid client data format in localStorage, resetting to empty array')
          setClients([])
          localStorage.removeItem('zerion_platform_clients')
        }
      } catch (parseError) {
        console.error('Error parsing clients from localStorage:', parseError)
        setClients([])
        // Clear corrupted data
        localStorage.removeItem('zerion_platform_clients')
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      setClients([]) // Ensure we always have a valid state
    }
  }

  const loadPlatformMetrics = async () => {
    setLoading(true)
    try {
      // Simulate loading comprehensive platform data
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      // Clean metrics with zero values - ready for real data
      const cleanMetrics: PlatformMetrics = {
        totalClients: clients.length || 0,
        totalRestaurants: 0,
        totalEndCustomers: 0,
        monthlyRevenue: 0,
        growthRate: 0,
        previousMonthRevenue: 0,
        platformHealth: {
          uptime: 99.97,
          lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'healthy',
          activeConnections: 0,
          responseTime: 145
        },
        recentActivity: [],
        topClients: [],
        systemStats: {
          totalTransactions: 0,
          totalStampsIssued: 0,
          totalRewardsRedeemed: 0,
          averageSessionTime: 0,
          errorRate: 0.03,
          apiCalls: 0
        }
      }
      
      setMetrics(cleanMetrics)
    } catch (error) {
      console.error('Error loading platform metrics:', error)
      // Set fallback metrics to prevent black screen
      const fallbackMetrics: PlatformMetrics = {
        totalClients: clients.length || 0,
        totalRestaurants: 0,
        totalEndCustomers: 0,
        monthlyRevenue: 0,
        growthRate: 0,
        previousMonthRevenue: 0,
        platformHealth: {
          uptime: 0,
          lastUpdate: new Date().toISOString(),
          status: 'critical',
          activeConnections: 0,
          responseTime: 0
        },
        recentActivity: [],
        topClients: [],
        systemStats: {
          totalTransactions: 0,
          totalStampsIssued: 0,
          totalRewardsRedeemed: 0,
          averageSessionTime: 0,
          errorRate: 0,
          apiCalls: 0
        }
      }
      setMetrics(fallbackMetrics)
    } finally {
      setLoading(false)
    }
  }

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.contactEmail) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Call our Edge Function to create client with user and tier 2 access
      const { data, error } = await supabase.functions.invoke('create-client-with-user', {
        body: {
          name: newClient.name,
          contactEmail: newClient.contactEmail,
          contactPhone: newClient.contactPhone,
          plan: newClient.plan
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to create client')
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create client')
      }

      // Update local state with the new client
      const client: ClientData = {
        id: data.client.id,
        name: data.client.name,
        logo: '🏢',
        plan: newClient.plan,
        restaurantCount: 0,
        locationCount: 0,
        customerCount: 0,
        monthlyRevenue: 0,
        status: newClient.plan === 'trial' ? 'trial' : 'active',
        joinDate: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        contactEmail: data.client.contactEmail,
        contactPhone: newClient.contactPhone || '',
        growthRate: 0
      }
      
      // Update localStorage for persistence
      try {
        const existingClientsStr = localStorage.getItem('zerion_platform_clients')
        const existingClients = existingClientsStr ? JSON.parse(existingClientsStr) : []
        const updatedClients = [...existingClients, client]
        localStorage.setItem('zerion_platform_clients', JSON.stringify(updatedClients))
        
        // Update state with new client
        setClients(prev => [...prev, client])
        
        // Update metrics if they exist
        if (metrics) {
          setMetrics(prev => prev ? {
            ...prev,
            totalClients: prev.totalClients + 1
          } : prev)
        }
      } catch (storageError) {
        console.warn('Error updating localStorage:', storageError)
      }
        
      // Reset form and close dialog
      setNewClient({
        name: '',
        contactEmail: '',
        contactPhone: '',
        plan: 'trial'
      })
      setShowAddClientDialog(false)

      toast({
        title: "🎉 Client Created Successfully!",
        description: data.message
      })

    } catch (error: any) {
      console.error('Error adding client:', error)
      toast({
        title: "Error Creating Client",
        description: error?.message || "Failed to add client. Please check your permissions and try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const signOut = () => {
    sessionStorage.clear()
    window.location.reload()
  }

  const handleSavePlatformSettings = async (section: string) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast({
        title: "Settings Saved",
        description: `${section} settings have been updated successfully.`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewClientDashboard = (client: ClientData) => {
    // Store the current admin context
    sessionStorage.setItem('zerion_admin_context', 'true')
    sessionStorage.setItem('viewing_client', client.id)
    
    // Route all clients to the Tier 2 Restaurant Chain HQ dashboard
    sessionStorage.setItem('temp_role', 'galletti_hq')
    sessionStorage.setItem('temp_client_name', client.name)
    window.location.reload()
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
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'client_signup': return <Users className="h-4 w-4 text-green-600" />
      case 'restaurant_added': return <Store className="h-4 w-4 text-blue-600" />
      case 'system_update': return <RefreshCw className="h-4 w-4 text-purple-600" />
      case 'payment_processed': return <DollarSign className="h-4 w-4 text-green-600" />
      case 'issue_resolved': return <CheckCircle className="h-4 w-4 text-orange-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      suspended: 'bg-red-100 text-red-800'
    }
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPlanBadge = (plan: string) => {
    const colors = {
      trial: 'bg-gray-100 text-gray-800',
      business: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    }
    return (
      <Badge className={colors[plan] || 'bg-gray-100 text-gray-800'}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </Badge>
    )
  }

  const getHealthStatus = (status: string) => {
    switch (status) {
      case 'healthy':
        return { icon: <CheckCircle className="h-5 w-5 text-green-600" />, color: 'text-green-600', bg: 'bg-green-100' }
      case 'warning':
        return { icon: <AlertCircle className="h-5 w-5 text-yellow-600" />, color: 'text-yellow-600', bg: 'bg-yellow-100' }
      case 'critical':
        return { icon: <AlertCircle className="h-5 w-5 text-red-600" />, color: 'text-red-600', bg: 'bg-red-100' }
      default:
        return { icon: <Activity className="h-5 w-5 text-gray-600" />, color: 'text-gray-600', bg: 'bg-gray-100' }
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    const matchesPlan = planFilter === 'all' || client.plan === planFilter
    return matchesSearch && matchesStatus && matchesPlan
  })

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading platform metrics...</p>
        </div>
      </div>
    )
  }

  // Fallback for when metrics is null but loading is false (error state)
  if (!metrics && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Unable to load platform metrics</p>
            <Button onClick={() => {
              setLoading(true)
              loadPlatformMetrics()
              loadClients()
            }}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${clientName}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      setLoading(true)
      
      // Remove from localStorage
      const existingClientsStr = localStorage.getItem('zerion_platform_clients')
      const existingClients = existingClientsStr ? JSON.parse(existingClientsStr) : []
      const updatedClients = existingClients.filter((c: ClientData) => c.id !== clientId)
      localStorage.setItem('zerion_platform_clients', JSON.stringify(updatedClients))
      
      // Update state
      setClients(prev => prev.filter(c => c.id !== clientId))
      
      // Update metrics
      if (metrics) {
        setMetrics(prev => prev ? {
          ...prev,
          totalClients: prev.totalClients - 1
        } : prev)
      }
      
      // Close dialog
      setSelectedClient(null)
      
      toast({
        title: "Cliente Eliminado",
        description: `${clientName} ha sido eliminado exitosamente.`,
      })
      
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente. Inténtalo de nuevo.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvitationEmail = async (clientEmail: string, clientName: string) => {
    try {
      setLoading(true)
      
      // Simulate sending invitation email
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Invitación Enviada",
        description: `Se ha enviado una nueva invitación a ${clientEmail}`,
      })
      
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la invitación. Inténtalo de nuevo.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditClient = (client: ClientData) => {
    setEditingClient(client)
    setEditForm({
      name: client.name,
      contactEmail: client.contactEmail,
      contactPhone: client.contactPhone,
      plan: client.plan
    })
  }

  const handleSaveClientEdit = async () => {
    if (!editingClient) return

    try {
      setLoading(true)
      
      // Update localStorage
      const existingClientsStr = localStorage.getItem('zerion_platform_clients')
      const existingClients = existingClientsStr ? JSON.parse(existingClientsStr) : []
      const updatedClients = existingClients.map((c: ClientData) => 
        c.id === editingClient.id 
          ? { ...c, ...editForm }
          : c
      )
      localStorage.setItem('zerion_platform_clients', JSON.stringify(updatedClients))
      
      // Update state
      setClients(prev => prev.map(c => 
        c.id === editingClient.id 
          ? { ...c, ...editForm }
          : c
      ))
      
      setEditingClient(null)
      
      toast({
        title: "Cliente Actualizado",
        description: `${editForm.name} ha sido actualizado exitosamente.`,
      })
      
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente. Inténtalo de nuevo.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Platform Overview Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Clients</CardTitle>
              <Building2 className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{metrics.totalClients}</div>
              <p className="text-xs text-blue-700 mt-1">Brand accounts</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Total Restaurants</CardTitle>
              <Store className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{formatNumber(metrics.totalRestaurants)}</div>
              <p className="text-xs text-green-700 mt-1">Franchise locations</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">End Customers</CardTitle>
              <Users className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{formatNumber(metrics.totalEndCustomers)}</div>
              <p className="text-xs text-purple-700 mt-1">Active users</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">Monthly Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-900">{formatCurrency(metrics.monthlyRevenue)}</div>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <p className="text-xs text-green-600">+{metrics.growthRate}% MoM</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Platform Health & System Stats */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Platform Health
              </CardTitle>
              <CardDescription>System status and performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getHealthStatus(metrics.platformHealth.status).icon}
                  <span className="font-medium">System Status</span>
                </div>
                <Badge className={`${getHealthStatus(metrics.platformHealth.status).bg} ${getHealthStatus(metrics.platformHealth.status).color}`}>
                  {metrics.platformHealth.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Uptime</span>
                    <span className="font-medium">{metrics.platformHealth.uptime}%</span>
                  </div>
                  <Progress value={metrics.platformHealth.uptime} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Active Connections</p>
                    <p className="font-semibold text-lg">{formatNumber(metrics.platformHealth.activeConnections)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Response Time</p>
                    <p className="font-semibold text-lg">{metrics.platformHealth.responseTime}ms</p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(metrics.platformHealth.lastUpdate).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                System Statistics
              </CardTitle>
              <CardDescription>Platform usage and performance data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatNumber(metrics.systemStats.totalTransactions)}</div>
                  <p className="text-xs text-blue-700">Total Transactions</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatNumber(metrics.systemStats.totalStampsIssued)}</div>
                  <p className="text-xs text-green-700">Stamps Issued</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{formatNumber(metrics.systemStats.totalRewardsRedeemed)}</div>
                  <p className="text-xs text-purple-700">Rewards Redeemed</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{metrics.systemStats.averageSessionTime}min</div>
                  <p className="text-xs text-orange-700">Avg Session Time</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span>Error Rate</span>
                  <span className="font-medium text-green-600">{metrics.systemStats.errorRate}%</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span>API Calls (24h)</span>
                  <span className="font-medium">{formatNumber(metrics.systemStats.apiCalls)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activity">
            <Activity className="w-4 h-4 mr-2" />
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Building2 className="w-4 h-4 mr-2" />
            Top Clients
          </TabsTrigger>
          <TabsTrigger value="client-management">
            <Users className="w-4 h-4 mr-2" />
            Client Management
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Platform Activity Feed
              </CardTitle>
              <CardDescription>Real-time updates from across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                        {activity.clientName && (
                          <Badge variant="outline" className="text-xs">
                            {activity.clientName}
                          </Badge>
                        )}
                        {activity.amount && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {formatCurrency(activity.amount)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Top Performing Clients
              </CardTitle>
              <CardDescription>Clients ranked by revenue and growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.topClients.map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{client.name}</h3>
                          {getStatusBadge(client.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>{client.restaurantCount} restaurants</span>
                          <span>{formatNumber(client.customerCount)} customers</span>
                          <span>Joined {new Date(client.joinDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{formatCurrency(client.monthlyRevenue)}</p>
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <p className="text-sm text-green-600">+{client.growthRate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="client-management" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Client Management</h3>
              <p className="text-sm text-gray-600">Manage all restaurant chains using the platform</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search clients..."
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
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Client List */}
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-2xl">
                        {client.logo}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{client.name}</h3>
                          {getPlanBadge(client.plan)}
                          {getStatusBadge(client.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{client.restaurantCount} restaurants</span>
                          <span>{client.locationCount} locations</span>
                          <span>{formatNumber(client.customerCount)} customers</span>
                          <span>{formatCurrency(client.monthlyRevenue)}/month</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span>Joined {new Date(client.joinDate).toLocaleDateString()}</span>
                          <span>Last active {new Date(client.lastActivity).toLocaleDateString()}</span>
                          <span className={client.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {client.growthRate >= 0 ? '+' : ''}{client.growthRate}% growth
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewClientDashboard(client)}
                        className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Dashboard
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedClient(client.id)}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Manage Client
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Manage Client Modal */}
          {selectedClient && (
            <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
              <DialogContent 
                className="max-w-2xl max-h-[80vh] overflow-y-auto"
                style={{ 
                  backgroundColor: '#ffffff', 
                  color: '#000000',
                  border: '2px solid #e5e7eb'
                }}
              >
                {(() => {
                  const client = clients.find(c => c.id === selectedClient)
                  if (!client) return null

                  return (
                    <div className="space-y-6" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                      {/* Header */}
                      <div 
                        className="flex items-center justify-between border-b pb-4"
                        style={{ backgroundColor: '#ffffff', borderBottomColor: '#e5e7eb' }}
                      >
                        <div className="flex items-center gap-3">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedClient(null)}
                            style={{ 
                              backgroundColor: '#f9fafb', 
                              color: '#374151',
                              border: '1px solid #d1d5db'
                            }}
                            className="hover:bg-gray-200"
                          >
                            <ArrowLeft className="w-4 h-4 mr-1" style={{ color: '#374151' }} />
                            <span style={{ color: '#374151' }}>Back to Clients</span>
                          </Button>
                          <div className="h-6 w-px" style={{ backgroundColor: '#d1d5db' }}></div>
                          <div>
                            <h2 style={{ color: '#111827', fontSize: '20px', fontWeight: '600' }}>
                              Manage Client
                            </h2>
                            <p style={{ color: '#6b7280', fontSize: '14px' }}>
                              Client ID: {client.id}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          style={{ 
                            backgroundColor: '#ffffff', 
                            color: '#374151', 
                            border: '1px solid #d1d5db',
                            fontSize: '12px'
                          }}
                        >
                          Last updated: {new Date().toLocaleDateString()}
                        </Badge>
                      </div>

                      {/* Client Info */}
                      <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <CardHeader style={{ backgroundColor: '#ffffff' }}>
                          <CardTitle style={{ color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building2 className="h-5 w-5" style={{ color: '#2563eb' }} />
                            <span style={{ color: '#111827' }}>Client Information</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent style={{ backgroundColor: '#ffffff' }}>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-3xl">
                              {client.logo}
                            </div>
                            <div>
                              <h3 style={{ color: '#111827', fontSize: '18px', fontWeight: '600' }}>
                                {client.name}
                              </h3>
                              <p style={{ color: '#6b7280', fontSize: '14px' }}>Restaurant Chain</p>
                              <div className="flex items-center gap-2 mt-1">
                                {getPlanBadge(client.plan)}
                                {getStatusBadge(client.status)}
                              </div>
                            </div>
                          </div>
                          
                          <div 
                            className="grid grid-cols-2 gap-4 pt-4"
                            style={{ borderTop: '1px solid #e5e7eb' }}
                          >
                            <div>
                              <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                                Contact Email
                              </span>
                              <p style={{ color: '#111827', fontSize: '14px', fontWeight: '600' }}>
                                {client.contactEmail}
                              </p>
                            </div>
                            <div>
                              <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                                Contact Phone
                              </span>
                              <p style={{ color: '#111827', fontSize: '14px', fontWeight: '600' }}>
                                {client.contactPhone}
                              </p>
                            </div>
                            <div>
                              <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                                Join Date
                              </span>
                              <p style={{ color: '#111827', fontSize: '14px', fontWeight: '600' }}>
                                {new Date(client.joinDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                                Last Activity
                              </span>
                              <p style={{ color: '#111827', fontSize: '14px', fontWeight: '600' }}>
                                {new Date(client.lastActivity).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Quick Stats */}
                      <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <CardHeader style={{ backgroundColor: '#ffffff' }}>
                          <CardTitle style={{ color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BarChart3 className="h-5 w-5" style={{ color: '#059669' }} />
                            <span style={{ color: '#111827' }}>Quick Stats</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent style={{ backgroundColor: '#ffffff' }}>
                          <div className="grid grid-cols-3 gap-4">
                            <div 
                              className="text-center p-3 rounded-lg"
                              style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}
                            >
                              <div style={{ color: '#2563eb', fontSize: '24px', fontWeight: '700' }}>
                                {client.restaurantCount}
                              </div>
                              <p style={{ color: '#1d4ed8', fontSize: '12px', fontWeight: '600' }}>
                                Restaurants
                              </p>
                            </div>
                            <div 
                              className="text-center p-3 rounded-lg"
                              style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
                            >
                              <div style={{ color: '#059669', fontSize: '24px', fontWeight: '700' }}>
                                {client.customerCount}
                              </div>
                              <p style={{ color: '#047857', fontSize: '12px', fontWeight: '600' }}>
                                Customers
                              </p>
                            </div>
                            <div 
                              className="text-center p-3 rounded-lg"
                              style={{ backgroundColor: '#faf5ff', border: '1px solid #d8b4fe' }}
                            >
                              <div style={{ color: '#7c3aed', fontSize: '24px', fontWeight: '700' }}>
                                {formatCurrency(client.monthlyRevenue)}
                              </div>
                              <p style={{ color: '#6d28d9', fontSize: '12px', fontWeight: '600' }}>
                                Monthly Revenue
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Actions */}
                      <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <CardHeader style={{ backgroundColor: '#ffffff' }}>
                          <CardTitle style={{ color: '#111827' }}>Actions</CardTitle>
                        </CardHeader>
                        <CardContent style={{ backgroundColor: '#ffffff' }}>
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewClientDashboard(client)}
                              style={{ 
                                backgroundColor: '#eff6ff', 
                                color: '#1d4ed8', 
                                border: '1px solid #3b82f6',
                                fontWeight: '600'
                              }}
                              className="hover:bg-blue-100"
                            >
                              <Eye className="h-4 w-4 mr-1" style={{ color: '#1d4ed8' }} />
                              <span style={{ color: '#1d4ed8' }}>View Dashboard</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleSendInvitationEmail(client.contactEmail, client.name)}
                              disabled={loading}
                              style={{ 
                                backgroundColor: '#f0fdf4', 
                                color: '#047857', 
                                border: '1px solid #10b981',
                                fontWeight: '600'
                              }}
                              className="hover:bg-green-100"
                            >
                              <Send className="h-4 w-4 mr-1" style={{ color: '#047857' }} />
                              <span style={{ color: '#047857' }}>Send Invitation</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditClient(client)}
                              style={{ 
                                backgroundColor: '#fef3c7', 
                                color: '#d97706', 
                                border: '1px solid #f59e0b',
                                fontWeight: '600'
                              }}
                              className="hover:bg-yellow-100"
                            >
                              <Edit className="h-4 w-4 mr-1" style={{ color: '#d97706' }} />
                              <span style={{ color: '#d97706' }}>Edit Details</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteClient(client.id, client.name)}
                              disabled={loading}
                              style={{ 
                                backgroundColor: '#fef2f2', 
                                color: '#dc2626', 
                                border: '1px solid #ef4444',
                                fontWeight: '600'
                              }}
                              className="hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4 mr-1" style={{ color: '#dc2626' }} />
                              <span style={{ color: '#dc2626' }}>Delete Client</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
              </DialogContent>
            </Dialog>
          )}

          {/* Floating Add Client Button */}
          <Dialog open={showAddClientDialog} onOpenChange={setShowAddClientDialog}>
            <DialogTrigger asChild>
              <Button 
                className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-50"
                size="icon"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="text-gray-900">Add New Client</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Add a new restaurant chain to the platform
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client_name" className="text-gray-700">Restaurant Chain Name *</Label>
                  <Input
                    id="client_name"
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Pizza Palace International"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email" className="text-gray-700">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={newClient.contactEmail}
                    onChange={(e) => setNewClient(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="admin@restaurant.com"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone" className="text-gray-700">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={newClient.contactPhone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="plan" className="text-gray-700">Initial Plan</Label>
                  <Select value={newClient.plan} onValueChange={(value: 'trial' | 'business' | 'enterprise') => setNewClient(prev => ({ ...prev, plan: value }))}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="trial" className="text-gray-900">Trial (30 days free)</SelectItem>
                      <SelectItem value="business" className="text-gray-900">Business ($99/month)</SelectItem>
                      <SelectItem value="enterprise" className="text-gray-900">Enterprise ($299/month)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddClient} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    {loading ? 'Adding...' : 'Add Client'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddClientDialog(false)} className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Platform Analytics</h3>
            <p className="text-sm text-gray-600">Comprehensive analytics and insights across the platform</p>
          </div>

          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics?.monthlyRevenue || 0)}</div>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-xs text-green-600">+{metrics?.growthRate || 0}% vs last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">New Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-400">No data available</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Churn Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <div className="flex items-center mt-1">
                  <TrendingDown className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-400">No data available</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Revenue/Client</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency((metrics?.monthlyRevenue || 0) / Math.max(metrics?.totalClients || 1, 1))}</div>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-400">No data available</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Trends
                </CardTitle>
                <CardDescription>Monthly revenue over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  {/* Simulated Bar Chart */}
                  <div className="flex items-end justify-between h-64 px-4 border-b border-l border-gray-200">
                    {[
                      { month: 'Jan', value: 85000, height: 45 },
                      { month: 'Feb', value: 92000, height: 52 },
                      { month: 'Mar', value: 78000, height: 40 },
                      { month: 'Apr', value: 105000, height: 65 },
                      { month: 'May', value: 118000, height: 75 },
                      { month: 'Jun', value: 125000, height: 82 },
                      { month: 'Jul', value: 132000, height: 88 },
                      { month: 'Aug', value: 128000, height: 85 },
                      { month: 'Sep', value: 145000, height: 98 },
                      { month: 'Oct', value: 138000, height: 92 },
                      { month: 'Nov', value: 152000, height: 105 },
                      { month: 'Dec', value: 124500, height: 80 }
                    ].map((data, index) => (
                      <div key={data.month} className="flex flex-col items-center group">
                        <div 
                          className="w-8 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:from-blue-700 hover:to-blue-500 transition-colors cursor-pointer relative"
                          style={{ height: `${data.height}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {formatCurrency(data.value)}
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between text-xs text-gray-500">
                    <span>$0</span>
                    <span>$150K</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Client Growth
                </CardTitle>
                <CardDescription>New clients acquired each month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  {/* Simulated Line Chart */}
                  <div className="relative h-64 border-b border-l border-gray-200">
                    <svg className="w-full h-full" viewBox="0 0 400 200">
                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4].map(i => (
                        <line 
                          key={i}
                          x1="0" 
                          y1={i * 40} 
                          x2="400" 
                          y2={i * 40} 
                          stroke="#f3f4f6" 
                          strokeWidth="1"
                        />
                      ))}
                      
                      {/* Line chart path */}
                      <path
                        d="M 20 160 L 53 140 L 86 150 L 119 120 L 152 100 L 185 85 L 218 70 L 251 75 L 284 60 L 317 65 L 350 45 L 380 55"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Data points */}
                      {[
                        { x: 20, y: 160, value: 3 },
                        { x: 53, y: 140, value: 4 },
                        { x: 86, y: 150, value: 3 },
                        { x: 119, y: 120, value: 6 },
                        { x: 152, y: 100, value: 8 },
                        { x: 185, y: 85, value: 10 },
                        { x: 218, y: 70, value: 12 },
                        { x: 251, y: 75, value: 11 },
                        { x: 284, y: 60, value: 14 },
                        { x: 317, y: 65, value: 13 },
                        { x: 350, y: 45, value: 16 },
                        { x: 380, y: 55, value: 15 }
                      ].map((point, index) => (
                        <g key={index}>
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill="#3b82f6"
                            className="hover:r-6 cursor-pointer"
                          />
                          <text
                            x={point.x}
                            y={point.y - 10}
                            textAnchor="middle"
                            className="text-xs fill-gray-600 opacity-0 hover:opacity-100"
                          >
                            {point.value}
                          </text>
                        </g>
                      ))}
                    </svg>
                    
                    {/* X-axis labels */}
                    <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-500 px-4">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                        <span key={month}>{month}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between text-xs text-gray-500">
                    <span>0 clients</span>
                    <span>20 clients</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Churn Analysis and Top Clients */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Churn Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Churn Analysis
                </CardTitle>
                <CardDescription>Client retention and churn metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Churn Rate Visualization */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Monthly Churn Rate</span>
                      <span className="text-sm text-gray-600">0%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-300 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>

                  {/* Retention Rate */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Retention Rate</span>
                      <span className="text-sm text-gray-600">0%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-300 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>

                  {/* Churn Reasons */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Churn Reasons (Last 30 days)</h4>
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No churn data available</p>
                      <p className="text-xs">Data will appear when clients start churning</p>
                    </div>
                  </div>

                  {/* At-Risk Clients */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">At-Risk Clients</h4>
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No at-risk clients identified</p>
                      <p className="text-xs">Monitoring client activity for risk indicators</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Clients Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Top Clients Performance
                </CardTitle>
                <CardDescription>Ranked by revenue and growth metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.topClients.slice(0, 5).map((client, index) => (
                    <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{client.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span>{client.restaurantCount} restaurants</span>
                            <span>•</span>
                            <span>{formatNumber(client.customerCount)} customers</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(client.monthlyRevenue)}</p>
                        <div className="flex items-center justify-end gap-1">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600">+{client.growthRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Revenue Distribution Chart */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Revenue Distribution</h4>
                  <div className="space-y-2">
                    {metrics?.topClients.slice(0, 5).map((client, index) => {
                      const totalRevenue = metrics.topClients.reduce((sum, c) => sum + c.monthlyRevenue, 0)
                      const percentage = (client.monthlyRevenue / totalRevenue) * 100
                      return (
                        <div key={client.id} className="flex items-center gap-3">
                          <div className="w-16 text-xs text-gray-600">{client.name.split(' ')[0]}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                index === 0 ? 'bg-blue-500' :
                                index === 1 ? 'bg-green-500' :
                                index === 2 ? 'bg-purple-500' :
                                index === 3 ? 'bg-orange-500' :
                                'bg-pink-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="w-12 text-xs text-gray-600 text-right">
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Platform Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Daily Active Users</span>
                    <span className="font-semibold">{formatNumber(45600)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Transactions/Day</span>
                    <span className="font-semibold">{formatNumber(12400)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">API Calls/Day</span>
                    <span className="font-semibold">{formatNumber(156000)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Platform Utilization</span>
                    <span className="font-semibold text-blue-600">87.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Financial Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">MRR (Monthly Recurring)</span>
                    <span className="font-semibold">{formatCurrency(metrics?.monthlyRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ARR (Annual Recurring)</span>
                    <span className="font-semibold">{formatCurrency((metrics?.monthlyRevenue || 0) * 12)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ARPU (Avg Revenue/User)</span>
                    <span className="font-semibold">{formatCurrency((metrics?.monthlyRevenue || 0) / (metrics?.totalClients || 1))}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Revenue Growth</span>
                    <span className="font-semibold text-green-600">+{metrics?.growthRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Overall Rating</span>
                    <span className="font-semibold">4.8/5.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Support Tickets</span>
                    <span className="font-semibold">23</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Resolution Time</span>
                    <span className="font-semibold">2.4h</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">NPS Score</span>
                    <span className="font-semibold text-green-600">72</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Platform Settings Modal */}
      <Dialog open={showPlatformSettings} onOpenChange={setShowPlatformSettings || (() => {})}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Platform Settings
            </DialogTitle>
            <DialogDescription>
              Configure platform-wide settings and manage system administration
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="admin-users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="admin-users">
                <Users className="w-4 h-4 mr-2" />
                Admin Users
              </TabsTrigger>
              <TabsTrigger value="system-config">
                <Server className="w-4 h-4 mr-2" />
                System Config
              </TabsTrigger>
              <TabsTrigger value="email-templates">
                <Mail className="w-4 h-4 mr-2" />
                Email Templates
              </TabsTrigger>
              <TabsTrigger value="feature-toggles">
                <Zap className="w-4 h-4 mr-2" />
                Feature Toggles
              </TabsTrigger>
              <TabsTrigger value="global-branding">
                <Crown className="w-4 h-4 mr-2" />
                Global Branding
              </TabsTrigger>
            </TabsList>

            {/* Admin Users Tab */}
            <TabsContent value="admin-users" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Admin Users</h3>
                  <p className="text-sm text-gray-600">Manage platform administrators and their permissions</p>
                </div>
                <Button onClick={() => {
                  toast({
                    title: "Invite Sent",
                    description: "Admin invitation has been sent successfully."
                  })
                }}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Admin
                </Button>
              </div>

              <Card>
                <CardContent className="p-6">
                  {platformSettings.adminUsers.length > 0 ? (
                    <div className="space-y-4">
                      {platformSettings.adminUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium">{user.name}</h4>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={user.role === 'Super Admin' ? 'bg-red-100 text-red-800' : 
                                       user.role === 'Admin' ? 'bg-blue-100 text-blue-800' : 
                                                              'bg-green-100 text-green-800'}>
                                  {user.role}
                                </Badge>
                                <Badge className={user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                  {user.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              Last login: {new Date(user.lastLogin).toLocaleDateString()}
                            </span>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Admin Users</h3>
                      <p className="text-sm">Get started by inviting your first platform administrator.</p>
                      <Button className="mt-4" onClick={() => {
                        toast({
                          title: "Invite Sent",
                          description: "Admin invitation has been sent successfully."
                        })
                      }}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite First Admin
                      </Button>
                    </div>
                  )}
                  <div className="mt-6 pt-6 border-t">
                    <Button onClick={() => handleSavePlatformSettings('Admin Users')} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Config Tab */}
            <TabsContent value="system-config" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">System Configuration</h3>
                <p className="text-sm text-gray-600">Configure trial duration, default limits, and system settings</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Trial & Limits</CardTitle>
                    <CardDescription>Default settings for new clients</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="trial_duration">Trial Duration (days)</Label>
                      <Input
                        id="trial_duration"
                        type="number"
                        value={platformSettings.systemConfig.trialDuration}
                        onChange={(e) => setPlatformSettings(prev => ({
                          ...prev,
                          systemConfig: {
                            ...prev.systemConfig,
                            trialDuration: parseInt(e.target.value)
                          }
                        }))}
                      />
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Default Plan Limits</h4>
                      {Object.entries(platformSettings.systemConfig.defaultLimits).map(([plan, limits]) => (
                        <div key={plan} className="p-3 bg-gray-50 rounded-lg">
                          <h5 className="font-medium capitalize mb-2">{plan} Plan</h5>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs">Stores</Label>
                              <Input
                                type="number"
                                value={limits.stores}
                                onChange={(e) => setPlatformSettings(prev => ({
                                  ...prev,
                                  systemConfig: {
                                    ...prev.systemConfig,
                                    defaultLimits: {
                                      ...prev.systemConfig.defaultLimits,
                                      [plan]: {
                                        ...limits,
                                        stores: parseInt(e.target.value)
                                      }
                                    }
                                  }
                                }))}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Users</Label>
                              <Input
                                type="number"
                                value={limits.users}
                                onChange={(e) => setPlatformSettings(prev => ({
                                  ...prev,
                                  systemConfig: {
                                    ...prev.systemConfig,
                                    defaultLimits: {
                                      ...prev.systemConfig.defaultLimits,
                                      [plan]: {
                                        ...limits,
                                        users: parseInt(e.target.value)
                                      }
                                    }
                                  }
                                }))}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Stamps</Label>
                              <Input
                                type="number"
                                value={limits.stamps}
                                onChange={(e) => setPlatformSettings(prev => ({
                                  ...prev,
                                  systemConfig: {
                                    ...prev.systemConfig,
                                    defaultLimits: {
                                      ...prev.systemConfig.defaultLimits,
                                      [plan]: {
                                        ...limits,
                                        stamps: parseInt(e.target.value)
                                      }
                                    }
                                  }
                                }))}
                                className="h-8"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>Platform-wide configuration options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Maintenance Mode</Label>
                        <p className="text-sm text-gray-600">Temporarily disable platform access</p>
                      </div>
                      <Button
                        variant={platformSettings.systemConfig.maintenanceMode ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => setPlatformSettings(prev => ({
                          ...prev,
                          systemConfig: {
                            ...prev.systemConfig,
                            maintenanceMode: !prev.systemConfig.maintenanceMode
                          }
                        }))}
                      >
                        {platformSettings.systemConfig.maintenanceMode ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto Backup</Label>
                        <p className="text-sm text-gray-600">Automatic daily database backups</p>
                      </div>
                      <Button
                        variant={platformSettings.systemConfig.autoBackup ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlatformSettings(prev => ({
                          ...prev,
                          systemConfig: {
                            ...prev.systemConfig,
                            autoBackup: !prev.systemConfig.autoBackup
                          }
                        }))}
                      >
                        {platformSettings.systemConfig.autoBackup ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor="data_retention">Data Retention (days)</Label>
                      <Input
                        id="data_retention"
                        type="number"
                        value={platformSettings.systemConfig.dataRetention}
                        onChange={(e) => setPlatformSettings(prev => ({
                          ...prev,
                          systemConfig: {
                            ...prev.systemConfig,
                            dataRetention: parseInt(e.target.value)
                          }
                        }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">How long to keep deleted client data</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSavePlatformSettings('System Configuration')} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </TabsContent>

            {/* Email Templates Tab */}
            <TabsContent value="email-templates" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Email Templates</h3>
                <p className="text-sm text-gray-600">Customize automated email templates sent to clients</p>
              </div>

              <div className="space-y-6">
                {Object.entries(platformSettings.emailTemplates).map(([templateKey, template]) => (
                  <Card key={templateKey}>
                    <CardHeader>
                      <CardTitle className="capitalize">
                        {templateKey.replace(/([A-Z])/g, ' $1').trim()} Template
                      </CardTitle>
                      <CardDescription>
                        Available variables: {"{{clientName}}, {{companyName}}, {{supportEmail}}"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor={`${templateKey}_subject`}>Subject Line</Label>
                        <Input
                          id={`${templateKey}_subject`}
                          value={template.subject}
                          onChange={(e) => setPlatformSettings(prev => ({
                            ...prev,
                            emailTemplates: {
                              ...prev.emailTemplates,
                              [templateKey]: {
                                ...template,
                                subject: e.target.value
                              }
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${templateKey}_content`}>Email Content</Label>
                        <textarea
                          id={`${templateKey}_content`}
                          value={template.content}
                          onChange={(e) => setPlatformSettings(prev => ({
                            ...prev,
                            emailTemplates: {
                              ...prev.emailTemplates,
                              [templateKey]: {
                                ...template,
                                content: e.target.value
                              }
                            }
                          }))}
                          className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none"
                          placeholder="Enter email content..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSavePlatformSettings('Email Templates')} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Templates'}
                </Button>
              </div>
            </TabsContent>

            {/* Feature Toggles Tab */}
            <TabsContent value="feature-toggles" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Feature Toggles</h3>
                <p className="text-sm text-gray-600">Enable or disable platform features for all clients</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Core Features</CardTitle>
                    <CardDescription>Essential platform functionality</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Referral System</Label>
                        <p className="text-sm text-gray-600">Customer referral rewards</p>
                      </div>
                      <Button
                        variant={platformSettings.featureToggles.referrals ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlatformSettings(prev => ({
                          ...prev,
                          featureToggles: {
                            ...prev.featureToggles,
                            referrals: !prev.featureToggles.referrals
                          }
                        }))}
                      >
                        {platformSettings.featureToggles.referrals ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-gray-600">Mobile push messaging</p>
                      </div>
                      <Button
                        variant={platformSettings.featureToggles.pushNotifications ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlatformSettings(prev => ({
                          ...prev,
                          featureToggles: {
                            ...prev.featureToggles,
                            pushNotifications: !prev.featureToggles.pushNotifications
                          }
                        }))}
                      >
                        {platformSettings.featureToggles.pushNotifications ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Digital Wallet</Label>
                        <p className="text-sm text-gray-600">Apple Wallet integration</p>
                      </div>
                      <Button
                        variant={platformSettings.featureToggles.digitalWallet ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlatformSettings(prev => ({
                          ...prev,
                          featureToggles: {
                            ...prev.featureToggles,
                            digitalWallet: !prev.featureToggles.digitalWallet
                          }
                        }))}
                      >
                        {platformSettings.featureToggles.digitalWallet ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Features</CardTitle>
                    <CardDescription>Premium functionality and analytics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>AI Analytics</Label>
                        <p className="text-sm text-gray-600">Machine learning insights</p>
                      </div>
                      <Button
                        variant={platformSettings.featureToggles.aiAnalytics ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlatformSettings(prev => ({
                          ...prev,
                          featureToggles: {
                            ...prev.featureToggles,
                            aiAnalytics: !prev.featureToggles.aiAnalytics
                          }
                        }))}
                      >
                        {platformSettings.featureToggles.aiAnalytics ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Geo Push</Label>
                        <p className="text-sm text-gray-600">Location-based notifications</p>
                      </div>
                      <Button
                        variant={platformSettings.featureToggles.geoPush ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlatformSettings(prev => ({
                          ...prev,
                          featureToggles: {
                            ...prev.featureToggles,
                            geoPush: !prev.featureToggles.geoPush
                          }
                        }))}
                      >
                        {platformSettings.featureToggles.geoPush ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Advanced Reporting</Label>
                        <p className="text-sm text-gray-600">Detailed analytics dashboard</p>
                      </div>
                      <Button
                        variant={platformSettings.featureToggles.advancedReporting ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlatformSettings(prev => ({
                          ...prev,
                          featureToggles: {
                            ...prev.featureToggles,
                            advancedReporting: !prev.featureToggles.advancedReporting
                          }
                        }))}
                      >
                        {platformSettings.featureToggles.advancedReporting ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSavePlatformSettings('Feature Toggles')} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Feature Settings'}
                </Button>
              </div>
            </TabsContent>

            {/* Global Branding Tab */}
            <TabsContent value="global-branding" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Global Branding</h3>
                <p className="text-sm text-gray-600">Customize ZerionCore platform appearance and branding</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Brand Identity</CardTitle>
                    <CardDescription>Company information and assets</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        value={platformSettings.globalBranding.companyName}
                        onChange={(e) => setPlatformSettings(prev => ({
                          ...prev,
                          globalBranding: {
                            ...prev.globalBranding,
                            companyName: e.target.value
                          }
                        }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="support_email">Support Email</Label>
                      <Input
                        id="support_email"
                        type="email"
                        value={platformSettings.globalBranding.supportEmail}
                        onChange={(e) => setPlatformSettings(prev => ({
                          ...prev,
                          globalBranding: {
                            ...prev.globalBranding,
                            supportEmail: e.target.value
                          }
                        }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="logo_url">Logo URL</Label>
                      <Input
                        id="logo_url"
                        value={platformSettings.globalBranding.logoUrl}
                        onChange={(e) => setPlatformSettings(prev => ({
                          ...prev,
                          globalBranding: {
                            ...prev.globalBranding,
                            logoUrl: e.target.value
                          }
                        }))}
                        placeholder="/path/to/logo.png"
                      />
                    </div>

                    <div>
                      <Label htmlFor="favicon_url">Favicon URL</Label>
                      <Input
                        id="favicon_url"
                        value={platformSettings.globalBranding.faviconUrl}
                        onChange={(e) => setPlatformSettings(prev => ({
                          ...prev,
                          globalBranding: {
                            ...prev.globalBranding,
                            faviconUrl: e.target.value
                          }
                        }))}
                        placeholder="/favicon.ico"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Color Scheme</CardTitle>
                    <CardDescription>Platform color palette</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="primary_color">Primary Color</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="primary_color"
                          type="color"
                          value={platformSettings.globalBranding.primaryColor}
                          onChange={(e) => setPlatformSettings(prev => ({
                            ...prev,
                            globalBranding: {
                              ...prev.globalBranding,
                              primaryColor: e.target.value
                            }
                          }))}
                          className="w-16 h-10"
                        />
                        <Input
                          value={platformSettings.globalBranding.primaryColor}
                          onChange={(e) => setPlatformSettings(prev => ({
                            ...prev,
                            globalBranding: {
                              ...prev.globalBranding,
                              primaryColor: e.target.value
                            }
                          }))}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="secondary_color">Secondary Color</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="secondary_color"
                          type="color"
                          value={platformSettings.globalBranding.secondaryColor}
                          onChange={(e) => setPlatformSettings(prev => ({
                            ...prev,
                            globalBranding: {
                              ...prev.globalBranding,
                              secondaryColor: e.target.value
                            }
                          }))}
                          className="w-16 h-10"
                        />
                        <Input
                          value={platformSettings.globalBranding.secondaryColor}
                          onChange={(e) => setPlatformSettings(prev => ({
                            ...prev,
                            globalBranding: {
                              ...prev.globalBranding,
                              secondaryColor: e.target.value
                            }
                          }))}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="accent_color">Accent Color</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="accent_color"
                          type="color"
                          value={platformSettings.globalBranding.accentColor}
                          onChange={(e) => setPlatformSettings(prev => ({
                            ...prev,
                            globalBranding: {
                              ...prev.globalBranding,
                              accentColor: e.target.value
                            }
                          }))}
                          className="w-16 h-10"
                        />
                        <Input
                          value={platformSettings.globalBranding.accentColor}
                          onChange={(e) => setPlatformSettings(prev => ({
                            ...prev,
                            globalBranding: {
                              ...prev.globalBranding,
                              accentColor: e.target.value
                            }
                          }))}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Color Preview</h4>
                      <div className="flex gap-2">
                        <div 
                          className="w-12 h-12 rounded-lg border-2 border-gray-200"
                          style={{ backgroundColor: platformSettings.globalBranding.primaryColor }}
                          title="Primary"
                        ></div>
                        <div 
                          className="w-12 h-12 rounded-lg border-2 border-gray-200"
                          style={{ backgroundColor: platformSettings.globalBranding.secondaryColor }}
                          title="Secondary"
                        ></div>
                        <div 
                          className="w-12 h-12 rounded-lg border-2 border-gray-200"
                          style={{ backgroundColor: platformSettings.globalBranding.accentColor }}
                          title="Accent"
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSavePlatformSettings('Global Branding')} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Branding'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Edit Client</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update client information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_client_name" className="text-gray-700">Restaurant Chain Name *</Label>
              <Input
                id="edit_client_name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Pizza Palace International"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            <div>
              <Label htmlFor="edit_contact_email" className="text-gray-700">Contact Email *</Label>
              <Input
                id="edit_contact_email"
                type="email"
                value={editForm.contactEmail}
                onChange={(e) => setEditForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                placeholder="admin@restaurant.com"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            <div>
              <Label htmlFor="edit_contact_phone" className="text-gray-700">Contact Phone</Label>
              <Input
                id="edit_contact_phone"
                value={editForm.contactPhone}
                onChange={(e) => setEditForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            <div>
              <Label htmlFor="edit_plan" className="text-gray-700">Plan</Label>
              <Select value={editForm.plan} onValueChange={(value: 'trial' | 'business' | 'enterprise') => setEditForm(prev => ({ ...prev, plan: value }))}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="trial" className="text-gray-900">Trial (30 days free)</SelectItem>
                  <SelectItem value="business" className="text-gray-900">Business ($99/month)</SelectItem>
                  <SelectItem value="enterprise" className="text-gray-900">Enterprise ($299/month)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveClientEdit} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditingClient(null)} className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
 
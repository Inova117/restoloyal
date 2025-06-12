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
  Users, 
  Gift, 
  TrendingUp, 
  Share2, 
  Copy, 
  QrCode,
  Settings,
  Award,
  Clock,
  CheckCircle,
  UserPlus,
  Download
} from 'lucide-react'

interface ReferralProgram {
  id?: string
  is_active: boolean
  referrer_reward_type: 'stamps' | 'discount' | 'free_item'
  referrer_reward_value: number
  referee_reward_type: 'stamps' | 'discount' | 'free_item'
  referee_reward_value: number
  min_referee_visits: number
  min_referee_stamps: number
  max_referrals_per_customer: number
  referral_code_prefix: string
  program_name: string
  program_description?: string
  terms_and_conditions?: string
}

interface ReferralStats {
  total_referrals: number
  pending_referrals: number
  qualified_referrals: number
  rewarded_referrals: number
  total_rewards_issued: number
  top_referrers: Array<{
    client_name: string
    referral_count: number
    rewards_earned: number
  }>
  recent_referrals: Array<{
    referrer_name: string
    referee_name: string
    status: string
    created_at: string
    qualified_at?: string
  }>
}

interface Referral {
  id: string
  status: string
  referral_source: string
  referee_visits: number
  referee_stamps: number
  created_at: string
  qualified_at?: string
  rewarded_at?: string
  referrer: { id: string; name: string; email: string }
  referee: { id: string; name: string; email: string }
  referral_code: { referral_code: string }
}

export default function ReferralDashboard() {
  const [program, setProgram] = useState<ReferralProgram>({
    is_active: false,
    referrer_reward_type: 'stamps',
    referrer_reward_value: 5,
    referee_reward_type: 'stamps',
    referee_reward_value: 3,
    min_referee_visits: 1,
    min_referee_stamps: 3,
    max_referrals_per_customer: 10,
    referral_code_prefix: 'REF',
    program_name: 'Refer a Friend',
    program_description: 'Invite friends and earn rewards when they visit!',
    terms_and_conditions: 'Referral rewards are issued after the referred customer meets qualification requirements.'
  })
  
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [referralCode, setReferralCode] = useState<string>('')
  const [newReferralCode, setNewReferralCode] = useState<string>('')
  const [newRefereeId, setNewRefereeId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
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
      loadProgram()
      loadStats()
      loadReferrals()
      loadClients()
    }
  }, [restaurantId])

  const loadProgram = async () => {
    try {
      // Use default program settings since referral tables don't exist yet
      toast({
        title: "Referral System",
        description: "Using default referral program settings. This is a demo version.",
        variant: "default"
      })
    } catch (error) {
      console.error('Error loading program:', error)
      toast({
        title: "Info",
        description: "Using default referral program settings. This is a demo version.",
        variant: "default"
      })
    }
  }

  const loadStats = async () => {
    try {
      // Generate simulated stats since referral tables may not exist
      const simulatedStats: ReferralStats = {
        total_referrals: 12,
        pending_referrals: 3,
        qualified_referrals: 7,
        rewarded_referrals: 2,
        total_rewards_issued: 9,
        top_referrers: [
          { client_name: 'John Smith', referral_count: 4, rewards_earned: 3 },
          { client_name: 'Sarah Johnson', referral_count: 3, rewards_earned: 2 },
          { client_name: 'Mike Davis', referral_count: 2, rewards_earned: 1 }
        ],
        recent_referrals: [
          { 
            referrer_name: 'John Smith', 
            referee_name: 'Alice Brown', 
            status: 'qualified', 
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            qualified_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          { 
            referrer_name: 'Sarah Johnson', 
            referee_name: 'Bob Wilson', 
            status: 'pending', 
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          { 
            referrer_name: 'Mike Davis', 
            referee_name: 'Carol White', 
            status: 'rewarded', 
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            qualified_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      }

      setStats(simulatedStats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadReferrals = async () => {
    try {
      // Generate simulated referrals since referral tables may not exist
      const simulatedReferrals: Referral[] = [
        {
          id: '1',
          status: 'qualified',
          referral_source: 'app',
          referee_visits: 3,
          referee_stamps: 5,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          qualified_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          referrer: { id: '1', name: 'John Smith', email: 'john@example.com' },
          referee: { id: '2', name: 'Alice Brown', email: 'alice@example.com' },
          referral_code: { referral_code: 'REF001' }
        },
        {
          id: '2',
          status: 'pending',
          referral_source: 'manual',
          referee_visits: 1,
          referee_stamps: 1,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          referrer: { id: '3', name: 'Sarah Johnson', email: 'sarah@example.com' },
          referee: { id: '4', name: 'Bob Wilson', email: 'bob@example.com' },
          referral_code: { referral_code: 'REF002' }
        },
        {
          id: '3',
          status: 'rewarded',
          referral_source: 'qr_code',
          referee_visits: 5,
          referee_stamps: 8,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          qualified_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          rewarded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          referrer: { id: '5', name: 'Mike Davis', email: 'mike@example.com' },
          referee: { id: '6', name: 'Carol White', email: 'carol@example.com' },
          referral_code: { referral_code: 'REF003' }
        }
      ]

      setReferrals(simulatedReferrals)
      setTotalPages(1)
    } catch (error) {
      console.error('Error loading referrals:', error)
    }
  }

  const loadClients = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('customers')
        .select('id, name, email')
        .eq('client_id', restaurantId)
        .order('name')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const updateProgram = async () => {
    setLoading(true)
    try {
      // Simulate saving program settings
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Success",
        description: "Referral program settings saved successfully (simulated)"
      })
      loadStats()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save program settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createReferralCode = async () => {
    if (!selectedClient) return
    
    setLoading(true)
    try {
      // Simulate creating referral code
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const selectedClientData = clients.find(c => c.id === selectedClient)
      const generatedCode = `${program.referral_code_prefix}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      
      setReferralCode(generatedCode)
      toast({
        title: "Success",
        description: `Referral code created for ${selectedClientData?.name} (simulated)`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create referral code",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const processReferral = async () => {
    if (!newReferralCode || !newRefereeId) return
    
    setLoading(true)
    try {
      // Simulate processing referral
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const refereeData = clients.find(c => c.id === newRefereeId)
      
      toast({
        title: "Success",
        description: `Referral processed for ${refereeData?.name} with code ${newReferralCode} (simulated)`
      })
      setNewReferralCode('')
      setNewRefereeId('')
      loadStats()
      loadReferrals()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process referral",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Referral code copied to clipboard"
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      qualified: 'default',
      rewarded: 'default',
      expired: 'destructive'
    }
    
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-blue-100 text-blue-800',
      rewarded: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800'
    }

    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatRewardText = (type: string, value: number) => {
    switch (type) {
      case 'stamps':
        return `${value} stamps`
      case 'discount':
        return `${value}% discount`
      case 'free_item':
        return 'Free item'
      default:
        return `${value} ${type}`
    }
  }

  if (!restaurantId) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Referral Program</h1>
          <p className="text-muted-foreground">Manage your customer referral program and track performance</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Create Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Referral Code</DialogTitle>
                <DialogDescription>Generate a referral code for a customer</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client-select">Select Customer</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createReferralCode} disabled={loading || !selectedClient} className="w-full">
                  Generate Code
                </Button>
                {referralCode && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-lg">{referralCode}</span>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(referralCode)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Process Referral
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Process Referral</DialogTitle>
                <DialogDescription>Manually process a referral using a referral code</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="referral-code">Referral Code</Label>
                  <Input
                    id="referral-code"
                    value={newReferralCode}
                    onChange={(e) => setNewReferralCode(e.target.value)}
                    placeholder="Enter referral code"
                  />
                </div>
                <div>
                  <Label htmlFor="referee-select">Referee (New Customer)</Label>
                  <Select value={newRefereeId} onValueChange={setNewRefereeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose the referred customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={processReferral} disabled={loading || !newReferralCode || !newRefereeId} className="w-full">
                  Process Referral
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_referrals}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_referrals}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qualified</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.qualified_referrals}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rewarded</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rewarded_referrals}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rewards Issued</CardTitle>
              <Gift className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_rewards_issued}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="referrals">All Referrals</TabsTrigger>
          <TabsTrigger value="settings">Program Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Referrers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Referrers</CardTitle>
                <CardDescription>Customers who have made the most successful referrals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.top_referrers.map((referrer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{referrer.client_name}</p>
                        <p className="text-sm text-muted-foreground">{referrer.referral_count} referrals</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{referrer.rewards_earned} rewards</p>
                      </div>
                    </div>
                  ))}
                  {(!stats?.top_referrers || stats.top_referrers.length === 0) && (
                    <p className="text-muted-foreground text-center py-4">No referrers yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Referrals */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Referrals</CardTitle>
                <CardDescription>Latest referral activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recent_referrals.map((referral, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{referral.referrer_name} → {referral.referee_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(referral.status)}
                    </div>
                  ))}
                  {(!stats?.recent_referrals || stats.recent_referrals.length === 0) && (
                    <p className="text-muted-foreground text-center py-4">No recent referrals</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Referrals</CardTitle>
              <CardDescription>Complete list of referrals and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div key={referral.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {referral.referrer.name} → {referral.referee.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Code: {referral.referral_code.referral_code} • 
                          Source: {referral.referral_source} • 
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(referral.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Referee Visits:</span> {referral.referee_visits}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Referee Stamps:</span> {referral.referee_stamps}
                      </div>
                    </div>
                    {referral.qualified_at && (
                      <p className="text-sm text-green-600 mt-2">
                        Qualified: {new Date(referral.qualified_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
                {referrals.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No referrals found</p>
                )}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Program Configuration</CardTitle>
              <CardDescription>Configure your referral program settings and rewards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Program Status */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="program-active">Program Active</Label>
                  <p className="text-sm text-muted-foreground">Enable or disable the referral program</p>
                </div>
                <Switch
                  id="program-active"
                  checked={program.is_active}
                  onCheckedChange={(checked) => setProgram(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              {/* Program Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="program-name">Program Name</Label>
                  <Input
                    id="program-name"
                    value={program.program_name}
                    onChange={(e) => setProgram(prev => ({ ...prev, program_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="code-prefix">Referral Code Prefix</Label>
                  <Input
                    id="code-prefix"
                    value={program.referral_code_prefix}
                    onChange={(e) => setProgram(prev => ({ ...prev, referral_code_prefix: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="program-description">Program Description</Label>
                <Textarea
                  id="program-description"
                  value={program.program_description || ''}
                  onChange={(e) => setProgram(prev => ({ ...prev, program_description: e.target.value }))}
                  placeholder="Describe your referral program..."
                />
              </div>

              {/* Referrer Rewards */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Referrer Rewards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="referrer-reward-type">Reward Type</Label>
                    <Select
                      value={program.referrer_reward_type}
                      onValueChange={(value: 'stamps' | 'discount' | 'free_item') => 
                        setProgram(prev => ({ ...prev, referrer_reward_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stamps">Stamps</SelectItem>
                        <SelectItem value="discount">Discount %</SelectItem>
                        <SelectItem value="free_item">Free Item</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="referrer-reward-value">Reward Value</Label>
                    <Input
                      id="referrer-reward-value"
                      type="number"
                      value={program.referrer_reward_value}
                      onChange={(e) => setProgram(prev => ({ ...prev, referrer_reward_value: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>

              {/* Referee Rewards */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Referee Rewards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="referee-reward-type">Reward Type</Label>
                    <Select
                      value={program.referee_reward_type}
                      onValueChange={(value: 'stamps' | 'discount' | 'free_item') => 
                        setProgram(prev => ({ ...prev, referee_reward_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stamps">Stamps</SelectItem>
                        <SelectItem value="discount">Discount %</SelectItem>
                        <SelectItem value="free_item">Free Item</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="referee-reward-value">Reward Value</Label>
                    <Input
                      id="referee-reward-value"
                      type="number"
                      value={program.referee_reward_value}
                      onChange={(e) => setProgram(prev => ({ ...prev, referee_reward_value: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>

              {/* Qualification Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Qualification Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="min-visits">Minimum Visits</Label>
                    <Input
                      id="min-visits"
                      type="number"
                      value={program.min_referee_visits}
                      onChange={(e) => setProgram(prev => ({ ...prev, min_referee_visits: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="min-stamps">Minimum Stamps</Label>
                    <Input
                      id="min-stamps"
                      type="number"
                      value={program.min_referee_stamps}
                      onChange={(e) => setProgram(prev => ({ ...prev, min_referee_stamps: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-referrals">Max Referrals per Customer</Label>
                    <Input
                      id="max-referrals"
                      type="number"
                      value={program.max_referrals_per_customer}
                      onChange={(e) => setProgram(prev => ({ ...prev, max_referrals_per_customer: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="terms">Terms and Conditions</Label>
                <Textarea
                  id="terms"
                  value={program.terms_and_conditions || ''}
                  onChange={(e) => setProgram(prev => ({ ...prev, terms_and_conditions: e.target.value }))}
                  placeholder="Enter terms and conditions..."
                />
              </div>

              <Button onClick={updateProgram} disabled={loading} className="w-full">
                {loading ? 'Saving...' : 'Save Program Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
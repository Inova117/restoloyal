import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useLoyaltyManager, type LoyaltySettings, type Campaign, type UpdateLoyaltySettingsData, type CreateCampaignData, type CampaignFilters } from '@/hooks/useLoyaltyManager'
import { useLocationManager } from '@/hooks/useLocationManager'
import { 
  Settings, 
  Plus,
  Edit,
  Eye,
  Play,
  Pause,
  Calendar,
  Target,
  Award,
  TrendingUp,
  Users,
  Gift,
  Percent,
  Star,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface LoyaltyManagerProps {
  clientId?: string
}

export default function LoyaltyManager({ clientId }: LoyaltyManagerProps) {
  const { loyaltySettings, campaigns, loading, pagination, fetchLoyaltySettings, updateLoyaltySettings, fetchCampaigns, createCampaign, updateCampaign } = useLoyaltyManager(clientId)
  const { locations } = useLocationManager(clientId)
  
  const [showEditSettingsDialog, setShowEditSettingsDialog] = useState(false)
  const [showCreateCampaignDialog, setShowCreateCampaignDialog] = useState(false)
  const [showEditCampaignDialog, setShowEditCampaignDialog] = useState(false)
  const [selectedSettings, setSelectedSettings] = useState<LoyaltySettings | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  
  // Filter state
  const [campaignFilters, setCampaignFilters] = useState<CampaignFilters>({
    status: undefined,
    promo_type: '',
    limit: 50,
    offset: 0
  })

  // Edit settings form state
  const [settingsForm, setSettingsForm] = useState<UpdateLoyaltySettingsData>({
    stamps_required: 10,
    reward_description: '',
    reward_value: 0,
    stamps_per_dollar: 1.0,
    auto_redeem: false,
    max_stamps_per_visit: 5,
    stamp_expiry_days: undefined,
    minimum_purchase_amount: undefined
  })

  // Create campaign form state
  const [campaignForm, setCampaignForm] = useState<CreateCampaignData>({
    title: '',
    description: '',
    promo_type: 'bonus_stamps',
    reward_config: {},
    start_date: '',
    end_date: '',
    eligible_locations: [],
    restaurant_id: '',
    usage_limit: undefined
  })

  const handleEditSettings = (settings: LoyaltySettings) => {
    setSelectedSettings(settings)
    setSettingsForm({
      stamps_required: settings.stamps_required,
      reward_description: settings.reward_description,
      reward_value: settings.reward_value,
      stamps_per_dollar: settings.stamps_per_dollar,
      auto_redeem: settings.auto_redeem,
      max_stamps_per_visit: settings.max_stamps_per_visit,
      stamp_expiry_days: settings.stamp_expiry_days,
      minimum_purchase_amount: settings.minimum_purchase_amount
    })
    setShowEditSettingsDialog(true)
  }

  const handleUpdateSettings = async () => {
    if (!selectedSettings) return

    const success = await updateLoyaltySettings(selectedSettings.restaurant_id, settingsForm)
    if (success) {
      setShowEditSettingsDialog(false)
      setSelectedSettings(null)
      fetchLoyaltySettings()
    }
  }

  const handleCreateCampaign = async () => {
    const success = await createCampaign(campaignForm)
    if (success) {
      setShowCreateCampaignDialog(false)
      setCampaignForm({
        title: '',
        description: '',
        promo_type: 'bonus_stamps',
        reward_config: {},
        start_date: '',
        end_date: '',
        eligible_locations: [],
        restaurant_id: '',
        usage_limit: undefined
      })
      fetchCampaigns()
    }
  }

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setCampaignForm({
      title: campaign.title,
      description: campaign.description,
      promo_type: campaign.promo_type,
      reward_config: campaign.reward_config,
      start_date: campaign.start_date.split('T')[0],
      end_date: campaign.end_date.split('T')[0],
      eligible_locations: campaign.eligible_locations,
      restaurant_id: campaign.restaurant_id || '',
      usage_limit: campaign.usage_limit
    })
    setShowEditCampaignDialog(true)
  }

  const handleUpdateCampaign = async () => {
    if (!selectedCampaign) return

    const updateData = {
      ...campaignForm,
      start_date: `${campaignForm.start_date}T00:00:00Z`,
      end_date: `${campaignForm.end_date}T23:59:59Z`
    }

    const success = await updateCampaign(selectedCampaign.id, updateData)
    if (success) {
      setShowEditCampaignDialog(false)
      setSelectedCampaign(null)
      fetchCampaigns()
    }
  }

  const handleCampaignStatusChange = async (campaign: Campaign, newStatus: 'active' | 'paused' | 'draft') => {
    await updateCampaign(campaign.id, { status: newStatus })
    fetchCampaigns()
  }

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { 
      ...campaignFilters, 
      [key]: value === "all" || value === "" ? undefined : value, 
      offset: 0 
    } as CampaignFilters
    setCampaignFilters(newFilters)
    fetchCampaigns(newFilters)
  }

  const handlePageChange = (newOffset: number) => {
    const newFilters = { ...campaignFilters, offset: newOffset } as CampaignFilters
    setCampaignFilters(newFilters)
    fetchCampaigns(newFilters)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      paused: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800'
    }
    const icons = {
      active: <Play className="w-3 h-3 mr-1" />,
      draft: <Edit className="w-3 h-3 mr-1" />,
      paused: <Pause className="w-3 h-3 mr-1" />,
      expired: <Calendar className="w-3 h-3 mr-1" />
    }
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPromoTypeBadge = (promoType: string) => {
    const colors = {
      bonus_stamps: 'bg-blue-100 text-blue-800',
      discount: 'bg-purple-100 text-purple-800',
      free_item: 'bg-green-100 text-green-800',
      double_stamps: 'bg-orange-100 text-orange-800',
      referral_bonus: 'bg-pink-100 text-pink-800'
    }
    const icons = {
      bonus_stamps: <Star className="w-3 h-3 mr-1" />,
      discount: <Percent className="w-3 h-3 mr-1" />,
      free_item: <Gift className="w-3 h-3 mr-1" />,
      double_stamps: <TrendingUp className="w-3 h-3 mr-1" />,
      referral_bonus: <Users className="w-3 h-3 mr-1" />
    }
    const labels = {
      bonus_stamps: 'Bonus Stamps',
      discount: 'Discount',
      free_item: 'Free Item',
      double_stamps: 'Double Stamps',
      referral_bonus: 'Referral Bonus'
    }
    return (
      <Badge className={colors[promoType] || 'bg-gray-100 text-gray-800'}>
        {icons[promoType]}
        {labels[promoType] || promoType}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const renderRewardConfig = (campaign: Campaign) => {
    const { promo_type, reward_config } = campaign
    switch (promo_type) {
      case 'bonus_stamps':
        return `+${reward_config.bonus_stamps} bonus stamps`
      case 'discount':
        return reward_config.discount_percentage 
          ? `${reward_config.discount_percentage}% off`
          : `$${reward_config.discount_amount} off`
      case 'free_item':
        return reward_config.free_item_description
      case 'double_stamps':
        return 'Double stamps on all purchases'
      case 'referral_bonus':
        return `+${reward_config.referral_bonus_stamps} stamps for referrals`
      default:
        return 'Special offer'
    }
  }

  if (loading && loyaltySettings.length === 0 && campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading loyalty settings...</p>
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
            <Award className="h-6 w-6 text-blue-600" />
            Loyalty & Campaigns
          </h2>
          <p className="text-gray-600 mt-1">Manage loyalty program rules and promotional campaigns</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            fetchLoyaltySettings()
            fetchCampaigns()
          }}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Loyalty Settings
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Target className="w-4 h-4 mr-2" />
            Campaigns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Loyalty Program Settings</h3>
              <p className="text-sm text-gray-600">Configure stamps, rewards, and program rules for each location</p>
            </div>
          </div>

          {/* Loyalty Settings Grid */}
          <div className="grid gap-6">
            {loyaltySettings.map((settings) => (
              <Card key={settings.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{settings.restaurant?.name || 'Restaurant'}</CardTitle>
                      <CardDescription>Last updated {formatDate(settings.updated_at)}</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditSettings(settings)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{settings.stamps_required}</div>
                      <p className="text-xs text-gray-500">Stamps Required</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">${settings.reward_value}</div>
                      <p className="text-xs text-gray-500">Reward Value</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{settings.stamps_per_dollar}x</div>
                      <p className="text-xs text-gray-500">Stamps per $</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{settings.max_stamps_per_visit}</div>
                      <p className="text-xs text-gray-500">Max per Visit</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Reward: {settings.reward_description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                      <span>Auto-redeem: {settings.auto_redeem ? 'Yes' : 'No'}</span>
                      {settings.stamp_expiry_days && <span>Expires: {settings.stamp_expiry_days} days</span>}
                      {settings.minimum_purchase_amount && <span>Min purchase: ${settings.minimum_purchase_amount}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Promotional Campaigns</h3>
              <p className="text-sm text-gray-600">Create and manage promotional campaigns and special offers</p>
            </div>
            <Dialog open={showCreateCampaignDialog} onOpenChange={setShowCreateCampaignDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                  <DialogDescription>
                    Create a promotional campaign to boost customer engagement
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="campaign_title">Campaign Title *</Label>
                      <Input
                        id="campaign_title"
                        value={campaignForm.title}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Double Stamp Weekend"
                      />
                    </div>
                    <div>
                      <Label htmlFor="promo_type">Promotion Type *</Label>
                      <Select value={campaignForm.promo_type} onValueChange={(value: any) => setCampaignForm(prev => ({ ...prev, promo_type: value, reward_config: {} }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bonus_stamps">Bonus Stamps</SelectItem>
                          <SelectItem value="discount">Discount</SelectItem>
                          <SelectItem value="free_item">Free Item</SelectItem>
                          <SelectItem value="double_stamps">Double Stamps</SelectItem>
                          <SelectItem value="referral_bonus">Referral Bonus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="campaign_description">Description *</Label>
                    <Textarea
                      id="campaign_description"
                      value={campaignForm.description}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the campaign and its benefits..."
                      rows={3}
                    />
                  </div>

                  {/* Reward Configuration */}
                  {campaignForm.promo_type === 'bonus_stamps' && (
                    <div>
                      <Label htmlFor="bonus_stamps">Bonus Stamps *</Label>
                      <Input
                        id="bonus_stamps"
                        type="number"
                        min="1"
                        max="50"
                        value={campaignForm.reward_config.bonus_stamps || ''}
                        onChange={(e) => setCampaignForm(prev => ({ 
                          ...prev, 
                          reward_config: { ...prev.reward_config, bonus_stamps: parseInt(e.target.value) || 0 }
                        }))}
                        placeholder="Number of bonus stamps"
                      />
                    </div>
                  )}

                  {campaignForm.promo_type === 'discount' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="discount_percentage">Discount Percentage</Label>
                        <Input
                          id="discount_percentage"
                          type="number"
                          min="1"
                          max="100"
                          value={campaignForm.reward_config.discount_percentage || ''}
                          onChange={(e) => setCampaignForm(prev => ({ 
                            ...prev, 
                            reward_config: { ...prev.reward_config, discount_percentage: parseInt(e.target.value) || 0, discount_amount: undefined }
                          }))}
                          placeholder="e.g., 20"
                        />
                      </div>
                      <div>
                        <Label htmlFor="discount_amount">OR Discount Amount ($)</Label>
                        <Input
                          id="discount_amount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={campaignForm.reward_config.discount_amount || ''}
                          onChange={(e) => setCampaignForm(prev => ({ 
                            ...prev, 
                            reward_config: { ...prev.reward_config, discount_amount: parseFloat(e.target.value) || 0, discount_percentage: undefined }
                          }))}
                          placeholder="e.g., 5.00"
                        />
                      </div>
                    </div>
                  )}

                  {campaignForm.promo_type === 'free_item' && (
                    <div>
                      <Label htmlFor="free_item_description">Free Item Description *</Label>
                      <Input
                        id="free_item_description"
                        value={campaignForm.reward_config.free_item_description || ''}
                        onChange={(e) => setCampaignForm(prev => ({ 
                          ...prev, 
                          reward_config: { ...prev.reward_config, free_item_description: e.target.value }
                        }))}
                        placeholder="e.g., Free medium pizza"
                      />
                    </div>
                  )}

                  {campaignForm.promo_type === 'referral_bonus' && (
                    <div>
                      <Label htmlFor="referral_bonus_stamps">Referral Bonus Stamps *</Label>
                      <Input
                        id="referral_bonus_stamps"
                        type="number"
                        min="1"
                        max="20"
                        value={campaignForm.reward_config.referral_bonus_stamps || ''}
                        onChange={(e) => setCampaignForm(prev => ({ 
                          ...prev, 
                          reward_config: { ...prev.reward_config, referral_bonus_stamps: parseInt(e.target.value) || 0 }
                        }))}
                        placeholder="Stamps for successful referral"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={campaignForm.start_date}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date *</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={campaignForm.end_date}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="eligible_locations">Eligible Locations *</Label>
                    <Select value={campaignForm.eligible_locations.length > 0 ? 'selected' : 'none'} onValueChange={() => {}}>
                      <SelectTrigger>
                        <SelectValue placeholder={`${campaignForm.eligible_locations.length} locations selected`} />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem 
                            key={location.id} 
                            value={location.id}
                            onClick={() => {
                              const isSelected = campaignForm.eligible_locations.includes(location.id)
                              if (isSelected) {
                                setCampaignForm(prev => ({
                                  ...prev,
                                  eligible_locations: prev.eligible_locations.filter(id => id !== location.id)
                                }))
                              } else {
                                setCampaignForm(prev => ({
                                  ...prev,
                                  eligible_locations: [...prev.eligible_locations, location.id]
                                }))
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                checked={campaignForm.eligible_locations.includes(location.id)}
                                readOnly
                              />
                              {location.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="usage_limit">Usage Limit (optional)</Label>
                    <Input
                      id="usage_limit"
                      type="number"
                      min="1"
                      value={campaignForm.usage_limit || ''}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, usage_limit: parseInt(e.target.value) || undefined }))}
                      placeholder="Maximum number of uses"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateCampaign} disabled={loading} className="flex-1">
                      {loading ? 'Creating...' : 'Create Campaign'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateCampaignDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Campaign Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status_filter">Filter by Status</Label>
                  <Select value={campaignFilters.status || "all"} onValueChange={(value) => handleFilterChange('status', value === "all" ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="promo_filter">Filter by Type</Label>
                  <Select value={campaignFilters.promo_type || "all"} onValueChange={(value) => handleFilterChange('promo_type', value === "all" ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="bonus_stamps">Bonus Stamps</SelectItem>
                      <SelectItem value="discount">Discount</SelectItem>
                      <SelectItem value="free_item">Free Item</SelectItem>
                      <SelectItem value="double_stamps">Double Stamps</SelectItem>
                      <SelectItem value="referral_bonus">Referral Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="limit_filter">Results per page</Label>
                  <Select value={campaignFilters.limit.toString()} onValueChange={(value) => handleFilterChange('limit', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns List */}
          <div className="space-y-4">
            {campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{campaign.title}</h3>
                          {getStatusBadge(campaign.status)}
                          {getPromoTypeBadge(campaign.promo_type)}
                        </div>
                        <p className="text-gray-600 mb-3">{campaign.description}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {renderRewardConfig(campaign)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {campaign.usage_count} uses
                            {campaign.usage_limit && ` / ${campaign.usage_limit}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditCampaign(campaign)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        {campaign.status === 'active' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCampaignStatusChange(campaign, 'paused')}
                          >
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                          </Button>
                        ) : campaign.status === 'paused' || campaign.status === 'draft' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCampaignStatusChange(campaign, 'active')}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Activate
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaigns Found</h3>
                  <p className="text-gray-600">
                    {campaignFilters.status || campaignFilters.promo_type 
                      ? 'No campaigns match your current filters.' 
                      : 'Create your first promotional campaign to boost customer engagement.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} campaigns
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                      disabled={pagination.offset === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                      disabled={!pagination.hasMore}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Settings Dialog */}
      <Dialog open={showEditSettingsDialog} onOpenChange={setShowEditSettingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Loyalty Settings</DialogTitle>
            <DialogDescription>
              Update loyalty program rules for {selectedSettings?.restaurant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stamps_required">Stamps Required *</Label>
                <Input
                  id="stamps_required"
                  type="number"
                  min="1"
                  max="100"
                  value={settingsForm.stamps_required}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, stamps_required: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label htmlFor="reward_value">Reward Value ($) *</Label>
                <Input
                  id="reward_value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={settingsForm.reward_value}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, reward_value: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="reward_description">Reward Description *</Label>
              <Input
                id="reward_description"
                value={settingsForm.reward_description}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, reward_description: e.target.value }))}
                placeholder="e.g., Free medium pizza"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stamps_per_dollar">Stamps per Dollar *</Label>
                <Input
                  id="stamps_per_dollar"
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={settingsForm.stamps_per_dollar}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, stamps_per_dollar: parseFloat(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label htmlFor="max_stamps_per_visit">Max Stamps per Visit *</Label>
                <Input
                  id="max_stamps_per_visit"
                  type="number"
                  min="1"
                  max="20"
                  value={settingsForm.max_stamps_per_visit}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, max_stamps_per_visit: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stamp_expiry_days">Stamp Expiry (days)</Label>
                <Input
                  id="stamp_expiry_days"
                  type="number"
                  min="1"
                  value={settingsForm.stamp_expiry_days || ''}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, stamp_expiry_days: parseInt(e.target.value) || undefined }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="minimum_purchase_amount">Min Purchase ($)</Label>
                <Input
                  id="minimum_purchase_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={settingsForm.minimum_purchase_amount || ''}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, minimum_purchase_amount: parseFloat(e.target.value) || undefined }))}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto_redeem">Auto-redeem rewards</Label>
              <Switch
                id="auto_redeem"
                checked={settingsForm.auto_redeem}
                onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, auto_redeem: checked }))}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateSettings} disabled={loading} className="flex-1">
                {loading ? 'Updating...' : 'Update Settings'}
              </Button>
              <Button variant="outline" onClick={() => setShowEditSettingsDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog - Similar structure to Create Campaign */}
      <Dialog open={showEditCampaignDialog} onOpenChange={setShowEditCampaignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update campaign details and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Similar form structure as create campaign */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateCampaign} disabled={loading} className="flex-1">
                {loading ? 'Updating...' : 'Update Campaign'}
              </Button>
              <Button variant="outline" onClick={() => setShowEditCampaignDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
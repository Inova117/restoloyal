import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Send, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  BarChart3, 
  Users, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  Filter,
  Download,
  Copy,
  Settings
} from 'lucide-react'
import { useNotificationCampaigns, NotificationCampaign, CampaignTemplate, CampaignAnalytics } from '@/hooks/useNotificationCampaigns'
import { toast } from 'sonner'

interface NotificationCampaignsManagerProps {
  clientId: string
  locationId?: string
}

const NotificationCampaignsManager: React.FC<NotificationCampaignsManagerProps> = ({
  clientId,
  locationId
}) => {
  const {
    loading,
    campaigns,
    templates,
    createCampaign,
    sendCampaign,
    scheduleCampaign,
    fetchCampaigns,
    getCampaignAnalytics,
    updateCampaign,
    deleteCampaign,
    fetchTemplates
  } = useNotificationCampaigns()

  const [activeTab, setActiveTab] = useState('campaigns')
  const [selectedCampaign, setSelectedCampaign] = useState<NotificationCampaign | null>(null)
  const [campaignAnalytics, setCampaignAnalytics] = useState<CampaignAnalytics | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  // Form state for creating campaigns
  const [formData, setFormData] = useState<Partial<NotificationCampaign>>({
    client_id: clientId,
    location_id: locationId,
    campaign_name: '',
    campaign_type: 'push',
    target_audience: 'all_customers',
    message_title: '',
    message_content: '',
    send_immediately: false,
    scheduled_for: ''
  })

  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: ''
  })

  useEffect(() => {
    fetchCampaigns({ client_id: clientId, location_id: locationId })
    fetchTemplates(clientId)
  }, [clientId, locationId, fetchCampaigns, fetchTemplates])

  const handleCreateCampaign = async () => {
    if (!formData.campaign_name || !formData.message_title || !formData.message_content) {
      toast.error('Please fill in all required fields')
      return
    }

    const result = await createCampaign(formData as Omit<NotificationCampaign, 'id'>)
    if (result.success) {
      setShowCreateDialog(false)
      resetForm()
    }
  }

  const handleSendCampaign = async (campaignId: string) => {
    const result = await sendCampaign(campaignId)
    if (result.success) {
      await fetchCampaigns({ client_id: clientId, location_id: locationId })
    }
  }

  const handleScheduleCampaign = async () => {
    if (!selectedCampaign || !scheduleData.date || !scheduleData.time) {
      toast.error('Please select date and time')
      return
    }

    const scheduledFor = `${scheduleData.date}T${scheduleData.time}:00Z`
    const result = await scheduleCampaign(selectedCampaign.id!, scheduledFor)
    if (result.success) {
      setShowScheduleDialog(false)
      setScheduleData({ date: '', time: '' })
      await fetchCampaigns({ client_id: clientId, location_id: locationId })
    }
  }

  const handleViewAnalytics = async (campaign: NotificationCampaign) => {
    if (campaign.status === 'draft') {
      toast.error('No analytics available for draft campaigns')
      return
    }

    setSelectedCampaign(campaign)
    const analytics = await getCampaignAnalytics(campaign.id!)
    if (analytics) {
      setCampaignAnalytics(analytics)
      setShowAnalyticsDialog(true)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    const result = await deleteCampaign(campaignId)
    if (result.success) {
      await fetchCampaigns({ client_id: clientId, location_id: locationId })
    }
  }

  const handleUseTemplate = (template: CampaignTemplate) => {
    setFormData({
      ...formData,
      campaign_name: `${template.template_name} - ${new Date().toLocaleDateString()}`,
      campaign_type: template.template_type,
      message_title: template.message_title,
      message_content: template.message_content
    })
    setShowCreateDialog(true)
  }

  const resetForm = () => {
    setFormData({
      client_id: clientId,
      location_id: locationId,
      campaign_name: '',
      campaign_type: 'push',
      target_audience: 'all_customers',
      message_title: '',
      message_content: '',
      send_immediately: false,
      scheduled_for: ''
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Edit },
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      sending: { color: 'bg-yellow-100 text-yellow-800', icon: Play },
      sent: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      partially_sent: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      push: Smartphone,
      email: Mail,
      sms: MessageSquare,
      multi: Users
    }
    return icons[type as keyof typeof icons] || Users
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filterStatus !== 'all' && campaign.status !== filterStatus) return false
    if (filterType !== 'all' && campaign.campaign_type !== filterType) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Campaigns</h2>
          <p className="text-gray-600">Create and manage push, email, and SMS campaigns</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Label>Filters:</Label>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="sending">Sending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="multi">Multi-channel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns List */}
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading campaigns...</p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredCampaigns.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
                    <p className="text-gray-600 mb-4">Create your first notification campaign to engage customers</p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredCampaigns.map((campaign) => {
                const TypeIcon = getTypeIcon(campaign.campaign_type)
                return (
                  <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <TypeIcon className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">{campaign.campaign_name}</h3>
                            {getStatusBadge(campaign.status)}
                          </div>
                          
                          <p className="text-gray-600 mb-3">{campaign.message_title}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Type: {campaign.campaign_type.toUpperCase()}</span>
                            <span>•</span>
                            <span>Audience: {campaign.target_audience.replace('_', ' ')}</span>
                            {campaign.location_id && (
                              <>
                                <span>•</span>
                                <span>Location specific</span>
                              </>
                            )}
                          </div>

                          {campaign.status === 'sent' && (
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-green-600">✓ {campaign.sent_count} sent</span>
                              {campaign.failed_count! > 0 && (
                                <span className="text-red-600">✗ {campaign.failed_count} failed</span>
                              )}
                            </div>
                          )}

                          {campaign.scheduled_for && campaign.status === 'scheduled' && (
                            <div className="mt-2 text-sm text-blue-600">
                              <Clock className="w-4 h-4 inline mr-1" />
                              Scheduled for {new Date(campaign.scheduled_for).toLocaleString()}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {campaign.status !== 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewAnalytics(campaign)}
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                          )}

                          {campaign.status === 'draft' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCampaign(campaign)
                                  setShowScheduleDialog(true)
                                }}
                              >
                                <Calendar className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSendCampaign(campaign.id!)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </>
                          )}

                          {campaign.status === 'scheduled' && (
                            <Button
                              size="sm"
                              onClick={() => handleSendCampaign(campaign.id!)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          )}

                          {['draft', 'scheduled'].includes(campaign.status) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{campaign.campaign_name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCampaign(campaign.id!)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const TypeIcon = getTypeIcon(template.template_type)
              return (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <TypeIcon className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">{template.template_name}</h3>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{template.message_title}</p>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{template.message_content}</p>
                    
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{template.template_type.toUpperCase()}</Badge>
                      <Button
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
                  </div>
                  <Send className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sent Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {campaigns.filter(c => c.status === 'sent').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Delivery Rate</p>
                    <p className="text-2xl font-bold text-gray-900">94.2%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Create a new notification campaign to engage your customers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campaign_name">Campaign Name *</Label>
                <Input
                  id="campaign_name"
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                  placeholder="Enter campaign name"
                />
              </div>
              <div>
                <Label htmlFor="campaign_type">Campaign Type *</Label>
                <Select
                  value={formData.campaign_type}
                  onValueChange={(value) => setFormData({ ...formData, campaign_type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="push">Push Notification</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="multi">Multi-channel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="target_audience">Target Audience *</Label>
              <Select
                value={formData.target_audience}
                onValueChange={(value) => setFormData({ ...formData, target_audience: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_customers">All Customers</SelectItem>
                  <SelectItem value="active_customers">Active Customers</SelectItem>
                  <SelectItem value="inactive_customers">Inactive Customers</SelectItem>
                  <SelectItem value="high_value_customers">High Value Customers</SelectItem>
                  {locationId && <SelectItem value="location_customers">Location Customers</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message_title">Message Title *</Label>
              <Input
                id="message_title"
                value={formData.message_title}
                onChange={(e) => setFormData({ ...formData, message_title: e.target.value })}
                placeholder="Enter message title"
              />
            </div>

            <div>
              <Label htmlFor="message_content">Message Content *</Label>
              <Textarea
                id="message_content"
                value={formData.message_content}
                onChange={(e) => setFormData({ ...formData, message_content: e.target.value })}
                placeholder="Enter message content"
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="send_immediately"
                checked={formData.send_immediately}
                onCheckedChange={(checked) => setFormData({ ...formData, send_immediately: checked })}
              />
              <Label htmlFor="send_immediately">Send immediately</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign} disabled={loading}>
              {loading ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Campaign Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Campaign</DialogTitle>
            <DialogDescription>
              Choose when to send "{selectedCampaign?.campaign_name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="schedule_date">Date</Label>
              <Input
                id="schedule_date"
                type="date"
                value={scheduleData.date}
                onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="schedule_time">Time</Label>
              <Input
                id="schedule_time"
                type="time"
                value={scheduleData.time}
                onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleCampaign} disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Campaign'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Campaign Analytics</DialogTitle>
            <DialogDescription>
              Performance metrics for "{campaignAnalytics?.campaign.campaign_name}"
            </DialogDescription>
          </DialogHeader>

          {campaignAnalytics && (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{campaignAnalytics.analytics.total_sent}</p>
                      <p className="text-sm text-gray-600">Total Sent</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{campaignAnalytics.analytics.delivered}</p>
                      <p className="text-sm text-gray-600">Delivered</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{campaignAnalytics.analytics.opened}</p>
                      <p className="text-sm text-gray-600">Opened</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{campaignAnalytics.analytics.clicked}</p>
                      <p className="text-sm text-gray-600">Clicked</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Rates */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Delivery Rate</span>
                        <span className="text-sm text-gray-600">{campaignAnalytics.analytics.delivery_rate}%</span>
                      </div>
                      <Progress value={parseFloat(campaignAnalytics.analytics.delivery_rate)} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Open Rate</span>
                        <span className="text-sm text-gray-600">{campaignAnalytics.analytics.open_rate}%</span>
                      </div>
                      <Progress value={parseFloat(campaignAnalytics.analytics.open_rate)} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Click Rate</span>
                        <span className="text-sm text-gray-600">{campaignAnalytics.analytics.click_rate}%</span>
                      </div>
                      <Progress value={parseFloat(campaignAnalytics.analytics.click_rate)} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* By Channel */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance by Channel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <Smartphone className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-lg font-semibold">{campaignAnalytics.analytics.by_type.push}</p>
                      <p className="text-sm text-gray-600">Push Notifications</p>
                    </div>
                    <div className="text-center">
                      <Mail className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-lg font-semibold">{campaignAnalytics.analytics.by_type.email}</p>
                      <p className="text-sm text-gray-600">Emails</p>
                    </div>
                    <div className="text-center">
                      <MessageSquare className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-lg font-semibold">{campaignAnalytics.analytics.by_type.sms}</p>
                      <p className="text-sm text-gray-600">SMS Messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowAnalyticsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default NotificationCampaignsManager 
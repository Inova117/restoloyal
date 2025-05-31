import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCustomerManager, type Customer, type UpdateCustomerData, type CustomerFilters } from '@/hooks/useCustomerManager'
import { useLocationManager } from '@/hooks/useLocationManager'
import { 
  Users, 
  Search, 
  Filter,
  Edit,
  Eye,
  UserCheck,
  UserX,
  UserMinus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  Star,
  Gift,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react'

interface CustomerManagerProps {
  clientId?: string
}

export default function CustomerManager({ clientId }: CustomerManagerProps) {
  const { customers, loading, pagination, fetchCustomers, fetchCustomerById, updateCustomer } = useCustomerManager(clientId)
  const { locations } = useLocationManager(clientId)
  
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  // Filter state
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    location_id: '',
    status: undefined,
    limit: 50,
    offset: 0
  })

  // Edit form state
  const [editForm, setEditForm] = useState<UpdateCustomerData>({
    name: '',
    email: '',
    phone: '',
    customer_status: 'active',
    location_id: ''
  })

  const handleSearch = (searchTerm: string) => {
    const newFilters = { ...filters, search: searchTerm, offset: 0 }
    setFilters(newFilters)
    fetchCustomers(newFilters)
  }

  const handleFilterChange = (key: keyof CustomerFilters, value: any) => {
    // Convert "all" values back to empty strings for the API
    let processedValue = value
    if (value === "all") {
      processedValue = key === 'status' ? undefined : ''
    }
    
    const newFilters = { ...filters, [key]: processedValue, offset: 0 }
    setFilters(newFilters)
    fetchCustomers(newFilters)
  }

  const handlePageChange = (newOffset: number) => {
    const newFilters = { ...filters, offset: newOffset }
    setFilters(newFilters)
    fetchCustomers(newFilters)
  }

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditForm({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      customer_status: customer.customer_status,
      location_id: customer.location_id || ''
    })
    setShowEditDialog(true)
  }

  const openDetailsDialog = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDetailsDialog(true)
    setLoadingDetails(true)
    
    try {
      const details = await fetchCustomerById(customer.id)
      setCustomerDetails(details)
    } catch (error) {
      console.error('Failed to fetch customer details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return

    const success = await updateCustomer(selectedCustomer.id, editForm)
    if (success) {
      setShowEditDialog(false)
      setSelectedCustomer(null)
      // Refresh the current page
      fetchCustomers(filters)
    }
  }

  const handleStatusChange = async (customer: Customer, newStatus: 'active' | 'inactive' | 'blocked') => {
    await updateCustomer(customer.id, { customer_status: newStatus })
    // Refresh the current page
    fetchCustomers(filters)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      blocked: 'bg-red-100 text-red-800'
    }
    const icons = {
      active: <UserCheck className="w-3 h-3 mr-1" />,
      inactive: <UserMinus className="w-3 h-3 mr-1" />,
      blocked: <UserX className="w-3 h-3 mr-1" />
    }
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customers...</p>
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
            <Users className="h-6 w-6 text-blue-600" />
            Customer Management
          </h2>
          <p className="text-gray-600 mt-1">Manage customers across all your locations</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => fetchCustomers(filters)}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Customers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Name, email, or phone..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Filter by Location</Label>
              <Select value={filters.location_id || "all"} onValueChange={(value) => handleFilterChange('location_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Filter by Status</Label>
              <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="limit">Results per page</Label>
              <Select value={filters.limit?.toString()} onValueChange={(value) => handleFilterChange('limit', parseInt(value))}>
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

      {/* Customer List */}
      <div className="space-y-4">
        {customers.length > 0 ? (
          customers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-lg">
                        {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{customer.name}</h3>
                        {getStatusBadge(customer.customer_status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {customer.email}
                          </span>
                        )}
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {customer.phone}
                          </span>
                        )}
                        {customer.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {customer.location.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          {customer.stamps} stamps
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {customer.total_visits} visits
                        </span>
                        {customer.last_visit && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Last visit {formatDate(customer.last_visit)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDetailsDialog(customer)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(customer)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {customer.customer_status === 'active' ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700">
                            <UserMinus className="w-4 h-4 mr-1" />
                            Suspend
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Suspend Customer</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to suspend {customer.name}? 
                              They will not be able to earn or redeem stamps until reactivated.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleStatusChange(customer, 'inactive')}>
                              Suspend
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : customer.customer_status === 'inactive' ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleStatusChange(customer, 'active')}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Activate
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleStatusChange(customer, 'active')}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Unblock
                      </Button>
                    )}
                    {customer.customer_status !== 'blocked' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <UserX className="w-4 h-4 mr-1" />
                            Block
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Block Customer</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to block {customer.name}? 
                              This will prevent them from using the loyalty program entirely.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleStatusChange(customer, 'blocked')}>
                              Block Customer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Customers Found</h3>
              <p className="text-gray-600">
                {filters.search || filters.location_id || filters.status 
                  ? 'No customers match your current filters.' 
                  : 'No customers have been registered yet.'}
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
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} customers
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

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information for {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Full Name</Label>
              <Input
                id="edit_name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="customer@email.com"
              />
            </div>
            <div>
              <Label htmlFor="edit_phone">Phone</Label>
              <Input
                id="edit_phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="edit_location">Location</Label>
              <Select value={editForm.location_id || "none"} onValueChange={(value) => setEditForm(prev => ({ ...prev, location_id: value === "none" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific location</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} - {location.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_status">Status</Label>
              <Select value={editForm.customer_status} onValueChange={(value: 'active' | 'inactive' | 'blocked') => setEditForm(prev => ({ ...prev, customer_status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center">
                      <UserMinus className="w-4 h-4 mr-2" />
                      Inactive
                    </div>
                  </SelectItem>
                  <SelectItem value="blocked">
                    <div className="flex items-center">
                      <UserX className="w-4 h-4 mr-2" />
                      Blocked
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleEditCustomer} disabled={loading} className="flex-1">
                {loading ? 'Updating...' : 'Update Customer'}
              </Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Customer Details - {selectedCustomer?.name}
            </DialogTitle>
            <DialogDescription>
              Complete customer profile and activity history
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading customer details...</p>
              </div>
            </div>
          ) : customerDetails ? (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">
                  <Users className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="stamps">
                  <Award className="w-4 h-4 mr-2" />
                  Stamps History
                </TabsTrigger>
                <TabsTrigger value="rewards">
                  <Gift className="w-4 h-4 mr-2" />
                  Rewards History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{customerDetails.name}</span>
                      </div>
                      {customerDetails.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span>{customerDetails.email}</span>
                        </div>
                      )}
                      {customerDetails.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{customerDetails.phone}</span>
                        </div>
                      )}
                      {customerDetails.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{customerDetails.location.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>Joined {formatDate(customerDetails.created_at)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Loyalty Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          Current Stamps
                        </span>
                        <span className="font-bold text-lg">{customerDetails.stamps}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          Total Visits
                        </span>
                        <span className="font-bold text-lg">{customerDetails.total_visits}</span>
                      </div>
                      {customerDetails.last_visit && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-green-500" />
                            Last Visit
                          </span>
                          <span>{formatDate(customerDetails.last_visit)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span>Status</span>
                        {getStatusBadge(customerDetails.customer_status)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="stamps" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Stamp Activity</CardTitle>
                    <CardDescription>Latest stamp collections and transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {customerDetails.recent_stamps && customerDetails.recent_stamps.length > 0 ? (
                      <div className="space-y-3">
                        {customerDetails.recent_stamps.map((stamp) => (
                          <div key={stamp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-yellow-500" />
                                <span className="font-medium">+{stamp.amount} stamps</span>
                              </div>
                              {stamp.notes && (
                                <p className="text-sm text-gray-600 mt-1">{stamp.notes}</p>
                              )}
                              <p className="text-xs text-gray-500">Added by {stamp.added_by_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatDate(stamp.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No stamp activity yet</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rewards" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Rewards History</CardTitle>
                    <CardDescription>Redeemed rewards and benefits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {customerDetails.recent_rewards && customerDetails.recent_rewards.length > 0 ? (
                      <div className="space-y-3">
                        {customerDetails.recent_rewards.map((reward) => (
                          <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="flex items-center gap-2">
                                <Gift className="w-4 h-4 text-purple-500" />
                                <span className="font-medium">{reward.description}</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                Used {reward.stamps_used} stamps
                                {reward.value && ` • Value: $${reward.value}`}
                              </p>
                              <p className="text-xs text-gray-500">Redeemed by {reward.redeemed_by_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatDate(reward.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No rewards redeemed yet</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Failed to load customer details</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 
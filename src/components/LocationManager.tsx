import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Loader2, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  Edit, 
  Trash2, 
  Building2,
  User,
  Search
} from 'lucide-react'
import { useLocationManager, useClientRestaurants, Location, LocationCreate, LocationUpdate } from '@/hooks/useLocationManager'
import { useCurrentClientId } from '@/hooks/useClientProfile'

export function LocationManager() {
  const { clientId, loading: clientIdLoading } = useCurrentClientId()
  const { locations, loading, error, createLocation, updateLocation, deleteLocation, refetch } = useLocationManager(clientId || undefined)
  const { restaurants } = useClientRestaurants(clientId || undefined)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Form state for create/edit
  const [formData, setFormData] = useState<LocationCreate>({
    restaurant_id: '',
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    manager_name: '',
    manager_email: '',
    latitude: undefined,
    longitude: undefined
  })

  // Filter locations based on search and status
  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.city.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && location.is_active) ||
                         (statusFilter === 'inactive' && !location.is_active)
    
    return matchesSearch && matchesStatus
  })

  const resetForm = () => {
    setFormData({
      restaurant_id: '',
      name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      phone: '',
      manager_name: '',
      manager_email: '',
      latitude: undefined,
      longitude: undefined
    })
  }

  const handleCreate = async () => {
    if (!clientId) return

    const success = await createLocation(formData)
    if (success) {
      setIsCreateDialogOpen(false)
      resetForm()
    }
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      restaurant_id: location.restaurant_id,
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      zip_code: location.zip_code || '',
      phone: location.phone || '',
      manager_name: location.manager_name || '',
      manager_email: location.manager_email || '',
      latitude: location.latitude,
      longitude: location.longitude
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingLocation || !clientId) return

    const updates: LocationUpdate = {
      name: formData.name,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code,
      phone: formData.phone,
      manager_name: formData.manager_name,
      manager_email: formData.manager_email,
      latitude: formData.latitude,
      longitude: formData.longitude
    }

    const success = await updateLocation(editingLocation.id, updates)
    if (success) {
      setIsEditDialogOpen(false)
      setEditingLocation(null)
      resetForm()
    }
  }

  const handleDelete = async (location: Location) => {
    if (!clientId) return
    
    if (window.confirm(`Are you sure you want to delete "${location.name}"? This action cannot be undone.`)) {
      await deleteLocation(location.id)
    }
  }

  const handleToggleStatus = async (location: Location) => {
    if (!clientId) return
    
    await updateLocation(location.id, { is_active: !location.is_active })
  }

  if (clientIdLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading client information...</span>
      </div>
    )
  }

  if (!clientId) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Client Access</h3>
          <p className="text-gray-600">
            You don't have client admin access. Please contact support if you believe this is an error.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <h3 className="text-lg font-semibold mb-2">Error Loading Locations</h3>
            <p>{error}</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Location Management</h1>
          <p className="text-gray-600">Manage all your restaurant locations</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
            </DialogHeader>
            <LocationForm
              formData={formData}
              setFormData={setFormData}
              restaurants={restaurants}
              onSubmit={handleCreate}
              onCancel={() => setIsCreateDialogOpen(false)}
              loading={loading}
              submitLabel="Create Location"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
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
            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Locations List */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading locations...</span>
        </div>
      ) : filteredLocations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Locations Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'No locations match your current filters.' 
                : 'Get started by adding your first location.'}
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Location
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          <LocationForm
            formData={formData}
            setFormData={setFormData}
            restaurants={restaurants}
            onSubmit={handleUpdate}
            onCancel={() => {
              setIsEditDialogOpen(false)
              setEditingLocation(null)
              resetForm()
            }}
            loading={loading}
            submitLabel="Update Location"
            isEdit={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Location Card Component
function LocationCard({ 
  location, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: {
  location: Location
  onEdit: (location: Location) => void
  onDelete: (location: Location) => void
  onToggleStatus: (location: Location) => void
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{location.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={location.is_active ? 'default' : 'secondary'}>
                {location.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(location)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(location)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div>{location.address}</div>
            <div className="text-gray-600">
              {location.city}, {location.state} {location.zip_code}
            </div>
          </div>
        </div>

        {location.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{location.phone}</span>
          </div>
        )}

        {location.manager_name && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <div className="text-sm">
              <div>{location.manager_name}</div>
              {location.manager_email && (
                <div className="text-gray-600 text-xs">{location.manager_email}</div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-gray-600">Status</span>
          <Switch
            checked={location.is_active}
            onCheckedChange={() => onToggleStatus(location)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Location Form Component
function LocationForm({
  formData,
  setFormData,
  restaurants,
  onSubmit,
  onCancel,
  loading,
  submitLabel,
  isEdit = false
}: {
  formData: LocationCreate
  setFormData: React.Dispatch<React.SetStateAction<LocationCreate>>
  restaurants: Array<{id: string, name: string}>
  onSubmit: () => void
  onCancel: () => void
  loading: boolean
  submitLabel: string
  isEdit?: boolean
}) {
  const isValid = formData.restaurant_id && formData.name && formData.address && formData.city && formData.state

  return (
    <div className="space-y-4">
      {!isEdit && (
        <div>
          <Label htmlFor="restaurant_id">Restaurant</Label>
          <Select value={formData.restaurant_id} onValueChange={(value) => setFormData({ ...formData, restaurant_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select a restaurant" />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map((restaurant) => (
                <SelectItem key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Location Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Downtown Store"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="123 Main Street"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="New York"
          />
        </div>
        <div>
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="NY"
          />
        </div>
        <div>
          <Label htmlFor="zip_code">ZIP Code</Label>
          <Input
            id="zip_code"
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
            placeholder="10001"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="manager_name">Manager Name</Label>
          <Input
            id="manager_name"
            value={formData.manager_name}
            onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
            placeholder="John Smith"
          />
        </div>
        <div>
          <Label htmlFor="manager_email">Manager Email</Label>
          <Input
            id="manager_email"
            type="email"
            value={formData.manager_email}
            onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
            placeholder="john@restaurant.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="latitude">Latitude (Optional)</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            value={formData.latitude || ''}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="40.7128"
          />
        </div>
        <div>
          <Label htmlFor="longitude">Longitude (Optional)</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            value={formData.longitude || ''}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="-74.0060"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!isValid || loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </div>
  )
} 
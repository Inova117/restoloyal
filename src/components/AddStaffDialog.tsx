// ============================================================================
// ADD STAFF DIALOG - UPDATED FOR 4-TIER HIERARCHY
// ============================================================================
// This component creates new location staff (Tier 3) for locations
// Can only be used by client admins (Tier 2)
// ============================================================================

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useUserRole, getUserClientContext } from '@/hooks/useUserRole'
import { Plus, Users, Mail, Phone, MapPin, Shield } from 'lucide-react'
import type { Location, LocationStaff } from '@/types/database'

interface AddStaffDialogProps {
  onStaffAdded: () => void
  locationId?: string // Optional: if specified, staff will be added to this location
  trigger?: React.ReactNode // Custom trigger element
}

interface StaffPermissions {
  can_create_customers: boolean
  can_manage_loyalty: boolean
  can_view_analytics: boolean
  can_export_data: boolean
}

export default function AddStaffDialog({ 
  onStaffAdded, 
  locationId,
  trigger 
}: AddStaffDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const { role, roleData } = useUserRole()
  const { toast } = useToast()

  const [staffData, setStaffData] = useState({
    name: '',
    email: '',
    phone: '',
    location_id: locationId || '',
    role: 'staff' as 'manager' | 'staff' | 'pos_operator'
  })

  const [permissions, setPermissions] = useState<StaffPermissions>({
    can_create_customers: true,
    can_manage_loyalty: true,
    can_view_analytics: false,
    can_export_data: false
  })

  // Get user context for multi-tenant isolation
  const userContext = getUserClientContext(roleData)

  // Load locations for this client
  useEffect(() => {
    if (open && !locationId && userContext.clientId) {
      loadLocations()
    }
  }, [open, locationId, userContext.clientId])

  // Update permissions based on role
  useEffect(() => {
    const rolePermissions = {
      manager: {
        can_create_customers: true,
        can_manage_loyalty: true,
        can_view_analytics: true,
        can_export_data: true
      },
      staff: {
        can_create_customers: true,
        can_manage_loyalty: true,
        can_view_analytics: false,
        can_export_data: false
      },
      pos_operator: {
        can_create_customers: true,
        can_manage_loyalty: false,
        can_view_analytics: false,
        can_export_data: false
      }
    }
    setPermissions(rolePermissions[staffData.role])
  }, [staffData.role])

  const loadLocations = async () => {
    setLoadingLocations(true)
    try {
      const { data, error } = await (supabase as any)
        .from('locations')
        .select('id, name, address, city, is_active')
        .eq('client_id', userContext.clientId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setLocations(data || [])
    } catch (error) {
      console.error('Error loading locations:', error)
      toast({
        title: "Error",
        description: "Failed to load locations",
        variant: "destructive"
      })
    } finally {
      setLoadingLocations(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!staffData.name.trim() || !staffData.email.trim() || !staffData.location_id) {
      toast({
        title: "Missing Information",
        description: "Name, email, and location are required",
        variant: "destructive"
      })
      return
    }

    if (!userContext.clientId) {
      toast({
        title: "Access Error",
        description: "Cannot determine your client context",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Call create-location-staff Edge Function
      const { data, error } = await supabase.functions.invoke('create-location-staff', {
        body: {
          name: staffData.name.trim(),
          email: staffData.email.trim(),
          phone: staffData.phone.trim() || null,
          location_id: staffData.location_id,
          role: staffData.role,
          permissions: permissions
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to create staff member')
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create staff member')
      }

      toast({
        title: "Staff Member Created",
        description: `${staffData.name} has been added to ${data.location_name}.`,
      })

      // Reset form
      setStaffData({
        name: '',
        email: '',
        phone: '',
        location_id: locationId || '',
        role: 'staff'
      })
      setPermissions({
        can_create_customers: true,
        can_manage_loyalty: true,
        can_view_analytics: false,
        can_export_data: false
      })

      setOpen(false)
      onStaffAdded()

    } catch (error) {
      console.error('Error creating staff member:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create staff member",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setStaffData({
      name: '',
      email: '',
      phone: '',
      location_id: locationId || '',
      role: 'staff'
    })
    setPermissions({
      can_create_customers: true,
      can_manage_loyalty: true,
      can_view_analytics: false,
      can_export_data: false
    })
    setOpen(false)
  }

  // Only client admins can create staff
  if (role !== 'client_admin') {
    return null
  }

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add Staff
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add New Staff Member
          </DialogTitle>
          <DialogDescription>
            Create a new staff member for one of your locations. They will be able to manage customers and loyalty programs.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            {/* Staff Name */}
            <div className="space-y-2">
              <Label htmlFor="staffName">
                Full Name *
              </Label>
              <Input
                id="staffName"
                value={staffData.name}
                onChange={(e) => setStaffData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter staff member's full name"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="staffEmail">
                Email Address *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="staffEmail"
                  type="email"
                  value={staffData.email}
                  onChange={(e) => setStaffData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="staff@business.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="staffPhone">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="staffPhone"
                  value={staffData.phone}
                  onChange={(e) => setStaffData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Location Selection */}
            {!locationId && (
              <div className="space-y-2">
                <Label htmlFor="staffLocation">
                  Location *
                </Label>
                <Select
                  value={staffData.location_id}
                  onValueChange={(value) => setStaffData(prev => ({ ...prev, location_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingLocations ? (
                      <SelectItem value="" disabled>Loading locations...</SelectItem>
                    ) : locations.length === 0 ? (
                      <SelectItem value="" disabled>No locations available</SelectItem>
                    ) : (
                      locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{location.name}</span>
                            <span className="text-muted-foreground text-xs">
                              {location.city}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="staffRole">
                Role *
              </Label>
              <Select
                value={staffData.role}
                onValueChange={(value: 'manager' | 'staff' | 'pos_operator') => 
                  setStaffData(prev => ({ ...prev, role: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Manager</div>
                        <div className="text-xs text-muted-foreground">Full access to all features</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="staff">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Staff</div>
                        <div className="text-xs text-muted-foreground">Customer management and loyalty operations</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="pos_operator">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div>
                        <div className="font-medium">POS Operator</div>
                        <div className="text-xs text-muted-foreground">Basic customer creation only</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="space-y-3 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="can_create_customers"
                    checked={permissions.can_create_customers}
                    onCheckedChange={(checked) => 
                      setPermissions(prev => ({ ...prev, can_create_customers: !!checked }))
                    }
                  />
                  <Label htmlFor="can_create_customers" className="text-sm">
                    Can create customers
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="can_manage_loyalty"
                    checked={permissions.can_manage_loyalty}
                    onCheckedChange={(checked) => 
                      setPermissions(prev => ({ ...prev, can_manage_loyalty: !!checked }))
                    }
                  />
                  <Label htmlFor="can_manage_loyalty" className="text-sm">
                    Can manage loyalty programs
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="can_view_analytics"
                    checked={permissions.can_view_analytics}
                    onCheckedChange={(checked) => 
                      setPermissions(prev => ({ ...prev, can_view_analytics: !!checked }))
                    }
                  />
                  <Label htmlFor="can_view_analytics" className="text-sm">
                    Can view analytics
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="can_export_data"
                    checked={permissions.can_export_data}
                    onCheckedChange={(checked) => 
                      setPermissions(prev => ({ ...prev, can_export_data: !!checked }))
                    }
                  />
                  <Label htmlFor="can_export_data" className="text-sm">
                    Can export data
                  </Label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Permissions are automatically set based on role, but can be customized.
              </p>
            </div>

            {/* Client Info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                <span className="font-medium">Your Business</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This staff member will be added to your business account
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !staffData.name.trim() || !staffData.email.trim() || !staffData.location_id}
            >
              {loading ? 'Creating...' : 'Create Staff Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 
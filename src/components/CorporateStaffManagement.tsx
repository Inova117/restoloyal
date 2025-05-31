import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  UserCheck, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  Building2, 
  Crown,
  Mail,
  Phone,
  Calendar,
  Search,
  Filter
} from 'lucide-react'

interface CorporateStaffMember {
  id: string
  name: string
  email: string
  phone?: string
  role: 'super_admin' | 'corporate_admin' | 'brand_manager' | 'regional_manager' | 'analyst'
  permissions: string[]
  assigned_brands: string[]
  status: 'active' | 'inactive' | 'pending'
  last_login?: string
  created_at: string
  updated_at: string
}

interface StaffRole {
  id: string
  name: string
  description: string
  permissions: string[]
  level: number
}

const STAFF_ROLES: StaffRole[] = [
  {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Full access to all corporate functions and brands',
    permissions: ['all_access', 'user_management', 'billing_management', 'system_settings'],
    level: 5
  },
  {
    id: 'corporate_admin',
    name: 'Corporate Administrator',
    description: 'Manage all brands and corporate operations',
    permissions: ['brand_management', 'staff_management', 'analytics_access', 'billing_view'],
    level: 4
  },
  {
    id: 'brand_manager',
    name: 'Brand Manager',
    description: 'Manage specific restaurant brands',
    permissions: ['brand_analytics', 'location_management', 'staff_view'],
    level: 3
  },
  {
    id: 'regional_manager',
    name: 'Regional Manager',
    description: 'Manage locations within specific regions',
    permissions: ['location_analytics', 'location_settings', 'staff_view'],
    level: 2
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    description: 'View analytics and generate reports',
    permissions: ['analytics_view', 'report_generation'],
    level: 1
  }
]

export default function CorporateStaffManagement() {
  const [staffMembers, setStaffMembers] = useState<CorporateStaffMember[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showStaffDialog, setShowStaffDialog] = useState(false)
  const [editingStaff, setEditingStaff] = useState<CorporateStaffMember | null>(null)
  
  const { toast } = useToast()

  useEffect(() => {
    loadStaffMembers()
  }, [])

  const loadStaffMembers = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simulated staff data
      const simulatedStaff: CorporateStaffMember[] = [
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@galletti.com',
          phone: '+1 (555) 123-4567',
          role: 'super_admin',
          permissions: ['all_access', 'user_management', 'billing_management', 'system_settings'],
          assigned_brands: ['all'],
          status: 'active',
          last_login: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          created_at: '2023-01-15T00:00:00Z',
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Michael Chen',
          email: 'michael.chen@galletti.com',
          phone: '+1 (555) 234-5678',
          role: 'corporate_admin',
          permissions: ['brand_management', 'staff_management', 'analytics_access', 'billing_view'],
          assigned_brands: ['all'],
          status: 'active',
          last_login: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          created_at: '2023-02-20T00:00:00Z',
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Emily Rodriguez',
          email: 'emily.rodriguez@galletti.com',
          phone: '+1 (555) 345-6789',
          role: 'brand_manager',
          permissions: ['brand_analytics', 'location_management', 'staff_view'],
          assigned_brands: ['Pizza Palace', 'Burger Kingdom'],
          status: 'active',
          last_login: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: '2023-03-10T00:00:00Z',
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'David Kim',
          email: 'david.kim@galletti.com',
          phone: '+1 (555) 456-7890',
          role: 'regional_manager',
          permissions: ['location_analytics', 'location_settings', 'staff_view'],
          assigned_brands: ['Taco Fiesta', 'Sushi Express'],
          status: 'active',
          last_login: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: '2023-04-05T00:00:00Z',
          updated_at: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Lisa Thompson',
          email: 'lisa.thompson@galletti.com',
          role: 'analyst',
          permissions: ['analytics_view', 'report_generation'],
          assigned_brands: ['all'],
          status: 'active',
          last_login: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          created_at: '2023-05-12T00:00:00Z',
          updated_at: new Date().toISOString()
        },
        {
          id: '6',
          name: 'James Wilson',
          email: 'james.wilson@galletti.com',
          role: 'brand_manager',
          permissions: ['brand_analytics', 'location_management', 'staff_view'],
          assigned_brands: ['Coffee Corner'],
          status: 'pending',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      setStaffMembers(simulatedStaff)
      
      toast({
        title: "Staff Data Loaded",
        description: "Corporate staff members loaded successfully (simulated)",
      })
    } catch (error) {
      console.error('Error loading staff:', error)
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStaff = async (staffData: Partial<CorporateStaffMember>) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const selectedRole = STAFF_ROLES.find(role => role.id === staffData.role)
      
      const newStaff: CorporateStaffMember = {
        id: Date.now().toString(),
        name: staffData.name || '',
        email: staffData.email || '',
        phone: staffData.phone || '',
        role: staffData.role as any || 'analyst',
        permissions: selectedRole?.permissions || [],
        assigned_brands: staffData.assigned_brands || [],
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setStaffMembers(prev => [...prev, newStaff])
      setShowStaffDialog(false)
      
      toast({
        title: "Success",
        description: `Staff member "${staffData.name}" added successfully (simulated)`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add staff member",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStaff = async (staffId: string, staffData: Partial<CorporateStaffMember>) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStaffMembers(prev => prev.map(staff => 
        staff.id === staffId 
          ? { ...staff, ...staffData, updated_at: new Date().toISOString() }
          : staff
      ))
      setShowStaffDialog(false)
      setEditingStaff(null)
      
      toast({
        title: "Success",
        description: "Staff member updated successfully (simulated)"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return
    
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setStaffMembers(prev => prev.filter(staff => staff.id !== staffId))
      
      toast({
        title: "Success",
        description: "Staff member removed successfully (simulated)"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove staff member",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const roleInfo = STAFF_ROLES.find(r => r.id === role)
    const colors = {
      super_admin: 'bg-red-100 text-red-800',
      corporate_admin: 'bg-purple-100 text-purple-800',
      brand_manager: 'bg-blue-100 text-blue-800',
      regional_manager: 'bg-green-100 text-green-800',
      analyst: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={colors[role] || 'bg-gray-100 text-gray-800'}>
        {roleInfo?.name || role}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || staff.role === roleFilter
    const matchesStatus = statusFilter === 'all' || staff.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never'
    const date = new Date(lastLogin)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading && staffMembers.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading corporate staff...</p>
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
            <UserCheck className="h-6 w-6 text-blue-600" />
            Corporate Staff Management
          </h2>
          <p className="text-muted-foreground">Manage corporate team members and their access permissions</p>
        </div>
        <Button onClick={() => setShowStaffDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              {staffMembers.filter(s => s.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffMembers.filter(s => s.role === 'super_admin' || s.role === 'corporate_admin').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Super & Corporate admins
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brand Managers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffMembers.filter(s => s.role === 'brand_manager').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Managing brands
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffMembers.filter(s => s.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting activation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {STAFF_ROLES.map(role => (
              <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStaff.map((staff) => (
          <Card key={staff.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{staff.name}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      {getRoleBadge(staff.role)}
                      {getStatusBadge(staff.status)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingStaff(staff)
                      setShowStaffDialog(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStaff(staff.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{staff.email}</span>
                </div>
                {staff.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{staff.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Last login: {formatLastLogin(staff.last_login)}</span>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Assigned Brands:</p>
                  <div className="flex flex-wrap gap-1">
                    {staff.assigned_brands.includes('all') ? (
                      <Badge variant="outline">All Brands</Badge>
                    ) : (
                      staff.assigned_brands.map(brand => (
                        <Badge key={brand} variant="outline">{brand}</Badge>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {staff.permissions.slice(0, 3).map(permission => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permission.replace('_', ' ')}
                      </Badge>
                    ))}
                    {staff.permissions.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{staff.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Staff Dialog */}
      <StaffDialog
        open={showStaffDialog}
        onOpenChange={setShowStaffDialog}
        staff={editingStaff}
        onSave={editingStaff ? 
          (data) => handleUpdateStaff(editingStaff.id, data) : 
          handleCreateStaff
        }
        loading={loading}
      />
    </div>
  )
}

// Staff Dialog Component
function StaffDialog({ 
  open, 
  onOpenChange, 
  staff, 
  onSave, 
  loading 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: CorporateStaffMember | null
  onSave: (data: Partial<CorporateStaffMember>) => void
  loading: boolean
}) {
  const [formData, setFormData] = useState<Partial<CorporateStaffMember>>({
    name: '',
    email: '',
    phone: '',
    role: 'analyst',
    assigned_brands: [],
    status: 'pending'
  })

  useEffect(() => {
    if (staff) {
      setFormData(staff)
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'analyst',
        assigned_brands: [],
        status: 'pending'
      })
    }
  }, [staff, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const selectedRole = STAFF_ROLES.find(role => role.id === formData.role)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{staff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
          <DialogDescription>
            {staff ? 'Update staff member information and permissions' : 'Add a new corporate team member with appropriate access levels'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select 
              value={formData.role || 'analyst'} 
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    <div>
                      <div className="font-medium">{role.name}</div>
                      <div className="text-xs text-muted-foreground">{role.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedRole && (
            <div>
              <Label>Permissions</Label>
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <div className="flex flex-wrap gap-1">
                  {selectedRole.permissions.map(permission => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {permission.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          {staff && (
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status || 'pending'} 
                onValueChange={(value: 'active' | 'inactive' | 'pending') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (staff ? 'Update Staff' : 'Add Staff')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useStaffManager, type StaffMember, type InviteStaffData, type UpdateStaffData } from '@/hooks/useStaffManager'
import { useLocationManager } from '@/hooks/useLocationManager'
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  MapPin, 
  Store, 
  Crown,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface StaffManagerProps {
  clientId?: string
}

export default function StaffManager({ clientId }: StaffManagerProps) {
  const { staff, loading, inviteStaff, updateStaff, removeStaff } = useStaffManager(clientId)
  const { locations } = useLocationManager(clientId)
  
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Invite form state
  const [inviteForm, setInviteForm] = useState<InviteStaffData>({
    email: '',
    full_name: '',
    role: 'location_staff',
    restaurant_id: '',
    location_id: ''
  })

  // Edit form state
  const [editForm, setEditForm] = useState<UpdateStaffData>({
    role: 'location_staff',
    restaurant_id: '',
    location_id: '',
    status: 'active'
  })

  const handleInviteStaff = async () => {
    if (!inviteForm.email || !inviteForm.role) {
      return
    }

    const success = await inviteStaff(inviteForm)
    if (success) {
      setShowInviteDialog(false)
      setInviteForm({
        email: '',
        full_name: '',
        role: 'location_staff',
        restaurant_id: '',
        location_id: ''
      })
    }
  }

  const handleEditStaff = async () => {
    if (!selectedStaff) return

    const success = await updateStaff(selectedStaff.id, editForm)
    if (success) {
      setShowEditDialog(false)
      setSelectedStaff(null)
    }
  }

  const handleRemoveStaff = async (staffMember: StaffMember) => {
    await removeStaff(staffMember.id)
  }

  const handleSuspendStaff = async (staffMember: StaffMember) => {
    await updateStaff(staffMember.id, { status: 'suspended' })
  }

  const handleActivateStaff = async (staffMember: StaffMember) => {
    await updateStaff(staffMember.id, { status: 'active' })
  }

  const openEditDialog = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember)
    setEditForm({
      role: staffMember.role,
      restaurant_id: staffMember.restaurant_id || '',
      location_id: staffMember.location_id || '',
      status: staffMember.status
    })
    setShowEditDialog(true)
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      client_admin: 'bg-purple-100 text-purple-800',
      restaurant_admin: 'bg-blue-100 text-blue-800',
      location_staff: 'bg-green-100 text-green-800'
    }
    const icons = {
      client_admin: <Crown className="w-3 h-3 mr-1" />,
      restaurant_admin: <Store className="w-3 h-3 mr-1" />,
      location_staff: <MapPin className="w-3 h-3 mr-1" />
    }
    return (
      <Badge className={colors[role] || 'bg-gray-100 text-gray-800'}>
        {icons[role]}
        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }
    const icons = {
      active: <CheckCircle className="w-3 h-3 mr-1" />,
      suspended: <UserX className="w-3 h-3 mr-1" />,
      pending: <Clock className="w-3 h-3 mr-1" />
    }
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.full_name && member.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  if (loading && staff.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff members...</p>
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
            Staff Management
          </h2>
          <p className="text-gray-600 mt-1">Manage staff across all your locations</p>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite Staff Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite_email">Email Address *</Label>
                <Input
                  id="invite_email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="staff@restaurant.com"
                />
              </div>
              <div>
                <Label htmlFor="invite_name">Full Name</Label>
                <Input
                  id="invite_name"
                  value={inviteForm.full_name}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label htmlFor="invite_role">Role *</Label>
                <Select value={inviteForm.role} onValueChange={(value: 'client_admin' | 'restaurant_admin' | 'location_staff') => setInviteForm(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client_admin">
                      <div className="flex items-center">
                        <Crown className="w-4 h-4 mr-2" />
                        Client Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="restaurant_admin">
                      <div className="flex items-center">
                        <Store className="w-4 h-4 mr-2" />
                        Restaurant Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="location_staff">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Location Staff
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {inviteForm.role === 'location_staff' && (
                <div>
                  <Label htmlFor="invite_location">Assign to Location</Label>
                  <Select value={inviteForm.location_id} onValueChange={(value) => setInviteForm(prev => ({ ...prev, location_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} - {location.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleInviteStaff} disabled={loading} className="flex-1">
                  {loading ? 'Sending...' : 'Send Invitation'}
                </Button>
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search staff by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="client_admin">Client Admin</SelectItem>
            <SelectItem value="restaurant_admin">Restaurant Admin</SelectItem>
            <SelectItem value="location_staff">Location Staff</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff List */}
      <div className="space-y-4">
        {filteredStaff.length > 0 ? (
          filteredStaff.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-lg">
                        {member.full_name ? member.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 
                         member.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">
                          {member.full_name || 'No name provided'}
                        </h3>
                        {getRoleBadge(member.role)}
                        {getStatusBadge(member.status)}
                      </div>
                      <p className="text-gray-600 flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {member.email}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>Invited {new Date(member.invited_at).toLocaleDateString()}</span>
                        {member.last_login && (
                          <span>Last login {new Date(member.last_login).toLocaleDateString()}</span>
                        )}
                        {member.location_name && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {member.location_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(member)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {member.status === 'active' ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700">
                            <UserX className="w-4 h-4 mr-1" />
                            Suspend
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Suspend Staff Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to suspend {member.full_name || member.email}? 
                              They will lose access to the system until reactivated.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleSuspendStaff(member)}>
                              Suspend
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : member.status === 'suspended' ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleActivateStaff(member)}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Activate
                      </Button>
                    ) : null}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {member.full_name || member.email} from your team? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemoveStaff(member)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Staff Members</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                  ? 'No staff members match your current filters.' 
                  : 'Get started by inviting your first staff member.'}
              </p>
              {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
                <Button onClick={() => setShowInviteDialog(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite First Staff Member
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update role and assignments for {selectedStaff?.full_name || selectedStaff?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_role">Role</Label>
              <Select value={editForm.role} onValueChange={(value: 'client_admin' | 'restaurant_admin' | 'location_staff') => setEditForm(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_admin">
                    <div className="flex items-center">
                      <Crown className="w-4 h-4 mr-2" />
                      Client Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="restaurant_admin">
                    <div className="flex items-center">
                      <Store className="w-4 h-4 mr-2" />
                      Restaurant Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="location_staff">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Location Staff
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.role === 'location_staff' && (
              <div>
                <Label htmlFor="edit_location">Assign to Location</Label>
                <Select value={editForm.location_id} onValueChange={(value) => setEditForm(prev => ({ ...prev, location_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} - {location.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="edit_status">Status</Label>
              <Select value={editForm.status} onValueChange={(value: 'active' | 'suspended' | 'pending') => setEditForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="suspended">
                    <div className="flex items-center">
                      <UserX className="w-4 h-4 mr-2" />
                      Suspended
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Pending
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleEditStaff} disabled={loading} className="flex-1">
                {loading ? 'Updating...' : 'Update Staff'}
              </Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
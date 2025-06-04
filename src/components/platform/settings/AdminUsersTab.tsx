// ============================================================================
// ADMIN USERS TAB COMPONENT
// Restaurant Loyalty Platform - Platform Administrator Management
// ============================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  Mail,
  Calendar,
  Key,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/platform/shared/StatusBadge';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface AdminUsersTabProps {
  className?: string;
  onCreateUser?: () => void;
  onEditUser?: (user: AdminUser) => void;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'platform_admin' | 'support_admin';
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  createdAt: string;
  permissions: string[];
}

interface AdminUserCardProps {
  user: AdminUser;
  onEdit?: (user: AdminUser) => void;
  onDelete?: (user: AdminUser) => void;
  onToggleStatus?: (user: AdminUser) => void;
  onResetPassword?: (user: AdminUser) => void;
}

// ============================================================================
// ADMIN USER CARD COMPONENT
// ============================================================================

const AdminUserCard: React.FC<AdminUserCardProps> = ({
  user,
  onEdit,
  onDelete,
  onToggleStatus,
  onResetPassword
}) => {
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', color: 'bg-red-100 text-red-800', icon: Shield };
      case 'platform_admin':
        return { label: 'Platform Admin', color: 'bg-blue-100 text-blue-800', icon: Users };
      case 'support_admin':
        return { label: 'Support Admin', color: 'bg-green-100 text-green-800', icon: UserCheck };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: Users };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(dateString);
  };

  const roleInfo = getRoleInfo(user.role);
  const RoleIcon = roleInfo.icon;

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <RoleIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {user.email}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={user.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit?.(user)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onResetPassword?.(user)}>
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStatus?.(user)}>
                  {user.status === 'active' ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete?.(user)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Role:</span>
            <Badge className={roleInfo.color}>
              {roleInfo.label}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last Login:</span>
            <span className="text-sm font-medium">{formatLastLogin(user.lastLogin)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Created:</span>
            <span className="text-sm font-medium">{formatDate(user.createdAt)}</span>
          </div>

          <div className="pt-3 border-t">
            <div className="text-sm text-gray-600 mb-2">Permissions:</div>
            <div className="flex flex-wrap gap-1">
              {user.permissions.slice(0, 3).map((permission) => (
                <Badge key={permission} variant="outline" className="text-xs">
                  {permission}
                </Badge>
              ))}
              {user.permissions.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{user.permissions.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// ADMIN USERS TAB COMPONENT
// ============================================================================

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  className,
  onCreateUser,
  onEditUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  // Mock data - in real implementation, this would come from a service
  const [users] = useState<AdminUser[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@zerioncore.com',
      role: 'super_admin',
      status: 'active',
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      permissions: ['all_access', 'user_management', 'system_config', 'billing_access']
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@zerioncore.com',
      role: 'platform_admin',
      status: 'active',
      lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      permissions: ['client_management', 'analytics_view', 'support_access']
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@zerioncore.com',
      role: 'support_admin',
      status: 'inactive',
      lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
      permissions: ['support_access', 'client_view']
    }
  ]);

  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    // In real implementation, this would call a service
    console.log('Deleting user:', userToDelete.id);
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleToggleStatus = (user: AdminUser) => {
    // In real implementation, this would call a service
    console.log('Toggling status for user:', user.id);
  };

  const handleResetPassword = (user: AdminUser) => {
    // In real implementation, this would call a service
    console.log('Resetting password for user:', user.id);
  };

  const openDeleteDialog = (user: AdminUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  return (
    <SectionErrorBoundary name="Admin Users Tab">
      <div className={cn('space-y-6', className)}>
        {/* Header and Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Admin Users Management
                </CardTitle>
                <CardDescription>
                  Manage platform administrators and their permissions • {filteredUsers.length} of {users.length} users
                </CardDescription>
              </div>
              <Button onClick={onCreateUser}>
                <Plus className="h-4 w-4 mr-2" />
                Add Admin User
              </Button>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="platform_admin">Platform Admin</SelectItem>
                  <SelectItem value="support_admin">Support Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Users Grid */}
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <AdminUserCard
                key={user.id}
                user={user}
                onEdit={onEditUser}
                onDelete={openDeleteDialog}
                onToggleStatus={handleToggleStatus}
                onResetPassword={handleResetPassword}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <Users className="h-16 w-16 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                      ? 'No Users Found' 
                      : 'No Admin Users Yet'
                    }
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                      ? 'No users match your current filters. Try adjusting your search criteria.'
                      : 'Get started by adding your first admin user to the platform.'
                    }
                  </p>
                  {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
                    <Button onClick={onCreateUser}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Admin User
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Admin User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{userToDelete?.name}</strong>? 
                This action cannot be undone and will revoke all their access to the platform.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SectionErrorBoundary>
  );
};

export default AdminUsersTab; 
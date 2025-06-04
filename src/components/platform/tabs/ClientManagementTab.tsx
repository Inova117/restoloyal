// ============================================================================
// CLIENT MANAGEMENT TAB COMPONENT
// Restaurant Loyalty Platform - Complete Client Management Interface
// ============================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Mail, 
  Users, 
  Building,
  Calendar,
  DollarSign
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
import { useClientManagement } from '@/hooks/platform/useClientManagement';
import { StatusBadge } from '@/components/platform/shared/StatusBadge';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';
import type { ClientData } from '@/services/platform/clientService';

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface ClientManagementTabProps {
  className?: string;
  onClientSelect?: (client: ClientData) => void;
  onCreateClient?: () => void;
  onEditClient?: (client: ClientData) => void;
}

interface ClientCardProps {
  client: ClientData;
  onSelect?: (client: ClientData) => void;
  onEdit?: (client: ClientData) => void;
  onDelete?: (client: ClientData) => void;
  onSendInvitation?: (client: ClientData) => void;
}

// ============================================================================
// CLIENT CARD COMPONENT
// ============================================================================

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onSelect,
  onEdit,
  onDelete,
  onSendInvitation
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg group-hover:text-blue-600 transition-colors cursor-pointer"
                      onClick={() => onSelect?.(client)}>
              {client.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="h-3 w-3" />
              Joined {formatDate(client.created_at)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={
              client.subscription_status === 'active' ? 'active' :
              client.subscription_status === 'cancelled' ? 'suspended' :
              client.subscription_status === 'suspended' ? 'suspended' :
              'trial'
            } />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onSelect?.(client)}>
                  <Users className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(client)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Client
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSendInvitation?.(client)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete?.(client)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{client.email || 'Not provided'}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Phone:</span>
            <span className="font-medium">{client.phone || 'Not provided'}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Plan:</span>
            <Badge variant="outline">
              {client.subscription_plan || 'Trial'}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {client.restaurant_count || 0}
              </div>
              <div className="text-xs text-gray-600">Restaurants</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {client.customer_count || 0}
              </div>
              <div className="text-xs text-gray-600">Customers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {formatCurrency(client.monthly_revenue || 0)}
              </div>
              <div className="text-xs text-gray-600">Revenue</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// CLIENT MANAGEMENT TAB COMPONENT
// ============================================================================

export const ClientManagementTab: React.FC<ClientManagementTabProps> = ({
  className,
  onClientSelect,
  onCreateClient,
  onEditClient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientData | null>(null);

  const {
    clients,
    loading,
    error,
    loadClients,
    deleteClient,
    sendInvitation,
    selectClient
  } = useClientManagement({ autoLoad: true });

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    const success = await deleteClient(clientToDelete.id, clientToDelete.name);
    if (success) {
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const handleSendInvitation = async (client: ClientData) => {
    if (!client.email) {
      // Handle case where client has no email
      return;
    }
    await sendInvitation(client.id, client.email, client.name);
  };

  const openDeleteDialog = (client: ClientData) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  // Loading state
  if (loading && clients.length === 0) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
              </div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <SectionErrorBoundary name="Client Management Tab">
      <div className={cn('space-y-6', className)}>
        {/* Header and Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Client Management
                </CardTitle>
                <CardDescription>
                  Manage all clients on the platform • {filteredClients.length} of {clients.length} clients
                </CardDescription>
              </div>
              <Button onClick={onCreateClient}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search clients by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadClients()}>
                Refresh
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="text-red-600">
                  <Building className="h-12 w-12 mx-auto mb-4" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Failed to Load Clients
                  </h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={() => loadClients()} variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clients Grid */}
        {!error && (
          <>
            {filteredClients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onSelect={(client) => {
                      selectClient(client);
                      onClientSelect?.(client);
                    }}
                    onEdit={onEditClient}
                    onDelete={openDeleteDialog}
                    onSendInvitation={handleSendInvitation}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <Building className="h-16 w-16 text-gray-400 mx-auto" />
                    <div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">
                        {searchTerm ? 'No Clients Found' : 'No Clients Yet'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm 
                          ? `No clients match "${searchTerm}". Try adjusting your search.`
                          : 'Get started by adding your first client to the platform.'
                        }
                      </p>
                      {!searchTerm && (
                        <Button onClick={onCreateClient}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Client
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{clientToDelete?.name}</strong>? 
                This action cannot be undone and will remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteClient}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Client
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SectionErrorBoundary>
  );
};

export default ClientManagementTab; 
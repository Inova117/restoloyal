// ============================================================================
// CLIENT LIST - UPDATED FOR 4-TIER HIERARCHY
// ============================================================================
// This component displays and manages clients (Tier 2) in the system
// Can only be used by superadmins (Tier 1)
// ============================================================================

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useUserRole } from '@/hooks/useUserRole'
import { Building, Users, MapPin, Mail, Phone, Calendar, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Client } from '@/types/database'

interface ClientWithStats extends Client {
  location_count?: number
  staff_count?: number
  customer_count?: number
  admin_count?: number
}

interface ClientListProps {
  refreshTrigger?: number // Used to trigger refresh from parent
}

export default function ClientList({ refreshTrigger }: ClientListProps) {
  const [clients, setClients] = useState<ClientWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const { role } = useUserRole()
  const { toast } = useToast()

  useEffect(() => {
    loadClients()
  }, [refreshTrigger])

  const loadClients = async () => {
    setLoading(true)
    try {
      // Get clients with basic info
      const { data: clientsData, error: clientsError } = await (supabase as any)
        .from('clients')
        .select(`
          id,
          name,
          business_type,
          email,
          phone,
          address,
          city,
          state,
          country,
          status,
          created_at,
          updated_at
        `)
        .order('name')

      if (clientsError) throw clientsError

      // Get stats for each client
      const clientsWithStats = await Promise.all(
        (clientsData || []).map(async (client) => {
          try {
            // Get location count
            const { count: locationCount } = await (supabase as any)
              .from('locations')
              .select('*', { count: 'exact', head: true })
              .eq('client_id', client.id)
              .eq('is_active', true)

            // Get staff count
            const { count: staffCount } = await (supabase as any)
              .from('location_staff')
              .select('*', { count: 'exact', head: true })
              .eq('client_id', client.id)
              .eq('is_active', true)

            // Get customer count
            const { count: customerCount } = await (supabase as any)
              .from('customers')
              .select('*', { count: 'exact', head: true })
              .eq('client_id', client.id)
              .eq('is_active', true)

            // Get admin count
            const { count: adminCount } = await (supabase as any)
              .from('client_admins')
              .select('*', { count: 'exact', head: true })
              .eq('client_id', client.id)
              .eq('is_active', true)

            return {
              ...client,
              location_count: locationCount || 0,
              staff_count: staffCount || 0,
              customer_count: customerCount || 0,
              admin_count: adminCount || 0
            }
          } catch (error) {
            console.error(`Error loading stats for client ${client.id}:`, error)
            return {
              ...client,
              location_count: 0,
              staff_count: 0,
              customer_count: 0,
              admin_count: 0
            }
          }
        })
      )

      setClients(clientsWithStats)
    } catch (error) {
      console.error('Error loading clients:', error)
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (clientId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('clients')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)

      if (error) throw error

      toast({
        title: "Status Updated",
        description: `Client ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      })

      loadClients() // Refresh the list
    } catch (error) {
      console.error('Error updating client status:', error)
      toast({
        title: "Error",
        description: "Failed to update client status",
        variant: "destructive"
      })
    }
  }

  // Only superadmins can view client list
  if (role !== 'superadmin') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Access denied. Only platform administrators can view client list.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Clients
          </CardTitle>
          <CardDescription>
            Loading client information...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Clients ({clients.length})
        </CardTitle>
        <CardDescription>
          Manage all clients in the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-8">
            <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Clients Found</h3>
            <p className="text-muted-foreground">
              No clients have been created yet. Use the "Add Client" button to create the first client.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <Card key={client.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Building className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-lg">{client.name}</h3>
                        </div>
                        <Badge variant={client.is_active ? "default" : "secondary"}>
                          {client.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {client.business_type && (
                          <Badge variant="outline">
                            {client.business_type}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{client.location_count} Locations</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{client.staff_count} Staff</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{client.customer_count} Customers</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{client.admin_count} Admins</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        {client.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {(client.city || client.state || client.country) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {[client.city, client.state, client.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Created {new Date(client.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(client.id, client.is_active)}
                        >
                          {client.is_active ? (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

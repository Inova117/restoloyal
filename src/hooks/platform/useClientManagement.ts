// ============================================================================
// USE CLIENT MANAGEMENT HOOK
// Restaurant Loyalty Platform - Client Management State Hook
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { clientService, type ClientData, type CreateClientData, type UpdateClientData, type ClientFilters } from '@/services/platform/clientService';
import { logInfo, logError } from '@/lib/logger';

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface UseClientManagementReturn {
  // State
  clients: ClientData[];
  loading: boolean;
  error: string | null;
  selectedClient: ClientData | null;
  
  // Actions
  loadClients: (filters?: ClientFilters) => Promise<void>;
  createClient: (data: CreateClientData) => Promise<boolean>;
  updateClient: (id: string, data: UpdateClientData) => Promise<boolean>;
  deleteClient: (id: string, clientName: string) => Promise<boolean>;
  selectClient: (client: ClientData | null) => void;
  sendInvitation: (clientId: string, email: string, clientName: string) => Promise<boolean>;
  
  // Computed values
  filteredClients: ClientData[];
  clientCount: number;
}

export interface UseClientManagementOptions {
  autoLoad?: boolean;
  initialFilters?: ClientFilters;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useClientManagement(options: UseClientManagementOptions = {}): UseClientManagementReturn {
  const { autoLoad = true, initialFilters } = options;
  const { toast } = useToast();

  // State
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [filters, setFilters] = useState<ClientFilters>(initialFilters || {});

  // Load clients from the service
  const loadClients = useCallback(async (newFilters?: ClientFilters) => {
    setLoading(true);
    setError(null);

    try {
      logInfo('Loading clients', { filters: newFilters || filters }, 'useClientManagement');

      const filtersToUse = newFilters || filters;
      const response = await clientService.getClients(filtersToUse);

      if (response.success && response.data) {
        setClients(response.data);
        logInfo('Clients loaded successfully', { count: response.data.length }, 'useClientManagement');
      } else {
        const errorMessage = response.error?.message || 'Failed to load clients';
        setError(errorMessage);
        logError('Failed to load clients', { error: response.error }, 'useClientManagement');
        
        toast({
          title: 'Error Loading Clients',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred while loading clients';
      setError(errorMessage);
      logError('Unexpected error loading clients', { error: err }, 'useClientManagement');
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Create a new client
  const createClient = useCallback(async (data: CreateClientData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      logInfo('Creating new client', { name: data.name }, 'useClientManagement');

      const response = await clientService.createClient(data);

      if (response.success && response.data) {
        // Add the new client to the list
        setClients(prev => [response.data!, ...prev]);
        
        logInfo('Client created successfully', { id: response.data.id, name: response.data.name }, 'useClientManagement');
        
        toast({
          title: 'Client Created',
          description: `${data.name} has been successfully added to the platform.`
        });

        return true;
      } else {
        const errorMessage = response.error?.message || 'Failed to create client';
        setError(errorMessage);
        logError('Failed to create client', { error: response.error }, 'useClientManagement');
        
        toast({
          title: 'Error Creating Client',
          description: errorMessage,
          variant: 'destructive'
        });

        return false;
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred while creating the client';
      setError(errorMessage);
      logError('Unexpected error creating client', { error: err }, 'useClientManagement');
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });

      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Update an existing client
  const updateClient = useCallback(async (id: string, data: UpdateClientData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      logInfo('Updating client', { id, updates: Object.keys(data) }, 'useClientManagement');

      const response = await clientService.updateClient(id, data);

      if (response.success && response.data) {
        // Update the client in the list
        setClients(prev => prev.map(client => 
          client.id === id ? response.data! : client
        ));

        // Update selected client if it's the one being updated
        if (selectedClient?.id === id) {
          setSelectedClient(response.data);
        }
        
        logInfo('Client updated successfully', { id, name: response.data.name }, 'useClientManagement');
        
        toast({
          title: 'Client Updated',
          description: `${response.data.name} has been successfully updated.`
        });

        return true;
      } else {
        const errorMessage = response.error?.message || 'Failed to update client';
        setError(errorMessage);
        logError('Failed to update client', { error: response.error }, 'useClientManagement');
        
        toast({
          title: 'Error Updating Client',
          description: errorMessage,
          variant: 'destructive'
        });

        return false;
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred while updating the client';
      setError(errorMessage);
      logError('Unexpected error updating client', { error: err }, 'useClientManagement');
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });

      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedClient, toast]);

  // Delete a client
  const deleteClient = useCallback(async (id: string, clientName: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      logInfo('Deleting client', { id, name: clientName }, 'useClientManagement');

      const response = await clientService.deleteClient(id);

      if (response.success) {
        // Remove the client from the list
        setClients(prev => prev.filter(client => client.id !== id));

        // Clear selected client if it's the one being deleted
        if (selectedClient?.id === id) {
          setSelectedClient(null);
        }
        
        logInfo('Client deleted successfully', { id, name: clientName }, 'useClientManagement');
        
        toast({
          title: 'Client Deleted',
          description: `${clientName} has been successfully removed from the platform.`
        });

        return true;
      } else {
        const errorMessage = response.error?.message || 'Failed to delete client';
        setError(errorMessage);
        logError('Failed to delete client', { error: response.error }, 'useClientManagement');
        
        toast({
          title: 'Error Deleting Client',
          description: errorMessage,
          variant: 'destructive'
        });

        return false;
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred while deleting the client';
      setError(errorMessage);
      logError('Unexpected error deleting client', { error: err }, 'useClientManagement');
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });

      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedClient, toast]);

  // Select a client
  const selectClient = useCallback((client: ClientData | null) => {
    setSelectedClient(client);
    logInfo('Client selected', { id: client?.id, name: client?.name }, 'useClientManagement');
  }, []);

  // Send invitation email
  const sendInvitation = useCallback(async (clientId: string, email: string, clientName: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      logInfo('Sending client invitation', { clientId, email, clientName }, 'useClientManagement');

      const response = await clientService.sendClientInvitation(clientId, email);

      if (response.success) {
        logInfo('Invitation sent successfully', { clientId, email }, 'useClientManagement');
        
        toast({
          title: 'Invitation Sent',
          description: `Invitation email has been sent to ${email} for ${clientName}.`
        });

        return true;
      } else {
        const errorMessage = response.error?.message || 'Failed to send invitation';
        setError(errorMessage);
        logError('Failed to send invitation', { error: response.error }, 'useClientManagement');
        
        toast({
          title: 'Error Sending Invitation',
          description: errorMessage,
          variant: 'destructive'
        });

        return false;
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred while sending the invitation';
      setError(errorMessage);
      logError('Unexpected error sending invitation', { error: err }, 'useClientManagement');
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });

      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Computed values
  const filteredClients = clients; // For now, filtering is done at the service level
  const clientCount = clients.length;

  // Auto-load clients on mount
  useEffect(() => {
    if (autoLoad) {
      loadClients();
    }
  }, [autoLoad, loadClients]);

  return {
    // State
    clients,
    loading,
    error,
    selectedClient,
    
    // Actions
    loadClients,
    createClient,
    updateClient,
    deleteClient,
    selectClient,
    sendInvitation,
    
    // Computed values
    filteredClients,
    clientCount
  };
}

export default useClientManagement; 
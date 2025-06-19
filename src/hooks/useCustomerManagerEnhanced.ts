import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

// ============================================================================
// INTERFACES
// ============================================================================

export interface CustomerSearchFilters {
  search?: string
  status?: 'active' | 'inactive' | 'suspended'
  location_id?: string
  date_range?: {
    start: string
    end: string
  }
  stamp_range?: {
    min: number
    max: number
  }
  loyalty_status?: 'bronze' | 'silver' | 'gold' | 'platinum'
  sort_by?: 'name' | 'created_at' | 'total_stamps' | 'last_visit'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface BulkOperation {
  operation: 'update_status' | 'add_stamps' | 'delete'
  customer_ids: string[]
  data?: {
    status?: string
    stamp_count?: number
    notes?: string
  }
}

export interface CustomerAnalytics {
  customer_id: string
  visit_frequency: number
  average_stamps_per_visit: number
  total_spent_estimate: number
  last_visit_days_ago: number
  loyalty_level: 'bronze' | 'silver' | 'gold' | 'platinum'
  predicted_churn_risk: 'low' | 'medium' | 'high'
  lifetime_value_score: number
}

export interface EnhancedCustomer {
  id: string
  client_id: string
  location_id: string
  name: string
  email?: string
  phone?: string
  qr_code: string
  total_stamps: number
  status: string
  created_at: string
  updated_at: string
  last_visit?: string
  visit_count: number
  analytics?: CustomerAnalytics
}

export interface DetailedAnalytics extends CustomerAnalytics {
  stamp_history: Array<{
    date: string
    count: number
    amount: number
  }>
  reward_history: Array<{
    date: string
    type: string
    stamps_used: number
  }>
  monthly_activity: Array<{
    month: string
    stamps: number
  }>
  engagement_score: number
  trends: {
    stamps_trend: 'increasing' | 'decreasing' | 'stable'
    visit_trend: 'increasing' | 'decreasing' | 'stable'
  }
}

export interface CustomerExport {
  format: 'csv' | 'json'
  filters?: CustomerSearchFilters
  include_analytics?: boolean
}

export interface CustomerSearchResponse {
  success: boolean
  data?: {
    customers: EnhancedCustomer[]
    total_count: number
    filters_applied: CustomerSearchFilters
  }
  message?: string
  error?: string
}

export interface BulkOperationResponse {
  success: boolean
  data?: {
    operation: string
    customers_affected: number
    results: any[]
  }
  message?: string
  error?: string
}

export interface CustomerAnalyticsResponse {
  success: boolean
  data?: {
    customer: {
      id: string
      name: string
      email?: string
      phone?: string
      total_stamps: number
      status: string
      created_at: string
    }
    analytics: DetailedAnalytics
    summary: {
      total_visits: number
      total_rewards_redeemed: number
      account_age_days: number
      last_activity: string
    }
  }
  message?: string
  error?: string
}

// ============================================================================
// HOOK
// ============================================================================

export const useCustomerManagerEnhanced = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  // Advanced Customer Search
  const searchCustomers = async (filters: CustomerSearchFilters): Promise<CustomerSearchResponse> => {
    setIsSearching(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-manager-enhanced?operation=search-customers`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(filters)
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search customers')
      }

      return data

    } catch (error) {
      console.error('Customer search error:', error)
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      })
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Search failed' 
      }
    } finally {
      setIsSearching(false)
    }
  }

  // Bulk Operations
  const performBulkOperation = async (operation: BulkOperation): Promise<BulkOperationResponse> => {
    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-manager-enhanced?operation=bulk-operations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(operation)
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Bulk operation failed')
      }

      toast({
        title: "Bulk Operation Success",
        description: data.message || `${operation.operation} completed successfully`,
      })

      return data

    } catch (error) {
      console.error('Bulk operation error:', error)
      toast({
        title: "Bulk Operation Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      })
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bulk operation failed' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Customer Analytics
  const getCustomerAnalytics = async (customerId: string): Promise<CustomerAnalyticsResponse> => {
    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-manager-enhanced?operation=customer-analytics&customer_id=${customerId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get customer analytics')
      }

      return data

    } catch (error) {
      console.error('Customer analytics error:', error)
      toast({
        title: "Analytics Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      })
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Analytics failed' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Export Customers
  const exportCustomers = async (exportConfig: CustomerExport): Promise<boolean> => {
    setIsExporting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-manager-enhanced?operation=export-customers`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(exportConfig)
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `customers_export_${Date.now()}.${exportConfig.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Success",
        description: `Customer data exported as ${exportConfig.format.toUpperCase()}`,
      })

      return true

    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      })
      return false
    } finally {
      setIsExporting(false)
    }
  }

  // Bulk Update Status
  const bulkUpdateStatus = async (customerIds: string[], status: string): Promise<boolean> => {
    const operation: BulkOperation = {
      operation: 'update_status',
      customer_ids: customerIds,
      data: { status }
    }

    const result = await performBulkOperation(operation)
    return result.success
  }

  // Bulk Add Stamps
  const bulkAddStamps = async (customerIds: string[], stampCount: number, notes?: string): Promise<boolean> => {
    const operation: BulkOperation = {
      operation: 'add_stamps',
      customer_ids: customerIds,
      data: { stamp_count: stampCount, notes }
    }

    const result = await performBulkOperation(operation)
    return result.success
  }

  // Bulk Delete
  const bulkDeleteCustomers = async (customerIds: string[]): Promise<boolean> => {
    const operation: BulkOperation = {
      operation: 'delete',
      customer_ids: customerIds
    }

    const result = await performBulkOperation(operation)
    return result.success
  }

  return {
    // State
    isLoading,
    isSearching,
    isExporting,

    // Methods
    searchCustomers,
    getCustomerAnalytics,
    exportCustomers,
    performBulkOperation,

    // Convenience methods
    bulkUpdateStatus,
    bulkAddStamps,
    bulkDeleteCustomers
  }
} 
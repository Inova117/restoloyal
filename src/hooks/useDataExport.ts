import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

// Mock mode flag - set to false when Edge Functions are deployed
const MOCK_MODE = true

export interface ExportRequest {
  type: 'customers' | 'rewards' | 'transactions' | 'analytics'
  location_id?: string
  date_from?: string
  date_to?: string
  format?: 'csv' | 'json'
  filters?: Record<string, any>
}

export interface ExportMetadata {
  export_type: string
  record_count: number
  date_from: string
  date_to: string
  exported_at: string
}

export interface ExportResponse {
  success: boolean
  data?: any[]
  metadata?: ExportMetadata
  error?: string
}

// Mock data for testing
const generateMockCustomerData = (count: number = 50) => {
  const customers = []
  const locations = ['Main Street Store', 'Mall Location', 'Airport Branch']
  const statuses = ['active', 'inactive', 'blocked']
  
  for (let i = 1; i <= count; i++) {
    customers.push({
      id: `customer_${i}`,
      name: `Customer ${i}`,
      email: `customer${i}@example.com`,
      phone: `+1-555-${String(i).padStart(4, '0')}`,
      location_name: locations[i % locations.length],
      status: statuses[i % statuses.length],
      total_stamps: Math.floor(Math.random() * 20),
      total_rewards: Math.floor(Math.random() * 5),
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    })
  }
  return customers
}

const generateMockRewardData = (count: number = 30) => {
  const rewards = []
  const locations = ['Main Street Store', 'Mall Location', 'Airport Branch']
  const rewardTypes = ['free_item', 'discount', 'bonus_stamps']
  const statuses = ['redeemed', 'pending', 'expired']
  
  for (let i = 1; i <= count; i++) {
    rewards.push({
      id: `reward_${i}`,
      customer_name: `Customer ${i}`,
      customer_email: `customer${i}@example.com`,
      reward_type: rewardTypes[i % rewardTypes.length],
      reward_value: `$${(Math.random() * 20 + 5).toFixed(2)}`,
      location_name: locations[i % locations.length],
      redeemed_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      stamps_used: Math.floor(Math.random() * 10 + 5),
      status: statuses[i % statuses.length]
    })
  }
  return rewards
}

const generateMockTransactionData = (count: number = 100) => {
  const transactions = []
  const locations = ['Main Street Store', 'Mall Location', 'Airport Branch']
  
  for (let i = 1; i <= count; i++) {
    transactions.push({
      id: `transaction_${i}`,
      customer_name: `Customer ${Math.floor(i / 2) + 1}`,
      customer_email: `customer${Math.floor(i / 2) + 1}@example.com`,
      location_name: locations[i % locations.length],
      transaction_type: 'stamp_earned',
      stamps_earned: Math.floor(Math.random() * 5 + 1),
      amount: Math.random() * 50 + 10,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: i % 5 === 0 ? 'Bonus promotion applied' : ''
    })
  }
  return transactions
}

const generateMockAnalyticsData = () => {
  const locations = ['Main Street Store', 'Mall Location', 'Airport Branch']
  const metrics = ['total_customers', 'active_customers', 'total_rewards', 'total_stamps']
  const data = []
  
  locations.forEach(location => {
    metrics.forEach(metric => {
      let value = 0
      switch (metric) {
        case 'total_customers':
          value = Math.floor(Math.random() * 500 + 200)
          break
        case 'active_customers':
          value = Math.floor(Math.random() * 300 + 100)
          break
        case 'total_rewards':
          value = Math.floor(Math.random() * 100 + 20)
          break
        case 'total_stamps':
          value = Math.floor(Math.random() * 2000 + 500)
          break
      }
      
      data.push({
        metric,
        location,
        period: '2024-01-01 to 2024-01-31',
        value,
        growth_rate: (Math.random() * 20 - 10).toFixed(1),
        last_updated: new Date().toISOString()
      })
    })
  })
  
  return data
}

export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const exportData = async (request: ExportRequest): Promise<ExportResponse> => {
    setIsExporting(true)

    try {
      if (MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        let mockData: any[] = []
        
        switch (request.type) {
          case 'customers':
            mockData = generateMockCustomerData()
            break
          case 'rewards':
            mockData = generateMockRewardData()
            break
          case 'transactions':
            mockData = generateMockTransactionData()
            break
          case 'analytics':
            mockData = generateMockAnalyticsData()
            break
        }

        // Filter by location if specified
        if (request.location_id && request.type !== 'analytics') {
          const locationNames = {
            'loc_1': 'Main Street Store',
            'loc_2': 'Mall Location',
            'loc_3': 'Airport Branch'
          }
          const locationName = locationNames[request.location_id as keyof typeof locationNames]
          if (locationName) {
            mockData = mockData.filter((item: any) => item.location_name === locationName)
          }
        }

        // Filter by date range if specified
        if (request.date_from || request.date_to) {
          const fromDate = request.date_from ? new Date(request.date_from) : new Date(0)
          const toDate = request.date_to ? new Date(request.date_to) : new Date()
          
          mockData = mockData.filter((item: any) => {
            const itemDate = new Date(item.created_at || item.redeemed_at || item.last_updated)
            return itemDate >= fromDate && itemDate <= toDate
          })
        }

        const response: ExportResponse = {
          success: true,
          data: mockData,
          metadata: {
            export_type: request.type,
            record_count: mockData.length,
            date_from: request.date_from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            date_to: request.date_to || new Date().toISOString(),
            exported_at: new Date().toISOString()
          }
        }

        // Generate and download file
        if (request.format === 'json') {
          downloadJSON(response, `${request.type}_export_${new Date().toISOString().split('T')[0]}.json`)
        } else {
          downloadCSV(mockData, `${request.type}_export_${new Date().toISOString().split('T')[0]}.csv`)
        }

        toast({
          title: "Export Successful",
          description: `Exported ${mockData.length} ${request.type} records`,
        })

        return response
      }

      // Production mode - call actual Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }

      // Handle CSV response
      if (request.format === 'csv' || !request.format) {
        const csvContent = await response.text()
        const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'export.csv'
        downloadCSVContent(csvContent, filename)
        
        toast({
          title: "Export Successful",
          description: `CSV file downloaded successfully`,
        })

        return { success: true }
      }

      // Handle JSON response
      const jsonData = await response.json()
      
      if (jsonData.success) {
        const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'export.json'
        downloadJSON(jsonData, filename)
        
        toast({
          title: "Export Successful",
          description: `Exported ${jsonData.metadata?.record_count || 0} records`,
        })
      }

      return jsonData

    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      })
      return { success: false, error: error instanceof Error ? error.message : 'Export failed' }
    } finally {
      setIsExporting(false)
    }
  }

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value || ''
        }).join(',')
      )
    ].join('\n')

    downloadCSVContent(csvContent, filename)
  }

  const downloadCSVContent = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadJSON = (data: any, filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    exportData,
    isExporting
  }
} 
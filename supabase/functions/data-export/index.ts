import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportRequest {
  type: 'customers' | 'rewards' | 'transactions' | 'analytics'
  location_id?: string
  date_from?: string
  date_to?: string
  format?: 'csv' | 'json'
  filters?: Record<string, any>
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  location_name: string
  status: string
  total_stamps: number
  total_visits: number
  total_rewards: number
  last_visit: string
  created_at: string
}

interface Reward {
  id: string
  customer_name: string
  customer_email: string
  reward_type: string
  reward_value: string
  location_name: string
  redeemed_at: string
  stamps_used: number
  status: string
}

interface Transaction {
  id: string
  customer_name: string
  customer_email: string
  location_name: string
  transaction_type: string
  stamps_earned: number
  amount: number
  created_at: string
  notes: string
}

interface AnalyticsExport {
  metric: string
  location: string
  period: string
  value: number
  growth_rate: number
  last_updated: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify JWT token and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user role and client_id
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role, client_id')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      return new Response(
        JSON.stringify({ error: 'User role not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has permission to export data
    let isAuthorized = false
    let clientId = userRole.client_id

    if (userRole.role === 'client_admin') {
      isAuthorized = true
    } else {
      // Also check if user is a platform admin
      const { data: platformAdminCheck, error: platformAdminError } = await supabaseClient
        .from('platform_admin_users')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['super_admin', 'admin'])
        .eq('status', 'active')
        .single()

      if (!platformAdminError && platformAdminCheck) {
        isAuthorized = true
        // For platform admins, we need to get client_id from request or use the user's assigned client
        // For now, use the user's client_id from user_roles
      }
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions for data export' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const exportRequest: ExportRequest = await req.json()
    
    // Validate export type
    if (!['customers', 'rewards', 'transactions', 'analytics'].includes(exportRequest.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid export type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Set default format
    const format = exportRequest.format || 'csv'

    // Build date filters
    const dateFrom = exportRequest.date_from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const dateTo = exportRequest.date_to || new Date().toISOString()

    let data: any[] = []
    let filename = ''

    // Export customers data
    if (exportRequest.type === 'customers') {
      const query = supabaseClient
        .from('customers')
        .select(`
          id,
          name,
          email,
          phone,
          status,
          created_at,
          locations!inner(name),
          stamps(count),
          rewards(count)
        `)
        .eq('client_id', clientId)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo)

      if (exportRequest.location_id) {
        query.eq('location_id', exportRequest.location_id)
      }

      const { data: customers, error } = await query

      if (error) {
        throw new Error(`Failed to fetch customers: ${error.message}`)
      }

      data = customers?.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        location_name: customer.locations?.name || 'Unknown',
        status: customer.status,
        total_stamps: customer.stamps?.[0]?.count || 0,
        total_rewards: customer.rewards?.[0]?.count || 0,
        created_at: customer.created_at
      })) || []

      filename = `customers_export_${new Date().toISOString().split('T')[0]}`
    }

    // Export rewards data
    else if (exportRequest.type === 'rewards') {
      const { data: rewards, error } = await supabaseClient
        .from('rewards')
        .select(`
          id,
          reward_type,
          reward_value,
          redeemed_at,
          stamps_used,
          status,
          customers!inner(name, email),
          locations!inner(name)
        `)
        .eq('client_id', clientId)
        .gte('redeemed_at', dateFrom)
        .lte('redeemed_at', dateTo)
        .eq('location_id', exportRequest.location_id || undefined)

      if (error) {
        throw new Error(`Failed to fetch rewards: ${error.message}`)
      }

      data = rewards?.map((reward: any) => ({
        id: reward.id,
        customer_name: reward.customers?.name || 'Unknown',
        customer_email: reward.customers?.email || 'Unknown',
        reward_type: reward.reward_type,
        reward_value: reward.reward_value,
        location_name: reward.locations?.name || 'Unknown',
        redeemed_at: reward.redeemed_at,
        stamps_used: reward.stamps_used,
        status: reward.status
      })) || []

      filename = `rewards_export_${new Date().toISOString().split('T')[0]}`
    }

    // Export transactions data
    else if (exportRequest.type === 'transactions') {
      const { data: stamps, error } = await supabaseClient
        .from('stamps')
        .select(`
          id,
          stamps_earned,
          amount,
          created_at,
          notes,
          customers!inner(name, email),
          locations!inner(name)
        `)
        .eq('client_id', clientId)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo)
        .eq('location_id', exportRequest.location_id || undefined)

      if (error) {
        throw new Error(`Failed to fetch transactions: ${error.message}`)
      }

      data = stamps?.map((stamp: any) => ({
        id: stamp.id,
        customer_name: stamp.customers?.name || 'Unknown',
        customer_email: stamp.customers?.email || 'Unknown',
        location_name: stamp.locations?.name || 'Unknown',
        transaction_type: 'stamp_earned',
        stamps_earned: stamp.stamps_earned,
        amount: stamp.amount || 0,
        created_at: stamp.created_at,
        notes: stamp.notes || ''
      })) || []

      filename = `transactions_export_${new Date().toISOString().split('T')[0]}`
    }

    // Export analytics data
    else if (exportRequest.type === 'analytics') {
      // Get aggregate metrics
      const { data: customers } = await supabaseClient
        .from('customers')
        .select('id, status, created_at, location_id, locations!inner(name)')
        .eq('client_id', clientId)

      const { data: rewards } = await supabaseClient
        .from('rewards')
        .select('id, redeemed_at, location_id, locations!inner(name)')
        .eq('client_id', clientId)

      const { data: stamps } = await supabaseClient
        .from('stamps')
        .select('id, stamps_earned, created_at, location_id, locations!inner(name)')
        .eq('client_id', clientId)

      // Build analytics export data
      const locationMetrics = new Map()
      
      // Process customers by location
      customers?.forEach((customer: any) => {
        const locationName = customer.locations?.name || 'Unknown'
        if (!locationMetrics.has(locationName)) {
          locationMetrics.set(locationName, {
            total_customers: 0,
            active_customers: 0,
            total_rewards: 0,
            total_stamps: 0
          })
        }
        const metrics = locationMetrics.get(locationName)
        metrics.total_customers++
        if (customer.status === 'active') {
          metrics.active_customers++
        }
      })

      // Process rewards by location
      rewards?.forEach((reward: any) => {
        const locationName = reward.locations?.name || 'Unknown'
        if (locationMetrics.has(locationName)) {
          locationMetrics.get(locationName).total_rewards++
        }
      })

      // Process stamps by location
      stamps?.forEach((stamp: any) => {
        const locationName = stamp.locations?.name || 'Unknown'
        if (locationMetrics.has(locationName)) {
          locationMetrics.get(locationName).total_stamps += stamp.stamps_earned || 0
        }
      })

      // Convert to export format
      data = Array.from(locationMetrics.entries()).flatMap(([location, metrics]) => [
        {
          metric: 'total_customers',
          location,
          period: `${dateFrom.split('T')[0]} to ${dateTo.split('T')[0]}`,
          value: metrics.total_customers,
          growth_rate: 0,
          last_updated: new Date().toISOString()
        },
        {
          metric: 'active_customers',
          location,
          period: `${dateFrom.split('T')[0]} to ${dateTo.split('T')[0]}`,
          value: metrics.active_customers,
          growth_rate: 0,
          last_updated: new Date().toISOString()
        },
        {
          metric: 'total_rewards',
          location,
          period: `${dateFrom.split('T')[0]} to ${dateTo.split('T')[0]}`,
          value: metrics.total_rewards,
          growth_rate: 0,
          last_updated: new Date().toISOString()
        },
        {
          metric: 'total_stamps',
          location,
          period: `${dateFrom.split('T')[0]} to ${dateTo.split('T')[0]}`,
          value: metrics.total_stamps,
          growth_rate: 0,
          last_updated: new Date().toISOString()
        }
      ])

      filename = `analytics_export_${new Date().toISOString().split('T')[0]}`
    }

    // Log export action for audit trail
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'data_export',
        resource_type: exportRequest.type,
        resource_id: null,
        details: {
          export_type: exportRequest.type,
          location_id: exportRequest.location_id,
          date_from: dateFrom,
          date_to: dateTo,
          format,
          record_count: data.length
        },
        client_id: clientId
      })

    // Return data based on format
    if (format === 'json') {
      return new Response(
        JSON.stringify({
          success: true,
          data,
          metadata: {
            export_type: exportRequest.type,
            record_count: data.length,
            date_from: dateFrom,
            date_to: dateTo,
            exported_at: new Date().toISOString()
          }
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}.json"`
          }
        }
      )
    }

    // Convert to CSV format
    if (data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No data found for the specified criteria' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    return new Response(csvContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Export failed', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 
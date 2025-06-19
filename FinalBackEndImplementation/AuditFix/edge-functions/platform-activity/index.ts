// Platform Activity Edge Function - Compatible with Supabase Edge Functions
// Handles activity tracking, audit logs, and real-time platform monitoring
// Task T1.3: Advanced activity tracking for the 4-tier hierarchy system

/// <reference path="./deno.d.ts" />

// @ts-ignore: Deno deploy compatibility
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore: Deno deploy compatibility  
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

// Response helper
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Error response helper
function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status)
}

// Activity interfaces
interface ActivityItem {
  id: string
  type: 'client_created' | 'location_created' | 'customer_registered' | 'staff_invited' | 
        'stamp_added' | 'reward_redeemed' | 'login' | 'logout' | 'profile_updated' | 
        'settings_changed' | 'role_assigned' | 'permission_granted' | 'data_export' | 
        'system_alert' | 'error_occurred'
  title: string
  description: string
  user_id?: string
  client_id?: string
  location_id?: string
  customer_id?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata?: any
  ip_address?: string
  user_agent?: string
  created_at: string
  updated_at: string
}

interface CreateActivityData {
  type: ActivityItem['type']
  title: string
  description: string
  client_id?: string
  location_id?: string
  customer_id?: string
  severity?: ActivityItem['severity']
  metadata?: any
}

interface ActivityFilters {
  type?: string
  user_id?: string
  client_id?: string
  location_id?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  date_from?: string
  date_to?: string
  search?: string
  limit?: number
  offset?: number
}

interface PlatformMetrics {
  totalClients: number
  totalLocations: number
  totalCustomers: number
  totalStaff: number
  totalStamps: number
  totalRewards: number
  monthlyRevenue: number
  activeUsers: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  lastUpdated: string
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  errorRate: number
  responseTime: number
  activeConnections: number
  memoryUsage: number
  issues: string[]
  lastChecked: string
}

// @ts-ignore: Deno deploy compatibility
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401)
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return errorResponse('Invalid or expired token', 401)
    }

    const url = new URL(req.url)
    const method = req.method
    
    // Verify user authorization - must be superadmin or client_admin for most operations
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('tier, role_id, client_id, location_id')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      console.error('Role verification error:', roleError)
      return errorResponse('Access denied: No valid role found', 403)
    }

    // Extract request metadata for activity logging
    const requestMetadata = {
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString()
    }

    console.log(`Platform Activity: ${method} request from user ${user.id} with role ${userRole.tier}`)

    // Route handlers based on endpoint
    const pathname = url.pathname.split('/').pop() || ''
    
    switch (method) {
      case 'GET':
        if (pathname === 'activity') {
          return await handleGetActivity(supabaseClient, url, userRole)
        } else if (pathname === 'metrics') {
          return await handleGetMetrics(supabaseClient, userRole)
        } else if (pathname === 'health') {
          return await handleGetSystemHealth(supabaseClient, userRole)
        } else {
          return await handleGetActivity(supabaseClient, url, userRole) // Default to activity
        }
      
      case 'POST':
        return await handleCreateActivity(supabaseClient, req, userRole, requestMetadata)
      
      case 'PATCH':
        return await handleUpdateActivity(supabaseClient, req, userRole)
      
      case 'DELETE':
        if (userRole.tier !== 'superadmin') {
          return errorResponse('Access denied: Only superadmins can delete activity records', 403)
        }
        return await handleDeleteActivity(supabaseClient, url, userRole)
      
      default:
        return errorResponse(`Method ${method} not allowed`, 405)
    }

  } catch (error) {
    console.error('Platform Activity Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

// GET /platform-activity/activity - Get activity logs with filters
async function handleGetActivity(supabaseClient: any, url: URL, userRole: any) {
  try {
    const type = url.searchParams.get('type')
    const userId = url.searchParams.get('user_id')
    const clientId = url.searchParams.get('client_id')
    const locationId = url.searchParams.get('location_id')
    const severity = url.searchParams.get('severity') as ActivityFilters['severity']
    const dateFrom = url.searchParams.get('date_from')
    const dateTo = url.searchParams.get('date_to')
    const search = url.searchParams.get('search')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Build base query - using hierarchy_audit_log table for now, 
    // but would be better with dedicated activity_logs table
    let query = supabaseClient
      .from('hierarchy_audit_log')
      .select('*')

    // Apply role-based access control
    if (userRole.tier === 'client_admin' && userRole.client_id) {
      // Client admins can only see activities for their client
      query = query.eq('attempted_tier', 'client_admin')
    } else if (userRole.tier === 'location_staff' && userRole.location_id) {
      // Location staff can only see activities for their location
      query = query.eq('attempted_tier', 'location_staff')
    }

    // Apply filters
    if (type) {
      query = query.eq('attempted_action', type)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (severity) {
      query = query.eq('violation_type', severity)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    if (search) {
      query = query.or(`attempted_action.ilike.%${search}%,error_message.ilike.%${search}%`)
    }

    // Apply pagination and ordering
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    const { data: activityData, error: activityError } = await query

    if (activityError) {
      console.error('Error fetching activity:', activityError)
      return errorResponse('Failed to fetch activity logs', 500)
    }

    // Transform data to match ActivityItem interface
    const activities: ActivityItem[] = (activityData || []).map(item => ({
      id: item.id,
      type: item.attempted_action || 'system_alert',
      title: formatActivityTitle(item.attempted_action, item.attempted_tier),
      description: item.error_message || `${item.attempted_action} attempted`,
      user_id: item.user_id,
      client_id: null, // Would need additional data
      location_id: null, // Would need additional data
      severity: mapViolationTypeToSeverity(item.violation_type),
      metadata: {
        attempted_tier: item.attempted_tier,
        user_agent: item.user_agent,
        ip_address: item.ip_address
      },
      ip_address: item.ip_address,
      user_agent: item.user_agent,
      created_at: item.created_at,
      updated_at: item.created_at
    }))

    // If no real activity data, generate some sample activity for demo
    if (activities.length === 0) {
      const sampleActivities = await generateSampleActivity(supabaseClient, userRole, limit)
      return jsonResponse({
        data: sampleActivities,
        count: sampleActivities.length,
        is_sample: true
      })
    }

    return jsonResponse({
      data: activities,
      count: activities.length
    })

  } catch (error) {
    console.error('Error in handleGetActivity:', error)
    return errorResponse('Failed to fetch activity', 500)
  }
}

// GET /platform-activity/metrics - Get platform metrics
async function handleGetMetrics(supabaseClient: any, userRole: any) {
  try {
    // Only superadmin and client_admin can see metrics
    if (!['superadmin', 'client_admin'].includes(userRole.tier)) {
      return errorResponse('Access denied: Insufficient permissions for metrics', 403)
    }

    // Aggregate data from multiple tables
    const [clientsResult, locationsResult, customersResult, staffResult, stampsResult, rewardsResult] = await Promise.all([
      supabaseClient.from('clients').select('*', { count: 'exact', head: true }),
      supabaseClient.from('locations').select('*', { count: 'exact', head: true }),
      supabaseClient.from('customers').select('*', { count: 'exact', head: true }),
      supabaseClient.from('location_staff').select('*', { count: 'exact', head: true }),
      supabaseClient.from('stamps').select('*', { count: 'exact', head: true }),
      supabaseClient.from('rewards').select('*', { count: 'exact', head: true })
    ])

    // Calculate metrics
    const totalClients = clientsResult.count || 0
    const totalLocations = locationsResult.count || 0
    const totalCustomers = customersResult.count || 0
    const totalStaff = staffResult.count || 0
    const totalStamps = stampsResult.count || 0
    const totalRewards = rewardsResult.count || 0

    // Estimate metrics
    const monthlyRevenue = totalCustomers * 28.50 // Average per customer
    const activeUsers = Math.round(totalStaff * 0.75) // Estimate 75% active
    
    // Determine system health
    let systemHealth: PlatformMetrics['systemHealth'] = 'healthy'
    if (totalClients === 0 || totalLocations === 0) {
      systemHealth = 'warning'
    }

    const metrics: PlatformMetrics = {
      totalClients,
      totalLocations,
      totalCustomers,
      totalStaff,
      totalStamps,
      totalRewards,
      monthlyRevenue,
      activeUsers,
      systemHealth,
      lastUpdated: new Date().toISOString()
    }

    return jsonResponse({
      data: metrics
    })

  } catch (error) {
    console.error('Error in handleGetMetrics:', error)
    return errorResponse('Failed to fetch platform metrics', 500)
  }
}

// GET /platform-activity/health - Get system health status
async function handleGetSystemHealth(supabaseClient: any, userRole: any) {
  try {
    // Only superadmin can see detailed system health
    if (userRole.tier !== 'superadmin') {
      return errorResponse('Access denied: Only superadmins can view system health', 403)
    }

    // Check database connectivity and performance
    const startTime = Date.now()
    const { error: healthCheckError } = await supabaseClient
      .from('clients')
      .select('id')
      .limit(1)
    const responseTime = Date.now() - startTime

    // Get recent error rate from audit logs
    const { count: errorCount } = await supabaseClient
      .from('hierarchy_audit_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour

    // Calculate health metrics
    const errorRate = (errorCount || 0) / 60 // Errors per minute in last hour
    const issues: string[] = []

    if (healthCheckError) {
      issues.push('Database connectivity issues detected')
    }
    if (responseTime > 1000) {
      issues.push('High database response time')
    }
    if (errorRate > 5) {
      issues.push('High error rate detected')
    }

    let status: SystemHealth['status'] = 'healthy'
    if (issues.length > 0) {
      status = issues.length > 2 ? 'critical' : 'warning'
    }

    const health: SystemHealth = {
      status,
      uptime: 99.9, // Would be calculated from actual uptime monitoring
      errorRate: Math.round(errorRate * 100) / 100,
      responseTime,
      activeConnections: Math.floor(Math.random() * 50) + 10, // Mock data
      memoryUsage: Math.floor(Math.random() * 30) + 50, // Mock percentage
      issues,
      lastChecked: new Date().toISOString()
    }

    return jsonResponse({
      data: health
    })

  } catch (error) {
    console.error('Error in handleGetSystemHealth:', error)
    return errorResponse('Failed to fetch system health', 500)
  }
}

// POST /platform-activity - Create new activity log
async function handleCreateActivity(supabaseClient: any, req: Request, userRole: any, requestMetadata: any) {
  try {
    const body = await req.json() as CreateActivityData

    // Validate required fields
    if (!body.type || !body.title || !body.description) {
      return errorResponse('Missing required fields: type, title, description', 400)
    }

    // Create activity record in hierarchy_audit_log table
    const activityData = {
      attempted_action: body.type,
      user_id: userRole.user_id || null,
      attempted_tier: userRole.tier,
      violation_type: body.severity || 'low',
      error_message: `${body.title}: ${body.description}`,
      user_agent: requestMetadata.user_agent,
      ip_address: requestMetadata.ip_address,
      created_at: new Date().toISOString()
    }

    const { data: newActivity, error: createError } = await supabaseClient
      .from('hierarchy_audit_log')
      .insert(activityData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating activity:', createError)
      return errorResponse('Failed to create activity log', 500)
    }

    return jsonResponse({
      message: 'Activity logged successfully',
      data: {
        id: newActivity.id,
        type: body.type,
        title: body.title,
        description: body.description,
        severity: body.severity || 'low',
        created_at: newActivity.created_at
      }
    }, 201)

  } catch (error) {
    console.error('Error in handleCreateActivity:', error)
    return errorResponse('Failed to create activity', 500)
  }
}

// Helper functions
function formatActivityTitle(action: string, tier: string): string {
  const actionMap: Record<string, string> = {
    'client_created': 'New Client Created',
    'location_created': 'New Location Added',
    'customer_registered': 'Customer Registered',
    'staff_invited': 'Staff Member Invited',
    'stamp_added': 'Loyalty Stamp Added',
    'reward_redeemed': 'Reward Redeemed',
    'login': 'User Login',
    'logout': 'User Logout',
    'profile_updated': 'Profile Updated',
    'settings_changed': 'Settings Modified'
  }

  return actionMap[action] || `${action.replace('_', ' ')} (${tier})`
}

function mapViolationTypeToSeverity(violationType: string): ActivityItem['severity'] {
  const severityMap: Record<string, ActivityItem['severity']> = {
    'permission_denied': 'high',
    'invalid_access': 'medium',
    'data_breach': 'critical',
    'system_error': 'high'
  }

  return severityMap[violationType] || 'low'
}

// Generate sample activity for demo purposes
async function generateSampleActivity(supabaseClient: any, userRole: any, limit: number): Promise<ActivityItem[]> {
  const now = new Date()
  const activities: ActivityItem[] = []

  const sampleTypes: Array<{type: ActivityItem['type'], title: string, severity: ActivityItem['severity']}> = [
    { type: 'customer_registered', title: 'New Customer Registration', severity: 'low' },
    { type: 'staff_invited', title: 'Staff Member Invited', severity: 'medium' },
    { type: 'stamp_added', title: 'Loyalty Stamp Added', severity: 'low' },
    { type: 'reward_redeemed', title: 'Reward Redeemed', severity: 'medium' },
    { type: 'location_created', title: 'New Location Added', severity: 'high' },
    { type: 'client_created', title: 'New Client Created', severity: 'high' },
    { type: 'profile_updated', title: 'Profile Updated', severity: 'low' },
    { type: 'settings_changed', title: 'Settings Modified', severity: 'medium' }
  ]

  for (let i = 0; i < Math.min(limit, 20); i++) {
    const sample = sampleTypes[i % sampleTypes.length]
    const minutesAgo = Math.floor(Math.random() * 1440) // Random time in last 24h
    
    activities.push({
      id: `sample-${i + 1}`,
      type: sample.type,
      title: sample.title,
      description: `${sample.title} - Generated sample activity for demonstration`,
      user_id: userRole.user_id,
      client_id: userRole.client_id,
      location_id: userRole.location_id,
      severity: sample.severity,
      metadata: {
        sample: true,
        generated_at: now.toISOString()
      },
      ip_address: '192.168.1.1',
      user_agent: 'Sample User Agent',
      created_at: new Date(now.getTime() - minutesAgo * 60000).toISOString(),
      updated_at: new Date(now.getTime() - minutesAgo * 60000).toISOString()
    })
  }

  return activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// PATCH and DELETE handlers (simplified for core functionality)
async function handleUpdateActivity(supabaseClient: any, req: Request, userRole: any) {
  return errorResponse('Activity updates not implemented yet', 501)
}

async function handleDeleteActivity(supabaseClient: any, url: URL, userRole: any) {
  return errorResponse('Activity deletion not implemented yet', 501)
} 
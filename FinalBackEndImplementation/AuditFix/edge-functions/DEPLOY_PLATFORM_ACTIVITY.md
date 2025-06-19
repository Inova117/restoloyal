# PLATFORM ACTIVITY Edge Function Deployment Guide

## Overview
Edge Function for comprehensive activity tracking, audit logging, and real-time platform monitoring in the 4-tier restaurant loyalty system.

## Function Details
- **Name**: `platform-activity`
- **Location**: `FinalBackEndImplementation/AuditFix/edge-functions/platform-activity/`
- **Purpose**: Activity tracking, metrics collection, and system health monitoring

## Supported Operations

### GET /platform-activity/activity
**Access**: Superadmin (all activities), Client Admin (client activities), Location Staff (location activities)

Query Parameters:
- `type` - Filter by activity type (customer_registered, staff_invited, etc.)
- `user_id` - Filter by specific user
- `client_id` - Filter by client (superadmin only)
- `location_id` - Filter by location
- `severity` - Filter by severity: low, medium, high, critical
- `date_from` - Start date filter (ISO format)
- `date_to` - End date filter (ISO format)
- `search` - Search in activity descriptions
- `limit` - Pagination limit (default: 50)
- `offset` - Pagination offset (default: 0)

### GET /platform-activity/metrics
**Access**: Superadmin (all metrics), Client Admin (client metrics)

Returns comprehensive platform metrics including:
- Total clients, locations, customers, staff
- Stamp and reward counts
- Revenue estimates
- System health status

### GET /platform-activity/health
**Access**: Superadmin only

Returns detailed system health information:
- Database performance metrics
- Error rates and response times
- System uptime and resource usage
- Active issue detection

### POST /platform-activity
**Access**: All authenticated users (creates activity for their actions)

Body:
```json
{
  "type": "customer_registered",
  "title": "New Customer Registration",
  "description": "Customer John Doe registered at Downtown Location",
  "client_id": "client-uuid",
  "location_id": "location-uuid",
  "severity": "low",
  "metadata": {
    "customer_id": "customer-uuid",
    "registration_method": "mobile_app"
  }
}
```

## Activity Types Supported

### Customer Activities
- `customer_registered` - New customer sign-up
- `stamp_added` - Loyalty stamp added to customer
- `reward_redeemed` - Customer redeemed a reward

### Staff Activities  
- `staff_invited` - New staff member invited
- `role_assigned` - Staff role or permissions changed
- `login` / `logout` - Staff authentication events

### Business Activities
- `client_created` - New client/restaurant chain added
- `location_created` - New restaurant location added
- `settings_changed` - Business settings modified

### System Activities
- `system_alert` - System health or performance alert
- `error_occurred` - System error or exception
- `data_export` - Data export operations

## Authorization Matrix

| Role | Activity Logs | Metrics | Health | Create Activity |
|------|---------------|---------|--------|----------------|
| **Superadmin** | ✅ All platform | ✅ Full metrics | ✅ System health | ✅ Any type |
| **Client Admin** | ✅ Client activities | ✅ Client metrics | ❌ | ✅ Client activities |
| **Location Staff** | ✅ Location activities | ❌ | ❌ | ✅ Location activities |

## Database Schema Dependencies

### Primary Table: `hierarchy_audit_log`
Used for storing activity and audit information:
```sql
- id (UUID)
- attempted_action (string) - Maps to activity type
- user_id (UUID) - User who performed the action
- attempted_tier (string) - User role/tier
- violation_type (string) - Maps to severity
- error_message (text) - Activity description
- user_agent (string) - Browser/client info
- ip_address (string) - Source IP
- created_at (timestamp)
```

### Metrics Source Tables:
- `clients` - Client count and status
- `locations` - Location count and distribution
- `customers` - Customer base metrics
- `location_staff` - Staff count and activity
- `stamps` - Loyalty program engagement
- `rewards` - Reward redemption metrics

## Deployment Commands

### 1. Deploy to Supabase
```bash
# From project root
cd FinalBackEndImplementation/AuditFix/edge-functions

# Deploy the function
supabase functions deploy platform-activity --project-ref YOUR_PROJECT_REF
```

### 2. Environment Variables
Ensure these are configured in Supabase dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Testing Endpoints

#### Test Activity Logs (Any Role)
```bash
curl -X GET "https://your-project-ref.supabase.co/functions/v1/platform-activity/activity?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Test Platform Metrics (Admin Only)
```bash
curl -X GET "https://your-project-ref.supabase.co/functions/v1/platform-activity/metrics" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Test System Health (Superadmin Only)
```bash
curl -X GET "https://your-project-ref.supabase.co/functions/v1/platform-activity/health" \
  -H "Authorization: Bearer SUPERADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Create Activity Log
```bash
curl -X POST "https://your-project-ref.supabase.co/functions/v1/platform-activity" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "customer_registered",
    "title": "New Customer Registration", 
    "description": "Customer registered via mobile app",
    "severity": "low"
  }'
```

## Response Formats

### Activity Logs Response
```json
{
  "data": [
    {
      "id": "activity-uuid",
      "type": "customer_registered",
      "title": "New Customer Registration",
      "description": "Customer John Doe registered at Downtown Location",
      "user_id": "user-uuid",
      "client_id": "client-uuid",
      "location_id": "location-uuid",
      "severity": "low",
      "metadata": {
        "registration_method": "mobile_app"
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ],
  "count": 1,
  "is_sample": false
}
```

### Platform Metrics Response
```json
{
  "data": {
    "totalClients": 25,
    "totalLocations": 67,
    "totalCustomers": 1342,
    "totalStaff": 89,
    "totalStamps": 8901,
    "totalRewards": 234,
    "monthlyRevenue": 38247.00,
    "activeUsers": 67,
    "systemHealth": "healthy",
    "lastUpdated": "2024-01-01T12:00:00Z"
  }
}
```

### System Health Response
```json
{
  "data": {
    "status": "healthy",
    "uptime": 99.9,
    "errorRate": 0.02,
    "responseTime": 245,
    "activeConnections": 23,
    "memoryUsage": 68,
    "issues": [],
    "lastChecked": "2024-01-01T12:00:00Z"
  }
}
```

## Security Features

1. **Role-Based Activity Filtering** - Users only see relevant activities
2. **IP and User Agent Tracking** - Full audit trail for security
3. **Severity Classification** - Automatic threat level assessment  
4. **Data Isolation** - Client admins see only their data
5. **Real-time Monitoring** - Live system health tracking
6. **Audit Compliance** - Complete activity logging for compliance

## Error Handling

- `401` - Missing or invalid authentication
- `403` - Insufficient permissions for requested data
- `404` - Activity or resource not found
- `400` - Invalid request parameters
- `500` - Server errors
- `501` - Feature not yet implemented

## Integration Notes

This Edge Function integrates with:
- `ZerionPlatformDashboard.tsx` - Activity feeds and metrics
- Authentication system via user_roles
- All other Edge Functions for cross-platform activity tracking
- Real-time dashboard updates

## Performance Considerations

- **Pagination** - Large activity logs are paginated
- **Indexing** - Database queries optimized with proper indexes
- **Caching** - Metrics can be cached for better performance
- **Filtering** - Role-based filtering reduces data transfer
- **Sample Data** - Fallback to generated data when no real data exists

## Monitoring and Alerts

Monitor function performance:
- Activity log ingestion rates
- Query performance for large datasets  
- System health check response times
- Error rates and security violations
- Real-time metric calculation performance

## Future Enhancements

1. **Real-time WebSocket Updates** - Live activity feeds
2. **Advanced Analytics** - Trend analysis and forecasting
3. **Alert System** - Automated notifications for critical events
4. **Data Retention** - Automated archiving of old activity logs
5. **Export Features** - Activity data export in various formats 
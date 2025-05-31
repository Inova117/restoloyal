# Analytics Report API Documentation

## Overview

The Analytics Report API provides comprehensive business intelligence endpoints for franchise administrators to view performance metrics, location breakdowns, and trend analysis. This API is designed for **Tier 2** (Restaurant HQ) administrators to gain insights into their business performance across all locations.

## Base URL

```
https://your-supabase-project.supabase.co/functions/v1/analytics-report
```

## Authentication

All requests require a valid Supabase session token in the Authorization header:

```
Authorization: Bearer <session_access_token>
```

## Endpoints

### 1. Aggregate Metrics

#### GET - Fetch Aggregate Business Metrics

Retrieve high-level business metrics including customer counts, revenue estimates, and growth rates.

**Endpoint:** `GET /analytics-report?endpoint=aggregate&client_id={client_id}`

**Query Parameters:**
- `client_id` (required): Client identifier
- `endpoint=aggregate` (required): Endpoint identifier
- `time_range` (optional): Time period ('30d', '90d', '6m', '1y', 'custom')
- `start_date` (optional): Custom start date (ISO format)
- `end_date` (optional): Custom end date (ISO format)
- `location_ids` (optional): Comma-separated location IDs to filter

**Example Request:**
```bash
curl -X GET "https://your-project.supabase.co/functions/v1/analytics-report?endpoint=aggregate&client_id=galletti-foods&time_range=30d" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "total_customers": 2847,
    "active_customers_30d": 1256,
    "total_rewards": 342,
    "total_stamps_issued": 18934,
    "growth_rate_30d": 12.5,
    "revenue_estimate": 28401.00,
    "avg_stamps_per_customer": 6.65,
    "reward_redemption_rate": 1.81
  },
  "date_range": {
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-01-31T23:59:59Z"
  }
}
```

### 2. Location Breakdown

#### GET - Fetch Location Performance Breakdown

Retrieve detailed performance metrics broken down by individual locations.

**Endpoint:** `GET /analytics-report?endpoint=locations&client_id={client_id}`

**Query Parameters:**
- `client_id` (required): Client identifier
- `endpoint=locations` (required): Endpoint identifier
- `time_range` (optional): Time period ('30d', '90d', '6m', '1y', 'custom')
- `start_date` (optional): Custom start date (ISO format)
- `end_date` (optional): Custom end date (ISO format)
- `location_ids` (optional): Comma-separated location IDs to filter

**Example Request:**
```bash
curl -X GET "https://your-project.supabase.co/functions/v1/analytics-report?endpoint=locations&client_id=galletti-foods&time_range=90d" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "location_id": "loc_1",
      "location_name": "Main Street Store",
      "address": "123 Main St",
      "city": "Downtown",
      "state": "CA",
      "customers": 1245,
      "active_customers_30d": 567,
      "stamps_issued": 8234,
      "rewards_redeemed": 156,
      "activity_rate": 45.5,
      "revenue_estimate": 12351.00,
      "growth_rate": 15.2
    },
    {
      "location_id": "loc_2",
      "location_name": "Mall Location",
      "address": "456 Shopping Center",
      "city": "Suburbia",
      "state": "CA",
      "customers": 987,
      "active_customers_30d": 423,
      "stamps_issued": 6789,
      "rewards_redeemed": 123,
      "activity_rate": 42.8,
      "revenue_estimate": 10183.50,
      "growth_rate": 8.7
    }
  ],
  "date_range": {
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-03-31T23:59:59Z"
  }
}
```

### 3. Trend Analysis

#### GET - Fetch Trend Analysis Data

Retrieve historical trends including monthly growth, redemption patterns, and customer retention cohorts.

**Endpoint:** `GET /analytics-report?endpoint=trends&client_id={client_id}`

**Query Parameters:**
- `client_id` (required): Client identifier
- `endpoint=trends` (required): Endpoint identifier
- `time_range` (optional): Time period ('30d', '90d', '6m', '1y', 'custom')
- `start_date` (optional): Custom start date (ISO format)
- `end_date` (optional): Custom end date (ISO format)
- `location_ids` (optional): Comma-separated location IDs to filter

**Example Request:**
```bash
curl -X GET "https://your-project.supabase.co/functions/v1/analytics-report?endpoint=trends&client_id=galletti-foods&time_range=6m" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "monthly_growth": [
      {
        "month": "Oct 2023",
        "new_customers": 234,
        "stamps_issued": 1567,
        "rewards_redeemed": 28,
        "revenue_estimate": 2350.50,
        "growth_rate": 8.2
      },
      {
        "month": "Nov 2023",
        "new_customers": 267,
        "stamps_issued": 1789,
        "rewards_redeemed": 34,
        "revenue_estimate": 2683.50,
        "growth_rate": 14.1
      }
    ],
    "reward_redemption_trends": [
      {
        "month": "Oct 2023",
        "redemption_rate": 1.79,
        "total_rewards": 28,
        "total_stamps": 1567
      },
      {
        "month": "Nov 2023",
        "redemption_rate": 1.90,
        "total_rewards": 34,
        "total_stamps": 1789
      }
    ],
    "retention_cohorts": [
      {
        "cohort_month": "Oct 2023",
        "customers_acquired": 234,
        "month_1_retention": 78.2,
        "month_3_retention": 45.7,
        "month_6_retention": 0,
        "month_12_retention": 0
      }
    ]
  },
  "date_range": {
    "start_date": "2023-10-01T00:00:00Z",
    "end_date": "2024-03-31T23:59:59Z"
  }
}
```

## Data Models

### Aggregate Metrics
- `total_customers`: Total number of customers across all locations
- `active_customers_30d`: Customers who made purchases in the last 30 days
- `total_rewards`: Total rewards redeemed in the specified time period
- `total_stamps_issued`: Total stamps issued in the specified time period
- `growth_rate_30d`: Customer growth rate compared to previous 30-day period
- `revenue_estimate`: Estimated revenue based on stamp activity ($1.50 per stamp)
- `avg_stamps_per_customer`: Average stamps per customer
- `reward_redemption_rate`: Percentage of stamps converted to rewards

### Location Breakdown
- `location_id`: Unique location identifier
- `location_name`: Display name of the location
- `address`, `city`, `state`: Location address information
- `customers`: Total customers for this location
- `active_customers_30d`: Active customers in last 30 days
- `stamps_issued`: Stamps issued at this location in time period
- `rewards_redeemed`: Rewards redeemed at this location in time period
- `activity_rate`: Percentage of customers active in last 30 days
- `revenue_estimate`: Estimated revenue for this location
- `growth_rate`: Customer growth rate for this location

### Monthly Growth Data
- `month`: Month label (e.g., "Oct 2023")
- `new_customers`: New customers acquired in this month
- `stamps_issued`: Total stamps issued in this month
- `rewards_redeemed`: Total rewards redeemed in this month
- `revenue_estimate`: Estimated revenue for this month
- `growth_rate`: Growth rate compared to previous month

### Redemption Trend Data
- `month`: Month label
- `redemption_rate`: Percentage of stamps converted to rewards
- `total_rewards`: Total rewards redeemed
- `total_stamps`: Total stamps issued

### Retention Cohort Data
- `cohort_month`: Month when customers were acquired
- `customers_acquired`: Number of customers acquired in this cohort
- `month_1_retention`: Percentage still active after 1 month
- `month_3_retention`: Percentage still active after 3 months
- `month_6_retention`: Percentage still active after 6 months
- `month_12_retention`: Percentage still active after 12 months

## Time Range Options

### Predefined Ranges
- `30d`: Last 30 days
- `90d`: Last 90 days
- `6m`: Last 6 months
- `1y`: Last year

### Custom Range
- `custom`: Use with `start_date` and `end_date` parameters
- Dates must be in ISO format (YYYY-MM-DD)
- Maximum range: 2 years

## Role-Based Access Control

### Client Admins
- Can view analytics for all locations within their client
- Full access to all metrics and trends
- Can filter by specific locations

### Platform Admins
- Can view analytics for any client
- Override permissions for system administration
- Access to all data across the platform

### Restaurant Admins
- Can view analytics only for their specific restaurant's locations
- Limited to locations they manage
- Same metric access as client admins but scoped to their restaurant

## Database Schema Requirements

### Required Tables
- `clients`: Customer data with location associations
- `stamps`: Stamp issuance records with timestamps
- `rewards`: Reward redemption records with timestamps
- `locations`: Location information and client associations
- `restaurants`: Restaurant hierarchy information

### Required Columns
- `clients.location_id`: Links customers to locations
- `clients.created_at`: Customer acquisition date
- `clients.status`: Customer status (active, inactive, blocked)
- `stamps.location_id`: Location where stamp was issued
- `stamps.client_id`: Customer who received the stamp
- `stamps.created_at`: Stamp issuance timestamp
- `rewards.location_id`: Location where reward was redeemed
- `rewards.client_id`: Customer who redeemed the reward
- `rewards.redeemed_at`: Reward redemption timestamp
- `locations.client_id`: Client that owns the location
- `locations.status`: Location status

## Performance Optimizations

### Database Indexes
The system includes optimized indexes for analytics queries:
- Composite indexes on (location_id, created_at)
- Monthly aggregation indexes using date_trunc
- Client and location filtering indexes

### Caching Strategy
- Analytics summary view for common queries
- Materialized views for heavy aggregations (optional)
- Client-side caching recommended for dashboard displays

## React Integration

### Hook Usage

```typescript
import { useAnalyticsManager } from '@/hooks/useAnalyticsManager'

function AnalyticsDashboard() {
  const { 
    aggregateMetrics, 
    locationBreakdown, 
    trendData, 
    loading,
    fetchAllAnalytics,
    fetchAggregateMetrics,
    fetchLocationBreakdown,
    fetchTrendAnalysis
  } = useAnalyticsManager('client-id')

  // Fetch all analytics with filters
  const handleFilterChange = (filters) => {
    fetchAllAnalytics(filters)
  }

  // Fetch specific metrics
  const handleRefreshMetrics = () => {
    fetchAggregateMetrics({ time_range: '30d' })
  }

  return (
    <div>
      {/* Your analytics dashboard */}
    </div>
  )
}
```

### TypeScript Interfaces

```typescript
interface AggregateMetrics {
  total_customers: number
  active_customers_30d: number
  total_rewards: number
  total_stamps_issued: number
  growth_rate_30d: number
  revenue_estimate: number
  avg_stamps_per_customer: number
  reward_redemption_rate: number
}

interface LocationBreakdown {
  location_id: string
  location_name: string
  address: string
  city: string
  state: string
  customers: number
  active_customers_30d: number
  stamps_issued: number
  rewards_redeemed: number
  activity_rate: number
  revenue_estimate: number
  growth_rate: number
}

interface AnalyticsFilters {
  time_range: '30d' | '90d' | '6m' | '1y' | 'custom'
  start_date?: string
  end_date?: string
  location_ids?: string[]
}
```

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "error": "client_id is required"
}
```

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden**
```json
{
  "error": "Forbidden: You are not authorized to view analytics for this client"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "details": "Failed to fetch locations: <detailed error message>"
}
```

## Security Features

### Row Level Security (RLS)
- All database queries are protected by RLS policies
- Users can only access analytics for their authorized clients/locations
- Platform admins have override access for system administration

### Data Scoping
- Client admins see data for all their locations
- Restaurant admins see data only for their restaurant's locations
- All queries are automatically scoped by user permissions

### Audit Logging
- Analytics access can be logged for compliance
- Optional triggers for tracking data access patterns
- Activity logging to platform_activity_log table

## Testing

### Mock Mode
The system includes comprehensive mock mode for testing:

```typescript
// Enable mock mode in useAnalyticsManager.ts
const MOCK_MODE = true

// Mock data includes:
// - Realistic aggregate metrics
// - 3 location breakdowns with varied performance
// - 4 months of trend data
// - Retention cohort analysis
```

### Test Data
Mock analytics data includes:
- **Aggregate**: 2,847 total customers, 1,256 active, 12.5% growth
- **Locations**: 3 locations with different performance profiles
- **Trends**: 4 months of historical data with growth patterns
- **Cohorts**: Customer retention analysis with realistic rates

## Deployment

### Prerequisites
1. Supabase project with Edge Functions enabled
2. Database tables with proper schema
3. RLS policies applied
4. Performance indexes created

### Deployment Steps
1. Deploy Edge Function:
   ```bash
   supabase functions deploy analytics-report
   ```

2. Run database migration:
   ```bash
   supabase db push
   ```

3. Update React hook to disable mock mode:
   ```typescript
   const MOCK_MODE = false
   ```

### Environment Variables
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key

## Performance Considerations

### Query Optimization
- Use date range filters to limit data scope
- Leverage database indexes for fast aggregations
- Consider materialized views for heavy queries

### Client-Side Optimization
- Implement caching for frequently accessed data
- Use pagination for large datasets
- Debounce filter changes to reduce API calls

### Scalability
- Analytics queries are designed to scale with data volume
- Indexes support efficient filtering and aggregation
- Consider data archiving for very large datasets

## Troubleshooting

### Common Issues

1. **"No client ID available" errors**
   - Verify client ID is passed to the hook
   - Check session storage for viewing_client
   - Ensure user has proper role assignments

2. **"Forbidden" errors**
   - Verify user has client_admin role for the specified client
   - Check RLS policies are correctly applied
   - Ensure user_roles table has correct data

3. **Empty or missing data**
   - Verify database tables have data
   - Check date ranges are reasonable
   - Ensure location associations are correct

4. **Performance issues**
   - Check if database indexes are created
   - Verify query date ranges are not too broad
   - Consider using smaller time ranges for initial load

### Debug Mode
Enable detailed logging:
```typescript
console.log('Analytics Debug Mode')
// Add debug statements in Edge Function and React hook
```

## API Rate Limits

- Standard Supabase Edge Function limits apply
- Recommended: Cache results for 5-15 minutes
- Implement client-side debouncing for filter changes
- Consider background refresh for dashboard displays

## Support

For technical support or feature requests:
1. Check this documentation first
2. Review error logs in Supabase dashboard
3. Test with mock mode enabled
4. Contact development team with specific error details and use case requirements 
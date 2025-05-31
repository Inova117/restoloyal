# Notification Campaigns API Documentation

## Overview

The Notification Campaigns API provides comprehensive functionality for HQ/admins to create, schedule, and send push notifications, emails, and SMS campaigns to customers. The system includes campaign management, analytics, templates, and third-party service integrations.

## Base URL
```
https://your-project.supabase.co/functions/v1/notification-campaigns
```

## Authentication
All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Campaign
**POST** `/create-campaign`

Creates a new notification campaign.

#### Request Body
```typescript
{
  client_id: string
  location_id?: string
  campaign_name: string
  campaign_type: 'push' | 'email' | 'sms' | 'multi'
  target_audience: 'all_customers' | 'location_customers' | 'active_customers' | 'inactive_customers' | 'high_value_customers'
  message_title: string
  message_content: string
  scheduled_for?: string // ISO 8601 format
  send_immediately: boolean
  metadata?: object
}
```

#### Response
```typescript
{
  success: boolean
  campaign: {
    id: string
    client_id: string
    location_id?: string
    campaign_name: string
    campaign_type: string
    target_audience: string
    message_title: string
    message_content: string
    status: 'draft' | 'sending'
    created_by: string
    created_at: string
    updated_at: string
  }
  message: string
}
```

#### Example
```bash
curl -X POST https://your-project.supabase.co/functions/v1/notification-campaigns/create-campaign \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "galletti-client-id",
    "campaign_name": "Weekend Special Promotion",
    "campaign_type": "push",
    "target_audience": "active_customers",
    "message_title": "Double Stamps Weekend!",
    "message_content": "Get double stamps on all purchases this weekend. Limited time offer!",
    "send_immediately": false
  }'
```

### 2. Send Campaign
**POST** `/send-campaign`

Sends a campaign immediately.

#### Request Body
```typescript
{
  campaign_id: string
}
```

#### Response
```typescript
{
  success: boolean
  message: string
}
```

### 3. Schedule Campaign
**POST** `/schedule-campaign`

Schedules a campaign for future sending.

#### Request Body
```typescript
{
  campaign_id: string
  scheduled_for: string // ISO 8601 format
}
```

#### Response
```typescript
{
  success: boolean
  message: string
}
```

### 4. Get Campaigns
**GET** `/campaigns`

Retrieves campaigns with optional filtering.

#### Query Parameters
- `client_id` (optional): Filter by client ID
- `location_id` (optional): Filter by location ID
- `status` (optional): Filter by status ('draft', 'scheduled', 'sending', 'sent', 'failed')
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

#### Response
```typescript
{
  success: boolean
  campaigns: Array<{
    id: string
    client_id: string
    location_id?: string
    campaign_name: string
    campaign_type: string
    target_audience: string
    message_title: string
    message_content: string
    status: string
    sent_count?: number
    failed_count?: number
    created_by: string
    sent_at?: string
    completed_at?: string
    created_at: string
    updated_at: string
  }>
}
```

### 5. Get Campaign Analytics
**GET** `/campaign-analytics`

Retrieves detailed analytics for a specific campaign.

#### Query Parameters
- `campaign_id` (required): Campaign ID

#### Response
```typescript
{
  success: boolean
  campaign: {
    // Campaign details
  }
  analytics: {
    total_sent: number
    delivered: number
    failed: number
    opened: number
    clicked: number
    by_type: {
      push: number
      email: number
      sms: number
    }
    delivery_rate: string
    open_rate: string
    click_rate: string
  }
}
```

### 6. Update Campaign
**PUT** `/update-campaign`

Updates a campaign (only draft and scheduled campaigns can be updated).

#### Request Body
```typescript
{
  campaign_id: string
  // Any campaign fields to update
  campaign_name?: string
  message_title?: string
  message_content?: string
  // ... other fields
}
```

### 7. Delete Campaign
**DELETE** `/delete-campaign`

Soft deletes a campaign (only draft and scheduled campaigns can be deleted).

#### Query Parameters
- `campaign_id` (required): Campaign ID

#### Response
```typescript
{
  success: boolean
  message: string
}
```

## Campaign Types

### Push Notifications
- **Type**: `push`
- **Service**: OneSignal
- **Requirements**: Customer must have app installed and notifications enabled
- **Delivery**: Near-instant
- **Tracking**: Sent, delivered, opened, clicked

### Email Campaigns
- **Type**: `email`
- **Service**: SendGrid
- **Requirements**: Customer must have valid email address
- **Delivery**: Within minutes
- **Tracking**: Sent, delivered, opened, clicked, bounced

### SMS Campaigns
- **Type**: `sms`
- **Service**: Twilio
- **Requirements**: Customer must have valid phone number
- **Delivery**: Within seconds
- **Tracking**: Sent, delivered, failed

### Multi-channel Campaigns
- **Type**: `multi`
- **Services**: All three services
- **Behavior**: Sends via all available channels for each customer
- **Fallback**: If one channel fails, others still attempt delivery

## Target Audiences

### All Customers
- **Value**: `all_customers`
- **Description**: All customers in the client database (excluding blocked)

### Location Customers
- **Value**: `location_customers`
- **Description**: Customers associated with a specific location
- **Requirement**: `location_id` must be provided

### Active Customers
- **Value**: `active_customers`
- **Description**: Customers with status 'active'

### Inactive Customers
- **Value**: `inactive_customers`
- **Description**: Customers with status 'inactive'

### High Value Customers
- **Value**: `high_value_customers`
- **Description**: Active customers with 50+ stamps

## Campaign Status Flow

```
draft → scheduled → sending → sent/partially_sent/failed
  ↓         ↓
deleted   deleted
```

### Status Descriptions
- **draft**: Campaign created but not sent or scheduled
- **scheduled**: Campaign scheduled for future sending
- **sending**: Campaign currently being processed
- **sent**: Campaign successfully sent to all recipients
- **partially_sent**: Campaign sent to some recipients, some failed
- **failed**: Campaign failed to send
- **deleted**: Campaign soft deleted

## Third-party Service Integration

### OneSignal (Push Notifications)
```typescript
// Environment variables required
ONESIGNAL_API_KEY=your_api_key
ONESIGNAL_APP_ID=your_app_id
```

### SendGrid (Email)
```typescript
// Environment variables required
SENDGRID_API_KEY=your_api_key
```

### Twilio (SMS)
```typescript
// Environment variables required
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

## Security & Permissions

### Role-based Access Control
- **Platform Admins**: Can manage all campaigns across all clients
- **Client Admins**: Can manage campaigns for their client
- **Restaurant Admins**: Can manage campaigns for their locations

### Data Scoping
- All campaigns are scoped to client_id
- Location-specific campaigns are further scoped to location_id
- RLS policies enforce data isolation

### Audit Logging
- All campaign activities are logged in `campaign_activity_logs`
- Notification delivery attempts are logged in `notification_logs`
- User actions are tracked with timestamps and details

## Rate Limiting & Best Practices

### Sending Limits
- **Push**: 10,000 notifications per minute
- **Email**: 1,000 emails per minute
- **SMS**: 100 messages per minute

### Best Practices
1. **Timing**: Send campaigns during business hours for better engagement
2. **Frequency**: Limit to 2-3 campaigns per week to avoid fatigue
3. **Personalization**: Use customer data to personalize messages
4. **Testing**: Test campaigns with small audiences first
5. **Compliance**: Respect opt-out preferences and regulations

## Error Handling

### Common Error Codes
- **400**: Bad Request - Invalid parameters
- **401**: Unauthorized - Invalid or missing token
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Campaign not found
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Server error

### Error Response Format
```typescript
{
  error: string
  details?: string
  code?: string
}
```

## Database Schema

### notification_campaigns
```sql
CREATE TABLE notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES platform_clients(id),
  location_id UUID REFERENCES locations(id),
  campaign_name VARCHAR(255) NOT NULL,
  campaign_type VARCHAR(20) NOT NULL,
  target_audience VARCHAR(50) NOT NULL,
  message_title VARCHAR(255) NOT NULL,
  message_content TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  send_immediately BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users(id),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### notification_logs
```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES notification_campaigns(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  notification_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  external_id VARCHAR(255),
  external_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### campaign_templates
```sql
CREATE TABLE campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES platform_clients(id),
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(20) NOT NULL,
  message_title VARCHAR(255) NOT NULL,
  message_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(client_id, template_name)
);
```

## TypeScript Interfaces

```typescript
interface NotificationCampaign {
  id?: string
  client_id: string
  location_id?: string
  campaign_name: string
  campaign_type: 'push' | 'email' | 'sms' | 'multi'
  target_audience: 'all_customers' | 'location_customers' | 'active_customers' | 'inactive_customers' | 'high_value_customers'
  message_title: string
  message_content: string
  scheduled_for?: string
  send_immediately: boolean
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'partially_sent' | 'failed' | 'deleted'
  sent_count?: number
  failed_count?: number
  created_by?: string
  sent_at?: string
  completed_at?: string
  created_at?: string
  updated_at?: string
  metadata?: any
}

interface CampaignAnalytics {
  campaign: NotificationCampaign
  analytics: {
    total_sent: number
    delivered: number
    failed: number
    opened: number
    clicked: number
    by_type: {
      push: number
      email: number
      sms: number
    }
    delivery_rate: string
    open_rate: string
    click_rate: string
  }
}

interface NotificationLog {
  id: string
  campaign_id: string
  customer_id: string
  notification_type: 'push' | 'email' | 'sms'
  status: 'sent' | 'delivered' | 'failed' | 'opened' | 'clicked' | 'bounced'
  sent_at: string
  delivered_at?: string
  opened_at?: string
  clicked_at?: string
  error_message?: string
  external_id?: string
}
```

## Testing

### Mock Mode
The system includes a comprehensive mock mode for development and testing:

```typescript
const MOCK_MODE = true // Set to false for production
```

### Test Scenarios
1. **Create Campaign**: Test all campaign types and audiences
2. **Send Immediately**: Test immediate sending functionality
3. **Schedule Campaign**: Test scheduling for future dates
4. **Analytics**: Test analytics calculation and display
5. **Templates**: Test template usage and management
6. **Permissions**: Test role-based access control
7. **Error Handling**: Test various error scenarios

### Sample Test Data
The mock mode includes realistic sample data:
- 3 sample campaigns with different statuses
- 5 campaign templates
- Realistic analytics with delivery, open, and click rates
- Proper error simulation and edge cases

## Production Deployment

### Environment Setup
1. Configure third-party service API keys
2. Set up database with proper RLS policies
3. Deploy Edge Functions to Supabase
4. Configure CORS and authentication
5. Set up monitoring and logging

### Monitoring
- Track campaign delivery rates
- Monitor third-party service status
- Set up alerts for failed campaigns
- Monitor database performance
- Track user engagement metrics

### Maintenance
- Regular cleanup of old notification logs
- Monitor and optimize database queries
- Update third-party service integrations
- Review and update campaign templates
- Analyze campaign performance trends 
# Loyalty Manager API Documentation

## Overview

The Loyalty Manager API provides comprehensive endpoints for managing loyalty program rules and promotional campaigns in the restaurant loyalty platform. This API is designed for **Tier 2** (Restaurant HQ) administrators to configure loyalty settings and create marketing campaigns.

## Base URL

```
https://your-supabase-project.supabase.co/functions/v1/loyalty-manager
```

## Authentication

All requests require a valid Supabase session token in the Authorization header:

```
Authorization: Bearer <session_access_token>
```

## Endpoints

### 1. Loyalty Settings Management

#### GET - Fetch Loyalty Settings

Retrieve loyalty program settings for restaurants.

**Endpoint:** `GET /loyalty-manager?endpoint=loyalty&client_id={client_id}`

**Query Parameters:**
- `client_id` (required): Client identifier
- `restaurant_id` (optional): Specific restaurant ID to filter settings
- `endpoint=loyalty` (required): Endpoint identifier

**Example Request:**
```bash
curl -X GET "https://your-project.supabase.co/functions/v1/loyalty-manager?endpoint=loyalty&client_id=galletti-foods" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "loyalty_1",
      "restaurant_id": "rest_1",
      "stamps_required": 10,
      "reward_description": "Free medium pizza",
      "reward_value": 15.99,
      "stamps_per_dollar": 1.0,
      "auto_redeem": false,
      "max_stamps_per_visit": 5,
      "stamp_expiry_days": 365,
      "minimum_purchase_amount": 5.00,
      "updated_at": "2024-01-20T10:00:00Z",
      "updated_by": "user_1",
      "restaurant": {
        "id": "rest_1",
        "name": "Main Street Location",
        "client_id": "galletti-foods"
      }
    }
  ]
}
```

#### POST/PATCH - Update Loyalty Settings

Create or update loyalty program settings for a restaurant.

**Endpoint:** `POST/PATCH /loyalty-manager?endpoint=loyalty&client_id={client_id}&restaurant_id={restaurant_id}`

**Request Body:**
```json
{
  "stamps_required": 10,
  "reward_description": "Free medium pizza",
  "reward_value": 15.99,
  "stamps_per_dollar": 1.0,
  "auto_redeem": false,
  "max_stamps_per_visit": 5,
  "stamp_expiry_days": 365,
  "minimum_purchase_amount": 5.00
}
```

**Field Validation:**
- `stamps_required`: Integer between 1-100
- `reward_value`: Positive decimal
- `stamps_per_dollar`: Decimal between 0.1-10
- `max_stamps_per_visit`: Integer between 1-20
- `stamp_expiry_days`: Optional positive integer
- `minimum_purchase_amount`: Optional positive decimal

**Example Response:**
```json
{
  "success": true,
  "message": "Loyalty settings updated successfully",
  "data": {
    "id": "loyalty_1",
    "restaurant_id": "rest_1",
    "stamps_required": 10,
    "reward_description": "Free medium pizza",
    "reward_value": 15.99,
    "stamps_per_dollar": 1.0,
    "auto_redeem": false,
    "max_stamps_per_visit": 5,
    "stamp_expiry_days": 365,
    "minimum_purchase_amount": 5.00,
    "updated_at": "2024-01-20T10:00:00Z",
    "updated_by": "user_1"
  }
}
```

### 2. Campaign Management

#### GET - List Campaigns

Retrieve promotional campaigns with filtering and pagination.

**Endpoint:** `GET /loyalty-manager?endpoint=campaigns&client_id={client_id}`

**Query Parameters:**
- `client_id` (required): Client identifier
- `status` (optional): Filter by status (draft, active, paused, expired)
- `promo_type` (optional): Filter by promotion type
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example Request:**
```bash
curl -X GET "https://your-project.supabase.co/functions/v1/loyalty-manager?endpoint=campaigns&client_id=galletti-foods&status=active&limit=25" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "campaign_1",
      "client_id": "galletti-foods",
      "restaurant_id": "rest_1",
      "title": "Double Stamp Weekend",
      "description": "Earn double stamps on all purchases this weekend!",
      "promo_type": "double_stamps",
      "reward_config": {},
      "start_date": "2024-01-26T00:00:00Z",
      "end_date": "2024-01-28T23:59:59Z",
      "eligible_locations": ["loc_1", "loc_2"],
      "status": "active",
      "usage_limit": 1000,
      "usage_count": 245,
      "created_at": "2024-01-20T10:00:00Z",
      "updated_at": "2024-01-20T10:00:00Z",
      "created_by": "user_1"
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 25,
    "offset": 0,
    "hasMore": false
  }
}
```

#### GET - Get Campaign by ID

Retrieve a specific campaign by ID.

**Endpoint:** `GET /loyalty-manager?endpoint=campaigns&client_id={client_id}&campaign_id={campaign_id}`

#### POST - Create Campaign

Create a new promotional campaign.

**Endpoint:** `POST /loyalty-manager?endpoint=campaigns&client_id={client_id}`

**Request Body:**
```json
{
  "title": "Double Stamp Weekend",
  "description": "Earn double stamps on all purchases this weekend!",
  "promo_type": "double_stamps",
  "reward_config": {},
  "start_date": "2024-01-26",
  "end_date": "2024-01-28",
  "eligible_locations": ["loc_1", "loc_2"],
  "restaurant_id": "rest_1",
  "usage_limit": 1000
}
```

**Promotion Types & Reward Configurations:**

1. **Bonus Stamps** (`bonus_stamps`)
   ```json
   {
     "promo_type": "bonus_stamps",
     "reward_config": {
       "bonus_stamps": 5
     }
   }
   ```

2. **Discount** (`discount`)
   ```json
   {
     "promo_type": "discount",
     "reward_config": {
       "discount_percentage": 20
       // OR
       "discount_amount": 5.00
     }
   }
   ```

3. **Free Item** (`free_item`)
   ```json
   {
     "promo_type": "free_item",
     "reward_config": {
       "free_item_description": "Free medium pizza"
     }
   }
   ```

4. **Double Stamps** (`double_stamps`)
   ```json
   {
     "promo_type": "double_stamps",
     "reward_config": {}
   }
   ```

5. **Referral Bonus** (`referral_bonus`)
   ```json
   {
     "promo_type": "referral_bonus",
     "reward_config": {
       "referral_bonus_stamps": 10
     }
   }
   ```

**Field Validation:**
- `title`: 3-255 characters
- `description`: 10+ characters
- `start_date`/`end_date`: Valid date range (end > start)
- `eligible_locations`: Array with at least one location ID
- `usage_limit`: Optional positive integer

#### PATCH - Update Campaign

Update an existing campaign.

**Endpoint:** `PATCH /loyalty-manager?endpoint=campaigns&client_id={client_id}&campaign_id={campaign_id}`

**Request Body:** Same as create campaign (partial updates allowed)

## Campaign Status Management

Campaigns have four possible statuses:

- **draft**: Campaign is being prepared, not yet active
- **active**: Campaign is currently running and available to customers
- **paused**: Campaign is temporarily disabled but can be reactivated
- **expired**: Campaign has ended (automatically set when end_date passes)

Status transitions:
- `draft` → `active`
- `active` → `paused`
- `paused` → `active`
- Any status → `expired` (automatic)

## Role-Based Access Control

### Client Admins
- Can manage loyalty settings for all restaurants in their client
- Can create and manage campaigns for their entire client
- Full access to all campaign types and settings

### Restaurant Admins
- Can manage loyalty settings only for their specific restaurant
- Can create and manage campaigns only for their restaurant
- Limited to campaigns affecting their restaurant's locations

### Platform Admins
- Full access to all loyalty settings and campaigns
- Can manage settings for any client or restaurant
- Override permissions for system administration

## Database Schema

### loyalty_settings Table
```sql
CREATE TABLE loyalty_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  stamps_required INTEGER NOT NULL DEFAULT 10,
  reward_description TEXT NOT NULL DEFAULT 'Free item',
  reward_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stamps_per_dollar DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  auto_redeem BOOLEAN NOT NULL DEFAULT false,
  max_stamps_per_visit INTEGER NOT NULL DEFAULT 5,
  stamp_expiry_days INTEGER,
  minimum_purchase_amount DECIMAL(10,2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(restaurant_id)
);
```

### campaigns Table
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES platform_clients(id),
  restaurant_id UUID REFERENCES restaurants(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  promo_type VARCHAR(50) NOT NULL CHECK (promo_type IN ('bonus_stamps', 'discount', 'free_item', 'double_stamps', 'referral_bonus')),
  reward_config JSONB NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  eligible_locations UUID[] NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'expired')),
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES auth.users(id)
);
```

## React Integration

### Hook Usage

```typescript
import { useLoyaltyManager } from '@/hooks/useLoyaltyManager'

function LoyaltyDashboard() {
  const { 
    loyaltySettings, 
    campaigns, 
    loading, 
    pagination,
    fetchLoyaltySettings,
    updateLoyaltySettings,
    fetchCampaigns,
    createCampaign,
    updateCampaign 
  } = useLoyaltyManager('client-id')

  // Fetch settings for specific restaurant
  const handleFetchSettings = () => {
    fetchLoyaltySettings('restaurant-id')
  }

  // Update loyalty settings
  const handleUpdateSettings = async () => {
    const success = await updateLoyaltySettings('restaurant-id', {
      stamps_required: 12,
      reward_description: 'Free large pizza',
      reward_value: 18.99
    })
    if (success) {
      // Settings updated successfully
    }
  }

  // Create campaign
  const handleCreateCampaign = async () => {
    const success = await createCampaign({
      title: 'Weekend Special',
      description: 'Double stamps all weekend long!',
      promo_type: 'double_stamps',
      reward_config: {},
      start_date: '2024-01-26',
      end_date: '2024-01-28',
      eligible_locations: ['loc1', 'loc2']
    })
    if (success) {
      // Campaign created successfully
    }
  }

  return (
    <div>
      {/* Your UI components */}
    </div>
  )
}
```

### TypeScript Interfaces

```typescript
interface LoyaltySettings {
  id: string
  restaurant_id: string
  stamps_required: number
  reward_description: string
  reward_value: number
  stamps_per_dollar: number
  auto_redeem: boolean
  max_stamps_per_visit: number
  stamp_expiry_days?: number
  minimum_purchase_amount?: number
  updated_at: string
  updated_by: string
  restaurant?: {
    id: string
    name: string
    client_id: string
  }
}

interface Campaign {
  id: string
  client_id: string
  restaurant_id?: string
  title: string
  description: string
  promo_type: 'bonus_stamps' | 'discount' | 'free_item' | 'double_stamps' | 'referral_bonus'
  reward_config: {
    bonus_stamps?: number
    discount_percentage?: number
    discount_amount?: number
    free_item_description?: string
    referral_bonus_stamps?: number
  }
  start_date: string
  end_date: string
  eligible_locations: string[]
  status: 'draft' | 'active' | 'paused' | 'expired'
  usage_limit?: number
  usage_count: number
  created_at: string
  updated_at: string
  created_by: string
}
```

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "error": "Campaign title must be at least 3 characters long"
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
  "error": "Forbidden: You are not authorized to manage loyalty settings for this client"
}
```

**404 Not Found**
```json
{
  "error": "Campaign not found or access denied"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "details": "Detailed error message"
}
```

## Security Features

### Row Level Security (RLS)
- All database operations are protected by RLS policies
- Users can only access data for their authorized clients/restaurants
- Platform admins have override access for system administration

### Input Validation
- All user inputs are validated on the server side
- SQL injection protection through parameterized queries
- XSS prevention through proper data sanitization

### Audit Logging
- All loyalty settings updates are logged to `platform_activity_log`
- Campaign creation and updates are tracked with user attribution
- Complete audit trail for compliance and debugging

## Testing

### Mock Mode
The system includes a comprehensive mock mode for testing:

```typescript
// Enable mock mode in useLoyaltyManager.ts
const MOCK_MODE = true

// Mock data includes:
// - 2 loyalty settings with different configurations
// - 3 campaigns with various statuses and types
// - Realistic API delays and error simulation
```

### Test Data
Mock loyalty settings:
- Main Street Location: 10 stamps, $15.99 reward, 1.0 stamps/$
- Mall Location: 8 stamps, $3.99 reward, 1.5 stamps/$

Mock campaigns:
- Double Stamp Weekend (active)
- New Customer Bonus (active)
- Holiday Special (expired)

## Deployment

### Prerequisites
1. Supabase project with Edge Functions enabled
2. Database tables created via migration
3. RLS policies applied
4. Environment variables configured

### Deployment Steps
1. Deploy Edge Function:
   ```bash
   supabase functions deploy loyalty-manager
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
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (for admin operations)

## Troubleshooting

### Common Issues

1. **"Unauthorized" errors**
   - Verify session token is valid
   - Check user has appropriate role (client_admin or restaurant_admin)

2. **"Forbidden" errors**
   - Ensure user has access to the specified client_id
   - Verify RLS policies are correctly applied

3. **Campaign validation errors**
   - Check all required fields are provided
   - Verify date ranges are valid (end > start)
   - Ensure eligible_locations array is not empty

4. **Database connection issues**
   - Verify Supabase project is active
   - Check environment variables are correctly set
   - Ensure database migration has been applied

### Debug Mode
Enable detailed logging by setting:
```typescript
console.log('Debug mode enabled')
// Add debug statements in Edge Function
```

## API Rate Limits

- Standard Supabase Edge Function limits apply
- Recommended: Implement client-side debouncing for frequent updates
- Consider caching for read-heavy operations

## Support

For technical support or feature requests:
1. Check this documentation first
2. Review error logs in Supabase dashboard
3. Test with mock mode enabled
4. Contact development team with specific error details 
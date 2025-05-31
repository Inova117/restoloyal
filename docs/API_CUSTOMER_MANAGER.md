# Customer Manager API Documentation

## Overview

The Customer Manager API provides secure endpoints for restaurant HQ (Tier 2) to view and manage their customers across all locations. This system enforces role-based access control and includes comprehensive filtering, search, and customer profile management capabilities.

## Base URL

```
https://your-project.supabase.co/functions/v1/customer-manager
```

## Authentication

All requests require a valid Supabase session token in the Authorization header:

```
Authorization: Bearer <session_access_token>
```

## Authorization Roles

- **client_admin**: Can manage all customers for their client
- **restaurant_admin**: Can manage customers for their specific restaurant
- **platform_admin**: Can manage customers for all clients (super admin access)

## Endpoints

### 1. List Customers

**GET** `/customer-manager`

Retrieve a paginated list of customers with optional filtering and search.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `client_id` | string | Yes | Client ID to filter customers |
| `location_id` | string | No | Filter by specific location |
| `search` | string | No | Search by name, email, or phone |
| `status` | string | No | Filter by status: `active`, `inactive`, `blocked` |
| `limit` | number | No | Number of results per page (default: 50, max: 100) |
| `offset` | number | No | Number of results to skip (default: 0) |

#### Example Request

```bash
curl -X GET "https://your-project.supabase.co/functions/v1/customer-manager?client_id=galletti-client-id&search=john&status=active&limit=25&offset=0" \
  -H "Authorization: Bearer <session_token>" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "customer_123",
      "restaurant_id": "rest_456",
      "location_id": "loc_789",
      "name": "John Smith",
      "email": "john.smith@email.com",
      "phone": "(555) 123-4567",
      "qr_code": "QR001",
      "stamps": 8,
      "total_visits": 15,
      "last_visit": "2024-01-22T14:30:00Z",
      "customer_status": "active",
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-22T14:30:00Z",
      "location": {
        "id": "loc_789",
        "name": "Main Street Store",
        "address": "123 Main St, Downtown, CA"
      },
      "restaurant": {
        "id": "rest_456",
        "name": "Galletti Pizza",
        "client_id": "galletti-client-id"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 25,
    "offset": 0,
    "hasMore": true
  }
}
```

### 2. Get Customer Details

**GET** `/customer-manager?customer_id={id}`

Retrieve detailed information about a specific customer, including recent activity.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `client_id` | string | Yes | Client ID for authorization |
| `customer_id` | string | Yes | Specific customer ID to retrieve |

#### Example Request

```bash
curl -X GET "https://your-project.supabase.co/functions/v1/customer-manager?client_id=galletti-client-id&customer_id=customer_123" \
  -H "Authorization: Bearer <session_token>" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "customer_123",
    "restaurant_id": "rest_456",
    "location_id": "loc_789",
    "name": "John Smith",
    "email": "john.smith@email.com",
    "phone": "(555) 123-4567",
    "qr_code": "QR001",
    "stamps": 8,
    "total_visits": 15,
    "last_visit": "2024-01-22T14:30:00Z",
    "customer_status": "active",
    "created_at": "2024-01-10T10:00:00Z",
    "updated_at": "2024-01-22T14:30:00Z",
    "location": {
      "id": "loc_789",
      "name": "Main Street Store",
      "address": "123 Main St, Downtown, CA"
    },
    "restaurant": {
      "id": "rest_456",
      "name": "Galletti Pizza",
      "client_id": "galletti-client-id"
    },
    "recent_stamps": [
      {
        "id": "stamp_001",
        "amount": 2,
        "notes": "Large pizza purchase",
        "created_at": "2024-01-22T14:30:00Z",
        "added_by_name": "Store Manager"
      }
    ],
    "recent_rewards": [
      {
        "id": "reward_001",
        "stamps_used": 10,
        "description": "Free medium pizza",
        "value": 15.99,
        "created_at": "2024-01-18T19:45:00Z",
        "redeemed_by_name": "Store Manager"
      }
    ]
  }
}
```

### 3. Update Customer

**PATCH** `/customer-manager?customer_id={id}`

Update customer information and status.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `client_id` | string | Yes | Client ID for authorization |
| `customer_id` | string | Yes | Customer ID to update |

#### Request Body

```json
{
  "name": "John Smith Jr.",
  "email": "john.smith.jr@email.com",
  "phone": "(555) 123-4567",
  "customer_status": "active",
  "location_id": "loc_789"
}
```

#### Example Request

```bash
curl -X PATCH "https://your-project.supabase.co/functions/v1/customer-manager?client_id=galletti-client-id&customer_id=customer_123" \
  -H "Authorization: Bearer <session_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith Jr.",
    "email": "john.smith.jr@email.com",
    "customer_status": "active"
  }'
```

#### Example Response

```json
{
  "success": true,
  "message": "Customer updated successfully",
  "data": {
    "id": "customer_123",
    "restaurant_id": "rest_456",
    "location_id": "loc_789",
    "name": "John Smith Jr.",
    "email": "john.smith.jr@email.com",
    "phone": "(555) 123-4567",
    "qr_code": "QR001",
    "stamps": 8,
    "total_visits": 15,
    "last_visit": "2024-01-22T14:30:00Z",
    "customer_status": "active",
    "created_at": "2024-01-10T10:00:00Z",
    "updated_at": "2024-01-23T10:15:00Z",
    "location": {
      "id": "loc_789",
      "name": "Main Street Store",
      "address": "123 Main St, Downtown, CA"
    },
    "restaurant": {
      "id": "rest_456",
      "name": "Galletti Pizza",
      "client_id": "galletti-client-id"
    }
  }
}
```

## Customer Status Values

| Status | Description |
|--------|-------------|
| `active` | Customer can earn and redeem stamps normally |
| `inactive` | Customer account is suspended, cannot earn/redeem stamps |
| `blocked` | Customer is permanently blocked from the loyalty program |

## Error Responses

### 400 Bad Request

```json
{
  "error": "client_id is required"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden: You are not authorized to manage customers for this client"
}
```

### 404 Not Found

```json
{
  "error": "Customer not found or access denied"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "details": "Specific error message"
}
```

## React Integration

### Hook Usage

```typescript
import { useCustomerManager } from '@/hooks/useCustomerManager'

function CustomerManagement() {
  const { 
    customers, 
    loading, 
    pagination, 
    fetchCustomers, 
    fetchCustomerById, 
    updateCustomer 
  } = useCustomerManager('your-client-id')

  // Fetch customers with filters
  const handleSearch = async () => {
    await fetchCustomers({
      search: 'john',
      status: 'active',
      location_id: 'loc_123',
      limit: 25,
      offset: 0
    })
  }

  // Get customer details
  const handleViewCustomer = async (customerId: string) => {
    const customer = await fetchCustomerById(customerId)
    console.log(customer)
  }

  // Update customer
  const handleUpdateCustomer = async (customerId: string) => {
    const success = await updateCustomer(customerId, {
      name: 'New Name',
      customer_status: 'inactive'
    })
    if (success) {
      console.log('Customer updated successfully')
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
interface Customer {
  id: string
  restaurant_id: string
  location_id?: string
  name: string
  email?: string
  phone?: string
  qr_code: string
  stamps: number
  total_visits: number
  last_visit?: string
  customer_status: 'active' | 'inactive' | 'blocked'
  created_at: string
  updated_at: string
  location?: {
    id: string
    name: string
    address: string
  }
  restaurant?: {
    id: string
    name: string
    client_id: string
  }
  recent_stamps?: Array<{
    id: string
    amount: number
    notes?: string
    created_at: string
    added_by_name?: string
  }>
  recent_rewards?: Array<{
    id: string
    stamps_used: number
    description?: string
    value?: number
    created_at: string
    redeemed_by_name?: string
  }>
}

interface CustomerFilters {
  location_id?: string
  search?: string
  status?: 'active' | 'inactive' | 'blocked'
  limit?: number
  offset?: number
}

interface UpdateCustomerData {
  name?: string
  email?: string
  phone?: string
  customer_status?: 'active' | 'inactive' | 'blocked'
  location_id?: string
}
```

## Security Features

### Row Level Security (RLS)

The API enforces RLS policies on the `clients` table:

- **Client Admins**: Can view/edit all customers for their client
- **Restaurant Admins**: Can view/edit customers for their specific restaurant only
- **Platform Admins**: Can view/edit customers for all clients

### Input Validation

- Email format validation
- Customer status validation (must be active, inactive, or blocked)
- Required field validation
- SQL injection prevention

### Audit Logging

All customer updates are logged to the `platform_activity_log` table with:
- Activity type: `customer_updated`
- User ID and email
- Client ID and customer ID
- Updated fields
- Timestamp

## Database Schema Requirements

### Required Tables

1. **clients** - Customer records
2. **restaurants** - Restaurant information
3. **locations** - Location information
4. **stamps** - Stamp transaction history
5. **rewards** - Reward redemption history
6. **user_roles** - User authorization
7. **platform_admin_users** - Platform admin access
8. **platform_activity_log** - Audit trail

### Required Indexes

```sql
CREATE INDEX idx_clients_restaurant_id ON clients (restaurant_id);
CREATE INDEX idx_clients_location_id ON clients (location_id);
CREATE INDEX idx_clients_customer_status ON clients (customer_status);
CREATE INDEX idx_clients_name_search ON clients USING gin (name gin_trgm_ops);
CREATE INDEX idx_clients_email_search ON clients USING gin (email gin_trgm_ops);
CREATE INDEX idx_clients_phone_search ON clients USING gin (phone gin_trgm_ops);
```

## Testing

### Test Customer Data

The system includes mock data for testing:
- 5 sample customers with different statuses
- Various locations and contact information
- Realistic stamp and visit counts
- Mock recent activity data

### Testing Endpoints

1. **List Customers**: Test pagination, filtering, and search
2. **Customer Details**: Test individual customer retrieval with activity
3. **Update Customer**: Test all field updates and status changes
4. **Authorization**: Test role-based access control
5. **Error Handling**: Test invalid inputs and unauthorized access

## Deployment

### Edge Function Deployment

```bash
# Deploy the customer-manager function
npx supabase functions deploy customer-manager

# Verify deployment
npx supabase functions list
```

### Database Migration

```bash
# Apply RLS policies and indexes
npx supabase db push
```

### Environment Variables

Ensure these are set in your Supabase project:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Troubleshooting

### Common Issues

1. **"Edge Function not found"**: Ensure the function is deployed
2. **"Unauthorized"**: Check session token and user authentication
3. **"Forbidden"**: Verify user has correct role for the client
4. **"No customers found"**: Check RLS policies and client_id parameter

### Debug Mode

Enable mock mode in the React hook for testing:

```typescript
// In src/hooks/useCustomerManager.ts
const MOCK_MODE = true // Set to false for production
```

This provides a complete customer management system with secure API endpoints, comprehensive UI, and proper role-based access control for restaurant HQ operations. 
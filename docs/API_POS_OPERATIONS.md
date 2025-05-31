# POS Operations API Documentation

## Overview

The POS Operations API provides secure endpoints for Point of Sale systems and staff to manage customer registrations, loyalty stamps, and reward redemptions. All operations are secured with location-based permissions and comprehensive audit logging.

## Base URL

```
https://your-project.supabase.co/functions/v1/pos-operations
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Register Customer

Register a new customer or check-in an existing customer by QR code.

**Endpoint:** `POST /register-customer`

**Request Body:**
```json
{
  "location_id": "uuid",
  "qr_code": "string (optional)",
  "customer_data": {
    "name": "string (required if no qr_code)",
    "email": "string (required if no qr_code)",
    "phone": "string (required if no qr_code)"
  }
}
```

**Response:**
```json
{
  "success": true,
  "customer": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "phone": "string",
    "qr_code": "string",
    "status": "active",
    "created_at": "timestamp"
  },
  "message": "Customer registered successfully"
}
```

**Example Usage:**

```javascript
// Register new customer
const response = await fetch('/functions/v1/pos-operations/register-customer', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    location_id: 'loc_123',
    customer_data: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-0123'
    }
  })
})

// Check-in existing customer with QR code
const response = await fetch('/functions/v1/pos-operations/register-customer', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    location_id: 'loc_123',
    qr_code: 'QR_1234567890'
  })
})
```

### 2. Add Stamps

Award loyalty stamps to a customer for a purchase.

**Endpoint:** `POST /add-stamp`

**Request Body:**
```json
{
  "customer_id": "uuid",
  "location_id": "uuid",
  "stamps_earned": "number (1-10)",
  "amount": "number (optional)",
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "stamp_record": {
    "id": "uuid",
    "customer_id": "uuid",
    "location_id": "uuid",
    "stamps_earned": "number",
    "amount": "number",
    "created_at": "timestamp"
  },
  "customer_summary": {
    "total_stamps": "number",
    "available_rewards": "number",
    "stamps_for_next_reward": "number"
  },
  "message": "Added 2 stamp(s) successfully"
}
```

**Example Usage:**

```javascript
const response = await fetch('/functions/v1/pos-operations/add-stamp', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customer_id: 'cust_123',
    location_id: 'loc_123',
    stamps_earned: 2,
    amount: 25.99,
    notes: 'Large coffee and pastry'
  })
})
```

### 3. Redeem Reward

Process a reward redemption for a customer.

**Endpoint:** `POST /redeem-reward`

**Request Body:**
```json
{
  "customer_id": "uuid",
  "location_id": "uuid",
  "reward_type": "string",
  "stamps_to_redeem": "number (10 or 20)"
}
```

**Response:**
```json
{
  "success": true,
  "reward_record": {
    "id": "uuid",
    "customer_id": "uuid",
    "location_id": "uuid",
    "reward_type": "string",
    "reward_value": "string",
    "stamps_used": "number",
    "redeemed_at": "timestamp",
    "status": "redeemed"
  },
  "customer_summary": {
    "remaining_stamps": "number",
    "available_rewards": "number",
    "stamps_for_next_reward": "number"
  },
  "message": "Reward redeemed successfully: Free Coffee"
}
```

**Example Usage:**

```javascript
const response = await fetch('/functions/v1/pos-operations/redeem-reward', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customer_id: 'cust_123',
    location_id: 'loc_123',
    reward_type: 'Free Coffee',
    stamps_to_redeem: 10
  })
})
```

### 4. Customer Lookup

Find customers by QR code, phone, or email.

**Endpoint:** `POST /customer-lookup`

**Request Body:**
```json
{
  "location_id": "uuid",
  "qr_code": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "customers": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "phone": "string",
      "qr_code": "string",
      "status": "string",
      "total_stamps": "number",
      "total_rewards": "number",
      "created_at": "timestamp"
    }
  ]
}
```

**Example Usage:**

```javascript
// Lookup by QR code
const response = await fetch('/functions/v1/pos-operations/customer-lookup', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    location_id: 'loc_123',
    qr_code: 'QR_1234567890'
  })
})

// Lookup by phone
const response = await fetch('/functions/v1/pos-operations/customer-lookup', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    location_id: 'loc_123',
    phone: '+1-555-0123'
  })
})
```

## Security Features

### Location-Based Permissions

- Staff can only operate within their assigned location(s)
- Client admins can operate across all locations in their franchise
- All operations are scoped to the staff member's permitted locations

### Role-Based Access Control

Staff permissions are controlled via the `location_staff` table:

```json
{
  "can_register_customers": true,
  "can_add_stamps": true,
  "can_redeem_rewards": true,
  "can_view_customer_data": true,
  "can_process_refunds": false,
  "can_manage_inventory": false
}
```

### Audit Logging

All POS operations are logged in the `customer_activity` table:

- Customer registrations
- Stamp additions
- Reward redemptions
- Staff member who performed the action
- Timestamp and location details

### Data Validation

- Customer verification (active status, correct client)
- Location verification (staff permissions)
- Stamp limits (max per visit based on loyalty settings)
- Reward eligibility (sufficient stamps)

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "error": "Missing authorization header"
}
```

**403 Forbidden:**
```json
{
  "error": "Insufficient permissions for this location"
}
```

**404 Not Found:**
```json
{
  "error": "Customer not found"
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid stamps amount. Must be between 1 and 10"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "details": "Detailed error message"
}
```

## React Hook Integration

### usePOSOperations Hook

```typescript
import { usePOSOperations } from '@/hooks/usePOSOperations'

const MyComponent = () => {
  const { 
    registerCustomer, 
    addStamp, 
    redeemReward, 
    lookupCustomer, 
    isLoading 
  } = usePOSOperations()

  const handleRegister = async () => {
    const result = await registerCustomer({
      location_id: 'loc_123',
      customer_data: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123'
      }
    })
    
    if (result.success) {
      console.log('Customer registered:', result.customer)
    }
  }

  return (
    <button onClick={handleRegister} disabled={isLoading}>
      Register Customer
    </button>
  )
}
```

### TypeScript Interfaces

```typescript
interface CustomerRegistrationRequest {
  qr_code?: string
  customer_data?: {
    name: string
    email: string
    phone: string
  }
  location_id: string
}

interface AddStampRequest {
  customer_id: string
  location_id: string
  stamps_earned: number
  amount?: number
  notes?: string
}

interface RedeemRewardRequest {
  customer_id: string
  location_id: string
  reward_type: string
  stamps_to_redeem: number
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  qr_code: string
  status: string
  total_stamps: number
  total_rewards: number
  created_at: string
}
```

## Testing

### Mock Mode

The React hook includes a mock mode for testing:

```typescript
// In usePOSOperations.ts
const MOCK_MODE = true // Set to false for production

// Mock responses include:
// - Realistic customer data generation
// - Simulated API delays
// - Success/error scenarios
// - Stamp calculations
// - Reward processing
```

### Test Scenarios

1. **Customer Registration:**
   - New customer registration
   - Existing customer QR scan
   - Blocked customer handling

2. **Stamp Operations:**
   - Valid stamp addition
   - Stamp limit validation
   - Customer verification

3. **Reward Redemption:**
   - Sufficient stamps check
   - Reward type validation
   - Customer eligibility

4. **Customer Lookup:**
   - QR code search
   - Phone number search
   - Email search
   - No results handling

## Database Schema

### Required Tables

- `location_staff` - Staff permissions and location assignments
- `customer_activity` - Audit log for all POS operations
- `customers` - Customer records with QR codes
- `stamps` - Stamp transaction records
- `rewards` - Reward redemption records
- `loyalty_settings` - Location-specific loyalty configuration

### RLS Policies

All tables have Row Level Security policies that enforce:
- Location-based data access
- Staff permission verification
- Client data scoping
- Audit trail integrity

## Deployment

1. Deploy the Edge Function to Supabase
2. Run the database migration for RLS policies
3. Configure staff permissions in `location_staff` table
4. Set up loyalty settings for each location
5. Test with mock mode before going live

## Rate Limiting

Consider implementing rate limiting for:
- Customer registrations (prevent spam)
- Stamp additions (prevent abuse)
- Reward redemptions (prevent double-redemption)

## Monitoring

Monitor these metrics:
- POS operation success rates
- Average response times
- Failed authentication attempts
- Unusual activity patterns
- Customer registration trends 
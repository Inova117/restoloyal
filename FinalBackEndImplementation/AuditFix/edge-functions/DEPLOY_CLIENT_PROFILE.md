# CLIENT PROFILE Edge Function Deployment Guide

## Overview
Edge Function for managing client profile operations in the 4-tier restaurant loyalty system.

## Function Details
- **Name**: `client-profile`
- **Location**: `FinalBackEndImplementation/AuditFix/edge-functions/client-profile/`
- **Purpose**: Handle client CRUD operations with proper authorization

## Supported Operations

### GET /client-profile
**Access**: Superadmin (all clients), Client Admin (own client only)

Query Parameters:
- `client_id` (optional for superadmin, auto-set for client_admin)
- `search` - Search by name, email, or slug
- `status` - Filter by status: active, inactive, suspended
- `business_type` - Filter by business type
- `include_stats` - Include metrics (true/false)
- `limit` - Pagination limit (default: 50)
- `offset` - Pagination offset (default: 0)

### POST /client-profile  
**Access**: Superadmin only

Body:
```json
{
  "name": "Restaurant Chain Name",
  "email": "admin@restaurant.com",
  "phone": "+1234567890",
  "business_type": "restaurant",
  "settings": {}
}
```

### PATCH /client-profile
**Access**: Superadmin (any client), Client Admin (own client only)

Query Parameters:
- `client_id` - Required

Body:
```json
{
  "name": "Updated Name",
  "email": "new@email.com",
  "phone": "+9876543210",
  "status": "active",
  "business_type": "cafe",
  "settings": {}
}
```

### DELETE /client-profile
**Access**: Superadmin only

Query Parameters:
- `client_id` - Required

## Authorization Matrix

| Role | GET | POST | PATCH | DELETE |
|------|-----|------|-------|--------|
| Superadmin | ✅ All clients | ✅ | ✅ Any client | ✅ |
| Client Admin | ✅ Own client | ❌ | ✅ Own client | ❌ |
| Location Staff | ❌ | ❌ | ❌ | ❌ |

## Database Schema Dependencies

### Required Tables:
- `clients` - Main client profile data
- `user_roles` - Authorization and tier validation
- `locations` - For stats counting
- `customers` - For stats counting  
- `location_staff` - For stats counting
- `stamps` - For stats counting
- `rewards` - For stats counting

### Key Fields Used:
```sql
-- clients table
id, name, slug, email, phone, business_type, status, settings, created_at, updated_at

-- user_roles table  
user_id, tier, role_id, client_id, location_id
```

## Deployment Commands

### 1. Deploy to Supabase
```bash
# From project root
cd FinalBackEndImplementation/AuditFix/edge-functions

# Deploy the function
supabase functions deploy client-profile --project-ref YOUR_PROJECT_REF
```

### 2. Set Environment Variables
Ensure these are configured in Supabase dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Testing Endpoints

#### Test GET (Superadmin)
```bash
curl -X GET "https://your-project-ref.supabase.co/functions/v1/client-profile?include_stats=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Test GET (Client Admin - Own Client)
```bash
curl -X GET "https://your-project-ref.supabase.co/functions/v1/client-profile?client_id=CLIENT_ID" \
  -H "Authorization: Bearer CLIENT_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Test POST (Superadmin Only)
```bash
curl -X POST "https://your-project-ref.supabase.co/functions/v1/client-profile" \
  -H "Authorization: Bearer SUPERADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Restaurant Chain",
    "email": "test@restaurant.com",
    "business_type": "restaurant"
  }'
```

#### Test PATCH
```bash
curl -X PATCH "https://your-project-ref.supabase.co/functions/v1/client-profile?client_id=CLIENT_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Restaurant Name",
    "status": "active"
  }'
```

## Response Format

### Success Response
```json
{
  "data": {
    "id": "client-uuid",
    "name": "Restaurant Name",
    "slug": "restaurant-name",
    "email": "admin@restaurant.com", 
    "phone": "+1234567890",
    "business_type": "restaurant",
    "status": "active",
    "settings": {},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    // With include_stats=true:
    "locations_count": 5,
    "customers_count": 1250,
    "staff_count": 15,
    "stamps_count": 8900,
    "rewards_count": 142,
    "monthly_revenue": 0
  },
  "count": 1
}
```

### Error Response
```json
{
  "error": "Error message describing the issue"
}
```

## Security Features

1. **JWT Token Validation** - All requests require valid auth tokens
2. **Role-Based Access Control** - Tier verification in user_roles table
3. **Client Isolation** - Client admins can only access their own client
4. **Input Validation** - Required fields and format validation
5. **Slug Generation** - Automatic URL-safe slug creation
6. **Conflict Prevention** - Duplicate slug detection
7. **Cascade Protection** - Prevents deletion of clients with dependencies

## Error Handling

- `401` - Missing or invalid authorization
- `403` - Insufficient permissions for operation
- `404` - Client not found
- `409` - Conflict (duplicate slug/name)
- `400` - Validation errors
- `500` - Server errors

## Integration Notes

This Edge Function integrates with:
- Frontend `useClientManagement.ts` hook
- Platform dashboard client management
- Client profile forms and modals
- Authentication system via user_roles

## Monitoring

Monitor function performance in Supabase Dashboard:
- Function logs for errors
- Request volume and response times
- Authorization failures
- Database query performance 
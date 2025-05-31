# Location Manager API Documentation

## Overview

The Location Manager API allows restaurant HQ (franchise admins) to manage all their locations with full CRUD operations. This API enforces strict role-based access control ensuring only authorized users can manage locations for their client.

## Security Model

### Role-Based Access Control

- **Client Admins**: Can manage all locations for their client
- **Restaurant Admins**: Can manage locations for their specific restaurant
- **Platform Admins**: Can manage all locations across all clients

### Row Level Security (RLS)

All location operations are protected by RLS policies that automatically filter data based on user roles and client associations.

## API Endpoints

### Base URL
```
https://your-project.supabase.co/functions/v1/location-manager
```

### Authentication
All requests require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## GET - List Locations

Retrieve all locations for a specific client.

### Request
```http
GET /location-manager?client_id={client_id}
```

### Parameters
- `client_id` (required): The client ID to fetch locations for

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "location-uuid",
      "restaurant_id": "restaurant-uuid",
      "name": "Downtown Store",
      "address": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "zip_code": "10001",
      "phone": "+1 (555) 123-4567",
      "manager_name": "John Smith",
      "manager_email": "john@restaurant.com",
      "is_active": true,
      "latitude": 40.7128,
      "longitude": -74.0060,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "restaurants": {
        "id": "restaurant-uuid",
        "name": "Pizza Palace",
        "client_id": "client-uuid"
      }
    }
  ]
}
```

---

## POST - Create Location

Add a new location to a restaurant.

### Request
```http
POST /location-manager?client_id={client_id}
Content-Type: application/json

{
  "restaurant_id": "restaurant-uuid",
  "name": "Downtown Store",
  "address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "phone": "+1 (555) 123-4567",
  "manager_name": "John Smith",
  "manager_email": "john@restaurant.com",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

### Required Fields
- `restaurant_id`: Must belong to the specified client
- `name`: Location name
- `address`: Street address
- `city`: City name
- `state`: State/province

### Optional Fields
- `zip_code`: Postal code
- `phone`: Contact phone number
- `manager_name`: Store manager name
- `manager_email`: Store manager email (must be valid format)
- `latitude`: GPS latitude coordinate
- `longitude`: GPS longitude coordinate

### Response
```json
{
  "success": true,
  "message": "Location created successfully",
  "data": {
    "id": "new-location-uuid",
    "restaurant_id": "restaurant-uuid",
    "name": "Downtown Store",
    "address": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "phone": "+1 (555) 123-4567",
    "manager_name": "John Smith",
    "manager_email": "john@restaurant.com",
    "is_active": true,
    "latitude": 40.7128,
    "longitude": -74.0060,
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

---

## PATCH - Update Location

Update an existing location.

### Request
```http
PATCH /location-manager?client_id={client_id}&location_id={location_id}
Content-Type: application/json

{
  "name": "Updated Store Name",
  "phone": "+1 (555) 987-6543",
  "is_active": false
}
```

### Updatable Fields
- `name`: Location name
- `address`: Street address
- `city`: City name
- `state`: State/province
- `zip_code`: Postal code
- `phone`: Contact phone number
- `manager_name`: Store manager name
- `manager_email`: Store manager email
- `is_active`: Active status (true/false)
- `latitude`: GPS latitude coordinate
- `longitude`: GPS longitude coordinate

### Response
```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "id": "location-uuid",
    "name": "Updated Store Name",
    "phone": "+1 (555) 987-6543",
    "is_active": false,
    "updated_at": "2024-01-01T13:00:00Z"
  }
}
```

---

## DELETE - Remove Location

Delete a location (only if no customer data exists).

### Request
```http
DELETE /location-manager?client_id={client_id}&location_id={location_id}
```

### Response
```json
{
  "success": true,
  "message": "Location deleted successfully"
}
```

### Error Response (if location has customer data)
```json
{
  "error": "Cannot delete location with existing customer data. Please deactivate instead."
}
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "error": "client_id is required"
}
```

### 401 - Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 - Forbidden
```json
{
  "error": "Forbidden: You are not authorized to manage locations for this client"
}
```

### 404 - Not Found
```json
{
  "error": "Location not found or access denied"
}
```

### 500 - Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Detailed error message"
}
```

---

## React Integration

### Hook Usage

```typescript
import { useLocationManager, useCurrentClientId } from '@/hooks/useLocationManager'

function LocationManagement() {
  const { clientId } = useCurrentClientId()
  const { 
    locations, 
    loading, 
    error, 
    createLocation, 
    updateLocation, 
    deleteLocation,
    refetch 
  } = useLocationManager(clientId)

  // Create a new location
  const handleCreate = async () => {
    const success = await createLocation({
      restaurant_id: 'restaurant-uuid',
      name: 'New Store',
      address: '456 Oak Street',
      city: 'Boston',
      state: 'MA'
    })
    
    if (success) {
      console.log('Location created successfully')
    }
  }

  // Update a location
  const handleUpdate = async (locationId: string) => {
    const success = await updateLocation(locationId, {
      name: 'Updated Store Name',
      is_active: false
    })
    
    if (success) {
      console.log('Location updated successfully')
    }
  }

  // Delete a location
  const handleDelete = async (locationId: string) => {
    const success = await deleteLocation(locationId)
    
    if (success) {
      console.log('Location deleted successfully')
    }
  }

  return (
    <div>
      {loading && <p>Loading locations...</p>}
      {error && <p>Error: {error}</p>}
      
      {locations.map(location => (
        <div key={location.id}>
          <h3>{location.name}</h3>
          <p>{location.address}, {location.city}, {location.state}</p>
          <button onClick={() => handleUpdate(location.id)}>
            Update
          </button>
          <button onClick={() => handleDelete(location.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
```

### Component Usage

```typescript
import { LocationManager } from '@/components/LocationManager'

function App() {
  return (
    <div className="container mx-auto p-6">
      <LocationManager />
    </div>
  )
}
```

---

## Database Schema

### Locations Table
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  phone TEXT,
  manager_name TEXT,
  manager_email TEXT,
  is_active BOOLEAN DEFAULT true,
  latitude DECIMAL,
  longitude DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### RLS Policies
- Client admins can manage all locations for their client
- Restaurant admins can manage locations for their restaurant
- Platform admins can manage all locations
- Automatic `updated_at` timestamp updates

---

## Testing Guide

### Setup Test Data

1. **Create Test Client and Restaurant**
```sql
-- Insert test client
INSERT INTO platform_clients (id, name, contact_email, plan, status)
VALUES ('test-client-id', 'Test Restaurant Chain', 'admin@testchain.com', 'business', 'active');

-- Insert test restaurant
INSERT INTO restaurants (id, client_id, name, is_active)
VALUES ('test-restaurant-id', 'test-client-id', 'Test Restaurant', true);

-- Assign user role
INSERT INTO user_roles (user_id, role, client_id)
VALUES ('your-user-id', 'client_admin', 'test-client-id');
```

2. **Set Client ID in Session Storage**
```javascript
sessionStorage.setItem('current_client_id', 'test-client-id');
```

### Test API Endpoints

#### Test GET Request
```bash
curl -X GET \
  "https://your-project.supabase.co/functions/v1/location-manager?client_id=test-client-id" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Test POST Request
```bash
curl -X POST \
  "https://your-project.supabase.co/functions/v1/location-manager?client_id=test-client-id" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "test-restaurant-id",
    "name": "Test Location",
    "address": "123 Test Street",
    "city": "Test City",
    "state": "TS"
  }'
```

#### Test PATCH Request
```bash
curl -X PATCH \
  "https://your-project.supabase.co/functions/v1/location-manager?client_id=test-client-id&location_id=location-uuid" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Location",
    "is_active": false
  }'
```

#### Test DELETE Request
```bash
curl -X DELETE \
  "https://your-project.supabase.co/functions/v1/location-manager?client_id=test-client-id&location_id=location-uuid" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test React Component

1. **Add to your app**
```typescript
import { LocationManager } from '@/components/LocationManager'

function TestPage() {
  return (
    <div className="container mx-auto p-6">
      <LocationManager />
    </div>
  )
}
```

2. **Test functionality**
- View locations list
- Create new location
- Edit existing location
- Toggle location status
- Delete location
- Search and filter locations

---

## Security Considerations

### Data Validation
- All required fields are validated
- Email format validation for manager emails
- Restaurant ownership verification
- Client access verification

### Audit Logging
All location operations are logged to `platform_activity_log` with:
- Activity type (location_added, location_updated, location_deleted)
- User information
- Location details
- Timestamp

### Access Control
- RLS policies prevent unauthorized access
- Multi-level role checking (client_admin, restaurant_admin, platform_admin)
- Client isolation enforced at database level

### Data Protection
- Sensitive location data only accessible to authorized users
- Automatic data filtering based on user roles
- Secure deletion with dependency checking

---

## Troubleshooting

### Common Issues

1. **"Forbidden" Error**
   - Verify user has correct role assignment
   - Check client_id matches user's assigned client
   - Ensure session storage has correct client_id

2. **"Invalid restaurant_id" Error**
   - Verify restaurant belongs to the specified client
   - Check restaurant exists and is active

3. **"Cannot delete location" Error**
   - Location has associated customer data
   - Use deactivation instead of deletion

4. **Empty locations list**
   - Check RLS policies are applied correctly
   - Verify user authentication
   - Confirm client has restaurants and locations

### Debug Steps

1. Check user authentication status
2. Verify client_id in session storage
3. Check user_roles table for correct assignments
4. Review browser network tab for API errors
5. Check Supabase logs for detailed error messages

---

## Performance Considerations

- Indexes on `restaurant_id` and `is_active` for fast filtering
- RLS policies optimized with proper indexes
- Automatic timestamp updates with triggers
- Efficient joins between locations and restaurants tables 
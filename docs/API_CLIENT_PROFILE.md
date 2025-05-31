# Client Profile Management API

## Overview

The Client Profile Management API allows restaurant franchise admins (client_admin role) to view and update their brand profile information. This endpoint enforces strict Row Level Security (RLS) to ensure only authorized users can access their own client data.

## Endpoint

```
GET/PATCH /functions/v1/client-profile
```

## Authentication

- **Required**: Bearer token from Supabase Auth
- **Authorization**: User must have `client_admin` role for the specified client
- **Security**: Row Level Security policies enforce access control

## Request Methods

### GET - View Profile

Retrieve the current client profile information.

**Query Parameters:**
- `client_id` (required): The UUID of the client to retrieve

**Example Request:**
```bash
curl -X GET \
  "${SUPABASE_URL}/functions/v1/client-profile?client_id=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Pizza Palace Chain",
    "logo": "https://example.com/logo.png",
    "theme": {
      "primary_color": "#FF6B35",
      "secondary_color": "#F7931E",
      "accent_color": "#FFD23F"
    },
    "contact_email": "admin@pizzapalace.com",
    "contact_phone": "+1 (555) 123-4567",
    "billing_address": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "USA"
    },
    "plan": "business",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### PATCH - Update Profile

Update specific fields of the client profile.

**Request Body:**
```json
{
  "client_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Updated Brand Name",
  "contact_email": "newemail@brand.com",
  "theme": {
    "primary_color": "#3B82F6",
    "secondary_color": "#10B981",
    "accent_color": "#F59E0B"
  }
}
```

**Example Request:**
```bash
curl -X PATCH \
  "${SUPABASE_URL}/functions/v1/client-profile" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Updated Pizza Palace",
    "contact_email": "admin@updatedpizzapalace.com"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Updated Pizza Palace",
    "contact_email": "admin@updatedpizzapalace.com",
    // ... other fields
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

## Data Schema

### ClientProfile Interface

```typescript
interface ClientProfile {
  id: string                    // UUID of the client
  name: string                  // Brand name
  logo?: string                 // Logo URL
  theme?: {                     // Brand theme colors
    primary_color: string       // Hex color code
    secondary_color: string     // Hex color code  
    accent_color: string        // Hex color code
  }
  contact_email: string         // Primary contact email
  contact_phone?: string        // Contact phone number
  billing_address?: {           // Billing address
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  plan: 'trial' | 'business' | 'enterprise'  // Subscription plan
  status: 'active' | 'suspended' | 'trial'   // Account status
  created_at: string            // ISO timestamp
  updated_at: string            // ISO timestamp
}
```

## Updatable Fields

The following fields can be updated via PATCH requests:

- `name` - Brand name (min 2 characters)
- `logo` - Logo URL
- `theme` - Brand theme colors (must be valid hex codes)
- `contact_email` - Contact email (must be valid email format)
- `contact_phone` - Contact phone number
- `billing_address` - Complete billing address object

**Note**: `plan` and `status` fields are read-only and can only be modified by platform admins.

## Validation Rules

### Name
- **Required**: Yes
- **Min Length**: 2 characters
- **Max Length**: 255 characters

### Contact Email
- **Required**: Yes
- **Format**: Valid email address
- **Example**: `admin@brand.com`

### Theme Colors
- **Format**: Valid hex color codes
- **Pattern**: `#[A-Fa-f0-9]{3,6}`
- **Examples**: `#FF6B35`, `#3B82F6`

### Phone Number
- **Required**: No
- **Format**: Any valid phone format
- **Example**: `+1 (555) 123-4567`

## Security Features

### Row Level Security (RLS)

The API enforces strict access control through PostgreSQL RLS policies:

1. **Client Admin Access**: Users with `client_admin` role can only view/update their assigned client
2. **Platform Admin Access**: Users with `super_admin` or `admin` roles can view/update all clients
3. **Authentication Required**: All requests must include valid Bearer token
4. **Role Verification**: User role and client assignment verified on every request

### Audit Logging

All profile updates are automatically logged to `platform_activity_log` table with:
- User ID and email
- Client ID and name
- Updated fields
- Timestamp
- Activity type: `profile_updated`

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden: You are not authorized to manage this client profile"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid email format"
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

### Using the Hook

```typescript
import { useClientProfile, useCurrentClientId } from '@/hooks/useClientProfile'

function ClientProfileComponent() {
  const { clientId } = useCurrentClientId()
  const { profile, loading, error, updateProfile } = useClientProfile(clientId)

  const handleUpdate = async () => {
    const success = await updateProfile({
      name: "New Brand Name",
      contact_email: "new@email.com"
    })
    
    if (success) {
      console.log("Profile updated successfully")
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!profile) return <div>No profile found</div>

  return (
    <div>
      <h1>{profile.name}</h1>
      <p>{profile.contact_email}</p>
      <button onClick={handleUpdate}>Update Profile</button>
    </div>
  )
}
```

### Component Example

```typescript
import { ClientProfileManager } from '@/components/ClientProfileManager'

function App() {
  return (
    <div>
      <ClientProfileManager />
    </div>
  )
}
```

## Database Setup

### Required Tables

1. **platform_clients** - Client profile data
2. **platform_admin_users** - User role assignments
3. **platform_activity_log** - Audit trail

### Required Policies

Run the migration file to set up RLS policies:

```sql
-- Enable RLS and create policies
\i supabase/migrations/20240101000006_client_profile_rls.sql
```

## Testing

### Manual Testing

1. **Setup Test Data**:
   ```sql
   -- Create test client
   INSERT INTO platform_clients (id, name, contact_email, plan, status)
   VALUES ('test-client-id', 'Test Brand', 'test@brand.com', 'business', 'active');
   
   -- Assign user as client admin
   INSERT INTO platform_admin_users (user_id, client_id, role, status)
   VALUES ('user-uuid', 'test-client-id', 'client_admin', 'active');
   ```

2. **Test GET Request**:
   ```bash
   curl -X GET \
     "${SUPABASE_URL}/functions/v1/client-profile?client_id=test-client-id" \
     -H "Authorization: Bearer ${ACCESS_TOKEN}"
   ```

3. **Test PATCH Request**:
   ```bash
   curl -X PATCH \
     "${SUPABASE_URL}/functions/v1/client-profile" \
     -H "Authorization: Bearer ${ACCESS_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"client_id": "test-client-id", "name": "Updated Test Brand"}'
   ```

### Expected Behaviors

- ✅ Client admins can view/update their own client profile
- ✅ Platform admins can view/update any client profile  
- ❌ Client admins cannot access other clients' profiles
- ❌ Unauthorized users receive 401 error
- ❌ Invalid data receives 400 error with validation message
- ✅ All updates are logged to activity log
- ✅ Updated timestamp is automatically set

## Deployment

1. **Deploy Edge Function**:
   ```bash
   supabase functions deploy client-profile
   ```

2. **Run Migrations**:
   ```bash
   supabase db push
   ```

3. **Set Environment Variables**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

## Support

For issues or questions regarding the Client Profile API:

1. Check the error response for specific details
2. Verify user has correct role assignment
3. Ensure RLS policies are properly configured
4. Review audit logs for debugging information 
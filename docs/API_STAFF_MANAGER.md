# Staff Manager API Documentation

## Overview

The Staff Manager API provides comprehensive staff management functionality for restaurant chains (Tier 2 - Restaurant Chain HQ). This API allows client administrators to invite, manage, and control staff access across their entire franchise network.

## Base URL

```
/functions/v1/staff-manager
```

## Authentication

All requests require a valid Supabase session token in the Authorization header:

```
Authorization: Bearer <session_token>
```

## Authorization

- **Client Admins**: Can manage all staff for their client
- **Platform Admins**: Can manage staff for all clients
- **Other roles**: No access to staff management

## Endpoints

### GET - List Staff Members

Retrieve all staff members for a specific client.

**Endpoint:** `GET /functions/v1/staff-manager?client_id={client_id}`

**Parameters:**
- `client_id` (required): The client ID to fetch staff for

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "staff_123",
      "user_id": "user_456",
      "email": "john.doe@restaurant.com",
      "full_name": "John Doe",
      "role": "location_staff",
      "client_id": "client_789",
      "restaurant_id": "restaurant_101",
      "restaurant_name": "Downtown Location",
      "location_id": "location_202",
      "location_name": "Main Street Store",
      "location_address": "123 Main St, City, State",
      "status": "active",
      "invited_at": "2024-01-15T10:30:00Z",
      "last_login": "2024-01-20T14:22:00Z"
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing client_id
- `401`: Unauthorized
- `403`: Forbidden (insufficient permissions)
- `500`: Server error

### POST - Invite Staff Member

Send an invitation to a new staff member.

**Endpoint:** `POST /functions/v1/staff-manager`

**Request Body:**
```json
{
  "email": "new.staff@restaurant.com",
  "full_name": "New Staff Member",
  "role": "location_staff",
  "restaurant_id": "restaurant_101",
  "location_id": "location_202",
  "client_id": "client_789"
}
```

**Required Fields:**
- `email`: Valid email address
- `role`: One of `client_admin`, `restaurant_admin`, `location_staff`
- `client_id`: Target client ID

**Role-Specific Requirements:**
- `restaurant_admin`: Requires `restaurant_id`
- `location_staff`: Requires `location_id`
- `client_admin`: No additional requirements

**Response:**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "data": {
    "id": "staff_124",
    "user_id": "user_457",
    "email": "new.staff@restaurant.com",
    "full_name": "New Staff Member",
    "role": "location_staff",
    "client_id": "client_789",
    "location_id": "location_202",
    "location_name": "Main Street Store",
    "location_address": "123 Main St, City, State",
    "status": "pending",
    "invited_at": "2024-01-21T09:15:00Z"
  }
}
```

**Status Codes:**
- `201`: Staff member invited successfully
- `400`: Validation error (invalid email, missing required fields)
- `401`: Unauthorized
- `403`: Forbidden
- `409`: User already has a role for this client
- `500`: Server error

### PATCH - Update Staff Member

Update an existing staff member's role, assignments, or status.

**Endpoint:** `PATCH /functions/v1/staff-manager?staff_id={staff_id}&client_id={client_id}`

**Parameters:**
- `staff_id` (required): The staff member ID to update
- `client_id` (required): The client ID

**Request Body:**
```json
{
  "role": "restaurant_admin",
  "restaurant_id": "restaurant_101",
  "location_id": null,
  "status": "active"
}
```

**Optional Fields:**
- `role`: New role assignment
- `restaurant_id`: Restaurant assignment (for restaurant_admin)
- `location_id`: Location assignment (for location_staff)
- `status`: `active`, `suspended`, or `pending`

**Response:**
```json
{
  "success": true,
  "message": "Staff member updated successfully",
  "data": {
    "id": "staff_123",
    "user_id": "user_456",
    "email": "john.doe@restaurant.com",
    "full_name": "John Doe",
    "role": "restaurant_admin",
    "client_id": "client_789",
    "restaurant_id": "restaurant_101",
    "restaurant_name": "Downtown Location",
    "location_id": null,
    "location_name": null,
    "status": "active",
    "invited_at": "2024-01-15T10:30:00Z",
    "last_login": "2024-01-20T14:22:00Z"
  }
}
```

**Status Codes:**
- `200`: Staff member updated successfully
- `400`: Validation error
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Staff member not found
- `500`: Server error

### DELETE - Remove Staff Member

Remove a staff member from the client's team.

**Endpoint:** `DELETE /functions/v1/staff-manager?staff_id={staff_id}&client_id={client_id}`

**Parameters:**
- `staff_id` (required): The staff member ID to remove
- `client_id` (required): The client ID

**Response:**
```json
{
  "success": true,
  "message": "Staff member removed successfully"
}
```

**Status Codes:**
- `200`: Staff member removed successfully
- `400`: Missing staff_id or client_id
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Staff member not found
- `500`: Server error

## Staff Roles

### client_admin
- **Description**: Full administrative access to the client account
- **Permissions**: Can manage all staff, locations, settings, and billing
- **Assignments**: No specific restaurant or location assignment

### restaurant_admin
- **Description**: Administrative access to a specific restaurant
- **Permissions**: Can manage staff and settings for assigned restaurant
- **Assignments**: Must be assigned to a specific `restaurant_id`

### location_staff
- **Description**: Staff access to a specific location
- **Permissions**: Can access POS system and basic functions for assigned location
- **Assignments**: Must be assigned to a specific `location_id`

## Staff Status

### active
- **Description**: Staff member has full access to assigned systems
- **Behavior**: Can log in and perform assigned functions

### suspended
- **Description**: Staff member access is temporarily disabled
- **Behavior**: Cannot log in or access any systems

### pending
- **Description**: Staff member has been invited but hasn't activated their account
- **Behavior**: Cannot log in until they complete the invitation process

## Row Level Security (RLS)

The API enforces strict Row Level Security policies:

1. **Client Admins**: Can only manage staff for their assigned client
2. **Platform Admins**: Can manage staff for all clients
3. **Other Roles**: No access to staff management functions

## Audit Logging

All staff management actions are logged to the `platform_activity_log` table:

- Staff invitations
- Role changes
- Status updates
- Staff removals

## Error Handling

### Common Error Responses

**400 - Bad Request**
```json
{
  "error": "email, role, and client_id are required"
}
```

**401 - Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**403 - Forbidden**
```json
{
  "error": "Forbidden: You are not authorized to manage staff for this client"
}
```

**409 - Conflict**
```json
{
  "error": "User already has a role assigned for this client"
}
```

**500 - Server Error**
```json
{
  "error": "Internal server error",
  "details": "Detailed error message"
}
```

## React Integration

### useStaffManager Hook

```typescript
import { useStaffManager } from '@/hooks/useStaffManager'

function StaffManagement() {
  const { 
    staff, 
    loading, 
    error, 
    inviteStaff, 
    updateStaff, 
    removeStaff 
  } = useStaffManager(clientId)

  // Invite a new staff member
  const handleInvite = async () => {
    const success = await inviteStaff({
      email: 'new@staff.com',
      full_name: 'New Staff',
      role: 'location_staff',
      location_id: 'loc_123'
    })
    
    if (success) {
      console.log('Staff invited successfully')
    }
  }

  // Update staff member
  const handleUpdate = async (staffId: string) => {
    const success = await updateStaff(staffId, {
      role: 'restaurant_admin',
      restaurant_id: 'rest_456'
    })
    
    if (success) {
      console.log('Staff updated successfully')
    }
  }

  // Remove staff member
  const handleRemove = async (staffId: string) => {
    const success = await removeStaff(staffId)
    
    if (success) {
      console.log('Staff removed successfully')
    }
  }

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {staff.map(member => (
        <div key={member.id}>
          {member.full_name} - {member.role} - {member.status}
        </div>
      ))}
    </div>
  )
}
```

### StaffManager Component

```typescript
import StaffManager from '@/components/StaffManager'

function Dashboard() {
  return (
    <div>
      <h1>Staff Management</h1>
      <StaffManager clientId="client_123" />
    </div>
  )
}
```

## Testing

### Manual Testing

1. **Test Staff Invitation**:
   ```bash
   curl -X POST /functions/v1/staff-manager \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@staff.com",
       "full_name": "Test Staff",
       "role": "location_staff",
       "location_id": "loc_123",
       "client_id": "client_456"
     }'
   ```

2. **Test Staff List**:
   ```bash
   curl -X GET "/functions/v1/staff-manager?client_id=client_456" \
     -H "Authorization: Bearer <token>"
   ```

3. **Test Staff Update**:
   ```bash
   curl -X PATCH "/functions/v1/staff-manager?staff_id=staff_123&client_id=client_456" \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"status": "suspended"}'
   ```

### Integration Testing

The API integrates with:
- Supabase Auth for user management
- Email invitation system
- Row Level Security policies
- Audit logging system

## Security Considerations

1. **Authentication**: All requests require valid session tokens
2. **Authorization**: Role-based access control enforced at API level
3. **Input Validation**: All inputs are validated and sanitized
4. **RLS Enforcement**: Database-level security prevents unauthorized access
5. **Audit Trail**: All actions are logged for compliance and security

## Troubleshooting

### Common Issues

1. **"Unauthorized" Error**: Check that the session token is valid and not expired
2. **"Forbidden" Error**: Verify the user has client_admin role for the target client
3. **"User already has a role" Error**: Check if the user is already assigned to this client
4. **Email Invitation Failures**: Verify email format and SMTP configuration

### Debug Mode

Enable debug logging by setting environment variables:
```
DEBUG_STAFF_MANAGER=true
LOG_LEVEL=debug
```

This will provide detailed logging for troubleshooting API issues. 
# Client Profile API Testing Guide

## Setup Test Data

Before testing the API, you need to set up test data in your Supabase database.

### 1. Create Test Client

```sql
-- Insert a test client
INSERT INTO platform_clients (id, name, contact_email, plan, status)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Test Pizza Chain', 'admin@testpizza.com', 'business', 'active')
ON CONFLICT (id) DO NOTHING;
```

### 2. Create Test User Role

First, you need to get your user ID from Supabase Auth. You can find this in the Supabase dashboard under Authentication > Users.

```sql
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from Supabase Auth
INSERT INTO user_roles (user_id, role, client_id)
VALUES ('YOUR_USER_ID_HERE', 'client_admin', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT DO NOTHING;
```

### 3. Set Client ID in Session Storage

In your browser console (when logged into the app), run:

```javascript
sessionStorage.setItem('current_client_id', '550e8400-e29b-41d4-a716-446655440000');
```

## Testing the API

### 1. Test GET Request (View Profile)

```bash
# Replace with your actual Supabase URL and access token
curl -X GET \
  "https://your-project.supabase.co/functions/v1/client-profile?client_id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Test Pizza Chain",
    "contact_email": "admin@testpizza.com",
    "plan": "business",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Test PATCH Request (Update Profile)

```bash
curl -X PATCH \
  "https://your-project.supabase.co/functions/v1/client-profile" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Pizza Chain",
    "contact_phone": "+1 (555) 123-4567",
    "theme": {
      "primary_color": "#FF6B35",
      "secondary_color": "#F7931E",
      "accent_color": "#FFD23F"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Pizza Chain",
    "contact_email": "admin@testpizza.com",
    "contact_phone": "+1 (555) 123-4567",
    "theme": {
      "primary_color": "#FF6B35",
      "secondary_color": "#F7931E",
      "accent_color": "#FFD23F"
    },
    "plan": "business",
    "status": "active",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

## Testing React Component

### 1. Add Component to Your App

```typescript
// In your main app component or a test page
import { ClientProfileManager } from '@/components/ClientProfileManager'

function TestPage() {
  return (
    <div className="container mx-auto p-6">
      <ClientProfileManager />
    </div>
  )
}
```

### 2. Test the UI

1. **Load Profile**: The component should automatically load the test client profile
2. **Edit Mode**: Click "Edit Profile" to enable editing
3. **Update Fields**: Modify any field (name, email, colors, etc.)
4. **Save Changes**: Click "Save Changes" to update the profile
5. **Verify Update**: Check that the changes are saved and displayed

## Troubleshooting

### Error: "Forbidden: You are not authorized to manage this client profile"

**Cause**: User doesn't have the correct role assignment.

**Solution**: 
1. Verify the user_roles record exists with correct user_id and client_id
2. Check that the role is exactly 'client_admin'
3. Ensure the client_id matches the one you're trying to access

### Error: "Client ID is required"

**Cause**: The client_id is not being passed correctly.

**Solution**:
1. Set the client_id in session storage: `sessionStorage.setItem('current_client_id', 'your-client-id')`
2. Or pass it directly to the useClientProfile hook

### Error: "Column pau.client_id does not exist"

**Cause**: Old RLS policies are still active.

**Solution**: Run the updated migration:
```sql
-- Drop old policies
DROP POLICY IF EXISTS "client_admins_can_view_own_profile" ON platform_clients;
DROP POLICY IF EXISTS "client_admins_can_update_own_profile" ON platform_clients;

-- Run the new migration
\i supabase/migrations/20240101000006_client_profile_rls.sql
```

### Error: "Failed to fetch profile"

**Cause**: RLS policies are blocking access.

**Solution**: 
1. Check that RLS policies are correctly applied
2. Verify user authentication
3. Check browser network tab for detailed error messages

## Verification Checklist

- [ ] Test client created in platform_clients table
- [ ] User role created in user_roles table with client_admin role
- [ ] Client ID set in session storage
- [ ] GET request returns profile data
- [ ] PATCH request updates profile successfully
- [ ] React component loads and displays profile
- [ ] Edit mode works correctly
- [ ] Save functionality updates the database
- [ ] Unauthorized users cannot access other clients' profiles

## Security Tests

### Test Unauthorized Access

Try accessing a different client_id that your user doesn't have access to:

```bash
curl -X GET \
  "https://your-project.supabase.co/functions/v1/client-profile?client_id=different-client-id" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "error": "Forbidden: You are not authorized to manage this client profile"
}
```

### Test Invalid Data

Try updating with invalid data:

```bash
curl -X PATCH \
  "https://your-project.supabase.co/functions/v1/client-profile" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "550e8400-e29b-41d4-a716-446655440000",
    "contact_email": "invalid-email"
  }'
```

**Expected Response:**
```json
{
  "error": "Invalid email format"
}
```

## Success Criteria

✅ **API Security**: Only authorized users can access their own client profiles  
✅ **Data Validation**: Invalid data is rejected with clear error messages  
✅ **Audit Logging**: All updates are logged to platform_activity_log  
✅ **React Integration**: UI components work seamlessly with the API  
✅ **Error Handling**: Proper error messages and loading states  
✅ **Performance**: Fast response times with proper indexing 
# 🏢 Galletti Tier 2 User Setup Guide

## Overview

This guide explains how to create users for **Galletti** with **Tier 2 access** (client admin level), which gives them full control over all Galletti restaurants and locations while being restricted to only Galletti data.

## What is Tier 2 Access?

**Tier 2** users have `client_admin` role and can:
- ✅ **View all Galletti restaurants** and locations
- ✅ **Manage customers** across all Galletti locations  
- ✅ **Access analytics** for the entire Galletti network
- ✅ **Export data** for compliance and reporting
- ✅ **Manage notification campaigns** across all locations
- ✅ **Create and manage staff** for individual restaurants
- ❌ **Cannot see other restaurant chains** (only Galletti)
- ❌ **Cannot access platform-level settings** (that's Tier 1)

## Prerequisites

1. **Database Setup**: Run the main `database-setup.sql` first
2. **Galletti Client**: Ensure Galletti is set up as a platform client
3. **User Registration**: Users must have Supabase accounts first

## Method 1: Automated SQL Script (Recommended)

### Step 1: Run the Setup Script

Copy and paste this into your **Supabase SQL Editor**:

```sql
-- Copy the entire contents of CREATE_GALLETTI_USERS.sql
-- This will set up all necessary tables and functions
```

### Step 2: Assign Users to Galletti

For each user you want to give Galletti Tier 2 access:

```sql
-- Replace with actual email addresses
SELECT assign_galletti_tier2_user('manager@galletti.com', 'Sarah Johnson');
SELECT assign_galletti_tier2_user('director@galletti.com', 'Mike Rodriguez');
SELECT assign_galletti_tier2_user('operations@galletti.com', 'Lisa Chen');
```

### Step 3: Verify the Setup

Check that users were assigned correctly:

```sql
SELECT 
  ur.role,
  ur.status,
  au.email,
  au.user_metadata->>'full_name' as full_name,
  ur.created_at
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
JOIN platform_clients pc ON ur.client_id = pc.id
WHERE pc.slug = 'galletti'
ORDER BY ur.created_at DESC;
```

## Method 2: Using the Staff Manager API

### Step 1: Get Galletti Client ID

```sql
SELECT id as galletti_client_id FROM platform_clients WHERE slug = 'galletti';
```

### Step 2: API Call to Create Staff

Use your app's staff manager or make an API call:

```typescript
const response = await fetch('/api/staff-manager', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'manager@galletti.com',
    full_name: 'Sarah Johnson', 
    role: 'client_admin',
    client_id: 'GALLETTI_CLIENT_ID_FROM_STEP_1'
  })
});
```

## Method 3: Manual Database Assignment

### Step 1: Get Required IDs

```sql
-- Get Galletti client ID
SELECT id as galletti_client_id FROM platform_clients WHERE slug = 'galletti';

-- Get user ID (user must be registered first)
SELECT id as user_id, email FROM auth.users WHERE email = 'manager@galletti.com';
```

### Step 2: Insert Role Assignment

```sql
INSERT INTO user_roles (user_id, role, client_id, status)
VALUES (
  'USER_ID_FROM_STEP_1',     -- Replace with actual user ID
  'client_admin',            -- Tier 2 role
  'GALLETTI_CLIENT_ID',      -- Replace with Galletti client ID  
  'active'
);
```

## User Registration Process

### For New Users (Don't have accounts yet):

1. **Send Invitations** via your app's staff manager
2. **Users register** through your app's signup flow
3. **Assign roles** using one of the methods above

### For Existing Users (Already have accounts):

1. **Get their user ID** from the auth.users table
2. **Assign the role** directly using the SQL functions

## Verification & Testing

### 1. Test Login Access

Have the user log in and verify they see:
- ✅ **Galletti HQ Dashboard** instead of regular restaurant dashboard
- ✅ **All Galletti locations** in the location manager
- ✅ **Analytics across all locations**
- ✅ **Export capabilities**

### 2. Check Role Assignment

```sql
-- Verify specific user's role
SELECT 
  ur.role,
  ur.status,
  pc.name as client_name,
  au.email
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id  
JOIN platform_clients pc ON ur.client_id = pc.id
WHERE au.email = 'manager@galletti.com';
```

### 3. Test Permissions

The user should be able to:
- 📊 **View Analytics** for all Galletti locations
- 👥 **Manage customers** across the network
- 🏪 **View all restaurant locations** 
- 📤 **Export data** for compliance
- 📢 **Send notifications** to customers
- ❌ **NOT see other restaurant chains**

## Troubleshooting

### Issue: User doesn't see Galletti HQ dashboard

**Check:**
1. User role is `client_admin` 
2. `client_id` matches Galletti's client ID
3. Role status is `active`

**Fix:**
```sql
UPDATE user_roles 
SET role = 'client_admin', status = 'active'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@galletti.com')
AND client_id = (SELECT id FROM platform_clients WHERE slug = 'galletti');
```

### Issue: User can't access certain features

**Check:**
- RLS policies are properly set up
- User has the correct `client_id` assignment
- Database permissions are granted

### Issue: "Client not found" error

**Fix:**
```sql
-- Ensure Galletti client exists
INSERT INTO platform_clients (name, slug, type, status, plan, contact_email)
VALUES ('Galletti Foods', 'galletti', 'restaurant_chain', 'active', 'business', 'admin@galletti.com')
ON CONFLICT (slug) DO NOTHING;
```

## Common Galletti User Emails

Based on your platform setup, these emails automatically get Galletti HQ access:

- `admin@galletti.com`
- `corporate@galletti.com` 
- `hq@galletti.com`

For other emails, use the assignment methods above.

## Security Notes

- ✅ **RLS policies** ensure users only see Galletti data
- ✅ **Role-based access** prevents escalation to platform admin
- ✅ **Audit logging** tracks all user assignments
- ✅ **Status management** allows suspending access without deletion

## Next Steps

1. **Run the setup script** (`CREATE_GALLETTI_USERS.sql`)
2. **Assign users** using the provided function
3. **Test the access** by logging in as a Galletti user
4. **Document the process** for your team

This gives you complete control over Galletti's multi-location restaurant network while maintaining proper security boundaries! 🎯 
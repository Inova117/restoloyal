# 🎯 Galletti Tier 2 Setup - Practical Walkthrough

Let's walk through setting up Galletti users step-by-step so you understand exactly how the connection works!

---

## 🚀 **STEP 1: Run the Database Setup**

Copy this entire script into your **Supabase SQL Editor** and execute it:

```sql
-- Copy the entire contents of CREATE_GALLETTI_USERS.sql here
-- This sets up all the necessary tables and functions
```

**Expected Output:**
```
✓ Galletti client already exists (or ✓ Created Galletti client)
Galletti Client ID: 550e8400-e29b-41d4-4bd9-b5ff-123456789abc
GALLETTI TIER 2 USER SETUP COMPLETE
To assign a user to Galletti with tier 2 access, run:
SELECT assign_galletti_tier2_user('user@galletti.com', 'Full Name');
```

---

## 🧪 **STEP 2: Create a Test User**

### **2.1: Sign up a new user in your app**

1. Go to your app's signup page
2. Create account with email: `manager@galletti.com`
3. Complete the signup process

**OR** use the Supabase Dashboard:

1. Go to **Authentication > Users** in Supabase Dashboard
2. Click **Add User**
3. Email: `manager@galletti.com`
4. Password: `Test123!`
5. Click **Create User**

### **2.2: Verify the user exists**

```sql
-- Check that the user was created
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'manager@galletti.com';
```

**Expected Output:**
```
id                                   | email                | created_at
------------------------------------|----------------------|-------------------------
123e4567-e89b-12d3-a456-426614174000| manager@galletti.com | 2024-01-20 10:30:00+00
```

---

## ⚡ **STEP 3: Assign Tier 2 Access**

Now assign the user to Galletti with tier 2 access:

```sql
-- This gives manager@galletti.com full Galletti HQ access
SELECT assign_galletti_tier2_user('manager@galletti.com', 'Sarah Johnson');
```

**Expected Output:**
```json
{
  "success": true,
  "message": "Successfully assigned tier 2 access to manager@galletti.com",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "client_id": "550e8400-e29b-41d4-4bd9-b5ff-123456789abc",
  "role": "client_admin"
}
```

---

## 🔍 **STEP 4: Verify the Connection**

Let's verify all the connections are working:

### **4.1: Check the platform_clients table**

```sql
SELECT id, name, slug, status, plan 
FROM platform_clients 
WHERE slug = 'galletti';
```

**Expected Output:**
```
id                  | name           | slug     | status | plan
--------------------|----------------|----------|--------|----------
550e8400-e29b-41d4 | Galletti Foods | galletti | active | business
```

### **4.2: Check the user_roles table**

```sql
SELECT 
  ur.role,
  ur.status,
  pc.name as client_name,
  au.email,
  ur.created_at
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
JOIN platform_clients pc ON ur.client_id = pc.id
WHERE au.email = 'manager@galletti.com';
```

**Expected Output:**
```
role        | status | client_name    | email                | created_at
------------|--------|----------------|----------------------|-------------------------
client_admin| active | Galletti Foods | manager@galletti.com | 2024-01-20 10:35:00+00
```

### **4.3: Check the complete chain**

```sql
-- This shows the complete user → role → client chain
SELECT 
  au.email as user_email,
  ur.role as user_role,
  ur.status as role_status,
  pc.name as client_name,
  pc.slug as client_slug,
  ur.client_id
FROM auth.users au
JOIN user_roles ur ON au.id = ur.user_id
JOIN platform_clients pc ON ur.client_id = pc.id
WHERE au.email = 'manager@galletti.com';
```

**Expected Output:**
```
user_email           | user_role    | role_status | client_name    | client_slug | client_id
---------------------|--------------|-------------|----------------|-------------|-------------------
manager@galletti.com | client_admin | active      | Galletti Foods | galletti    | 550e8400-e29b-41d4
```

---

## 🎨 **STEP 5: Test the Frontend Connection**

### **5.1: Log in as the Galletti user**

1. **Sign out** of your current session
2. **Log in** with: `manager@galletti.com` / `Test123!`
3. **Observe** what dashboard appears

### **5.2: What you should see**

✅ **Galletti HQ Dashboard** (NOT the regular restaurant dashboard)
✅ **"Galletti Foods HQ"** in the header
✅ **"Multi-Location Management"** subtitle  
✅ **"Tier 2 Access"** indicator
✅ **Building2 icon** with blue/purple gradient

### **5.3: Check the browser console**

Open **Developer Tools > Console** and look for:

```javascript
Role detection debug: {
  userEmail: "manager@galletti.com",
  role: "galletti_hq",
  clientName: "Galletti Restaurant Group"
}
```

---

## 🧠 **STEP 6: Understanding How It Works**

Let's trace through exactly what happens when `manager@galletti.com` logs in:

### **6.1: Login Process**

```
1. User enters: manager@galletti.com / Test123!
2. Supabase Auth: Creates session, returns user object
3. useUserRole.ts: Runs useEffect when user state changes
```

### **6.2: Role Detection Logic**

Looking at `src/hooks/useUserRole.ts` (lines 91-108):

```typescript
// Check if user is Galletti HQ
const gallettiHQEmails = ['admin@galletti.com', 'corporate@galletti.com', 'hq@galletti.com']
const isGallettiHQ = gallettiHQEmails.includes(user.email || '')

if (gallettiHQEmails.includes(user.email || '')) {
  setRoleData({
    role: 'galletti_hq',
    permissions: {
      canViewAllClients: false,
      canViewAllRestaurants: true,  // 🎯 This gives access to all Galletti restaurants
      canViewOwnRestaurant: false,
      canViewLocationOnly: false,
      canManageClients: false,
      canAddStamps: false,
      canRedeemRewards: false,
      canViewAnalytics: true,        // 🎯 Analytics access
      canManageLocations: true,      // 🎯 Location management
      canAccessCorporateData: true,  // 🎯 Corporate-level features
      canManagePlatform: false,
      clientId: 'galletti'           // 🎯 This filters all data to Galletti only
    },
    isLoading: false,
    clientName: 'Galletti Restaurant Group'
  })
  return
}
```

**BUT WAIT!** There's a problem here...

---

## 🚨 **STEP 7: The Current Issue & How to Fix It**

### **7.1: The Problem**

The current system uses **hardcoded emails** (`admin@galletti.com`, etc.) but our new user is `manager@galletti.com` which is NOT in that list!

### **7.2: Check Current Behavior**

When you log in as `manager@galletti.com`, you probably see:
❌ **Location Staff dashboard** (default fallback)
❌ **NOT the Galletti HQ dashboard**

### **7.3: The Fix - Option A: Add to Hardcoded List**

**Quick Fix**: Add your email to the hardcoded list in `src/hooks/useUserRole.ts`:

```typescript
// Line 91 - Add your new email
const gallettiHQEmails = [
  'admin@galletti.com', 
  'corporate@galletti.com', 
  'hq@galletti.com',
  'manager@galletti.com'  // 👈 Add this line
]
```

### **7.4: The Fix - Option B: Database-Driven (Recommended)**

**Better Fix**: Replace hardcoded logic with database lookup.

Add this code in `src/hooks/useUserRole.ts` after the ZerionCore admin check:

```typescript
// Add after line ~195 (after ZerionCore admin check)

// Check if user has client_admin role for any client
const { data: clientRole, error: clientError } = await supabase
  .from('user_roles')
  .select(`
    role,
    status,
    client_id,
    platform_clients!inner(
      id,
      name,
      slug
    )
  `)
  .eq('user_id', user.id)
  .eq('role', 'client_admin')
  .eq('status', 'active')
  .single()

if (clientRole && !clientError) {
  // Handle Galletti specifically (for now)
  if (clientRole.platform_clients.slug === 'galletti') {
    setRoleData({
      role: 'galletti_hq',
      permissions: {
        canViewAllClients: false,
        canViewAllRestaurants: true,
        canViewOwnRestaurant: false,
        canViewLocationOnly: false,
        canManageClients: false,
        canAddStamps: false,
        canRedeemRewards: false,
        canViewAnalytics: true,
        canManageLocations: true,
        canAccessCorporateData: true,
        canManagePlatform: false,
        clientId: clientRole.client_id
      },
      isLoading: false,
      clientName: clientRole.platform_clients.name
    })
    return
  }
  
  // TODO: Handle other restaurant chains here
}
```

---

## ✅ **STEP 8: Test the Complete Flow**

After implementing the fix:

### **8.1: Refresh and test**

1. **Save** the code changes
2. **Refresh** your app
3. **Log in** as `manager@galletti.com`
4. **Verify** you see the Galletti HQ dashboard

### **8.2: Test tier 2 features**

Navigate through the dashboard and verify access to:

- ✅ **Analytics** tab - shows Galletti network data
- ✅ **Locations** tab - shows all Galletti restaurants
- ✅ **Customers** tab - shows customers across all locations
- ✅ **Export** tab - data export capabilities
- ✅ **Notifications** tab - campaign management
- ❌ **Platform** tab - should NOT be visible (that's tier 1 only)

---

## 🎯 **STEP 9: Add More Galletti Users**

Now add more users to test the system:

```sql
-- Add more Galletti HQ users
SELECT assign_galletti_tier2_user('director@galletti.com', 'Mike Rodriguez');
SELECT assign_galletti_tier2_user('operations@galletti.com', 'Lisa Chen');
SELECT assign_galletti_tier2_user('analytics@galletti.com', 'John Smith');
```

**Test**: Each of these users should get the same Galletti HQ dashboard access!

---

## 🚀 **STEP 10: Ready for New Restaurant Chains**

Now you understand the complete flow! To add a new restaurant chain like "Pizza Palace":

```sql
-- 1. Create the client
INSERT INTO platform_clients (name, slug, type, status, plan, contact_email)
VALUES ('Pizza Palace Corp', 'pizza-palace', 'restaurant_chain', 'active', 'business', 'admin@pizzapalace.com');

-- 2. Assign a user
SELECT assign_galletti_tier2_user('manager@pizzapalace.com', 'Tony Milano');
```

**Note**: You'll need to update the frontend code to handle the new client, but the database pattern is exactly the same!

---

## 🎯 **Summary: What You've Learned**

1. **Database Pattern**: `platform_clients` → `user_roles` → `auth.users`
2. **Role Assignment**: `client_admin` role with `client_id` connection  
3. **Frontend Detection**: `useUserRole.ts` checks user roles and shows appropriate dashboard
4. **Data Isolation**: RLS policies automatically filter data by `client_id`
5. **Scalability**: Same pattern works for unlimited restaurant chains

**The magic**: Once a user has `client_admin` role for a client, they automatically get tier 2 access to ALL that client's data, but ONLY that client's data! 🎯 
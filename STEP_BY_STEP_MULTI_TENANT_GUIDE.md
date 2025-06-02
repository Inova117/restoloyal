# 🏗️ Step-by-Step Multi-Tenant Restaurant Setup Guide

## 🎯 Understanding the Connection Flow

This guide shows you **exactly** how the system connects users to their specific restaurant dashboards and how to replicate this for any new restaurant chain.

## 📊 **The 3-Table Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ platform_clients│───▶│ user_roles      │───▶│ auth.users      │
│                 │    │                 │    │                 │
│ id (UUID)       │    │ user_id         │    │ id              │
│ name            │    │ client_id  ─────┼───▶│ email           │
│ slug            │    │ role            │    │ metadata        │
│ status          │    │ status          │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Key Insight**: The `user_roles.client_id` is what connects a user to their specific restaurant chain!

---

## 🔥 **Step 1: Understanding Galletti's Current Setup**

Let's examine how Galletti is currently configured:

### **1.1 Check Galletti's Platform Client Record**

```sql
-- This shows Galletti as a platform client
SELECT 
  id,
  name,
  slug,
  type,
  status,
  plan
FROM platform_clients 
WHERE slug = 'galletti';
```

**Expected Output:**
```
id                  | name           | slug     | type             | status | plan
--------------------|----------------|----------|------------------|--------|----------
550e8400-e29b-41d4 | Galletti Foods | galletti | restaurant_chain | active | business
```

### **1.2 Check How the Frontend Recognizes Galletti Users**

Looking at `src/hooks/useUserRole.ts`, there are **TWO methods** for Galletti access:

#### **Method A: Hardcoded Email Detection (Current)**
```typescript
// Lines 91-92 in useUserRole.ts
const gallettiHQEmails = ['admin@galletti.com', 'corporate@galletti.com', 'hq@galletti.com']
const isGallettiHQ = gallettiHQEmails.includes(user.email || '')
```

#### **Method B: Database Role Detection (Scalable)**
```typescript
// This checks the user_roles table for client_admin role
const { data: userRole } = await supabase
  .from('user_roles')
  .select('role, client_id, platform_clients(slug)')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .single()
```

### **1.3 Current Connection Flow for Galletti**

```
1. User logs in with email: manager@galletti.com
2. useUserRole.ts checks: gallettiHQEmails.includes('manager@galletti.com') 
3. If TRUE → role = 'galletti_hq' 
4. Frontend shows: GallettiHQDashboard component
5. Dashboard uses clientId: 'galletti' for data filtering
```

---

## ⚡ **Step 2: The TWO-STEP Process for ANY New Restaurant**

For any new restaurant chain (Pizza Palace, Burger King, Taco Bell, etc.), you need:

### **Step 2.1: Create the Platform Client**

```sql
-- Template for ANY restaurant chain
INSERT INTO platform_clients (
  name,                    -- Display name: "Pizza Palace Corp"
  slug,                    -- URL-safe identifier: "pizza-palace"  
  type,                    -- Always: "restaurant_chain"
  status,                  -- Always: "active"
  plan,                    -- Subscription: "business", "enterprise"
  contact_email,           -- Primary contact
  contact_phone
) VALUES (
  'Pizza Palace Corporation',
  'pizza-palace',
  'restaurant_chain', 
  'active',
  'business',
  'admin@pizzapalace.com',
  '+1-555-PIZZA'
);
```

### **Step 2.2: Assign Users to the Client**

```sql
-- Get the client ID we just created
SELECT id FROM platform_clients WHERE slug = 'pizza-palace';

-- Assign user(s) to this client with tier 2 access
INSERT INTO user_roles (user_id, role, client_id, status)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'manager@pizzapalace.com'),
  'client_admin',
  (SELECT id FROM platform_clients WHERE slug = 'pizza-palace'),
  'active'
);
```

---

## 🚀 **Step 3: Frontend Integration Options**

You have **3 options** for connecting the frontend:

### **Option A: Hardcoded Email Lists (Quick & Simple)**

Add to `src/hooks/useUserRole.ts`:

```typescript
// Add new restaurant emails
const pizzaPalaceEmails = ['admin@pizzapalace.com', 'corporate@pizzapalace.com', 'hq@pizzapalace.com']
const isPizzaPalaceHQ = pizzaPalaceEmails.includes(user.email || '')

// Add new role check
if (isPizzaPalaceHQ) {
  setRoleData({
    role: 'pizza_palace_hq',  // New role type
    permissions: { /* same as galletti_hq */ },
    clientName: 'Pizza Palace Corporation'
  })
  return
}
```

### **Option B: Database-Driven Detection (Scalable)**

Replace hardcoded logic with database lookup:

```typescript
// Check user_roles table for any client assignment
const { data: userRole } = await supabase
  .from('user_roles')
  .select(`
    role,
    client_id,
    platform_clients!inner(
      slug,
      name
    )
  `)
  .eq('user_id', user.id)
  .eq('status', 'active')
  .eq('role', 'client_admin')
  .single()

if (userRole) {
  setRoleData({
    role: 'client_hq',  // Generic role for all clients
    permissions: { /* standard tier 2 permissions */ },
    clientId: userRole.client_id,
    clientName: userRole.platform_clients.name,
    clientSlug: userRole.platform_clients.slug
  })
}
```

### **Option C: Hybrid Approach (Best of Both)**

Keep hardcoded for existing clients, use database for new ones:

```typescript
// Check hardcoded first (existing clients)
if (gallettiHQEmails.includes(user.email || '')) {
  // Galletti logic...
  return
}

// Check database for other clients
const { data: userRole } = await supabase.from('user_roles')...
```

---

## 🏪 **Step 4: Component Integration**

### **Option A: Separate Components (Current Approach)**

Create dedicated components for each chain:

```typescript
// src/components/PizzaPalaceHQDashboard.tsx
export default function PizzaPalaceHQDashboard() {
  return (
    <div>
      <h1>Pizza Palace Corporate Dashboard</h1>
      {/* Pizza Palace specific features */}
    </div>
  )
}

// In src/pages/Index.tsx
if (role === 'pizza_palace_hq') {
  return <PizzaPalaceHQDashboard />
}
```

### **Option B: Generic Component (Scalable)**

Create one component that adapts to any client:

```typescript
// src/components/ClientHQDashboard.tsx
export default function ClientHQDashboard({ clientData }: { clientData: ClientData }) {
  return (
    <div>
      <h1>{clientData.name} Corporate Dashboard</h1>
      {/* Generic multi-location management */}
    </div>
  )
}

// In src/pages/Index.tsx
if (role === 'client_hq') {
  return <ClientHQDashboard clientData={clientData} />
}
```

---

## 🔧 **Step 5: Complete Example - Adding "Pizza Palace"**

Let's add a complete new restaurant chain:

### **5.1: Database Setup**

```sql
-- Step 1: Create the platform client
INSERT INTO platform_clients (name, slug, type, status, plan, contact_email)
VALUES ('Pizza Palace Corporation', 'pizza-palace', 'restaurant_chain', 'active', 'business', 'admin@pizzapalace.com');

-- Step 2: Get the client ID
SELECT id as pizza_palace_client_id FROM platform_clients WHERE slug = 'pizza-palace';

-- Step 3: Assign a user (assuming they already have an account)
INSERT INTO user_roles (
  user_id,
  role,
  client_id,
  status
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'manager@pizzapalace.com'),
  'client_admin',
  (SELECT id FROM platform_clients WHERE slug = 'pizza-palace'),
  'active'
);
```

### **5.2: Frontend Code (Database-Driven Approach)**

Update `src/hooks/useUserRole.ts`:

```typescript
// Replace the hardcoded Galletti check with database lookup
const { data: clientRole, error } = await supabase
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

if (clientRole && !error) {
  // Generic client HQ role that works for ANY restaurant chain
  setRoleData({
    role: 'client_hq',
    permissions: {
      canViewAllClients: false,
      canViewAllRestaurants: true,  // All restaurants for THIS client
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
    clientName: clientRole.platform_clients.name,
    clientSlug: clientRole.platform_clients.slug
  })
  return
}
```

### **5.3: Component Updates**

Update `src/pages/Index.tsx`:

```typescript
// Replace specific role checks with generic client_hq
if (role === 'client_hq') {
  return (
    <div className={`min-h-screen bg-background ${pageLoaded ? 'page-enter' : 'opacity-0'}`}>
      <div className="container-editorial section-editorial-sm">
        <div className="dashboard-header slide-in-left">
          <div className="dashboard-header-title">
            <div className="p-4 bg-sage-turquoise-100 rounded-2xl hover-glow">
              <Building2 className="w-10 h-10 text-sage-turquoise-600 hover-scale" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl lg:text-5xl font-editorial font-bold text-balance">
                {clientName} HQ Dashboard
              </h1>
              <p className="text-muted-foreground text-xl leading-relaxed">
                Multi-location restaurant management
              </p>
            </div>
          </div>
          {/* Rest of component */}
        </div>
        
        {/* Use generic component that adapts to any client */}
        <ClientHQDashboard clientData={{ clientId, clientName, clientSlug }} />
      </div>
    </div>
  );
}
```

---

## 🎯 **Step 6: Testing the New Setup**

### **6.1: Verify Database Records**

```sql
-- Check Pizza Palace client exists
SELECT * FROM platform_clients WHERE slug = 'pizza-palace';

-- Check user role assignment
SELECT 
  ur.role,
  ur.status,
  pc.name as client_name,
  au.email
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
JOIN platform_clients pc ON ur.client_id = pc.id
WHERE au.email = 'manager@pizzapalace.com';
```

### **6.2: Test Login Flow**

1. **User logs in** with `manager@pizzapalace.com`
2. **System checks** `user_roles` table
3. **Finds** `client_admin` role for `pizza-palace` client
4. **Shows** Pizza Palace HQ dashboard
5. **Data filtering** happens automatically via RLS policies using `client_id`

---

## ⚡ **The Magic: How Data Isolation Works**

Each restaurant chain's data is automatically isolated through **Row Level Security (RLS)**:

```sql
-- Example RLS policy (already in your database)
CREATE POLICY "Client admins can manage their customers" ON public.clients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.restaurants r ON r.id = clients.restaurant_id
      WHERE ur.user_id = auth.uid()
      AND ur.client_id = r.client_id  -- This line isolates the data!
      AND ur.role = 'client_admin'
      AND ur.status = 'active'
    )
  );
```

**Translation**: A Pizza Palace admin can only see customers from Pizza Palace restaurants, never Galletti customers!

---

## 🚀 **Quick Template for Adding ANY Restaurant**

Save this as a template:

```sql
-- Template: Replace RESTAURANT_NAME and SLUG
DO $$
DECLARE
  client_id UUID;
BEGIN
  -- 1. Create platform client
  INSERT INTO platform_clients (name, slug, type, status, plan, contact_email)
  VALUES ('RESTAURANT_NAME Corp', 'SLUG', 'restaurant_chain', 'active', 'business', 'admin@SLUG.com')
  RETURNING id INTO client_id;
  
  -- 2. Assign user (replace email)
  INSERT INTO user_roles (user_id, role, client_id, status)
  VALUES (
    (SELECT id FROM auth.users WHERE email = 'manager@SLUG.com'),
    'client_admin',
    client_id,
    'active'
  );
  
  RAISE NOTICE '✅ % setup complete! Client ID: %', 'RESTAURANT_NAME', client_id;
END $$;
```

**Usage Examples:**
- RESTAURANT_NAME = "Burger Kingdom", SLUG = "burger-kingdom"  
- RESTAURANT_NAME = "Taco Fiesta", SLUG = "taco-fiesta"
- RESTAURANT_NAME = "Sushi Express", SLUG = "sushi-express"

---

## 🎯 **Summary: The Connection Flow**

```
🏪 RESTAURANT SETUP:
   platform_clients table → client_id (UUID)
   
👤 USER ASSIGNMENT:  
   user_roles table → (user_id + client_id + role:'client_admin')
   
🔒 DATA ISOLATION:
   RLS policies → filter by client_id automatically
   
🎨 FRONTEND DETECTION:
   useUserRole.ts → checks user_roles table → shows correct dashboard
   
📊 DASHBOARD RENDERING:
   Generic component → adapts to any client → full tier 2 access
```

**Bottom Line**: Once you understand this pattern, adding a new restaurant chain takes literally **5 minutes**! 🚀
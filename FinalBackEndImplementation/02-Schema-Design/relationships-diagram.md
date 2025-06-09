# 🔗 **FOREIGN KEY RELATIONSHIPS DIAGRAM**

## 🎯 **4-TIER HIERARCHY RELATIONSHIPS**

This document visualizes all foreign key relationships in the optimal schema design.

---

## 📊 **COMPLETE RELATIONSHIP DIAGRAM**

```
                        ┌─────────────────┐
                        │   auth.users    │ ← Supabase Auth
                        │                 │
                        └─────────────────┘
                                 │
                         ┌───────┴───────┐
                         │               │
              ┌──────────▼─────────┐     │
              │   TIER 1           │     │
              │   superadmins      │     │
              │                    │     │
              │ • user_id (FK) ────┼─────┘
              │ • email            │
              │ • name             │
              └──────────┬─────────┘
                         │ creates
                         │
              ┌──────────▼─────────┐     ┌─────────────────┐
              │   TIER 2           │     │  client_admins  │
              │   clients          │     │                 │
              │                    │     │ • user_id (FK) ─┼─────┐
              │ • created_by_      │◄────┤ • client_id(FK) │     │
              │   superadmin_id    │     │ • created_by_   │     │
              │ • name, slug       │     │   superadmin_id │     │
              └──────────┬─────────┘     └─────────────────┘     │
                         │ owns                  │ creates       │
                         │                       │               │
              ┌──────────▼─────────┐     ┌───────▼─────────┐     │
              │   locations        │     │  location_staff │     │
              │                    │     │                 │     │
              │ • client_id (FK) ──┼─────┤ • user_id (FK) ─┼─────┘
              │ • created_by_      │     │ • location_id   │
              │   client_admin_id  │     │ • client_id (FK)│
              │ • name, address    │     │ • created_by_   │
              └──────────┬─────────┘     │   client_admin_id│
                         │ has           └─────────┬───────┘
                         │                         │ creates
                         │                         │
              ┌──────────▼─────────────────────────▼─────────┐
              │   TIER 4                                     │
              │   customers                                  │
              │                                              │
              │ • client_id (FK) ────────────────────────────┼─┐
              │ • location_id (FK) ──────────────────────────┼─│─┐
              │ • created_by_staff_id (FK) ──────────────────┘ │ │
              │ • name, email, qr_code                         │ │
              └────────────────────────────────────────────────┘ │
                         │ has loyalty data                       │
                         │                                        │
              ┌──────────▼─────────┐     ┌─────────────────────┐ │
              │   stamps           │     │   rewards           │ │
              │                    │     │                     │ │
              │ • customer_id (FK) │     │ • customer_id (FK)  │ │
              │ • location_id (FK) ┼─────┤ • location_id (FK) ─┼─┘
              │ • client_id (FK) ──┼─────┤ • client_id (FK) ───┼───┘
              │ • created_by_      │     │ • created_by_       │
              │   staff_id (FK)    │     │   staff_id (FK)     │
              └────────────────────┘     └─────────────────────┘
```

---

## 🔒 **HIERARCHY ENFORCEMENT FOREIGN KEYS**

### **Tier 1 → Tier 2 Creation Chain**
```sql
-- Only superadmins can create clients
clients.created_by_superadmin_id → superadmins.id

-- Only superadmins can create client admins  
client_admins.created_by_superadmin_id → superadmins.id
```

### **Tier 2 → Tier 3 Creation Chain**
```sql
-- Only client admins can create locations
locations.created_by_client_admin_id → client_admins.id

-- Only client admins can create location staff
location_staff.created_by_client_admin_id → client_admins.id
```

### **Tier 3 → Tier 4 Creation Chain**
```sql
-- Only location staff can create customers
customers.created_by_staff_id → location_staff.id

-- Only location staff can create stamps
stamps.created_by_staff_id → location_staff.id

-- Only location staff can create rewards  
rewards.created_by_staff_id → location_staff.id
```

---

## 🏢 **MULTI-TENANT ISOLATION FOREIGN KEYS**

### **Client Ownership Chain**
```sql
-- All entities belong to a client
client_admins.client_id → clients.id
locations.client_id → clients.id
location_staff.client_id → clients.id  
customers.client_id → clients.id
stamps.client_id → clients.id
rewards.client_id → clients.id
```

### **Location Association Chain**
```sql
-- Staff and customers belong to specific locations
location_staff.location_id → locations.id
customers.location_id → locations.id
stamps.location_id → locations.id
rewards.location_id → locations.id
```

---

## 🔍 **DETAILED RELATIONSHIP ANALYSIS**

### **1. Superadmins (Tier 1)**
```sql
superadmins
├── user_id → auth.users.id (1:1)
└── Creates:
    ├── clients (1:many via created_by_superadmin_id)
    └── client_admins (1:many via created_by_superadmin_id)
```

### **2. Clients (Tier 2 - Businesses)**
```sql
clients  
├── created_by_superadmin_id → superadmins.id (many:1)
└── Owns:
    ├── client_admins (1:many via client_id)
    ├── locations (1:many via client_id)
    ├── location_staff (1:many via client_id)
    ├── customers (1:many via client_id)
    ├── stamps (1:many via client_id)
    └── rewards (1:many via client_id)
```

### **3. Client Admins (Tier 2 - Users)**
```sql
client_admins
├── user_id → auth.users.id (1:1)
├── client_id → clients.id (many:1)
├── created_by_superadmin_id → superadmins.id (many:1)
└── Creates:
    ├── locations (1:many via created_by_client_admin_id)
    └── location_staff (1:many via created_by_client_admin_id)
```

### **4. Locations (Tier 3 - Physical Stores)**
```sql
locations
├── client_id → clients.id (many:1)
├── created_by_client_admin_id → client_admins.id (many:1)
└── Has:
    ├── location_staff (1:many via location_id)
    ├── customers (1:many via location_id)
    ├── stamps (1:many via location_id)
    └── rewards (1:many via location_id)
```

### **5. Location Staff (Tier 3 - Users)**
```sql
location_staff
├── user_id → auth.users.id (1:1)
├── location_id → locations.id (many:1)
├── client_id → clients.id (many:1)
├── created_by_client_admin_id → client_admins.id (many:1)
└── Creates:
    ├── customers (1:many via created_by_staff_id)
    ├── stamps (1:many via created_by_staff_id)
    └── rewards (1:many via created_by_staff_id)
```

### **6. Customers (Tier 4)**
```sql
customers
├── client_id → clients.id (many:1)
├── location_id → locations.id (many:1)
├── created_by_staff_id → location_staff.id (many:1)
└── Has:
    ├── stamps (1:many via customer_id)
    └── rewards (1:many via customer_id)
```

### **7. Loyalty System Tables**
```sql
stamps & rewards
├── customer_id → customers.id (many:1)
├── location_id → locations.id (many:1)
├── client_id → clients.id (many:1)
└── created_by_staff_id → location_staff.id (many:1)
```

---

## 🔐 **CRITICAL CONSTRAINT RELATIONSHIPS**

### **Hierarchy Validation Constraints**
```sql
-- 1. Location creator must belong to the client
locations: created_by_client_admin_id must have client_id = location.client_id

-- 2. Staff creator must belong to the client
location_staff: created_by_client_admin_id must have client_id = staff.client_id

-- 3. Staff must work at their assigned location's client
location_staff: location_id.client_id must equal staff.client_id

-- 4. Customer creator must work at customer's location
customers: created_by_staff_id must have location_id = customer.location_id

-- 5. Customer location must belong to customer's client
customers: location_id.client_id must equal customer.client_id

-- 6. All loyalty actions must maintain client consistency
stamps/rewards: customer, location, and staff must all belong to same client
```

---

## 🎯 **USER ROLES TRACKING RELATIONSHIPS**

### **Central User Roles Table**
```sql
user_roles
├── user_id → auth.users.id (1:1)
├── created_by_user_id → auth.users.id (many:1)
└── Tier-specific references:
    ├── superadmin_id → superadmins.id (0:1)
    ├── client_admin_id → client_admins.id (0:1)
    ├── location_staff_id → location_staff.id (0:1)
    └── customer_id → customers.id (0:1)
```

---

## ✅ **RELATIONSHIP VALIDATION MATRIX**

| Relationship Type | Source | Target | Constraint | Purpose |
|-------------------|--------|--------|------------|---------|
| **Auth Reference** | All user tables | `auth.users` | CASCADE | Supabase Auth integration |
| **Creation Hierarchy** | All tables | Creator tier | RESTRICT | Hierarchy enforcement |
| **Ownership** | All entities | `clients` | CASCADE | Multi-tenant isolation |
| **Location Association** | Staff/Customers | `locations` | CASCADE | Physical association |
| **Data Consistency** | Loyalty tables | Multiple | CHECK | Business logic integrity |

---

## 🚀 **IMPLEMENTATION BENEFITS**

### **✅ CLEAR HIERARCHY**
- Every entity knows who created it
- Database-level hierarchy enforcement
- No ambiguous relationships

### **✅ COMPLETE ISOLATION**
- Every table has `client_id` 
- No cross-client data access possible
- RLS policies can enforce boundaries

### **✅ DATA INTEGRITY**
- Strong foreign key constraints
- CHECK constraints validate business rules
- Cascading deletes maintain consistency

### **✅ PERFORMANCE**
- Proper indexing on all FK columns
- Efficient queries with clear join paths
- Optimized for multi-tenant access patterns

---

**✅ PHASE 2A COMPLETE: All foreign key relationships mapped and validated**

**🔄 NEXT: Phase 2B - Hierarchy validation constraints** 
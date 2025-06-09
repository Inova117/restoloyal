# 🎯 **REQUIREMENTS MAPPING**

## 📋 **CURRENT vs REQUIRED FUNCTIONALITY**

This document maps the current state against the exact requirements to identify gaps and plan implementation.

---

## 🔒 **REQUIREMENT 1: 4-TIER HIERARCHY (NO PUBLIC SIGNUP)**

### **Required:**
```
Tier 1: Superadmin (You) 
    ↓ (creates only)
Tier 2: Client Admin (Restaurant HQ/Businesses)
    ↓ (creates only)  
Tier 3: Location Staff (Store Managers/POS Users)
    ↓ (creates only)
Tier 4: Customers (End Users via QR/POS)
```

### **Current State:**
```sql
-- Legacy: 2-tier only
app_role: 'restaurant_admin', 'client'

-- Newer: 4 roles but no hierarchy
app_role: 'zerion_admin', 'client_admin', 'restaurant_admin', 'location_staff'
```

### **Gap Analysis:**
- ❌ **Tier 1 (Superadmin)**: Not properly defined
- ❌ **Hierarchy Enforcement**: No database-level constraints
- ❌ **Creation Control**: No tier-based creation validation
- ❌ **Public Signup**: Still enabled (violates requirement)

### **Implementation Required:**
- ✅ **Define Tier 1**: Dedicated superadmin table and role
- ✅ **Enforce Hierarchy**: Database constraints and triggers
- ✅ **Creation Validation**: Only upper tier can create lower tier
- ✅ **Disable Public Signup**: Block all self-registration

---

## 🏢 **REQUIREMENT 2: COMPLETE CLIENT ISOLATION**

### **Required:**
> "Each client in tier 2, are different businesses so each one has to be separated and handled individually"

### **Current State:**
```sql
-- Some isolation via platform_clients
-- RLS policies exist but incomplete
-- Potential cross-client data access
```

### **Gap Analysis:**
- ⚠️ **Partial Isolation**: Basic structure exists
- ❌ **Complete Separation**: Gaps in RLS policies
- ❌ **Data Validation**: No cross-client access prevention
- ❌ **Admin Override**: No clear superadmin access paths

### **Implementation Required:**
- ✅ **Complete RLS**: Every table with client isolation
- ✅ **Data Validation**: Prevent cross-client operations
- ✅ **Admin Override**: Superadmin access to all clients
- ✅ **Audit Trail**: Track cross-client access attempts

---

## 🔐 **REQUIREMENT 3: NO PUBLIC SIGNUP ANYWHERE**

### **Required:**
> "No public 'create account' form for any tier—accounts are always created from above"

### **Current State:**
```javascript
// This is currently possible (VIOLATION):
const { user, error } = await supabase.auth.signUp({
  email: 'anyone@example.com', 
  password: 'password123'
})
```

### **Gap Analysis:**
- ❌ **Public Registration**: Supabase Auth allows signup
- ❌ **Self-Assignment**: Users can assign themselves roles
- ❌ **API Validation**: No hierarchy checks in Edge Functions
- ❌ **Frontend Protection**: No UI-level restrictions

### **Implementation Required:**
- ✅ **Disable Public Signup**: Supabase Auth configuration
- ✅ **Hierarchy Validation**: All user creation via Edge Functions
- ✅ **Role Assignment Control**: Only authorized tier can assign roles
- ✅ **API Security**: Validate creator permissions

---

## 🏗️ **REQUIREMENT 4: EXPLICIT FK RELATIONSHIPS**

### **Required:**
> "All relationships (FKs) must be explicit and secure"

### **Current State:**
```sql
-- Weak relationships
restaurants.user_id → auth.users.id (unclear purpose)
clients.restaurant_id → restaurants.id (confusing naming)
-- Multiple customer tables with different relationships
```

### **Gap Analysis:**
- ❌ **Unclear Semantics**: Relationships not well-defined
- ❌ **Multiple Paths**: Different tables for same concept
- ❌ **Weak Constraints**: No hierarchy enforcement
- ❌ **Naming Confusion**: Table names don't match purpose

### **Implementation Required:**
- ✅ **Clear Relationships**: Each FK has explicit purpose
- ✅ **Single Path**: One table per concept
- ✅ **Strong Constraints**: Database-level hierarchy enforcement
- ✅ **Clear Naming**: Tables named for their purpose

---

## 🧪 **REQUIREMENT 5: WORKING TEST FLOW**

### **Required Test Flow:**
1. Create superadmin account (you)
2. Superadmin creates Client HQ
3. Client HQ creates Location Staff  
4. Location Staff creates Customers via QR/POS
5. Verify no other creation paths exist

### **Current State:**
```sql
-- Cannot complete test flow:
-- 1. No superadmin bootstrap mechanism
-- 2. No hierarchy-enforced creation
-- 3. Multiple creation paths possible
-- 4. No QR/POS-specific customer creation
```

### **Gap Analysis:**
- ❌ **Step 1**: No superadmin bootstrap
- ❌ **Step 2**: No hierarchy validation
- ❌ **Step 3**: No tier-based creation
- ❌ **Step 4**: No QR/POS integration
- ❌ **Step 5**: Cannot verify exclusivity

### **Implementation Required:**
- ✅ **Bootstrap SQL**: Create initial superadmin
- ✅ **Hierarchy Edge Functions**: Tier-based creation
- ✅ **Creation Validation**: Block unauthorized paths
- ✅ **QR/POS Integration**: Customer creation flows
- ✅ **Testing Framework**: Validate all requirements

---

## 📊 **FUNCTIONAL REQUIREMENTS MAPPING**

### **Core Loyalty System**

| Function | Current | Required | Gap |
|----------|---------|----------|-----|
| Customer Management | ✅ Exists | ✅ Tier 4 only | ⚠️ Needs hierarchy |
| Stamp/Points System | ✅ Exists | ✅ Multi-location | ⚠️ Needs client isolation |
| Rewards System | ✅ Exists | ✅ Per-location rules | ⚠️ Needs validation |
| QR Integration | ⚠️ Basic | ✅ POS creation | ❌ Missing |

### **User Management**

| Function | Current | Required | Gap |
|----------|---------|----------|-----|
| Superadmin Role | ❌ Missing | ✅ Tier 1 | ❌ Must implement |
| Client Admin Role | ⚠️ Partial | ✅ Tier 2 | ⚠️ Needs hierarchy |
| Location Staff Role | ⚠️ Partial | ✅ Tier 3 | ⚠️ Needs hierarchy |
| Customer Role | ✅ Exists | ✅ Tier 4 | ⚠️ Needs POS creation |

### **Security & Isolation**

| Function | Current | Required | Gap |
|----------|---------|----------|-----|
| Multi-tenant Isolation | ⚠️ Partial | ✅ Complete | ❌ Must complete |
| Role-based Access | ⚠️ Basic | ✅ Hierarchy-based | ❌ Must redesign |
| Public Signup Block | ❌ Open | ✅ Blocked | ❌ Must implement |
| Audit Logging | ⚠️ Basic | ✅ Complete | ⚠️ Needs enhancement |

---

## 🎯 **IMPLEMENTATION PRIORITY MATRIX**

### **CRITICAL (Must Have)** 🔴
1. **4-Tier Hierarchy**: Foundation for everything
2. **Superadmin Bootstrap**: Cannot start without this
3. **Public Signup Block**: Security requirement
4. **Client Isolation**: Multi-tenant requirement

### **HIGH (Should Have)** 🟡  
5. **Hierarchy Edge Functions**: API layer security
6. **Clear FK Relationships**: Data integrity
7. **QR/POS Integration**: Core functionality
8. **Testing Framework**: Validation

### **MEDIUM (Nice to Have)** 🟢
9. **Audit Logging**: Compliance and debugging
10. **Performance Optimization**: User experience
11. **Error Handling**: Robustness
12. **Documentation**: Maintenance

---

## 📋 **MISSING COMPONENTS CHECKLIST**

### **Database Layer**
- [ ] Superadmin table and role
- [ ] 4-tier enum definition
- [ ] Hierarchy constraint triggers
- [ ] Complete RLS policies
- [ ] Client isolation validation

### **API Layer**
- [ ] Superadmin bootstrap function
- [ ] Hierarchy-enforced creation functions
- [ ] Public signup blocking
- [ ] QR/POS customer creation
- [ ] Validation middleware

### **Security Layer**
- [ ] Complete multi-tenant isolation
- [ ] Role assignment validation
- [ ] Cross-client access prevention
- [ ] Audit trail implementation
- [ ] Error handling

### **Testing Layer**
- [ ] Bootstrap testing
- [ ] Hierarchy validation tests
- [ ] Security penetration tests
- [ ] Multi-tenant isolation tests
- [ ] End-to-end workflow tests

---

## 🔍 **SCHEMA REQUIREMENTS ANALYSIS**

### **Required Tables (Minimum)**
```sql
-- Tier 1: Superadmin management
superadmins (id, user_id, email, created_at)

-- Tier 2: Business/client management  
clients (id, name, slug, email, created_by_superadmin_id)

-- Tier 3: Location and staff management
locations (id, client_id, name, address)
staff (id, user_id, location_id, role, created_by_client_admin_id)

-- Tier 4: Customer management
customers (id, name, email, qr_code, location_id, created_by_staff_id)

-- Core loyalty system
stamps (id, customer_id, location_id, quantity, created_by_staff_id)
rewards (id, customer_id, location_id, stamps_used, created_by_staff_id)
```

### **Required Constraints**
```sql
-- Hierarchy enforcement
CHECK: staff.created_by_client_admin_id must own staff.location_id.client_id
CHECK: customers.created_by_staff_id must work at customers.location_id
CHECK: Only superadmins can create clients
CHECK: Only client admins can create staff
CHECK: Only staff can create customers
```

---

## 🎯 **SUCCESS CRITERIA MAPPING**

### **Must Be Able To:**
1. ✅ **Create superadmin** → Bootstrap SQL script
2. ✅ **Superadmin creates client** → create-client Edge Function
3. ✅ **Client creates staff** → create-staff Edge Function  
4. ✅ **Staff creates customers** → create-customer Edge Function (QR/POS)
5. ✅ **Verify exclusivity** → No other creation paths possible

### **Must NOT Be Able To:**
1. ❌ **Public signup** → Blocked at Supabase Auth level
2. ❌ **Self role assignment** → Database constraints prevent
3. ❌ **Cross-client access** → RLS policies enforce isolation
4. ❌ **Skip hierarchy** → All creation validates tier permissions

---

**✅ PHASE 1 COMPLETE: All requirements mapped against current state**

**🔄 NEXT: Phase 2 - Design optimal schema to meet all requirements** 
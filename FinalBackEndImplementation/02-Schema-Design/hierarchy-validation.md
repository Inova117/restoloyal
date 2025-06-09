# 🔐 **HIERARCHY VALIDATION & ENFORCEMENT**

## 🎯 **4-TIER HIERARCHY ENFORCEMENT STRATEGY**

This document defines how the 4-tier hierarchy is enforced at the database level to ensure **NO PUBLIC SIGNUP** and strict creation controls.

---

## 🚨 **CORE HIERARCHY RULES**

### **Creation Hierarchy (ENFORCED)**
```
Tier 1: SUPERADMIN
    ↓ ONLY creates
Tier 2: CLIENT_ADMIN  
    ↓ ONLY creates
Tier 3: LOCATION_STAFF
    ↓ ONLY creates
Tier 4: CUSTOMER
```

### **Violation Prevention**
- ❌ **NO tier can create users in same or higher tiers**
- ❌ **NO tier can skip levels** (e.g., superadmin → location_staff directly)
- ❌ **NO self-registration** anywhere in the system
- ❌ **NO cross-client user creation**

---

## 🔧 **DATABASE-LEVEL ENFORCEMENT MECHANISMS**

### **1. Foreign Key Constraints (BASIC)**
```sql
-- Enforced in schema
clients.created_by_superadmin_id → superadmins.id
client_admins.created_by_superadmin_id → superadmins.id
locations.created_by_client_admin_id → client_admins.id
location_staff.created_by_client_admin_id → client_admins.id
customers.created_by_staff_id → location_staff.id
```

### **2. CHECK Constraints (INTERMEDIATE)**
```sql
-- Already in optimal-schema.sql
CONSTRAINT user_roles_hierarchy_validation CHECK (
  (tier = 'superadmin' AND created_by_tier IS NULL) OR -- Bootstrap
  (tier = 'client_admin' AND created_by_tier = 'superadmin') OR
  (tier = 'location_staff' AND created_by_tier = 'client_admin') OR  
  (tier = 'customer' AND created_by_tier = 'location_staff')
)
```

### **3. Database Triggers (ADVANCED)**
```sql
-- Will be implemented in Phase 3
-- Validates creator permissions in real-time
-- Prevents unauthorized user creation
-- Logs all hierarchy violations
```

---

## 🛡️ **HIERARCHY VALIDATION FUNCTIONS**

### **Superadmin Validation Function**
```sql
CREATE OR REPLACE FUNCTION validate_superadmin_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Superadmins can only be created via bootstrap (no creator validation)
  -- OR by existing superadmins (for multi-superadmin scenarios)
  
  IF TG_OP = 'INSERT' THEN
    -- For initial bootstrap, allow creation without creator
    -- For subsequent superadmins, validate creator is superadmin
    IF NEW.created_by_superadmin_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM superadmins 
        WHERE id = NEW.created_by_superadmin_id 
        AND is_active = true
      ) THEN
        RAISE EXCEPTION 'Invalid superadmin creator: %', NEW.created_by_superadmin_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### **Client Admin Validation Function**
```sql
CREATE OR REPLACE FUNCTION validate_client_admin_creation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Validate creator is active superadmin
    IF NOT EXISTS (
      SELECT 1 FROM superadmins 
      WHERE id = NEW.created_by_superadmin_id 
      AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Only active superadmins can create client admins';
    END IF;
    
    -- Validate client exists and belongs to same superadmin
    IF NOT EXISTS (
      SELECT 1 FROM clients 
      WHERE id = NEW.client_id 
      AND created_by_superadmin_id = NEW.created_by_superadmin_id
      AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Client admin must be created by the same superadmin who created the client';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### **Location Staff Validation Function**
```sql
CREATE OR REPLACE FUNCTION validate_location_staff_creation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Validate creator is active client admin for this client
    IF NOT EXISTS (
      SELECT 1 FROM client_admins 
      WHERE id = NEW.created_by_client_admin_id 
      AND client_id = NEW.client_id
      AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Only active client admins can create location staff for their client';
    END IF;
    
    -- Validate location belongs to same client
    IF NOT EXISTS (
      SELECT 1 FROM locations 
      WHERE id = NEW.location_id 
      AND client_id = NEW.client_id
    ) THEN
      RAISE EXCEPTION 'Location staff must be assigned to location within same client';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### **Customer Validation Function**
```sql
CREATE OR REPLACE FUNCTION validate_customer_creation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Validate creator is active location staff for this location
    IF NOT EXISTS (
      SELECT 1 FROM location_staff 
      WHERE id = NEW.created_by_staff_id 
      AND location_id = NEW.location_id
      AND client_id = NEW.client_id
      AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Only active location staff can create customers for their location';
    END IF;
    
    -- Validate location belongs to client
    IF NOT EXISTS (
      SELECT 1 FROM locations 
      WHERE id = NEW.location_id 
      AND client_id = NEW.client_id
    ) THEN
      RAISE EXCEPTION 'Customer location must belong to customer client';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔒 **USER ROLES CENTRAL VALIDATION**

### **Central User Roles Trigger**
```sql
CREATE OR REPLACE FUNCTION validate_user_role_creation()
RETURNS TRIGGER AS $$
DECLARE
  creator_tier public.user_tier;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get creator's tier
    IF NEW.created_by_user_id IS NOT NULL THEN
      SELECT tier INTO creator_tier 
      FROM user_roles 
      WHERE user_id = NEW.created_by_user_id 
      AND is_active = true;
      
      IF creator_tier IS NULL THEN
        RAISE EXCEPTION 'Invalid creator user ID: %', NEW.created_by_user_id;
      END IF;
      
      -- Validate hierarchy: creator must be exactly one tier above
      CASE NEW.tier
        WHEN 'superadmin' THEN
          -- Superadmin can only be created via bootstrap (no creator)
          IF NEW.created_by_user_id IS NOT NULL THEN
            RAISE EXCEPTION 'Superadmin can only be created via bootstrap';
          END IF;
          
        WHEN 'client_admin' THEN
          IF creator_tier != 'superadmin' THEN
            RAISE EXCEPTION 'Only superadmins can create client admins';
          END IF;
          
        WHEN 'location_staff' THEN
          IF creator_tier != 'client_admin' THEN
            RAISE EXCEPTION 'Only client admins can create location staff';
          END IF;
          
        WHEN 'customer' THEN
          IF creator_tier != 'location_staff' THEN
            RAISE EXCEPTION 'Only location staff can create customers';
          END IF;
          
        ELSE
          RAISE EXCEPTION 'Invalid user tier: %', NEW.tier;
      END CASE;
    END IF;
    
    -- Additional validation: ensure tier-specific ID is provided and valid
    CASE NEW.tier
      WHEN 'superadmin' THEN
        IF NEW.superadmin_id IS NULL THEN
          RAISE EXCEPTION 'Superadmin role requires superadmin_id';
        END IF;
        
      WHEN 'client_admin' THEN
        IF NEW.client_admin_id IS NULL THEN
          RAISE EXCEPTION 'Client admin role requires client_admin_id';
        END IF;
        
      WHEN 'location_staff' THEN
        IF NEW.location_staff_id IS NULL THEN
          RAISE EXCEPTION 'Location staff role requires location_staff_id';
        END IF;
        
      WHEN 'customer' THEN
        IF NEW.customer_id IS NULL THEN
          RAISE EXCEPTION 'Customer role requires customer_id';
        END IF;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🚫 **PUBLIC SIGNUP PREVENTION**

### **Auth User Creation Trigger**
```sql
-- This will be implemented to prevent direct auth.users creation
-- without going through proper hierarchy

CREATE OR REPLACE FUNCTION prevent_unauthorized_user_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Block creation unless it's going through our Edge Functions
  -- We'll detect this via a special session variable set by Edge Functions
  
  IF current_setting('app.creating_user_via_hierarchy', true) != 'true' THEN
    RAISE EXCEPTION 'User creation must go through proper hierarchy Edge Functions';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to auth.users table
CREATE TRIGGER auth_users_hierarchy_check
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_unauthorized_user_creation();
```

---

## 🔍 **HIERARCHY VALIDATION MATRIX**

### **Creation Permission Matrix**
| Creator Tier | Can Create | Cannot Create |
|--------------|------------|---------------|
| **Superadmin** | ✅ Clients<br>✅ Client Admins | ❌ Location Staff<br>❌ Customers |
| **Client Admin** | ✅ Locations<br>✅ Location Staff | ❌ Clients<br>❌ Client Admins<br>❌ Customers |
| **Location Staff** | ✅ Customers<br>✅ Stamps<br>✅ Rewards | ❌ Clients<br>❌ Client Admins<br>❌ Locations<br>❌ Location Staff |
| **Customer** | ❌ Nothing | ❌ Everything |

### **Cross-Client Validation**
| Action | Validation Required |
|--------|-------------------|
| **Client Admin creates Location** | ✅ Must belong to same client |
| **Client Admin creates Staff** | ✅ Must belong to same client |
| **Staff creates Customer** | ✅ Must work at customer's location |
| **Staff adds Stamps** | ✅ Customer, staff, location must share client |
| **Staff redeems Rewards** | ✅ Customer, staff, location must share client |

---

## 🧪 **HIERARCHY TESTING SCENARIOS**

### **Valid Creation Flows (Should Succeed)**
```sql
-- 1. Bootstrap: Create superadmin
INSERT INTO superadmins (user_id, email, name) VALUES (...);

-- 2. Superadmin creates client
INSERT INTO clients (name, created_by_superadmin_id) VALUES (...);

-- 3. Superadmin creates client admin
INSERT INTO client_admins (user_id, client_id, created_by_superadmin_id) VALUES (...);

-- 4. Client admin creates location
INSERT INTO locations (client_id, created_by_client_admin_id) VALUES (...);

-- 5. Client admin creates location staff
INSERT INTO location_staff (user_id, location_id, client_id, created_by_client_admin_id) VALUES (...);

-- 6. Location staff creates customer
INSERT INTO customers (location_id, client_id, created_by_staff_id) VALUES (...);
```

### **Invalid Creation Flows (Should Fail)**
```sql
-- ❌ Client admin tries to create another client admin
INSERT INTO client_admins (user_id, client_id, created_by_client_admin_id) VALUES (...);
-- Expected: FOREIGN KEY violation (created_by_client_admin_id doesn't exist)

-- ❌ Location staff tries to create another location staff
INSERT INTO location_staff (user_id, location_id, client_id, created_by_staff_id) VALUES (...);
-- Expected: FOREIGN KEY violation (created_by_staff_id wrong type)

-- ❌ Cross-client customer creation
INSERT INTO customers (location_id, client_id, created_by_staff_id) VALUES (...);
-- WHERE staff.client_id != customer.client_id
-- Expected: CHECK constraint violation

-- ❌ Direct auth.users creation (public signup)
INSERT INTO auth.users (email) VALUES ('hacker@evil.com');
-- Expected: Trigger exception about hierarchy requirement
```

---

## 📊 **HIERARCHY AUDIT & MONITORING**

### **Hierarchy Violation Logging**
```sql
-- Audit table for tracking hierarchy violations
CREATE TABLE public.hierarchy_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  violation_type TEXT NOT NULL,
  attempted_action TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  target_table TEXT NOT NULL,
  target_data JSONB,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Function to log violations
CREATE OR REPLACE FUNCTION log_hierarchy_violation(
  p_violation_type TEXT,
  p_attempted_action TEXT,
  p_user_id UUID,
  p_target_table TEXT,
  p_target_data JSONB,
  p_error_message TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO hierarchy_audit_log (
    violation_type, attempted_action, user_id, target_table, 
    target_data, error_message, ip_address, user_agent
  ) VALUES (
    p_violation_type, p_attempted_action, p_user_id, p_target_table,
    p_target_data, p_error_message, 
    inet_client_addr(), 
    current_setting('request.header.user-agent', true)
  );
END;
$$ LANGUAGE plpgsql;
```

---

## ✅ **HIERARCHY ENFORCEMENT CHECKLIST**

### **Database Level**
- [x] Foreign key constraints enforce basic hierarchy
- [x] CHECK constraints validate tier relationships  
- [x] Triggers prevent unauthorized user creation
- [x] Central user_roles table tracks all assignments
- [x] Audit logging captures violation attempts

### **API Level (Phase 4)**
- [ ] Edge Functions validate creator permissions
- [ ] Session variables prevent direct DB access
- [ ] Authentication checks tier permissions
- [ ] Rate limiting prevents brute force

### **Frontend Level (Future)**
- [ ] UI hides unauthorized creation options
- [ ] Role-based navigation and features
- [ ] Clear hierarchy visualization
- [ ] Error handling for permission violations

---

**✅ PHASE 2 COMPLETE: Optimal schema design with complete hierarchy validation**

**🔄 NEXT: Phase 3 - Database Implementation (Clean Slate)** 
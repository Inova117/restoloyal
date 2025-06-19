# 🔧 FASE 2: COMPLETAR CRUD OPERATIONS

## **Priority 1: Client Management (Superadmin)**

### **Edge Functions Needed:**
1. **update-client/** - Client updates
2. **delete-client/** - Client deletion (with safety checks)

### **Implementation Steps:**
```typescript
// update-client Edge Function
- Validate superadmin permissions
- Check client exists
- Update with audit logging
- Return updated client data

// delete-client Edge Function  
- Validate superadmin permissions
- Check for dependencies (locations, customers)
- Soft delete or prevent if has data
- Audit log deletion
```

### **Frontend Updates:**
- Add Edit Client modal in ZerionPlatformDashboard
- Add Delete confirmation with dependency check
- Update ClientManagementTab with full CRUD

## **Priority 2: Location Management (Client Admin)**

### **Edge Functions Needed:**
1. **create-location/** - Location creation
2. **update-location/** - Location updates  
3. **delete-location/** - Location deletion

### **Implementation Steps:**
```typescript
// create-location Edge Function
- Validate client_admin permissions
- Verify client ownership
- Create location with hierarchy
- Return location data

// update-location Edge Function
- Validate permissions and ownership
- Update location data
- Audit logging

// delete-location Edge Function
- Check for customers/staff dependencies
- Soft delete or prevent if active
- Audit logging
```

### **Frontend Updates:**
- Add Create Location modal
- Add Edit Location functionality
- Add Location management in GallettiHQDashboard

## **Priority 3: Staff Management (Client Admin)**

### **Edge Functions Needed:**
1. **update-location-staff/** - Staff updates
2. **delete-location-staff/** - Staff deletion

### **Implementation Steps:**
```typescript
// update-location-staff Edge Function
- Validate client_admin permissions
- Check staff belongs to client
- Update staff data
- Role and permission management

// delete-location-staff Edge Function
- Validate permissions
- Check for active sessions
- Deactivate or delete staff
- Audit logging
```

### **Frontend Updates:**
- Add Staff Management UI
- Add Role/Permission editor
- Add Staff list with CRUD operations

## **Estimated Timeline: 2-3 Weeks**
- Week 1: Client CRUD Edge Functions + UI
- Week 2: Location CRUD Edge Functions + UI  
- Week 3: Staff CRUD Edge Functions + UI

## **Testing Strategy:**
- Unit tests for each Edge Function
- Integration tests for CRUD flows
- Security testing for permissions
- UI testing for all operations 
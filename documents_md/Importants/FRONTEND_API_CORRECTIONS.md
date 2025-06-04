# 🔧 FRONTEND API CORRECTIONS
## Fix Edge Function Calls to Match Deployed Functions

**Problem**: Frontend calling old `create-client-with-user-v2` function that doesn't exist  
**Solution**: Update all API calls to use the 4 deployed Edge Functions correctly

---

## 📊 **CURRENT DEPLOYED FUNCTIONS**

```
✅ platform-management    → Platform admin operations
✅ client-administration  → Client dashboard operations  
✅ client-profile        → Client profile management
✅ [OTHER FUNCTIONS]     → Various operations
```

**❌ BROKEN CALLS**: `create-client-with-user-v2` (doesn't exist)  
**✅ CORRECT CALLS**: `platform-management` with proper endpoints

---

## 🚨 **IMMEDIATE FIX REQUIRED**

### **1. Fix Client Creation in ZerionPlatformDashboard.tsx**

**Current Broken Code (line 398)**:
```typescript
const { data, error } = await supabase.functions.invoke('create-client-with-user-v2', {
  body: {
    name: newClient.name,
    contactEmail: newClient.contactEmail,
    contactPhone: newClient.contactPhone,
    plan: newClient.plan
  }
})
```

**✅ CORRECTED CODE**:
```typescript
const { data, error } = await supabase.functions.invoke('platform-management', {
  body: {
    name: newClient.name,
    slug: newClient.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
    type: 'restaurant_chain',
    contact_email: newClient.contactEmail,
    contact_phone: newClient.contactPhone,
    plan: newClient.plan
  }
})
```

### **2. API Response Structure Update**

**Current Structure Expected**:
```typescript
if (data.success) {
  const client: ClientData = {
    id: data.client.id,
    name: data.client.name,
    // ...
  }
}
```

**✅ NEW STRUCTURE** (based on platform-management):
```typescript
if (data.success) {
  const client: ClientData = {
    id: data.data.id,
    name: data.data.name,
    logo: '🏢',
    plan: data.data.plan,
    restaurantCount: 0,
    locationCount: 0,
    customerCount: 0,
    monthlyRevenue: 0,
    status: data.data.status,
    created_at: data.data.created_at,
    updated_at: data.data.updated_at || data.data.created_at,
    contact_email: data.data.contact_email,
    contact_phone: data.data.contact_phone || '',
    growthRate: 0
  }
}
```

---

## 📝 **ALL REQUIRED CORRECTIONS**

### **File: `src/components/ZerionPlatformDashboard.tsx`**

**Lines to Update**:
- Line 398: Change function call
- Line 410-450: Update response handling
- Line 630+: Update delete client logic
- Line 724+: Update edit client logic

### **File: `src/services/platform/platformService.ts`**

**Current Issues**:
- All API calls need to be updated to use correct endpoints
- Response structures need to match deployed functions
- Error handling needs to be consistent

---

## 🛠️ **IMPLEMENTATION PLAN**

### **Step 1: Update platformService.ts**
```typescript
export class PlatformService {
  
  async createClient(clientData: any): Promise<any> {
    const { data, error } = await supabase.functions.invoke('platform-management', {
      body: {
        name: clientData.name,
        slug: clientData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        type: clientData.type || 'restaurant_chain',
        contact_email: clientData.contactEmail,
        contact_phone: clientData.contactPhone,
        plan: clientData.plan || 'trial'
      }
    })
    
    if (error) throw error
    return data
  }

  async getClients(): Promise<any[]> {
    const { data, error } = await supabase.functions.invoke('platform-management', {
      body: { endpoint: 'clients' }
    })
    
    if (error) throw error
    return data.data || []
  }

  async getPlatformMetrics(): Promise<any> {
    const { data, error } = await supabase.functions.invoke('platform-management', {
      body: { endpoint: 'metrics' }
    })
    
    if (error) throw error
    return data.data
  }

  async deleteClient(clientId: string): Promise<boolean> {
    const { data, error } = await supabase.functions.invoke('platform-management', {
      method: 'DELETE',
      body: { client_id: clientId }
    })
    
    if (error) throw error
    return data.success
  }
}
```

### **Step 2: Update ZerionPlatformDashboard.tsx**

**Replace the handleAddClient function (lines 386-469)**:
```typescript
const handleAddClient = async () => {
  if (!newClient.name || !newClient.contactEmail) {
    toast({
      title: "Missing Information",
      description: "Please fill in all required fields",
      variant: "destructive"
    })
    return
  }

  setLoading(true)
  try {
    // Call platform-management edge function
    const { data, error } = await supabase.functions.invoke('platform-management', {
      body: {
        name: newClient.name,
        slug: newClient.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        type: 'restaurant_chain',
        contact_email: newClient.contactEmail,
        contact_phone: newClient.contactPhone,
        plan: newClient.plan
      }
    })

    if (error) {
      throw new Error(error.message || 'Failed to create client')
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to create client')
    }

    // Update local state with the new client
    const client: ClientData = {
      id: data.data.id,
      name: data.data.name,
      logo: '🏢',
      plan: data.data.plan,
      restaurantCount: 0,
      locationCount: 0,
      customerCount: 0,
      monthlyRevenue: 0,
      status: data.data.status,
      created_at: data.data.created_at,
      updated_at: data.data.updated_at || data.data.created_at,
      contact_email: data.data.contact_email,
      contact_phone: data.data.contact_phone || '',
      growthRate: 0
    }
    
    // Update localStorage and state
    try {
      const existingClientsStr = localStorage.getItem('zerion_platform_clients')
      const existingClients = existingClientsStr ? JSON.parse(existingClientsStr) : []
      const updatedClients = [...existingClients, client]
      localStorage.setItem('zerion_platform_clients', JSON.stringify(updatedClients))
      
      setClients(prev => [...prev, client])
      
      if (metrics) {
        setMetrics(prev => prev ? {
          ...prev,
          totalClients: prev.totalClients + 1
        } : prev)
      }
    } catch (storageError) {
      console.warn('Error updating localStorage:', storageError)
    }
      
    // Reset form and close dialog
    setNewClient({
      name: '',
      contactEmail: '',
      contactPhone: '',
      plan: 'trial'
    })
    setShowAddClientDialog(false)

    toast({
      title: "🎉 Client Created Successfully!",
      description: `Client "${client.name}" has been created successfully`
    })

  } catch (error: any) {
    console.error('Error adding client:', error)
    toast({
      title: "Error Creating Client",
      description: error?.message || "Failed to add client. Please check your permissions and try again.",
      variant: "destructive"
    })
  } finally {
    setLoading(false)
  }
}
```

---

## ✅ **TESTING CHECKLIST**

After implementing the fixes:

1. **✅ Test Client Creation**:
   - Add new client via platform dashboard
   - Verify it appears in client list
   - Check if data persists after refresh

2. **✅ Test Client Deletion**:
   - Delete a client
   - Verify it's removed from UI and backend

3. **✅ Test Metrics Loading**:
   - Verify platform metrics load correctly
   - Check activity feed updates

4. **✅ Test Error Handling**:
   - Try creating client with invalid data
   - Verify proper error messages display

---

## 🎯 **EXPECTED RESULT**

After implementing these corrections:

✅ **Client creation will work**  
✅ **No more CORS errors**  
✅ **All API calls will use correct endpoints**  
✅ **Platform dashboard will be fully functional**  

**The issue will be completely resolved!** 🚀 
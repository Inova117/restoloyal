# 🔍 DASHBOARD DEBUG GUIDE
**Restaurant Loyalty Platform - Client Data Loading Issues**  
**Date**: December 19, 2024  
**Updated**: Security initialization fixes applied

---

## 🎯 **ISSUE SUMMARY**

You've added 3 clients to Supabase but they're not showing up in the dashboard. Additionally, there may be security initialization issues preventing the page from loading properly.

---

## 🚨 **NEW: SECURITY INITIALIZATION FIX**

**Issue**: Security measures (CSP, session management) were too strict in development mode and blocking page loading.

**Fix Applied**: 
- ✅ CSP disabled in development mode
- ✅ Better error handling for security initialization
- ✅ Debug component added to track loading states

**What to look for**:
- Check for "🔒 Security measures initialized successfully" in console
- Look for debug info panel in bottom-right corner (dev mode only)
- No CSP errors in browser console

---

## 🔧 **STEP 1: CHECK BROWSER CONSOLE**

1. **Open your dashboard in the browser**
2. **Press F12** to open Developer Tools
3. **Go to the Console tab**
4. **Look for these debug messages**:

```
🔒 Initializing security measures...
🔧 CSP skipped in development mode
✅ Session management initialized
🔒 Security measures initialized successfully
🔍 Loading dashboard data for role: [your-role]
🔍 User ID: [your-user-id]
🏪 Found restaurants: [number]
🔍 Loading clients for restaurant: [restaurant-id]
📊 Final clients loaded: [number]
```

**What to check**:
- ✅ **Security initialized**: Should see success message
- ✅ **Role**: Should be `restaurant_owner` for basic dashboard
- ✅ **Restaurants found**: Should be `1` or more
- ✅ **Clients loaded**: Should match the number you added (3)

**🔍 Debug Panel**: Look for the debug info panel in the bottom-right corner showing loading states.

---

## 🔧 **STEP 2: VERIFY DATABASE STRUCTURE**

### **Check Your Supabase Tables**:

1. **Go to Supabase Dashboard** → Your Project → Table Editor
2. **Check these tables exist**:
   - ✅ `restaurants` table
   - ✅ `clients` table (legacy) OR `customers` table (new)

### **Verify Data Relationships**:

**In `restaurants` table**:
- ✅ Check `user_id` matches your auth user ID
- ✅ Note the `restaurant.id` value

**In `clients` table**:
- ✅ Check `restaurant_id` matches your restaurant ID
- ✅ Verify you have 3 records with correct `restaurant_id`

---

## 🔧 **STEP 3: COMMON ISSUES & FIXES**

### **Issue 1: Security Blocking Page Load**
**Symptoms**: Page doesn't load, CSP errors in console
**Fix**: ✅ **ALREADY FIXED** - CSP disabled in development mode

### **Issue 2: Wrong User Role**
**Symptoms**: Console shows role other than `restaurant_owner`
**Fix**: Check your `user_roles` table in Supabase

### **Issue 3: No Restaurant Found**
**Symptoms**: Console shows "Found restaurants: 0"
**Fix**: 
```sql
-- Run in Supabase SQL Editor
INSERT INTO restaurants (user_id, name, stamps_required) 
VALUES ('[your-user-id]', 'My Restaurant', 10);
```

### **Issue 4: Wrong Restaurant ID**
**Symptoms**: Console shows "Final clients loaded: 0" but clients exist
**Fix**: Check if `clients.restaurant_id` matches `restaurants.id`

### **Issue 5: Environment Variables Missing**
**Symptoms**: Connection errors, no data loading
**Fix**: Verify Netlify environment variables are deployed

---

## 🔧 **STEP 4: MANUAL DATABASE CHECK**

**Run this query in Supabase SQL Editor**:

```sql
-- Check your user ID
SELECT auth.uid() as current_user_id;

-- Check your restaurants
SELECT id, name, user_id 
FROM restaurants 
WHERE user_id = auth.uid();

-- Check your clients (replace [restaurant-id] with actual ID)
SELECT id, name, email, restaurant_id, stamps, created_at 
FROM clients 
WHERE restaurant_id = '[restaurant-id]'
ORDER BY created_at DESC;
```

---

## 🔧 **STEP 5: FORCE REFRESH DATA**

If data exists but dashboard doesn't show it:

1. **Clear browser cache** (Ctrl+Shift+R)
2. **Check Network tab** for failed API calls
3. **Try logging out and back in**
4. **Restart development server** if running locally

---

## 🚨 **EMERGENCY FIXES**

### **Quick Fix 1: Create Test Data**
```sql
-- Create a restaurant if missing
INSERT INTO restaurants (user_id, name, stamps_required) 
VALUES (auth.uid(), 'Test Restaurant', 10);

-- Create test clients (replace [restaurant-id])
INSERT INTO clients (restaurant_id, name, email, qr_code, stamps) VALUES
('[restaurant-id]', 'Test Customer 1', 'test1@example.com', 'QR001', 5),
('[restaurant-id]', 'Test Customer 2', 'test2@example.com', 'QR002', 8),
('[restaurant-id]', 'Test Customer 3', 'test3@example.com', 'QR003', 2);
```

### **Quick Fix 2: Reset User Role**
```sql
-- Ensure you have restaurant_owner role
INSERT INTO user_roles (user_id, role) 
VALUES (auth.uid(), 'restaurant_owner')
ON CONFLICT (user_id) DO UPDATE SET role = 'restaurant_owner';
```

### **Quick Fix 3: Disable Security (Temporary)**
If security is still causing issues, you can temporarily disable it by commenting out the security initialization in `src/App.tsx`:

```typescript
// Temporarily disable security initialization
// initializeSecurity();
```

---

## 📞 **NEXT STEPS**

1. **Check browser console** for the new debug messages
2. **Look for the debug panel** in bottom-right corner
3. **Follow Step 1** and share the console output
4. **Run the SQL queries** in Step 4 and share results
5. **Check if any errors appear** in browser console
6. **Verify your user role** in the `user_roles` table

---

## 🔍 **DEBUG CHECKLIST**

- [ ] Browser console shows security initialization success
- [ ] Debug panel appears in bottom-right corner
- [ ] No CSP or security errors in console
- [ ] Browser console shows debug messages
- [ ] User role is `restaurant_owner`
- [ ] Restaurant exists with correct `user_id`
- [ ] Clients exist with correct `restaurant_id`
- [ ] Environment variables are configured
- [ ] No network errors in browser
- [ ] Data relationships are correct

**Once you complete this checklist, the dashboard should display your 3 clients correctly!** 
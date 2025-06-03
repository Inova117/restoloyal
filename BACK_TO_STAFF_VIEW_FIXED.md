# Back to Staff View Button Fixed

## Problem
The "Back to Staff View" button was only clearing the `force_client_admin` flag but not properly forcing the location staff role, causing the user to get stuck in a reload loop.

## Root Cause
When clearing `force_client_admin`, the role detection was falling back to the user metadata check, which would detect `client_admin` role and switch back to client dashboard, creating an infinite loop.

## Solution Implemented

### 1. Added Force Location Staff Flag
- Added `force_location_staff` session storage flag
- This flag explicitly forces the user into location staff view
- Takes priority over client admin metadata detection

### 2. Updated Role Detection Priority
```typescript
// New priority order:
1. force_location_staff (return from client admin) ← NEW
2. force_client_admin (manual access to client dashboard)
3. ZerionCore admin emails
4. Admin context (super admin viewing client)
5. Location context (HQ viewing location)
6. Galletti HQ emails
7. Restaurant ownership check
8. User roles table query
9. User metadata fallback (client_admin detection)
10. Default to location staff
```

### 3. Updated Button Logic
**Client Dashboard Button:**
```typescript
onClick={() => {
  sessionStorage.removeItem('force_location_staff')  // Clear staff override
  sessionStorage.setItem('force_client_admin', 'true')  // Set admin override
  window.location.reload()
}}
```

**Back to Staff View Button:**
```typescript
onClick={() => {
  sessionStorage.removeItem('force_client_admin')  // Clear admin override
  sessionStorage.setItem('force_location_staff', 'true')  // Force staff view
  window.location.reload()
}}
```

### 4. Session Cleanup
Both flags are properly cleaned up in:
- `returnToPlatform()` function
- `returnToHQ()` function

## User Flow Now Works Correctly

### For Client Admin Users:
1. **Login**: Default to Location Staff (Tier 4) ✅
2. **Click "Client Dashboard"**: Switch to Client Dashboard (Tier 2) ✅
3. **Click "Back to Staff View"**: Return to Location Staff (Tier 4) ✅
4. **Repeat**: Can switch back and forth seamlessly ✅

## Files Modified:
- `src/hooks/useUserRole.ts` - Added force_location_staff detection
- `src/pages/Index.tsx` - Updated Client Dashboard button
- `src/components/GallettiHQDashboard.tsx` - Updated Back to Staff View button

## Testing:
The user should now be able to:
- ✅ Switch from Staff View to Client Dashboard
- ✅ Switch back from Client Dashboard to Staff View
- ✅ Repeat the process without getting stuck
- ✅ See proper role detection in console logs 
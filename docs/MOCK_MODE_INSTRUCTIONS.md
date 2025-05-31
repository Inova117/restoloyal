# Mock Mode Instructions

## Overview

The restaurant management system is currently running in **Mock Mode** to allow you to test the functionality while the Edge Functions are being deployed.

## Current Status

✅ **Mock Mode Enabled** - The system uses simulated data and API responses  
🔄 **Edge Functions** - Need to be deployed for production use

## What Works in Mock Mode

### Staff Management
- ✅ View staff list with sample data (4 mock staff members)
- ✅ Invite new staff members (simulated)
- ✅ Update staff roles and status (simulated)
- ✅ Remove staff members (simulated)
- ✅ Search and filter functionality
- ✅ All UI components and interactions

### Customer Management
- ✅ View customer list with sample data (5 mock customers)
- ✅ Search customers by name, email, or phone
- ✅ Filter customers by location and status
- ✅ View detailed customer profiles with activity history
- ✅ Edit customer information and status
- ✅ Suspend, activate, and block customers
- ✅ Pagination and sorting
- ✅ Customer activity tracking (stamps and rewards)

### Location Management
- ✅ View locations list with sample data (3 mock locations)
- ✅ Location assignment in staff and customer management
- ✅ All location-related UI components

### Loyalty Management
- ✅ View loyalty settings with sample data (2 mock settings)
- ✅ Update loyalty program rules (simulated)
- ✅ View campaigns list with sample data (3 mock campaigns)
- ✅ Create new promotional campaigns (simulated)
- ✅ Update campaign status and details (simulated)
- ✅ Filter campaigns by status and type
- ✅ All UI components and interactions

### Analytics Management
- ✅ View aggregate business metrics with sample data
- ✅ Location performance breakdown (3 mock locations)
- ✅ Trend analysis with historical data (4 months)
- ✅ Customer retention cohort analysis
- ✅ Time range filtering and custom date ranges
- ✅ Revenue estimates and growth rate calculations
- ✅ All UI components and chart displays

### Data Export Management
- ✅ Export customer data (50 mock customers)
- ✅ Export rewards data (30 mock rewards)
- ✅ Export transaction data (100 mock transactions)
- ✅ Export analytics data (location-based metrics)
- ✅ CSV and JSON format support
- ✅ Location and date range filtering
- ✅ Automatic file download functionality
- ✅ Export summary and field preview
- ✅ Security notices and audit logging simulation

### POS Operations Management
- ✅ Customer lookup by QR code, phone, or email (50 mock customers)
- ✅ Register new customers with QR code generation
- ✅ Add stamps to customer accounts with purchase tracking
- ✅ Redeem rewards with eligibility checking
- ✅ Location-based permissions and staff verification
- ✅ Real-time feedback and validation
- ✅ Customer selection context across tabs
- ✅ Business rule enforcement (stamp limits, reward eligibility)
- ✅ All UI components and POS terminal interface

### Notification Campaigns Management
- ✅ View campaigns list with sample data (3 mock campaigns)
- ✅ Create new notification campaigns (push, email, SMS, multi-channel)
- ✅ Schedule campaigns for future sending
- ✅ Send campaigns immediately with progress tracking
- ✅ View detailed campaign analytics with delivery/open/click rates
- ✅ Use campaign templates (5 mock templates)
- ✅ Filter campaigns by status and type
- ✅ Target audience selection (all customers, active, inactive, high-value)
- ✅ Location-specific campaign targeting
- ✅ Campaign performance metrics and channel breakdown
- ✅ All UI components and campaign management interface

## Mock Data Included

### Staff Members
1. **John Manager** - Client Admin (Active)
2. **Sarah Supervisor** - Restaurant Admin (Active)
3. **Mike Staff** - Location Staff (Active)
4. **Pending User** - Location Staff (Pending)

### Customers
1. **John Smith** - Active customer (8 stamps, 15 visits)
2. **Sarah Johnson** - Active customer (12 stamps, 22 visits)
3. **Mike Wilson** - Active customer (3 stamps, 5 visits)
4. **Emily Davis** - Inactive customer (0 stamps, 1 visit)
5. **Robert Brown** - Blocked customer (15 stamps, 28 visits)

### Locations
1. **Main Street Store** - Downtown, CA
2. **Mall Location** - Shopping Center, CA
3. **Airport Branch** - Terminal City, CA

### Analytics Data
1. **Aggregate Metrics**
   - Total customers: 2,847
   - Active customers (30d): 1,256
   - Total rewards: 342
   - Stamps issued: 18,934
   - Growth rate: 12.5%
   - Revenue estimate: $28,401

2. **Location Breakdown** (3 locations)
   - Main Street Store: 1,245 customers, 45.5% activity rate
   - Mall Location: 987 customers, 42.8% activity rate  
   - Airport Branch: 615 customers, 43.3% activity rate

3. **Trend Data** (4 months)
   - Monthly growth patterns from Oct 2023 - Jan 2024
   - Reward redemption trends (1.79% - 1.98% rates)
   - Customer retention cohorts with realistic retention rates

## Mock Data Details

### Loyalty Settings (2 settings)
1. **Main Street Location**
   - Stamps required: 10
   - Reward: Free medium pizza ($15.99)
   - Stamps per dollar: 1.0
   - Max per visit: 5
   - Expiry: 365 days

2. **Mall Location**
   - Stamps required: 8
   - Reward: Free large drink ($3.99)
   - Stamps per dollar: 1.5
   - Max per visit: 3
   - Auto-redeem enabled

### Campaigns (3 campaigns)
1. **Double Stamp Weekend** (Active)
   - Type: Double stamps
   - Duration: Jan 26-28, 2024
   - Usage: 245/1000

2. **New Customer Bonus** (Active)
   - Type: Bonus stamps (+5)
   - Duration: Jan 15 - Feb 15, 2024
   - Usage: 89 (no limit)

3. **Holiday Special** (Expired)
   - Type: Discount (20% off)
   - Duration: Dec 20 - Jan 5, 2024
   - Usage: 456/500

### POS Operations Data (50 customers)
- **Customer Database**: 50 mock customers with QR codes, contact info, and loyalty data
- **Stamp History**: Realistic stamp earning patterns and purchase tracking
- **Reward Eligibility**: Customers with various stamp counts (0-25 stamps)
- **Location Assignment**: Customers distributed across 3 locations
- **Activity Tracking**: Recent visits, stamp additions, and reward redemptions

### Notification Campaigns Data
1. **Campaigns** (3 campaigns)
   - **Welcome New Customers** - Multi-channel, sent to 1,247 customers
   - **Weekend Special Promotion** - Push notification, scheduled for future
   - **Inactive Customer Re-engagement** - Email campaign, draft status

2. **Campaign Templates** (5 templates)
   - Welcome New Customer (Multi-channel)
   - Reward Available (Push)
   - Special Promotion (Email)
   - Birthday Special (SMS)
   - Inactive Customer (Multi-channel)

3. **Analytics Data**
   - Total campaigns: 3
   - Sent campaigns: 1
   - Total notifications: 1,247
   - Average delivery rate: 94.2%
   - Realistic open rates (72.1%) and click rates (18.3%)
   - Channel breakdown (push, email, SMS performance)

## How to Switch to Production Mode

When your Edge Functions are deployed, follow these steps:

### 1. Update Staff Manager Hook
File: `src/hooks/useStaffManager.ts`
```typescript
// Change this line from true to false
const MOCK_MODE = false
```

### 2. Update Customer Manager Hook
File: `src/hooks/useCustomerManager.ts`
```typescript
// Change this line from true to false
const MOCK_MODE = false
```

### 3. Update Location Manager Hook
File: `src/hooks/useLocationManager.ts`
```typescript
// Change this line from true to false
const MOCK_MODE = false
```

### 4. Update Analytics Manager Hook
File: `src/hooks/useAnalyticsManager.ts`
```typescript
// Change this line from true to false
const MOCK_MODE = false
```

### 5. Update Data Export Hook
File: `src/hooks/useDataExport.ts`
```typescript
// Change this line from true to false
const MOCK_MODE = false
```

### 6. Update POS Operations Hook
File: `src/hooks/usePOSOperations.ts`
```typescript
// Change this line from true to false
const MOCK_MODE = false
```

### 7. Update Notification Campaigns Hook
File: `src/hooks/useNotificationCampaigns.ts`
```typescript
// Change this line from true to false
const MOCK_MODE = false
```

### 8. Deploy Edge Functions
Run these commands in your terminal:
```bash
# Deploy staff manager function
npx supabase functions deploy staff-manager

# Deploy customer manager function
npx supabase functions deploy customer-manager

# Deploy location manager function
npx supabase functions deploy location-manager

# Deploy loyalty manager function
npx supabase functions deploy loyalty-manager

# Deploy analytics report function
npx supabase functions deploy analytics-report

# Deploy data export function
npx supabase functions deploy data-export

# Deploy POS operations function
npx supabase functions deploy pos-operations

# Deploy notification campaigns function
npx supabase functions deploy notification-campaigns
```

### 9. Run Database Schema Fixes
Make sure you've run the SQL from these files in your Supabase SQL Editor:
- `docs/FIX_USER_ROLES_SCHEMA.sql` (for staff management)
- `docs/FIX_ANALYTICS_SCHEMA.sql` (for analytics)
- `COLUMN_ALIGNMENT_FIX.sql` (for POS operations)
- `supabase/migrations/20240101000013_pos_operations_rls.sql` (for POS operations)
- `supabase/migrations/20240101000014_notification_campaigns_schema.sql` (for notification campaigns)

## Testing the Management Systems

### 1. Navigate to Management Tabs
- Go to the Galletti HQ Dashboard
- Click on the "Staff", "Customers", or "Locations" tabs
- You should see the mock data for each section

### 2. Test Staff Management
- Click "Invite Staff" button
- Fill in the form with test data
- Submit - you'll see a success message and the new staff member added
- Test edit and remove functionality

### 3. Test Customer Management
- Use the search box to filter customers by name, email, or phone
- Use the location and status dropdowns to filter the list
- Click "View" to see detailed customer profiles with activity history
- Click "Edit" to modify customer information
- Test suspend, activate, and block functionality
- Test pagination with the Previous/Next buttons

### 4. Test Location Integration
- Both staff and customer management use location data
- Location assignments work in both systems
- Location filtering works correctly

### 5. Test Loyalty Management
- Navigate to the Loyalty tab
- Verify loyalty settings and campaign management

### 6. Test Analytics Management
- Navigate to the Analytics tab
- **Overview Tab:**
  - View aggregate metrics cards
  - Check growth indicators and key insights
  - Verify revenue estimates and activity rates
- **Locations Tab:**
  - Compare performance across locations
  - Check growth rates and activity metrics
  - Verify location-specific data display
- **Trends Tab:**
  - View monthly growth charts
  - Check reward redemption trends
  - Examine customer retention cohorts table
- **Filters:**
  - Test time range selection (30d, 90d, 6m, 1y)
  - Try custom date range selection
  - Test location filtering (when available)

### 8. Test Data Export Management
- Navigate to the Data Export tab
- **Export Type Selection:**
  - Test all 4 export types (customers, rewards, transactions, analytics)
  - Verify field previews for each type
  - Check export descriptions and icons
- **Filtering Options:**
  - Test location filtering (All locations vs specific location)
  - Try quick date range buttons (30d, 90d, 1y)
  - Test custom date range selection
  - Switch between CSV and JSON formats
- **Export Process:**
  - Click "Export Data" button
  - Verify loading state and progress indication
  - Check file download functionality
  - Confirm success toast notifications
- **Data Validation:**
  - Open downloaded CSV files to verify data structure
  - Check JSON format exports for proper structure
  - Verify filtering works (location and date range)
  - Confirm record counts match expectations

## Troubleshooting

### If you see "gin_trgm_ops does not exist" error:
- This is a database extension issue for text search
- Run the SQL from `docs/FIX_TRIGRAM_EXTENSION.sql` in your Supabase SQL Editor
- The fix will create fallback indexes if the trigram extension isn't available
- Refresh the page after running the fix

### If you see "Unexpected token '<'" error:
- This means the system is trying to call the real Edge Function
- Make sure `MOCK_MODE = true` in all hook files
- Refresh the page

### If any tab shows loading forever:
- Check the browser console for errors
- Make sure you've saved all hook files with mock mode enabled
- Try refreshing the page

### If actions don't work (invite/edit/remove/etc.):
- Check that mock mode is enabled in the relevant hook
- Look for any console errors
- Make sure you're clicking the correct buttons

### If customer details don't load:
- Check that `MOCK_MODE = true` in `useCustomerManager.ts`
- Verify the customer ID exists in the mock data
- Check browser console for errors

### If database migration fails:
- Check if you have the required tables (clients, user_roles, etc.)
- Run the schema fix files in order
- Contact support if you need help with database setup

### If you see "invalid input value for enum app_role: 'platform_admin'" error:
- This is a database enum issue where the role values don't match
- **Quick Fix**: Run the SQL from `docs/QUICK_FIX_DATA_EXPORT.sql` in your Supabase SQL Editor
- This script will:
  - Check current enum values
  - Add missing role values (zerion_admin, platform_admin)
  - Create/update audit_logs table and RLS policies
  - Verify the setup is working
- Refresh the page after running the fix
- Make sure you're testing in mock mode first (`MOCK_MODE = true` in `useDataExport.ts`)

## Production Deployment Checklist

When ready to switch to production mode:

### 1. Deploy Edge Functions
```bash
# Deploy all management functions
supabase functions deploy staff-manager
supabase functions deploy customer-manager
supabase functions deploy location-manager
supabase functions deploy loyalty-manager
supabase functions deploy analytics-report
```

### 2. Run Database Migrations
```bash
# Apply all schema changes
supabase db push
```

### 3. Disable Mock Mode
Update the following files to set `MOCK_MODE = false`:
- `src/hooks/useStaffManager.ts`
- `src/hooks/useCustomerManager.ts`
- `src/hooks/useLocationManager.ts`
- `src/hooks/useLoyaltyManager.ts`
- `src/hooks/useAnalyticsManager.ts`
- `src/hooks/useDataExport.ts`
- `src/hooks/usePOSOperations.ts`
- `src/hooks/useNotificationCampaigns.ts`

### 4. Verify Environment Variables
Ensure these are set in your environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 5. Test Production Endpoints
1. Test staff management operations
2. Test customer management operations
3. Test location management operations
4. Test loyalty settings and campaign management
5. Test analytics data fetching and filtering
6. Test data export functionality and file downloads
7. Verify RLS policies are working
8. Check audit logging functionality

## Testing All Features

### Staff Management Testing
1. Navigate to Staff tab
2. Try inviting a new staff member
3. Update existing staff roles and status
4. Test search and filtering
5. Verify all status changes work

### Customer Management Testing
1. Navigate to Customers tab
2. Search for customers by name/email/phone
3. Filter by location and status
4. View customer details and activity
5. Update customer information
6. Test status changes (suspend/activate/block)

### Location Management Testing
1. Navigate to Locations tab
2. View location list and details
3. Update location information
4. Test status management
5. Verify contact information updates

### Loyalty Management Testing
1. Navigate to Loyalty tab
2. **Loyalty Settings:**
   - View current settings for each location
   - Update stamps required, reward value, etc.
   - Test auto-redeem toggle
   - Update expiry and minimum purchase settings
3. **Campaigns:**
   - View campaign list with filtering
   - Create new campaigns of different types
   - Test all promotion types (bonus stamps, discount, free item, double stamps, referral bonus)
   - Update campaign status (activate/pause)
   - Edit campaign details

### Analytics Management Testing
1. Navigate to Analytics tab
2. **Test Overview Metrics:**
   - Verify aggregate metrics display correctly
   - Check growth indicators (arrows and colors)
   - Review key insights section
3. **Test Location Breakdown:**
   - Compare metrics across all locations
   - Verify activity rates and growth calculations
   - Check location-specific performance data
4. **Test Trend Analysis:**
   - View monthly growth patterns
   - Check redemption rate trends
   - Examine retention cohort data
5. **Test Filtering:**
   - Change time ranges and verify data updates
   - Try custom date range selection
   - Test refresh functionality

## Troubleshooting

### Loyalty Management Issues

1. **"Cannot find loyalty settings"**
   - Verify mock data is properly loaded
   - Check client ID is correctly set
   - Ensure component is properly mounted

2. **Campaign creation fails**
   - Check all required fields are filled
   - Verify date range is valid (end > start)
   - Ensure at least one location is selected
   - Validate reward configuration for selected type

3. **Settings update not working**
   - Verify restaurant ID is available
   - Check form validation passes
   - Ensure all required fields have valid values

### General Mock Mode Issues

1. **"Unexpected token '<', '<!DOCTYPE'... is not valid JSON"**
   - This indicates Edge Functions are not deployed
   - Verify `MOCK_MODE = true` in the respective hook
   - Check network tab for actual response

2. **Components not loading**
   - Verify all imports are correct
   - Check console for JavaScript errors
   - Ensure mock data arrays are properly defined

3. **Filters not working**
   - Check filter state management
   - Verify mock data includes varied statuses/types
   - Ensure filter logic handles empty/undefined values

4. **Toast notifications not appearing**
   - Verify `useToast` hook is properly imported
   - Check if toast provider is set up in app root
   - Ensure success/error messages are properly triggered

### Analytics Management Issues

1. **"column l.client_id does not exist" error**
   - This means the locations table is missing the client_id column
   - Run the SQL from `docs/FIX_ANALYTICS_SCHEMA.sql` in your Supabase SQL Editor
   - This will add the missing client_id, restaurant_id, and status columns to the locations table
   - Refresh the page after running the fix

2. **"invalid input syntax for type uuid" or "operator does not exist: uuid = character varying" error**
   - This indicates a type mismatch between UUID and VARCHAR columns
   - **Quick Fix**: Run the SQL from `docs/QUICK_FIX_ANALYTICS.sql` in your Supabase SQL Editor
   - This script will:
     - Check existing column types
     - Add missing columns with correct types
     - Safely update data without type conflicts
     - Create necessary indexes
   - Refresh the page after running the fix

3. **"No analytics data loading"**
   - Verify mock data is properly defined in useAnalyticsManager.ts
   - Check client ID is correctly set
   - Ensure component is properly mounted

4. **Filters not working**
   - Check filter state management in AnalyticsManager.tsx
   - Verify time range options are correctly handled
   - Ensure custom date range validation works

5. **Charts not displaying**
   - Verify trend data structure matches expected format
   - Check if data arrays are properly populated
   - Ensure chart components handle empty data gracefully

6. **Performance issues**
   - Check if multiple API calls are being made unnecessarily
   - Verify loading states are properly managed
   - Ensure data fetching is optimized

## Mock vs Production Differences

### Mock Mode Behavior
- ✅ Instant responses with simulated delays
- ✅ Predefined data sets for testing
- ✅ No actual database operations
- ✅ All CRUD operations work but don't persist
- ✅ Realistic error simulation
- ✅ Complete UI functionality testing

### Production Mode Behavior
- 🔄 Real API calls to Supabase Edge Functions
- 🔄 Actual database operations with RLS
- 🔄 Real authentication and authorization
- 🔄 Persistent data changes
- 🔄 Network latency and potential failures
- 🔄 Audit logging and compliance tracking

## Performance Notes

- Mock mode responses include realistic delays (600-1000ms)
- Production mode will have actual network latency
- Large datasets may require pagination optimization
- Consider implementing client-side caching for frequently accessed data

## Security Considerations

- Mock mode bypasses all authentication checks
- Production mode enforces RLS policies
- Ensure sensitive data is not exposed in mock responses
- Test role-based access control thoroughly in production

The mock mode provides a complete testing environment that mirrors the production functionality exactly across all management systems including the new analytics dashboard.

## Testing POS Operations

### Access POS Operations
1. Navigate to the main dashboard
2. Click on the "POS Operations" tab
3. You'll see a comprehensive POS interface with 4 main sections

### Test Customer Lookup
1. Go to the "Customer Lookup" tab
2. Try searching with different criteria:
   - QR Code: Enter any text (e.g., "QR_12345")
   - Phone: Enter a phone number (e.g., "+1-555-0123")
   - Email: Enter an email (e.g., "test@example.com")
3. Click "Search Customer"
4. Mock results will appear 70% of the time
5. Click on a customer result to select them

### Test Customer Registration
1. Go to the "Register" tab
2. **Option A - QR Code Registration:**
   - Enter a QR code (e.g., "QR_EXISTING_123")
   - Click "Register Customer"
   - 30% chance it finds an existing customer
   - 70% chance it prompts for new customer data
3. **Option B - New Customer Registration:**
   - Leave QR code empty
   - Fill in customer details:
     - Name: "John Doe"
     - Phone: "+1-555-0123"
     - Email: "john@example.com"
   - Click "Register Customer"
   - New customer will be created and selected

### Test Adding Stamps
1. Go to the "Add Stamps" tab
2. If no customer is selected, enter a customer ID manually
3. Select stamps to award (1-10)
4. Optionally add purchase amount and notes
5. Click "Add Stamps"
6. Mock response shows:
   - Stamp record created
   - Updated customer totals
   - Available rewards calculation

### Test Reward Redemption
1. Go to the "Redeem Reward" tab
2. If no customer is selected, enter a customer ID manually
3. Select a reward type from the dropdown
4. Choose stamps to redeem (10 or 20)
5. Click "Redeem Reward"
6. Mock response shows:
   - Reward record created
   - Remaining stamps calculation
   - Success confirmation

### Test Customer Selection Flow
1. Use Customer Lookup to find a customer
2. Click on a search result to select them
3. Notice the green "Selected Customer" card appears
4. Switch to other tabs - customer ID is auto-filled
5. Use "Clear Selection" to reset

### Mock Data Features
- **Realistic Data**: Names, emails, phones, QR codes
- **Stamp Calculations**: Proper totals and reward eligibility
- **API Delays**: Simulated loading states (600ms-1000ms)
- **Success Rates**: 70% success for lookups, 100% for operations
- **Toast Notifications**: Success/error messages
- **Loading States**: Proper button states and spinners

### Expected Behaviors
- **Location Context**: Shows "Main Street Store" as current location
- **Customer Selection**: Persists across tabs until cleared
- **Form Validation**: Required fields enforced
- **Error Handling**: Graceful error messages
- **Audit Trail**: All operations logged (in production)

### Security Testing
- **Permission Checks**: Staff can only operate in assigned locations
- **Data Validation**: Stamp limits, reward eligibility
- **Customer Verification**: Active status, correct client
- **Audit Logging**: All operations tracked with staff ID

### Production Readiness
- Set `MOCK_MODE = false` in `usePOSOperations.ts`
- Deploy Edge Function to Supabase
- Run database migration for RLS policies
- Configure staff permissions
- Test with real authentication tokens 
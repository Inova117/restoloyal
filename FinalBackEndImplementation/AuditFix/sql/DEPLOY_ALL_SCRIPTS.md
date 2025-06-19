# 🚀 SQL Scripts Deployment Guide

## 🚨 IMPORTANT: Use the Minimal Fix Approach

Your database has some existing tables but is missing key columns and relationships. **DO NOT** run the original complex scripts - they will cause errors.

## ✅ RECOMMENDED DEPLOYMENT ORDER

### Step 1: Diagnose Current Schema
```sql
-- Run this first to see what you currently have
-- File: DIAGNOSE_CURRENT_SCHEMA.sql
```
This will show you exactly what tables and columns exist in your database.

### Step 2: Apply Minimal Fix
```sql
-- Run this to safely add missing columns and tables
-- File: MINIMAL_FIX_SCHEMA.sql
```
This script will:
- ✅ Add missing columns to existing tables (safely)
- ✅ Create missing tables without breaking existing data
- ✅ Populate default relationships
- ✅ Create performance indexes
- ✅ Preserve all your existing data

### Step 3: Verify Everything Works
```sql
-- Run the diagnostic again to confirm everything is fixed
-- File: DIAGNOSE_CURRENT_SCHEMA.sql
```

## 🔧 HOW TO RUN IN SUPABASE

1. **Go to Supabase Dashboard** → Your Project → SQL Editor

2. **Create New Query** and paste the content of `DIAGNOSE_CURRENT_SCHEMA.sql`

3. **Click "Run"** - This will show you what you currently have

4. **Create Another New Query** and paste the content of `MINIMAL_FIX_SCHEMA.sql`

5. **Click "Run"** - This will safely fix your schema

6. **Run the diagnostic again** to verify everything is working

## ❌ DO NOT RUN THESE (They will cause errors):
- ~~01-customer-management-tables.sql~~ 
- ~~02-staff-management-tables.sql~~
- ~~03-base-hierarchy-tables.sql~~
- ~~00-run-all-setup.sql~~

These scripts assume a completely fresh database and will conflict with your existing schema.

## 🎯 What the Minimal Fix Does

### Missing Columns Added:
- `customers.client_id` (with automatic population from locations)
- `customers.location_id` (if missing)
- `customers.qr_code` (auto-generated for existing customers)
- `customers.total_stamps` (defaults to 0)
- `customers.total_visits` (defaults to 0)
- `customers.status` (defaults to 'active')

### Missing Tables Created:
- `clients` (with default "Default Restaurant" entry)
- `locations` (with default "Main Location" entry)
- `location_staff` (empty, ready for staff creation)
- `stamps` (empty, ready for loyalty tracking)
- `rewards` (empty, ready for reward redemptions)

### Relationships Fixed:
- All existing customers linked to default client/location
- Foreign key constraints properly established
- Performance indexes created

## 🔄 After Running the Fix

1. **Your existing customers data will be preserved** ✅
2. **All missing relationships will be established** ✅
3. **Your Edge Functions will work** ✅
4. **You can disable MOCK_MODE in your frontend** ✅

## 🆘 If You Get Errors

If you still get errors after running the minimal fix:

1. **Copy the exact error message**
2. **Run the diagnostic script again**  
3. **Show me the results** - I'll create an even more targeted fix

The minimal fix approach is designed to work with **any** existing schema state and safely bring it up to the required standard without breaking anything. 
# ZerionCore Restaurant Loyalty Platform - Access Guide

## Platform Structure

**ZerionCore** is the platform provider that manages multiple restaurant clients.
**Galletti** is the first client - a restaurant chain with multiple brands.

## Test Accounts & Access Levels

### 1. ZerionCore Platform Admin (You - Platform Owner)
- **Email**: `martin@zerionstudio.com`
- **Access**: Complete platform management
- **Can See**: All clients, all restaurants, all data
- **Features**: 
  - Client management
  - Platform analytics
  - Revenue tracking across all clients
  - Platform settings

### 2. Galletti Corporate HQ (Your First Client)
- **Email**: `admin@galletti.com`
- **Access**: All Galletti restaurants and brands
- **Can See**: All Galletti brands (Pizza Palace, Burger Kingdom, etc.)
- **Features**:
  - Corporate dashboard
  - Multi-brand management
  - Consolidated analytics
  - Location management

### 3. Restaurant Owner (Individual Restaurant)
- **Email**: Any user who creates a restaurant
- **Access**: Their specific restaurant and locations
- **Can See**: Their restaurant data only
- **Features**:
  - Customer management
  - Loyalty program management
  - Analytics for their restaurant
  - Location management

### 4. Location Staff (Point of Sale)
- **Email**: Default role for other users
- **Access**: Simple POS interface
- **Can See**: Customer lookup and stamp management
- **Features**:
  - QR code scanning
  - Add stamps
  - Redeem rewards
  - Customer search

## Quick Setup Instructions

1. **Run Database Setup**:
   - Copy the contents of `database-setup.sql`
   - Paste into your Supabase SQL Editor
   - Execute the script

2. **Test the Platform**:
   - Login with your existing account: `martin@zerionstudio.com`
   - You'll automatically get ZerionCore admin access
   - Create `admin@galletti.com` account to test Galletti HQ dashboard
   - Any other account will be restaurant owner or location staff

## Platform Hierarchy

```
ZerionCore Platform (admin@zerioncore.com)
├── Galletti Restaurant Group (admin@galletti.com)
│   ├── Pizza Palace (47 restaurants, 312 locations)
│   ├── Burger Kingdom
│   ├── Taco Fiesta
│   ├── Sushi Express
│   ├── Coffee Corner
│   └── Healthy Bowls
├── Demo Pizza Palace (demo@pizzapalace.com)
└── Test Burger Kingdom (admin@burgerkingdom.com)
```

## Database Structure

The platform now supports:
- **Multi-client architecture** (platform_clients table)
- **Multi-brand restaurants** (restaurants with client_id)
- **Multi-location support** (locations table)
- **Hierarchical access control** (role-based RLS policies)
- **Comprehensive analytics** (cross-client reporting)

## URLs to Share

- **ZerionCore Admin**: Login with `martin@zerionstudio.com` to see the full platform
- **Galletti HQ**: Create and login with `admin@galletti.com` to see the corporate dashboard
- **Restaurant Owner**: Create any other account to see individual restaurant management
- **Location Staff**: Default role shows the POS interface

## Features by Role

| Feature | ZerionCore | Galletti HQ | Restaurant Owner | Location Staff |
|---------|------------|-------------|------------------|----------------|
| Platform Management | ✅ | ❌ | ❌ | ❌ |
| All Client Data | ✅ | ❌ | ❌ | ❌ |
| Client Analytics | ✅ | ✅ | ❌ | ❌ |
| Multi-Brand View | ✅ | ✅ | ❌ | ❌ |
| Restaurant Management | ✅ | ✅ | ✅ | ❌ |
| Customer Management | ✅ | ✅ | ✅ | ✅ |
| POS Operations | ✅ | ❌ | ✅ | ✅ |

This structure allows you (ZerionCore) to manage the entire platform while giving Galletti corporate-level access to their restaurant empire, and individual restaurant owners access to their specific locations. 
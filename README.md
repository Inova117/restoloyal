# 🍽️ RestaurantLoyalty - Multi-Tenant Loyalty Platform

> **Enterprise-grade multi-tenant restaurant loyalty management system with 4-tier hierarchical access control**

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.11-blue.svg)](https://tailwindcss.com/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)]()

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [🏗️ System Architecture](#️-system-architecture)
- [🔧 Recent Major Fixes](#-recent-major-fixes)
- [✨ Features](#-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [🚀 Installation](#-installation)
- [🧪 Testing](#-testing)
- [📁 Project Structure](#-project-structure)
- [🔐 Security](#-security)
- [📋 Known Issues](#-known-issues)
- [🤝 Contributing](#-contributing)

## 🎯 Overview

 Fydely is a comprehensive multi-tenant restaurant loyalty management platform designed for enterprise-scale operations. The system supports complex hierarchical access control, enabling platform owners to manage multiple restaurant chains, each with their own corporate headquarters, individual locations, and staff members.

### Key Capabilities:
- **Multi-Tenant Architecture**: Complete data isolation between clients
- **4-Tier Hierarchical Access**: Platform → Client → Restaurant → Location
- **Role-Based Access Control**: Granular permissions and role switching
- **Real-Time Operations**: Live POS interface and customer management
- **Corporate Management**: Multi-location oversight and analytics
- **Scalable Infrastructure**: Built for enterprise deployment

## 🏗️ System Architecture

### 4-Tier Hierarchy

#### Tier 1: ZerionCore Platform (`zerion_admin`)
- **Platform Owners & Super Administrators**
- Complete system oversight and management
- Client creation, deletion, and management
- Cross-tenant impersonation capabilities
- Platform-wide analytics and configuration
- **Access**: All clients, all features

#### Tier 2: Client Admin (`galletti_hq` / `client_admin`)
- **Restaurant Chain Corporate Headquarters**
- Multi-location management dashboard
- Staff management across all locations
- Corporate analytics and brand settings
- Location-specific configuration
- **Access**: All locations within client

#### Tier 3: Restaurant Owner (`restaurant_owner`)
- **Individual Restaurant Owners**
- Single location management
- Customer and loyalty program management
- Location-specific analytics
- Staff management for owned location
- **Access**: Owned restaurant only

#### Tier 4: Location Staff (`location_staff`)
- **Point-of-Sale Interface**
- Customer check-in and stamp management
- Basic customer operations
- Transaction processing
- **Access**: POS operations only

### Role Detection & Switching

The system implements sophisticated role detection with multiple fallback mechanisms:

```typescript
// Role Detection Priority:
1. force_location_staff (return from client admin)
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

## 🔧 Recent Major Fixes

### ✅ React Error #310 Resolution (December 2024)
**Issue**: "Rendered more hooks than during the previous render" in production builds
**Root Cause**: Multiple conditional returns after hooks execution violated React's Rules of Hooks
**Solution**: Replaced conditional returns with single return statement using conditional JSX

```typescript
// ❌ Before (problematic)
if (role === 'zerion_admin') return <ZerionLayout />;
if (role === 'galletti_hq') return <GallettiLayout />;

// ✅ After (fixed)
return (
  <div>
    {role === 'zerion_admin' && <ZerionLayout />}
    {role === 'galletti_hq' && <GallettiLayout />}
  </div>
);
```

### ✅ Client Admin Access Implementation
**Issue**: Users with `client_admin` metadata couldn't access Tier 2 dashboard
**Solution**: Enhanced role detection with metadata fallback and manual access controls

**Features Added**:
- "Client Dashboard" button in staff view (Crown icon)
- "Back to Staff View" button in client dashboard
- Session storage flags: `force_client_admin` and `force_location_staff`
- Seamless role switching without authentication issues

### ✅ UX Flash Prevention
**Issue**: Momentary empty panels during role transitions
**Solution**: Defensive clamping pattern in tab management

```typescript
// Prevents flash when tabs are recomputed
<Tabs value={availableTabs.includes(activeTab) ? activeTab : availableTabs[0]}>
```

### ✅ Client Deletion Bug Fix
**Issue**: Deleted clients remained in database causing constraint errors on recreation
**Solution**: 
- Updated Edge Function to handle both CREATE and DELETE operations
- Proper foreign key constraint handling (delete user_roles first, then platform_clients)
- Database cleanup procedures

## ✨ Features

### 🔐 Authentication & Authorization
- **Supabase Auth Integration**: Email/password, social logins
- **Role-Based Access Control**: Granular permissions per tier
- **Row-Level Security**: Database-level data isolation
- **Session Management**: Secure role switching and context preservation
- **Multi-Factor Authentication**: Enterprise security standards

### 🏢 Multi-Tenant Management
- **Client Lifecycle**: Creation, configuration, deletion
- **User Role Assignment**: Dynamic role management
- **Hierarchical Data Access**: Proper data isolation
- **Cross-Tenant Impersonation**: Admin oversight capabilities
- **Audit Trails**: Complete action logging

### 🎯 Loyalty Program
- **Digital Stamp Collection**: QR-based customer engagement
- **Automated Rewards**: Threshold-based reward triggers
- **Customer Management**: Complete customer lifecycle
- **Analytics & Reporting**: Performance insights
- **Customizable Programs**: Per-location configuration

### 💳 Point of Sale (POS)
- **Customer Check-In**: Quick customer identification
- **Stamp Issuance**: Transaction-based stamp allocation
- **Reward Redemption**: Instant reward processing
- **Transaction History**: Complete audit trail
- **Offline Capability**: Local storage fallbacks

### 📊 Corporate Dashboard
- **Multi-Location Overview**: Centralized management
- **Staff Access Control**: Granular permission management
- **Performance Analytics**: Cross-location insights
- **Brand Configuration**: Corporate settings management
- **Operating Hours**: Location-specific scheduling

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript strict mode
- **Vite** for lightning-fast development
- **Tailwind CSS** with custom design system
- **Shadcn/UI** for consistent components
- **Lucide React** for iconography
- **TanStack Query** for server state management

### Backend
- **Supabase** (PostgreSQL + Auth + Storage + Edge Functions)
- **Row-Level Security** for multi-tenant data isolation
- **Edge Functions** for serverless business logic
- **Real-Time Subscriptions** for live updates

### Development & Deployment
- **TypeScript** for type safety
- **ESLint** for code quality
- **Netlify** for frontend deployment
- **Supabase** for backend infrastructure

## 🚀 Installation

### Prerequisites
```bash
Node.js 18+
npm or yarn
Supabase account
```

### Quick Start
```bash
# Clone repository
git clone [repository-url]
cd RestaurantLoyalty

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Configure Supabase credentials

# Start development
npm run dev
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🧪 Testing

### Test User Accounts
- **ZerionCore Admin**: `martin@zerionstudio.com`
- **Client Admin**: Users with `client_admin` in user metadata
- **Restaurant Owner**: Users with restaurant ownership records
- **Location Staff**: Default role for authenticated users

### Test Scenarios
1. **Role Switching**: Navigate between all 4 tiers
2. **Client Management**: Create/delete clients from platform
3. **Staff Operations**: POS interface and customer management
4. **Corporate Features**: Multi-location management and analytics

### Debug Information
The system provides comprehensive console logging for role detection:
```typescript
console.log('Role detection debug:', {
  userEmail: user.email,
  forceClientAdmin,
  forceLocationStaff,
  userMetadata: user.user_metadata,
  detectedRole: role
});
```

## 📁 Project Structure

```
RestaurantLoyalty/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── ui/                 # Shadcn/UI base components
│   │   ├── ZerionPlatformDashboard.tsx
│   │   ├── GallettiHQDashboard.tsx
│   │   ├── POSInterface.tsx
│   │   └── ...
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/                  # Custom hooks
│   │   └── useUserRole.ts      # Role detection & management
│   ├── integrations/           # External services
│   │   └── supabase/
│   ├── lib/                    # Utilities
│   ├── pages/                  # Main pages
│   │   └── Index.tsx           # Application router
│   └── styles/                 # Global styles
├── supabase/
│   ├── functions/              # Edge Functions
│   │   ├── create-client-with-user-v2/
│   │   ├── customer-manager/
│   │   └── ...
│   └── migrations/             # Database schema
├── docs/                       # Documentation
│   ├── CLIENT_ADMIN_ACCESS_IMPLEMENTED.md
│   ├── BACK_TO_STAFF_VIEW_FIXED.md
│   ├── REACT_ERROR_310_SOLUTION.md
│   └── ...
└── README.md
```

## 🔐 Security

### Authentication
- **Multi-Factor Authentication** support
- **Secure session management** with JWT tokens
- **Email verification** for account activation
- **Password policies** and strength requirements

### Authorization
- **Role-based permissions** with granular control
- **Row-level security** for data isolation
- **API endpoint protection** with middleware
- **Cross-tenant isolation** preventing data leaks

### Data Protection
- **Encryption at rest** for sensitive data
- **HTTPS enforcement** for all communications
- **Input sanitization** preventing injection attacks
- **Audit logging** for compliance requirements

## 📋 Known Issues

### Current Limitations
- **Edge Function Deployment**: Requires manual intervention via Supabase dashboard
- **Demo Data**: Some features use localStorage for demonstration
- **Real-Time Sync**: Limited real-time synchronization in some areas

### Planned Improvements
- **Real-Time Notifications**: WebSocket-based live updates
- **Advanced Analytics**: Enhanced reporting and insights
- **Mobile App**: Native iOS/Android applications
- **Apple Wallet Integration**: Digital loyalty cards

## 🤝 Contributing

### Development Workflow
1. **Feature Branch**: Create from main branch
2. **Implementation**: Follow TypeScript strict mode
3. **Testing**: Verify across all user roles
4. **Documentation**: Update relevant docs
5. **Pull Request**: Submit for review

### Code Standards
- **TypeScript Strict Mode**: No `any` types
- **ESLint Compliance**: Follow configured rules
- **Component Documentation**: JSDoc for complex components
- **Security First**: Follow OWASP guidelines

### Debugging Tips
1. **Check Console Logs**: Role detection provides detailed logging
2. **Verify Session Storage**: Check force flags and context
3. **Test Role Switching**: Verify all tier transitions
4. **Database Inspection**: Use Supabase dashboard for data verification

---

## 📞 Support & Documentation

### Additional Documentation
- [Client Admin Access Implementation](./CLIENT_ADMIN_ACCESS_IMPLEMENTED.md)
- [React Error #310 Solution](./REACT_ERROR_310_SOLUTION.md)
- [Back to Staff View Fix](./BACK_TO_STAFF_VIEW_FIXED.md)
- [UX Flash Fix](./UX_FLASH_FIX_IMPLEMENTED.md)
- [Client Deletion Bug Fix](./CLIENT_DELETION_BUG_FIXED.md)

### Getting Help
1. **Check Documentation**: Review relevant .md files
2. **Console Debugging**: Enable verbose logging
3. **Role Verification**: Test with different user types
4. **Database Check**: Verify data integrity in Supabase

---

**Last Updated**: December 2024  
**Version**: 2.1.0  
**Status**: Production Ready  
**Maintainer**: ZerionStudio Team 
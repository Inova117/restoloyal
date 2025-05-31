# 🍽️ RestaurantLoyalty - Digital Loyalty Program Platform

> **A modern, QR-code based loyalty program management system for restaurants and businesses**

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.11-blue.svg)](https://tailwindcss.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [API Structure](#api-structure)
- [Component Structure](#component-structure)
- [Roadmap](#roadmap)
- [Business Model](#business-model)
- [Contributing](#contributing)

## 🎯 Overview

RestaurantLoyalty is a comprehensive digital loyalty program platform that enables restaurants to manage customer retention through a modern stamp-based reward system. The platform features QR code generation, real-time stamp tracking, automated reward management, and a beautiful admin dashboard.

### 🎪 What it does:
- **Multi-tenant Restaurant Management**: Each restaurant gets their own isolated loyalty program
- **QR-Based Customer Registration**: Automatic QR code generation for each customer
- **Digital Stamp Collection**: Track customer visits and purchases through stamp accumulation
- **Automated Reward System**: Automatic eligibility detection and reward redemption
- **Real-time Dashboard**: Live analytics and customer management interface
- **Mobile-First Design**: Responsive UI optimized for tablets and mobile devices

## ✨ Features

### 🏪 Restaurant Management
- **Multi-tenant Architecture**: Isolated data per restaurant using Supabase RLS
- **Custom Branding**: Configurable restaurant name, stamps required, reward descriptions
- **Real-time Analytics**: Live dashboard with client count, total stamps, and reward-ready customers

### 👥 Customer Management
- **Easy Registration**: Simple form-based customer onboarding
- **QR Code Generation**: Unique QR codes for each customer (`QR{timestamp}{random}`)
- **Progress Tracking**: Visual stamp progress with animated progress bars
- **Contact Information**: Store customer email and phone for marketing

### 🎫 Stamp & Reward System
- **QR Code Scanning**: Manual QR input or simulated scanning functionality
- **Automatic Stamp Counting**: Real-time stamp increment with database triggers
- **Reward Eligibility**: Automatic detection when customers reach stamp threshold
- **Reward Redemption**: One-click reward redemption with stamp reset
- **Audit Trail**: Complete history of stamps and rewards in dedicated tables

### 🎨 User Interface
- **Modern Design**: Clean, professional interface using Shadcn/UI components
- **Responsive Layout**: Mobile-first design that works on all devices
- **Real-time Updates**: Live data refresh without page reloads
- **Interactive Components**: Animated progress bars, toast notifications, loading states
- **Accessibility**: ARIA-compliant components with keyboard navigation

## 🏗️ Architecture

### Frontend Architecture
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn/UI base components
│   ├── AddClientDialog.tsx    # Customer registration modal
│   ├── AddStampDialog.tsx     # QR scanning and stamp addition
│   ├── ClientList.tsx         # Customer list with actions
│   ├── StampProgress.tsx      # Visual progress indicator
│   └── ProtectedRoute.tsx     # Authentication wrapper
├── contexts/            # React Context providers
│   └── AuthContext.tsx        # Supabase authentication
├── hooks/               # Custom React hooks
├── integrations/        # External service integrations
│   └── supabase/             # Database client and types
├── lib/                 # Utility functions
├── pages/               # Main application pages
│   ├── Auth.tsx              # Login/signup page
│   ├── Index.tsx             # Main dashboard
│   └── NotFound.tsx          # 404 error page
└── App.tsx              # Root application component
```

### Backend Architecture (Supabase)
```
Database Tables:
├── restaurants          # Restaurant profiles and settings
├── clients             # Customer information and QR codes
├── stamps              # Individual stamp records
├── rewards             # Reward redemption history
└── user_roles          # User permission management

Database Functions:
├── RLS Policies        # Row-level security for multi-tenancy
├── Triggers            # Auto-increment stamps, reward detection
└── Edge Functions      # Future: Apple Wallet, geo-push notifications
```

## 🗄️ Database Schema

### Tables Structure

#### `restaurants`
```sql
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  stamps_required INTEGER DEFAULT 10,
  reward_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `clients`
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  qr_code TEXT UNIQUE NOT NULL,
  stamps INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `stamps`
```sql
CREATE TABLE stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  restaurant_id UUID REFERENCES restaurants(id),
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `rewards`
```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  restaurant_id UUID REFERENCES restaurants(id),
  redeemed_by UUID REFERENCES auth.users(id),
  stamps_used INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Database Triggers
- **Auto-increment stamps**: Automatically updates client stamp count when new stamp is added
- **Reward detection**: Triggers notifications when customers become eligible for rewards
- **Audit logging**: Maintains complete history of all transactions

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - Modern React with hooks and concurrent features
- **TypeScript 5.5.3** - Type-safe development
- **Vite 5.4.1** - Fast build tool and dev server
- **React Router 6.26.2** - Client-side routing
- **TanStack Query 5.56.2** - Server state management

### UI Framework
- **Tailwind CSS 3.4.11** - Utility-first CSS framework
- **Shadcn/UI** - High-quality React components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library
- **Recharts 2.12.7** - Data visualization (future analytics)

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database with real-time subscriptions
  - Row-level security (RLS) for multi-tenancy
  - Built-in authentication and authorization
  - Edge Functions for serverless computing

### Development Tools
- **ESLint** - Code linting and formatting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🚀 Installation

### Prerequisites
- Node.js 18+ or Bun
- Supabase account
- Git

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd RestaurantLoyalty
```

2. **Install dependencies**
```bash
# Using npm
npm install

# Using bun (recommended)
bun install
```

3. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env.local

# Configure Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Database Setup**
- Create a new Supabase project
- Run the SQL migrations in `supabase/migrations/`
- Configure Row Level Security (RLS) policies
- Set up authentication providers

5. **Start Development Server**
```bash
# Using npm
npm run dev

# Using bun
bun dev
```

6. **Build for Production**
```bash
# Using npm
npm run build

# Using bun
bun run build
```

## 📱 Usage

### For Restaurant Owners

1. **Initial Setup**
   - Sign up/login to create restaurant account
   - Configure restaurant details (name, stamps required, reward description)

2. **Customer Registration**
   - Click "Add Client" to register new customers
   - Fill in customer details (name, email, phone)
   - System automatically generates unique QR code

3. **Stamp Management**
   - Use "Add Stamp" to scan customer QR codes
   - Manual QR code entry or simulated scanning
   - Real-time stamp count updates

4. **Reward Redemption**
   - Monitor "Ready for Rewards" dashboard section
   - One-click reward redemption for eligible customers
   - Automatic stamp count reset after redemption

### For Customers (Future Mobile App)
- Receive QR code upon registration
- Show QR code for stamp collection
- Track progress toward rewards
- Receive notifications when rewards are ready

## 🔌 API Structure

### Supabase Client Integration
```typescript
// Client initialization
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)
```

### Key API Operations
```typescript
// Add new client
const { data, error } = await supabase
  .from('clients')
  .insert({
    restaurant_id: restaurantId,
    name: clientName,
    email: clientEmail,
    qr_code: generatedQRCode
  })

// Add stamp
const { error } = await supabase
  .from('stamps')
  .insert({
    client_id: clientId,
    restaurant_id: restaurantId,
    added_by: userId
  })

// Redeem reward
const { error } = await supabase
  .from('rewards')
  .insert({
    client_id: clientId,
    restaurant_id: restaurantId,
    redeemed_by: userId,
    stamps_used: stampCount
  })
```

## 🧩 Component Structure

### Core Components

#### `Index.tsx` - Main Dashboard
- Restaurant overview with key metrics
- Tabbed interface (Dashboard/Clients)
- Quick action buttons
- Real-time data fetching

#### `ClientList.tsx` - Customer Management
- Grid layout of customer cards
- Individual stamp progress tracking
- Add stamp and redeem reward actions
- Responsive design for mobile/tablet

#### `AddClientDialog.tsx` - Customer Registration
- Modal form for new customer registration
- QR code generation logic
- Form validation and error handling
- Success notifications

#### `AddStampDialog.tsx` - Stamp Addition
- QR code scanning interface
- Customer lookup by QR code
- Stamp addition with progress feedback
- Simulated scanning functionality

#### `StampProgress.tsx` - Progress Visualization
- Animated progress bar
- Individual stamp indicators
- Completion state animations
- Responsive sizing options

## 🗺️ Development Roadmap

### ✅ **COMPLETED PHASES**

#### **Phase 1: Core Platform (100% Complete)**
**Timeline: Completed**
- ✅ Multi-tenant restaurant management with Supabase RLS
- ✅ QR-based customer registration and tracking system
- ✅ Digital stamp collection with automated counting
- ✅ Automated reward detection and redemption
- ✅ Real-time admin dashboard with live updates
- ✅ Apple Wallet integration with live stamp updates
- ✅ GeoPush notifications with OneSignal integration
- ✅ Complete authentication and authorization system

**Business Impact**: Core loyalty program functionality enabling restaurants to manage digital stamp cards with Apple Wallet integration and location-based notifications.

#### **Phase 2: Advanced Analytics (100% Complete)**
**Timeline: Completed**
- ✅ Customer behavior analytics and insights dashboard
- ✅ Retention tracking with cohort analysis
- ✅ Engagement scoring and AI-powered recommendations
- ✅ Advanced reporting with data export capabilities
- ✅ Performance optimization with database views and indexes
- ✅ Multi-dimensional analytics (Overview, Customer, Engagement, Retention, Cohort)

**Business Impact**: Enterprise-level analytics providing actionable insights for customer retention and business optimization.

#### **Phase 3: Referral Engine (100% Complete)**
**Timeline: Completed**
- ✅ Customer referral program management system
- ✅ Automated referral tracking and qualification
- ✅ Unique referral code generation (e.g., "REFJOH1234")
- ✅ Comprehensive referral analytics and reporting
- ✅ Flexible reward configuration (stamps, discounts, free items)
- ✅ Manual processing capabilities for special cases

**Business Impact**: Customer acquisition engine enabling viral growth through automated referral programs with smart qualification and reward distribution.

#### **Phase 4: Multi-Location Franchise Management (100% Complete)**
**Timeline: Completed**
- ✅ Location hierarchy and management system
- ✅ Cross-location customer tracking and mobility analytics
- ✅ Staff management with role-based permissions per location
- ✅ Location-specific analytics and performance comparison
- ✅ Centralized franchise oversight with drill-down capabilities
- ✅ Individual location settings and branding customization

**Business Impact**: Enterprise franchise management enabling restaurant chains to manage multiple locations with unified customer loyalty across all sites.

#### **Phase 6.1: Galletti HQ Interface (100% Complete)**
**Timeline: Completed**
- ✅ Corporate management platform for multiple restaurant brands
- ✅ Franchise-wide statistics and consolidated analytics
- ✅ Brand hierarchy management (Corporate → Brands → Franchises → Locations)
- ✅ Corporate staff management with role-based permissions
- ✅ Enterprise billing system with usage tracking
- ✅ Corporate branding control and brand portfolio management
- ✅ Advanced data export and executive reporting
- ✅ Dashboard comparison across brands and performance metrics

**Business Impact**: Transform platform from franchise management to corporate restaurant management, enabling companies like Galletti to manage hundreds of independent restaurant brands from a single interface.

---

### 🚧 **ACTIVE DEVELOPMENT**

#### **Phase 5: Platform Expansion (In Planning)**
**Timeline: Q1-Q2 2024**
**Priority: High**

##### **5.1 Customer Mobile App** 🔄
- **React Native app** for iOS and Android
- Customer-facing loyalty card management
- QR code scanning for self-service stamp collection
- Push notifications for rewards and promotions
- Social sharing and referral features
- Apple Wallet and Google Pay integration

##### **5.2 POS System Integrations** 🔄
- **Square Integration**: Automatic stamp addition on purchase
- **Toast Integration**: Real-time transaction sync
- **Clover Integration**: Point-of-sale loyalty automation
- **Generic API**: Webhook-based integration for any POS
- **Revenue Tracking**: Link loyalty data to actual sales

##### **5.3 Advanced Marketing Automation** 🔄
- **Email Campaigns**: Automated email sequences based on customer behavior
- **SMS Marketing**: Text message campaigns for promotions and reminders
- **Behavioral Triggers**: Smart campaigns based on visit patterns
- **A/B Testing**: Campaign optimization with performance tracking
- **Customer Segmentation**: Advanced targeting based on analytics data

##### **5.4 Social Media Integration** 🔄
- **Instagram Integration**: Social media check-ins for bonus stamps
- **Facebook Integration**: Social sharing rewards
- **TikTok Integration**: User-generated content campaigns
- **Social Analytics**: Track social media impact on loyalty

---

### 🔮 **FUTURE PHASES**

#### **Phase 6: Enterprise Features (Q3-Q4 2024)**
**Priority: Medium-High**

##### **6.2 White-Label Platform** 
- **Complete Rebrandable Solution**: Custom branding for resellers
- **Multi-Brand Management**: Manage multiple restaurant brands
- **Reseller Dashboard**: Partner management and revenue sharing
- **Custom Domain Support**: Branded URLs for enterprise clients

##### **6.3 Advanced Security & Compliance**
- **SOC2 Type II Compliance**: Enterprise-grade security certification
- **GDPR Compliance**: European data protection compliance
- **PCI DSS Compliance**: Payment card industry security standards
- **Advanced Audit Logging**: Comprehensive security monitoring

##### **6.4 Enterprise API Platform**
- **GraphQL API**: Modern API for complex integrations
- **Webhook System**: Real-time event notifications
- **SDK Development**: JavaScript, Python, and PHP SDKs
- **API Documentation**: Comprehensive developer portal

#### **Phase 7: AI & Machine Learning (2025)**
**Priority: Medium**

##### **7.1 Predictive Analytics**
- **Customer Lifetime Value Prediction**: AI-powered CLV forecasting
- **Churn Prediction**: Identify at-risk customers before they leave
- **Optimal Reward Timing**: AI-driven reward recommendation engine
- **Demand Forecasting**: Predict busy periods and customer flow

##### **7.2 Personalization Engine**
- **Dynamic Rewards**: Personalized rewards based on customer preferences
- **Smart Recommendations**: AI-powered menu and offer suggestions
- **Behavioral Targeting**: Machine learning-driven customer segmentation
- **Predictive Messaging**: Optimal timing and content for communications

#### **Phase 8: Global Expansion (2025-2026)**
**Priority: Low-Medium**

##### **8.1 International Features**
- **Multi-Currency Support**: Global payment processing
- **Multi-Language Interface**: Localization for international markets
- **Regional Compliance**: Local data protection and business regulations
- **Time Zone Management**: Global restaurant chain support

##### **8.2 Advanced Integrations**
- **Delivery Platform Integration**: UberEats, DoorDash, Grubhub loyalty
- **Reservation Systems**: OpenTable and Resy integration
- **Accounting Software**: QuickBooks and Xero integration
- **CRM Systems**: Salesforce and HubSpot integration

---

### 📊 **CURRENT PLATFORM STATUS**

| Feature Category | Completion | Status |
|------------------|------------|--------|
| **Core Loyalty System** | 100% | ✅ Production Ready |
| **Apple Wallet Integration** | 100% | ✅ Production Ready |
| **GeoPush Notifications** | 100% | ✅ Production Ready |
| **Advanced Analytics** | 100% | ✅ Production Ready |
| **Referral Engine** | 100% | ✅ Production Ready |
| **Multi-Location Management** | 100% | ✅ Production Ready |
| **Customer Mobile App** | 0% | 🔄 Planning Phase |
| **POS Integrations** | 0% | 🔄 Planning Phase |
| **Marketing Automation** | 0% | 🔄 Planning Phase |
| **Galletti HQ Interface** | 100% | ✅ Completed |

---

### 🎯 **BUSINESS PRIORITIES**

#### **Immediate Focus (Next 3 Months)**
1. **Customer Mobile App Development** - Highest ROI for customer engagement
2. **Square POS Integration** - Most requested feature by restaurant partners
3. **Email Marketing Automation** - Essential for customer retention

#### **Medium-Term Goals (3-6 Months)**
1. **Additional POS Integrations** (Toast, Clover)
2. **SMS Marketing Platform**
3. **Social Media Integrations**

#### **Long-Term Vision (6-12 Months)**
1. **White-Label Platform** for reseller partnerships
2. **Enterprise Security Compliance** (SOC2, GDPR, PCI DSS)
3. **AI-Powered Personalization** engine
4. **Advanced API Platform** with GraphQL and SDKs

---

### 💡 **INNOVATION PIPELINE**

#### **Emerging Technologies Under Consideration**
- **Blockchain Loyalty Tokens**: Cryptocurrency-based rewards system
- **AR/VR Experiences**: Augmented reality loyalty interactions
- **Voice Assistant Integration**: Alexa and Google Assistant support
- **IoT Integration**: Smart device connectivity for automated check-ins
- **Biometric Authentication**: Fingerprint and facial recognition for customers

#### **Market Research & Validation**
- **Customer Feedback Analysis**: Continuous user research and feature validation
- **Competitive Analysis**: Regular market analysis and feature gap identification
- **Technology Trends**: Monitoring emerging technologies for early adoption opportunities

---

### 🚀 **SUCCESS METRICS**

#### **Platform KPIs**
- **Customer Retention**: 85%+ retention rate for restaurant partners
- **User Engagement**: 70%+ monthly active users for customer app
- **Revenue Growth**: 25%+ increase in restaurant revenue through loyalty programs
- **Platform Scalability**: Support for 10,000+ restaurants by end of 2024

#### **Technical Performance**
- **Uptime**: 99.9% platform availability
- **Response Time**: <200ms average API response time
- **Scalability**: Handle 1M+ transactions per day
- **Security**: Zero security incidents with enterprise-grade protection

This roadmap represents our commitment to building the most comprehensive restaurant loyalty platform in the market, with a focus on innovation, scalability, and measurable business impact for our restaurant partners.

## 🏢 Multi-Location Franchise Management

### Features Implemented:
- **Location Hierarchy**: Create and manage multiple restaurant locations under a single franchise
- **Cross-Location Customer Tracking**: Customers can visit any location and earn stamps across the entire franchise
- **Staff Management**: Assign managers and staff to specific locations with role-based permissions
- **Location-Specific Analytics**: Individual performance metrics for each location with comparison tools
- **Centralized Oversight**: Franchise-level dashboard with cross-location insights and mobility tracking
- **Location Configuration**: Individual settings for stamps required, rewards, operating hours, and branding per location

### How It Works:
1. **Location Setup**: Franchise owners create multiple locations with unique addresses, contact info, and settings
2. **Staff Assignment**: Assign managers and staff to specific locations with appropriate role permissions
3. **Customer Mobility**: Customers can visit any franchise location and their stamps/rewards are tracked across all locations
4. **Cross-Location Analytics**: Track customer movement between locations and analyze franchise-wide performance
5. **Centralized Management**: Single dashboard to oversee all locations with drill-down capabilities for individual location details

### Technical Implementation:
- **Database Tables**: `locations`, `location_managers`, `location_analytics`, `cross_location_visits` for comprehensive location management
- **Edge Function**: `location-manager` handles all location operations including CRUD, analytics, and staff management
- **Frontend Component**: `MultiLocationDashboard` provides complete franchise management interface
- **Automatic Tracking**: Database triggers automatically track customer visits across locations
- **Performance Optimization**: Specialized indexes and views for fast cross-location queries

### Key Features:
- **Location Management**: Create, edit, and manage multiple restaurant locations
- **Primary Location**: Designate one location as primary with special handling
- **Staff Roles**: Assign staff, managers, and admins to specific locations
- **Cross-Location Visits**: Track customer visits across all franchise locations
- **Mobile Customers**: Identify customers who visit multiple locations
- **Performance Comparison**: Compare metrics across all locations
- **Location Analytics**: Individual performance tracking for each location

### Analytics Available:
- **Franchise Overview**: Total locations, mobile customers, and cross-location activity
- **Location Performance**: Individual metrics for customers, visits, stamps, and rewards per location
- **Customer Mobility**: Track which customers visit multiple locations and their movement patterns
- **Staff Management**: Monitor staff assignments and roles across all locations
- **Cross-Location Insights**: Analyze customer behavior across the entire franchise network

### Management Features:
- **Location CRUD**: Complete create, read, update, delete operations for locations
- **Staff Management**: Add, edit, and remove staff members with role-based permissions
- **Settings Configuration**: Individual location settings for stamps, rewards, hours, and branding
- **Performance Monitoring**: Real-time analytics for each location with comparison tools
- **Customer Tracking**: View customer activity across all franchise locations

## 🍎 Apple Wallet Integration

### Features Implemented:
- **Pass Generation**: Restaurant owners can generate `.pkpass` files for any client
- **Live Updates**: Passes automatically sync when stamps are added/redeemed
- **QR Code Integration**: Each pass contains the client's QR code for scanning
- **Branded Design**: Passes use restaurant branding and colors
- **Device Registration**: Support for Apple Wallet push notifications
- **Security**: Proper authentication and access control

### How It Works:
1. **Generate Pass**: Restaurant clicks "Add to Wallet" button for any client
2. **Download**: Browser downloads a `.pkpass` file
3. **Add to Wallet**: Customer adds the pass to their iPhone/Apple Watch
4. **Live Sync**: When stamps are added, the pass updates automatically
5. **Scanning**: Pass displays QR code for easy stamp collection

### Technical Implementation:
- **Edge Functions**: `generate-pkpass` and `update-pkpass` handle pass creation and updates
- **Database Triggers**: Automatically update timestamps for live sync
- **Frontend Component**: `AppleWalletButton` provides easy pass generation
- **Device Registration**: Tracks devices for push notifications

## 📍 GeoPush Notifications

### Features Implemented:
- **Location-Based Triggers**: Automatically detect when customers are near restaurants
- **Personalized Messages**: Custom notifications based on loyalty status and progress
- **OneSignal Integration**: Professional push notification service with geofencing
- **Smart Targeting**: Configurable radius and quiet hours for optimal engagement
- **Analytics Logging**: Track notification triggers and effectiveness
- **Demo Testing**: Built-in testing interface for validating geolocation setup

### How It Works:
1. **Restaurant Setup**: Restaurant owners configure their location coordinates and notification radius
2. **Customer Detection**: When customers enter the geofenced area, the system detects their proximity
3. **Smart Messaging**: Notifications are personalized based on loyalty status:
   - "Reward Ready!" for customers who can redeem
   - "Almost there!" for customers close to rewards
   - "Collect stamps!" for regular customers
4. **Delivery**: OneSignal sends push notifications to nearby customers
5. **Analytics**: All triggers are logged for performance analysis

### Technical Implementation:
- **Edge Function**: `geo-push` handles location detection and notification sending
- **Database Tables**: `geo_triggers`, `notification_settings` for logging and preferences
- **Geospatial Queries**: Haversine formula for accurate distance calculations
- **Frontend Components**: `GeoPushSettings` and `GeoPushDemo` for configuration and testing
- **OneSignal API**: Professional push notification delivery with geofencing support

### Configuration Options:
- **Notification Radius**: 50-5000 meters around restaurant location
- **Custom Messages**: Personalized notification text per restaurant
- **Quiet Hours**: Respect customer preferences for notification timing
- **Enable/Disable**: Toggle geo-notifications on/off per restaurant
- **Testing Interface**: Simulate notifications with various test locations

## 📊 Advanced Analytics Dashboard

### Features Implemented:
- **Comprehensive Reporting**: Multi-dimensional analytics with overview, customer, engagement, and retention reports
- **Real-time Insights**: Live data processing with customizable date ranges and reporting periods
- **Customer Segmentation**: Automatic classification of customers as Active, At Risk, or Inactive
- **Engagement Metrics**: Track customer events, stamp collection patterns, and reward redemption rates
- **Retention Analysis**: Customer lifecycle tracking with actionable recommendations
- **Data Export**: JSON export functionality for external analysis
- **Performance Optimization**: Database views and indexes for fast query performance

### How It Works:
1. **Data Collection**: Automatic event tracking for all customer interactions (stamps, rewards, visits)
2. **Analytics Processing**: Edge Function generates comprehensive reports on-demand
3. **Visualization**: Interactive dashboard with multiple report types and filtering options
4. **Insights Generation**: AI-powered recommendations based on customer behavior patterns
5. **Export Capabilities**: Download analytics data for external business intelligence tools

### Technical Implementation:
- **Database Tables**: `customer_analytics`, `business_metrics`, `customer_cohorts` for comprehensive data storage
- **Database Views**: `customer_insights`, `restaurant_performance` for optimized querying
- **Edge Function**: `analytics-report` handles complex report generation with multiple report types
- **Frontend Component**: `AnalyticsDashboard` provides interactive analytics interface
- **Automatic Triggers**: Database triggers track all customer events for analytics

### Report Types Available:
- **Overview Report**: Key metrics, trends, and top customers summary
- **Customer Report**: Detailed customer segmentation and behavior analysis
- **Engagement Report**: Event tracking, engagement scores, and activity patterns
- **Retention Report**: Customer lifecycle analysis with retention recommendations
- **Cohort Analysis**: Customer cohort tracking for long-term retention insights

### Key Metrics Tracked:
- **Customer Metrics**: Total customers, active customers, new customer acquisition
- **Engagement Metrics**: Stamps earned, visits recorded, rewards redeemed
- **Retention Metrics**: Customer status distribution, lifecycle stages, retention rates
- **Performance Metrics**: Average stamps per customer, reward redemption rates, engagement scores

## 🚀 Future Enhancements

### Phase 2: Advanced Features
- **Apple Wallet Integration**: Native iOS wallet cards with live stamp updates
- **Geolocation Push**: Automatic notifications when customers are nearby
- **Advanced Analytics**: Customer behavior insights and retention metrics
- **Multi-location Support**: Franchise management with location-specific campaigns
- **Custom Branding**: White-label solution with restaurant branding

### Phase 3: Platform Expansion
- **Customer Mobile App**: Dedicated app for customers to track rewards
- **Social Features**: Referral programs and social sharing
- **Integration APIs**: Connect with POS systems and payment processors
- **Advanced Reporting**: Revenue impact analysis and ROI tracking
- **Marketing Automation**: Email/SMS campaigns based on customer behavior

### Phase 4: Enterprise Features
- **Enterprise Dashboard**: Multi-brand management for restaurant groups
- **Advanced Security**: SOC2 compliance and enterprise-grade security
- **Custom Integrations**: API-first approach for enterprise clients
- **White-label Platform**: Complete rebrandable solution for resellers

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: [docs.restaurantloyalty.com](https://docs.restaurantloyalty.com)
- **Email Support**: support@zerionstudio.com
- **Discord Community**: [Join our Discord](https://discord.gg/zerionstudio)
- **GitHub Issues**: [Report bugs and request features](https://github.com/zerionstudio/restaurant-loyalty/issues)

---

**Built with ❤️ by [Zerion Studio](https://zerionstudio.com)**

*Empowering restaurants to build lasting customer relationships through modern loyalty programs.*

## 🤝 Referral Engine

### Features Implemented:
- **Program Management**: Restaurant owners can configure referral programs with custom rewards and qualification requirements
- **Unique Code Generation**: Automatic generation of personalized referral codes for each customer (e.g., "REFJOH1234")
- **Automated Qualification**: Smart tracking of referee visits and stamps with automatic reward processing
- **Flexible Rewards**: Support for stamps, discounts, or free items for both referrers and referees
- **Real-time Analytics**: Comprehensive referral statistics with top referrers and recent activity tracking
- **Manual Processing**: Admin interface for manually processing referrals and generating codes

### How It Works:
1. **Program Setup**: Restaurant owners configure their referral program settings including reward types and qualification requirements
2. **Code Generation**: Customers receive unique referral codes that they can share with friends
3. **Referral Processing**: When a new customer uses a referral code, the system creates a pending referral relationship
4. **Automatic Qualification**: The system monitors referee activity (visits and stamps) and automatically qualifies referrals when requirements are met
5. **Reward Distribution**: Once qualified, both referrer and referee automatically receive their configured rewards
6. **Analytics Tracking**: All referral activity is logged and available in comprehensive analytics reports

### Technical Implementation:
- **Database Tables**: `referral_programs`, `referral_codes`, `referrals`, `referral_rewards` for complete referral tracking
- **Edge Function**: `referral-manager` handles all referral operations including code generation, processing, and analytics
- **Frontend Component**: `ReferralDashboard` provides comprehensive referral management interface
- **Automatic Triggers**: Database triggers automatically check qualification status when customer data changes
- **Smart Code Generation**: Intelligent referral code creation using customer names and random numbers

### Configuration Options:
- **Program Status**: Enable/disable referral program per restaurant
- **Reward Types**: Configure stamps, discounts, or free items for referrers and referees
- **Qualification Requirements**: Set minimum visits and stamps required for referral qualification
- **Program Limits**: Control maximum referrals per customer and code usage limits
- **Custom Branding**: Personalize program name, description, and terms & conditions

### Analytics Available:
- **Referral Statistics**: Total, pending, qualified, and rewarded referrals
- **Top Referrers**: Customers who have made the most successful referrals
- **Recent Activity**: Latest referral activity with status tracking
- **Reward Tracking**: Complete history of rewards issued through referrals
- **Performance Metrics**: Referral conversion rates and program effectiveness

### Admin Features:
- **Code Generation**: Create referral codes for any customer
- **Manual Processing**: Process referrals manually using referral codes
- **Program Configuration**: Complete control over referral program settings
- **Analytics Dashboard**: Real-time insights into referral program performance
- **Customer Management**: View individual customer referral history and rewards

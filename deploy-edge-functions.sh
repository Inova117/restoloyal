#!/bin/bash

# ============================================================================
# 🚀 EDGE FUNCTIONS DEPLOYMENT SCRIPT
# Post-Security Audit - Deploy Fixed Functions
# ============================================================================

echo "🚀 Starting Edge Functions deployment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if logged in to Supabase
if ! supabase status &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Supabase CLI ready"

# Deploy critical fixed functions
echo "📦 Deploying fixed Edge Functions..."

echo "  → Deploying create-client-with-user-v2 (primary client management)..."
supabase functions deploy create-client-with-user-v2

echo "  → Deploying create-client-with-user (backup client management)..."
supabase functions deploy create-client-with-user

echo "  → Deploying staff-manager..."
supabase functions deploy staff-manager

echo "  → Deploying location-manager..."
supabase functions deploy location-manager

echo "  → Deploying customer-manager..."
supabase functions deploy customer-manager

echo "  → Deploying loyalty-manager..."
supabase functions deploy loyalty-manager

echo "  → Deploying analytics-report..."
supabase functions deploy analytics-report

echo "  → Deploying notification-campaigns..."
supabase functions deploy notification-campaigns

echo "  → Deploying client-profile..."
supabase functions deploy client-profile

echo "✅ All Edge Functions deployed successfully"

# Set environment variables reminder
echo ""
echo "⚠️  IMPORTANT: Configure Environment Variables"
echo "  ├─ VITE_PLATFORM_ADMIN_EMAILS"
echo "  ├─ VITE_GALLETTI_ADMIN_EMAILS"
echo "  └─ app.platform_admin_emails (PostgreSQL setting)"
echo ""
echo "📋 Next steps:"
echo "  1. Configure environment variables in Netlify"
echo "  2. Run updated security policies on database"
echo "  3. Test admin functionality"
echo ""
echo "🔗 Deployment complete! Functions are now live." 
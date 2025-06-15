#!/bin/bash

# ============================================================================
# 🚀 EDGE FUNCTIONS DEPLOYMENT SCRIPT - CURRENT IMPLEMENTATION
# Deploy the actual Edge Functions that exist in FinalBackEndImplementation
# ============================================================================

echo "🚀 Starting Edge Functions deployment for current implementation..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if logged in to Supabase
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Supabase CLI ready"

# Change to Edge Functions directory
cd FinalBackEndImplementation/04-Edge-Functions

echo "📦 Deploying Edge Functions from FinalBackEndImplementation..."

# Deploy each function individually
echo "  → Deploying create-client..."
supabase functions deploy create-client

echo "  → Deploying create-customer..."
supabase functions deploy create-customer

echo "  → Deploying create-location..."
supabase functions deploy create-location

echo "  → Deploying create-location-staff..."
supabase functions deploy create-location-staff

echo "  → Deploying create-superadmin..."
supabase functions deploy create-superadmin

echo "  → Deploying platform-management..."
supabase functions deploy platform-management

echo "✅ All Edge Functions deployed successfully"

# Set environment secrets
echo ""
echo "🔒 Setting up environment secrets..."
echo "  → Setting SUPABASE_URL..."
supabase secrets set SUPABASE_URL=https://sosdnyzzhzowoxsztgol.supabase.co

echo "  → Setting SUPABASE_SERVICE_ROLE_KEY..."
echo "⚠️  Please set your service role key manually:"
echo "   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here"

echo ""
echo "📋 Deployment Summary:"
echo "  ✅ create-client - Superadmin → Client creation"
echo "  ✅ create-customer - Location Staff → Customer creation"
echo "  ✅ create-location - Client Admin → Location creation"
echo "  ✅ create-location-staff - Client Admin → Staff creation"
echo "  ✅ create-superadmin - Platform → Superadmin creation"
echo "  ✅ platform-management - Superadmin platform operations"
echo ""
echo "🎯 Next steps:"
echo "  1. Set SUPABASE_SERVICE_ROLE_KEY secret"
echo "  2. Test Edge Functions from your app"
echo "  3. Check function logs: supabase functions logs"
echo ""
echo "🔗 Deployment complete! Functions are now live at:"
echo "   https://sosdnyzzhzowoxsztgol.supabase.co/functions/v1/" 
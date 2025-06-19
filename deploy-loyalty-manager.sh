#!/bin/bash

# ============================================================================
# DEPLOY LOYALTY MANAGER EDGE FUNCTION
# Restaurant Loyalty Platform - Core Loyalty System
# ============================================================================

echo "🚀 DEPLOYING LOYALTY MANAGER EDGE FUNCTION"
echo "============================================="

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "Please install it first: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/functions/loyalty-manager/index.ts" ]; then
    echo "❌ loyalty-manager function not found in supabase/functions/"
    echo "Expected: supabase/functions/loyalty-manager/index.ts"
    exit 1
fi

echo "📂 Checking function files..."

# Check required files exist
if [ ! -f "FinalBackEndImplementation/AuditFix/edge-functions/loyalty-manager/index.ts" ]; then
    echo "❌ Source file not found: FinalBackEndImplementation/AuditFix/edge-functions/loyalty-manager/index.ts"
    exit 1
fi

if [ ! -f "FinalBackEndImplementation/AuditFix/edge-functions/loyalty-manager/deno.d.ts" ]; then
    echo "❌ Type definitions not found: FinalBackEndImplementation/AuditFix/edge-functions/loyalty-manager/deno.d.ts"
    exit 1
fi

# Copy files from development location to deployment location
echo "📋 Copying function files..."
cp "FinalBackEndImplementation/AuditFix/edge-functions/loyalty-manager/index.ts" "supabase/functions/loyalty-manager/"
cp "FinalBackEndImplementation/AuditFix/edge-functions/loyalty-manager/deno.d.ts" "supabase/functions/loyalty-manager/"

echo "✅ Files copied successfully"

# Deploy the function
echo "🚀 Deploying loyalty-manager function..."

supabase functions deploy loyalty-manager --use-api

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 LOYALTY MANAGER DEPLOYED SUCCESSFULLY!"
    echo "============================================="
    echo ""
    echo "📋 Function Details:"
    echo "   • Name: loyalty-manager"
    echo "   • Purpose: Core loyalty system functionality"
    echo "   • Features:"
    echo "     - Stamp management (add/track stamps)"
    echo "     - Reward redemption system"
    echo "     - Loyalty settings configuration"
    echo "     - Customer loyalty status tracking"
    echo "     - Transaction history"
    echo ""
    echo "🔗 Available Endpoints:"
    echo "   GET  /loyalty-manager?endpoint=settings          - Get loyalty program settings"
    echo "   POST /loyalty-manager?endpoint=settings          - Update loyalty settings"
    echo "   POST /loyalty-manager?endpoint=add-stamp         - Add stamps to customer"
    echo "   POST /loyalty-manager?endpoint=redeem-reward     - Redeem customer reward"
    echo "   GET  /loyalty-manager?endpoint=customer-status   - Get customer loyalty status"
    echo "   GET  /loyalty-manager?endpoint=history           - Get transaction history"
    echo ""
    echo "🛡️ Security Features:"
    echo "   • JWT authentication required"
    echo "   • Role-based access control"
    echo "   • Multi-tenant data isolation"
    echo "   • Input validation and sanitization"
    echo ""
    echo "📊 Core Functionality Enabled:"
    echo "   • ✅ Stamp Management"
    echo "   • ✅ Reward Redemption"
    echo "   • ✅ Loyalty Settings"
    echo "   • ✅ Customer Status Tracking"
    echo "   • ✅ Transaction History"
    echo ""
    echo "🔄 Next Steps:"
    echo "   1. Update useLoyaltyManager.ts hook (set MOCK_MODE = false)"
    echo "   2. Test stamp addition functionality"
    echo "   3. Test reward redemption process"
    echo "   4. Configure loyalty program settings"
    echo ""
    echo "🧪 Test the deployment:"
    echo "   bash test-loyalty-manager.sh"
    echo ""
else
    echo ""
    echo "❌ DEPLOYMENT FAILED"
    echo "==================="
    echo ""
    echo "🔍 Troubleshooting steps:"
    echo "   1. Check Supabase CLI authentication:"
    echo "      supabase auth status"
    echo ""
    echo "   2. Verify project linking:"
    echo "      supabase status"
    echo ""
    echo "   3. Check function syntax:"
    echo "      deno check supabase/functions/loyalty-manager/index.ts"
    echo ""
    echo "   4. Review deployment logs for detailed error information"
    echo ""
    exit 1
fi 
#!/bin/bash

# ============================================================================
# DEPLOY SCRIPT: Notification System Edge Function
# ============================================================================
# Task T4.1: Notification System deployment
# Features: Campaign management, push notifications, customer segmentation
# ============================================================================

echo "🚀 DEPLOYING NOTIFICATION SYSTEM EDGE FUNCTION..."
echo "================================================"

# Check if we're in the correct directory
if [ ! -d "FinalBackEndImplementation/AuditFix/edge-functions/notification-system" ]; then
    echo "❌ Error: notification-system directory not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found!"
    echo "Please install Supabase CLI: npm install -g supabase"
    exit 1
fi

# Function source and destination
SOURCE_DIR="FinalBackEndImplementation/AuditFix/edge-functions/notification-system"
DEST_DIR="supabase/functions/notification-system"

echo "📁 Preparing deployment..."

# Create destination directory
mkdir -p "$DEST_DIR"

# Copy files
echo "📋 Copying function files..."
cp "$SOURCE_DIR/index.ts" "$DEST_DIR/"
cp "$SOURCE_DIR/deno.d.ts" "$DEST_DIR/"

# Verify files exist
if [ ! -f "$DEST_DIR/index.ts" ]; then
    echo "❌ Error: Failed to copy index.ts"
    exit 1
fi

if [ ! -f "$DEST_DIR/deno.d.ts" ]; then
    echo "❌ Error: Failed to copy deno.d.ts" 
    exit 1
fi

echo "✅ Files copied successfully!"

# Deploy the function
echo ""
echo "🚀 Deploying to Supabase..."
echo "Function: notification-system"
echo "Location: $DEST_DIR"
echo ""

# Deploy with error handling
if supabase functions deploy notification-system --project-ref $(supabase status --output json | jq -r '.project_id' 2>/dev/null || echo $SUPABASE_PROJECT_ID); then
    echo ""
    echo "✅ NOTIFICATION SYSTEM DEPLOYED SUCCESSFULLY!"
    echo "============================================="
    echo ""
    echo "🔑 Available Operations:"
    echo "  • create-campaign     - Create notification campaigns"
    echo "  • get-campaigns      - List all campaigns"
    echo "  • send-notification  - Send push notifications" 
    echo "  • customer-segmentation - Target customer segments"
    echo "  • campaign-analytics - View campaign performance"
    echo ""
    echo "📊 Features Enabled:"
    echo "  ✓ Campaign Management"
    echo "  ✓ Push Notifications"
    echo "  ✓ Customer Segmentation"
    echo "  ✓ Performance Analytics"
    echo "  ✓ Multi-channel Support (Push, Email, SMS)"
    echo ""
    echo "🔗 Function URL:"
    echo "  https://$(supabase status --output json | jq -r '.project_id' 2>/dev/null || echo $SUPABASE_PROJECT_ID).supabase.co/functions/v1/notification-system"
    echo ""
    echo "📋 Next Steps:"
    echo "  1. Update frontend to use notification campaigns"
    echo "  2. Test campaign creation and sending"
    echo "  3. Implement customer segmentation UI"
    echo "  4. Set up analytics dashboards"
    echo ""
    echo "🔧 Test Commands:"
    echo "  • List campaigns: ?operation=get-campaigns"
    echo "  • Create campaign: ?operation=create-campaign (POST)"
    echo "  • Send notification: ?operation=send-notification (POST)"
    echo ""
else
    echo ""
    echo "❌ DEPLOYMENT FAILED!"
    echo "===================="
    echo ""
    echo "Please check:"
    echo "  1. Supabase CLI is logged in: supabase login"
    echo "  2. Project is linked: supabase link --project-ref YOUR_PROJECT_ID"
    echo "  3. Environment variables are set correctly"
    echo ""
    echo "For manual deployment:"
    echo "  supabase functions deploy notification-system"
    echo ""
    exit 1
fi

echo "🎯 T4.1 NOTIFICATION SYSTEM: COMPLETE!"
echo "======================================" 
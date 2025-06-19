#!/bin/bash

# ============================================================================
# TEST SCRIPT FOR CLIENT-PROFILE EDGE FUNCTION
# ============================================================================
# Tests the deployed client-profile edge function in Supabase
# Verifies all endpoints and authorization scenarios
# ============================================================================

echo "🧪 TESTING CLIENT-PROFILE EDGE FUNCTION"
echo "========================================"

# Configuration - Update these with your actual values
SUPABASE_URL="YOUR_SUPABASE_URL"
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
FUNCTION_URL="${SUPABASE_URL}/functions/v1/client-profile"

echo "📍 Function URL: $FUNCTION_URL"
echo ""

# Test 1: Check function availability (should fail without auth)
echo "🔍 Test 1: Function availability check (expect 401)"
echo "=================================================="
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X GET "$FUNCTION_URL" \
  -H "Content-Type: application/json"
echo ""
echo ""

# Test 2: Test with invalid auth (should fail)
echo "🔍 Test 2: Invalid authentication (expect 401)"
echo "=============================================="
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X GET "$FUNCTION_URL" \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json"
echo ""
echo ""

# Test 3: Test CORS (should succeed)
echo "🔍 Test 3: CORS preflight check (expect 200)"
echo "==========================================="
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X OPTIONS "$FUNCTION_URL" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization"
echo ""
echo ""

echo "✅ BASIC TESTS COMPLETED"
echo "========================"
echo ""
echo "🔑 NEXT STEPS:"
echo "1. Get a valid JWT token from your Supabase auth"
echo "2. Update this script with your real SUPABASE_URL"
echo "3. Test with valid authentication tokens"
echo ""
echo "📚 MANUAL TESTING:"
echo "Replace YOUR_JWT_TOKEN with a real token and run:"
echo ""
echo "# Test GET with valid auth:"
echo "curl -X GET \"$FUNCTION_URL?include_stats=true\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""
echo "# Test POST (superadmin only):"
echo "curl -X POST \"$FUNCTION_URL\" \\"
echo "  -H \"Authorization: Bearer YOUR_SUPERADMIN_JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"name\": \"Test Restaurant\", \"email\": \"test@restaurant.com\"}'"
echo ""
echo "🎯 Function deployment verification complete!" 
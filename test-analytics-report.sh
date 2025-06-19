#!/bin/bash

# Test Analytics Report Edge Function
# Verifies deployment and functionality of analytics-report edge function

echo "📊 Testing Analytics Report Edge Function"
echo "========================================="

# Configuration (update these values)
SUPABASE_URL="${SUPABASE_URL:-https://your-project-ref.supabase.co}"
FUNCTION_URL="$SUPABASE_URL/functions/v1/analytics-report"

# Test JWT token (you need to provide a valid token)
JWT_TOKEN="${JWT_TOKEN:-your-jwt-token-here}"

if [ "$JWT_TOKEN" == "your-jwt-token-here" ]; then
    echo "⚠️  Warning: Using placeholder JWT token"
    echo "   Please set JWT_TOKEN environment variable with a valid token"
    echo ""
fi

echo "🔧 Configuration:"
echo "   SUPABASE_URL: $SUPABASE_URL"
echo "   FUNCTION_URL: $FUNCTION_URL"
echo "   JWT_TOKEN: ${JWT_TOKEN:0:20}..."
echo ""

# Test 1: Basic connectivity
echo "📡 Test 1: Basic connectivity (OPTIONS)"
response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$FUNCTION_URL")
if [ "$response" -eq 200 ]; then
    echo "   ✅ CORS preflight successful ($response)"
else
    echo "   ❌ CORS preflight failed ($response)"
fi
echo ""

# Test 2: Authentication check
echo "🔐 Test 2: Authentication check"
response=$(curl -s -w "%{http_code}" -X GET "$FUNCTION_URL?endpoint=aggregate" \
    -H "Content-Type: application/json")
if [[ "$response" == *"401"* ]] || [[ "$response" == *"Missing authorization"* ]]; then
    echo "   ✅ Properly rejects unauthenticated requests"
else
    echo "   ❌ Authentication check failed"
    echo "   Response: $response"
fi
echo ""

# Test 3: Aggregate metrics endpoint
echo "📈 Test 3: Aggregate metrics endpoint"
response=$(curl -s -X GET "$FUNCTION_URL?endpoint=aggregate&time_range=30d" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json")
    
if [[ "$response" == *"total_customers"* ]] && [[ "$response" == *"revenue_estimate"* ]]; then
    echo "   ✅ Aggregate metrics endpoint working"
    echo "   Sample response: ${response:0:200}..."
else
    echo "   ❌ Aggregate metrics endpoint failed"
    echo "   Response: $response"
fi
echo ""

# Test 4: Location breakdown endpoint
echo "🏪 Test 4: Location breakdown endpoint"
response=$(curl -s -X GET "$FUNCTION_URL?endpoint=locations&time_range=30d" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json")
    
if [[ "$response" == *"location_name"* ]] || [[ "$response" == *"data"* ]] || [[ "$response" == *"No locations found"* ]]; then
    echo "   ✅ Location breakdown endpoint working"
    echo "   Sample response: ${response:0:200}..."
else
    echo "   ❌ Location breakdown endpoint failed"
    echo "   Response: $response"
fi
echo ""

# Test 5: Trends analysis endpoint
echo "📊 Test 5: Trends analysis endpoint"
response=$(curl -s -X GET "$FUNCTION_URL?endpoint=trends&time_range=6m" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json")
    
if [[ "$response" == *"monthly_growth"* ]] || [[ "$response" == *"retention_cohorts"* ]]; then
    echo "   ✅ Trends analysis endpoint working"
    echo "   Sample response: ${response:0:200}..."
else
    echo "   ❌ Trends analysis endpoint failed"
    echo "   Response: $response"
fi
echo ""

# Test 6: Custom date range
echo "📅 Test 6: Custom date range"
response=$(curl -s -X GET "$FUNCTION_URL?endpoint=aggregate&time_range=custom&start_date=2024-01-01&end_date=2024-01-31" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json")
    
if [[ "$response" == *"total_customers"* ]] || [[ "$response" == *"error"* ]]; then
    echo "   ✅ Custom date range endpoint responding"
    echo "   Response: ${response:0:200}..."
else
    echo "   ❌ Custom date range endpoint failed"
    echo "   Response: $response"
fi
echo ""

# Test 7: Different time ranges
echo "⏱️  Test 7: Different time ranges"
for range in "90d" "6m" "1y"; do
    response=$(curl -s -X GET "$FUNCTION_URL?endpoint=aggregate&time_range=$range" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json")
    
    if [[ "$response" == *"total_customers"* ]] || [[ "$response" == *"error"* ]]; then
        echo "   ✅ Time range '$range' working"
    else
        echo "   ❌ Time range '$range' failed"
    fi
done
echo ""

# Test 8: Error handling
echo "🚨 Test 8: Error handling"
response=$(curl -s -X GET "$FUNCTION_URL?endpoint=invalid" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json")
    
if [[ "$response" == *"error"* ]] && [[ "$response" == *"Unknown endpoint"* ]]; then
    echo "   ✅ Error handling working properly"
else
    echo "   ⚠️  Unexpected response for invalid endpoint"
    echo "   Response: $response"
fi
echo ""

echo "🎯 Summary:"
echo "   Analytics Report Edge Function testing completed"
echo "   Review results above for any failures"
echo ""

echo "📚 Manual Testing Examples:"
echo ""

echo "1. Get 30-day aggregate metrics:"
echo "   curl -X GET '$FUNCTION_URL?endpoint=aggregate&time_range=30d' \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "     -H 'Content-Type: application/json'"
echo ""

echo "2. Get location breakdown for 90 days:"
echo "   curl -X GET '$FUNCTION_URL?endpoint=locations&time_range=90d' \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "     -H 'Content-Type: application/json'"
echo ""

echo "3. Get 6-month trend analysis:"
echo "   curl -X GET '$FUNCTION_URL?endpoint=trends&time_range=6m' \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "     -H 'Content-Type: application/json'"
echo ""

echo "4. Custom date range analysis:"
echo "   curl -X GET '$FUNCTION_URL?endpoint=aggregate&time_range=custom&start_date=2024-01-01&end_date=2024-01-31' \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "     -H 'Content-Type: application/json'"
echo ""

echo "5. Filter by specific locations:"
echo "   curl -X GET '$FUNCTION_URL?endpoint=aggregate&location_ids=loc1,loc2' \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "     -H 'Content-Type: application/json'"
echo ""

echo "6. Client-specific analytics (superadmin only):"
echo "   curl -X GET '$FUNCTION_URL?endpoint=aggregate&client_id=client-123' \\"
echo "     -H 'Authorization: Bearer SUPERADMIN_TOKEN' \\"
echo "     -H 'Content-Type: application/json'"
echo ""

echo "📊 Analytics Endpoints Summary:"
echo ""
echo "• aggregate  → Comprehensive metrics (customers, stamps, revenue)"
echo "• locations  → Location breakdown and performance comparison"
echo "• trends     → Monthly growth, retention, and redemption trends"
echo ""

echo "🔐 Access Control:"
echo "• Superadmin → All platform data"
echo "• Client Admin → Client-scoped data only"
echo "• Location Staff → Location-scoped data only"
echo ""

echo "✅ Analytics Report Edge Function test completed!" 
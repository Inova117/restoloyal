#!/bin/bash

# ============================================================================
# 🧪 EDGE FUNCTIONS TESTING SCRIPT
# Tests all 6 Edge Functions with sample data
# ============================================================================

echo "🧪 Testing Edge Functions with Sample Data..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="https://sosdnyzzhzowoxsztgol.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvc2RueXp6aHpvd294c3p0Z29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NzgyOTYsImV4cCI6MjA2NDI1NDI5Nn0.DnbcCSQM2OubGuK_8UDQ83aToFNG034YlQcuI6ZOr5Q"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

test_edge_function() {
    local function_name=$1
    local method=$2
    local data=$3
    local expected_status=$4
    
    echo -n "  → Testing $function_name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$SUPABASE_URL/functions/v1/$function_name" \
            -H "Authorization: Bearer $ANON_KEY" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$SUPABASE_URL/functions/v1/$function_name" \
            -H "Authorization: Bearer $ANON_KEY" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    # Extract response body (all but last line)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ Success (HTTP $status_code)${NC}"
        if [ ! -z "$response_body" ] && [ "$response_body" != "null" ]; then
            echo "     Response: $(echo "$response_body" | head -c 100)..."
        fi
        return 0
    else
        echo -e "${RED}❌ Failed (HTTP $status_code)${NC}"
        if [ ! -z "$response_body" ]; then
            echo "     Error: $(echo "$response_body" | head -c 200)..."
        fi
        return 1
    fi
}

# ============================================================================
# TEST 1: CREATE-SUPERADMIN
# ============================================================================

echo -e "\n${BLUE}🔐 TEST 1: Create Superadmin${NC}"

superadmin_data='{
  "email": "test-superadmin@example.com",
  "password": "TestPassword123!",
  "full_name": "Test Superadmin",
  "phone": "+1234567890"
}'

test_edge_function "create-superadmin" "POST" "$superadmin_data" "201"

# ============================================================================
# TEST 2: CREATE-CLIENT
# ============================================================================

echo -e "\n${BLUE}🏢 TEST 2: Create Client${NC}"

client_data='{
  "business_name": "Test Restaurant Chain",
  "business_type": "restaurant",
  "contact_email": "contact@testrestaurant.com",
  "contact_phone": "+1234567891",
  "address": "123 Test Street, Test City, TC 12345",
  "admin_email": "admin@testrestaurant.com",
  "admin_password": "AdminPassword123!",
  "admin_full_name": "Test Admin",
  "admin_phone": "+1234567892"
}'

test_edge_function "create-client" "POST" "$client_data" "201"

# ============================================================================
# TEST 3: CREATE-LOCATION
# ============================================================================

echo -e "\n${BLUE}🏪 TEST 3: Create Location${NC}"

location_data='{
  "name": "Test Restaurant Downtown",
  "address": "456 Downtown Ave, Test City, TC 12346",
  "phone": "+1234567893",
  "email": "downtown@testrestaurant.com",
  "manager_email": "manager@testrestaurant.com",
  "manager_password": "ManagerPassword123!",
  "manager_full_name": "Test Manager",
  "manager_phone": "+1234567894"
}'

test_edge_function "create-location" "POST" "$location_data" "201"

# ============================================================================
# TEST 4: CREATE-LOCATION-STAFF
# ============================================================================

echo -e "\n${BLUE}👥 TEST 4: Create Location Staff${NC}"

staff_data='{
  "email": "staff@testrestaurant.com",
  "password": "StaffPassword123!",
  "full_name": "Test Staff Member",
  "phone": "+1234567895",
  "role": "cashier",
  "location_id": "00000000-0000-0000-0000-000000000001"
}'

test_edge_function "create-location-staff" "POST" "$staff_data" "201"

# ============================================================================
# TEST 5: CREATE-CUSTOMER
# ============================================================================

echo -e "\n${BLUE}👤 TEST 5: Create Customer${NC}"

customer_data='{
  "email": "customer@example.com",
  "full_name": "Test Customer",
  "phone": "+1234567896",
  "date_of_birth": "1990-01-01",
  "location_id": "00000000-0000-0000-0000-000000000001"
}'

test_edge_function "create-customer" "POST" "$customer_data" "201"

# ============================================================================
# TEST 6: PLATFORM-MANAGEMENT
# ============================================================================

echo -e "\n${BLUE}⚙️  TEST 6: Platform Management${NC}"

# Test GET /stats endpoint
echo -n "  → Testing platform stats... "
response=$(curl -s -w "\n%{http_code}" "$SUPABASE_URL/functions/v1/platform-management/stats" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json")

status_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | head -n -1)

if [ "$status_code" = "200" ] || [ "$status_code" = "401" ]; then
    echo -e "${GREEN}✅ Endpoint accessible (HTTP $status_code)${NC}"
else
    echo -e "${RED}❌ Failed (HTTP $status_code)${NC}"
fi

# Test GET /health endpoint
echo -n "  → Testing health check... "
response=$(curl -s -w "\n%{http_code}" "$SUPABASE_URL/functions/v1/platform-management/health" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json")

status_code=$(echo "$response" | tail -n1)

if [ "$status_code" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed (HTTP $status_code)${NC}"
else
    echo -e "${YELLOW}⚠️  Health check response (HTTP $status_code)${NC}"
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "\n${BLUE}📊 EDGE FUNCTIONS TEST SUMMARY${NC}"
echo "============================================"

echo -e "\n${YELLOW}📝 NOTES:${NC}"
echo "• Tests use sample data - not real accounts"
echo "• 401/403 errors are expected without proper authentication"
echo "• 201 responses indicate successful function execution"
echo "• 400/422 responses may indicate validation working correctly"

echo -e "\n${YELLOW}🔍 WHAT TO LOOK FOR:${NC}"
echo "• ✅ HTTP 200/201: Function working correctly"
echo "• ⚠️  HTTP 400/422: Function accessible, validation working"
echo "• ❌ HTTP 404: Function not deployed"
echo "• ❌ HTTP 500: Function has runtime errors"

echo -e "\n${YELLOW}🎯 NEXT STEPS:${NC}"
echo "1. If all functions return 404: Run ./deploy-edge-functions-current.sh"
echo "2. If functions return 401/403: Authentication working correctly"
echo "3. If functions return 500: Check Supabase logs for errors"
echo "4. Test with real authentication tokens for full functionality"

echo -e "\n✅ Edge Functions testing complete!" 
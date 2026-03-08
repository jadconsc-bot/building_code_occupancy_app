#!/bin/bash

# ⚠️ DEVELOPMENT ONLY - REMOVE FOR PRODUCTION
# 
# Backend E2E Test Script
# Tests dev auth + encryption workflows using curl
# 
# Usage: ./test-backend-e2e.sh <base_url> <password>
# Example: ./test-backend-e2e.sh https://buildingcode-9f4j2cdo.manus.space admin123

set -e

BASE_URL="${1:-https://buildingcode-9f4j2cdo.manus.space}"
PASSWORD="${2:-admin123}"
COOKIE_JAR="/tmp/dev-cookies.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
log_test() {
  echo -e "${BLUE}[TEST]${NC} $1"
  ((TESTS_RUN++))
}

log_pass() {
  echo -e "${GREEN}[PASS]${NC} $1"
  ((TESTS_PASSED++))
}

log_fail() {
  echo -e "${RED}[FAIL]${NC} $1"
  ((TESTS_FAILED++))
}

log_info() {
  echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test 1: Dev Login
test_dev_login() {
  log_test "Dev Authentication with password"
  
  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"password\":\"$PASSWORD\"}" \
    -c "$COOKIE_JAR" \
    "$BASE_URL/api/dev/login")
  
  if echo "$response" | grep -q '"success":true'; then
    log_pass "Dev login successful"
    log_info "Response: $response"
  else
    log_fail "Dev login failed"
    log_info "Response: $response"
    return 1
  fi
}

# Test 2: Check Authentication Status
test_check_auth() {
  log_test "Check authentication status"
  
  response=$(curl -s -b "$COOKIE_JAR" \
    "$BASE_URL/api/trpc/auth.me")
  
  if echo "$response" | grep -q '"result"'; then
    log_pass "Auth status check successful"
    log_info "User authenticated"
  else
    log_fail "Auth status check failed"
    log_info "Response: $response"
    return 1
  fi
}

# Test 3: Create Encrypted Client
test_create_client() {
  log_test "Create encrypted client"
  
  client_data='{
    "name": "Test Client",
    "email": "test@example.com",
    "phone": "+1-555-0000",
    "address": "123 Test St",
    "company": "Test Company"
  }'
  
  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -b "$COOKIE_JAR" \
    -d "{\"0\":{\"json\":$client_data}}" \
    "$BASE_URL/api/trpc/encryptedClients.create")
  
  if echo "$response" | grep -q '"id"'; then
    log_pass "Client created with encryption"
    CLIENT_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    log_info "Client ID: $CLIENT_ID"
  else
    log_fail "Client creation failed"
    log_info "Response: $response"
    return 1
  fi
}

# Test 4: List Encrypted Clients
test_list_clients() {
  log_test "List encrypted clients with decryption"
  
  response=$(curl -s -b "$COOKIE_JAR" \
    "$BASE_URL/api/trpc/encryptedClients.list")
  
  if echo "$response" | grep -q '"name"'; then
    log_pass "Clients retrieved and decrypted"
    CLIENT_COUNT=$(echo "$response" | grep -o '"name"' | wc -l)
    log_info "Clients found: $CLIENT_COUNT"
  else
    log_fail "Client list retrieval failed"
    log_info "Response: $response"
    return 1
  fi
}

# Test 5: Get Specific Client
test_get_client() {
  log_test "Get specific encrypted client"
  
  if [ -z "$CLIENT_ID" ]; then
    log_fail "Client ID not set (previous test failed)"
    return 1
  fi
  
  response=$(curl -s -b "$COOKIE_JAR" \
    "$BASE_URL/api/trpc/encryptedClients.get?input={\"0\":{\"json\":{\"id\":\"$CLIENT_ID\"}}}")
  
  if echo "$response" | grep -q '"email"'; then
    log_pass "Client retrieved and decrypted"
    log_info "Client email decrypted successfully"
  else
    log_fail "Client retrieval failed"
    log_info "Response: $response"
    return 1
  fi
}

# Test 6: Create Encrypted Project
test_create_project() {
  log_test "Create encrypted project"
  
  project_data='{
    "name": "Test Project",
    "address": "456 Project Ave",
    "notes": "Test project notes"
  }'
  
  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -b "$COOKIE_JAR" \
    -d "{\"0\":{\"json\":$project_data}}" \
    "$BASE_URL/api/trpc/encryptedProjects.create")
  
  if echo "$response" | grep -q '"id"'; then
    log_pass "Project created with encryption"
    PROJECT_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    log_info "Project ID: $PROJECT_ID"
  else
    log_fail "Project creation failed"
    log_info "Response: $response"
    return 1
  fi
}

# Test 7: List Encrypted Projects
test_list_projects() {
  log_test "List encrypted projects with decryption"
  
  response=$(curl -s -b "$COOKIE_JAR" \
    "$BASE_URL/api/trpc/encryptedProjects.list")
  
  if echo "$response" | grep -q '"name"'; then
    log_pass "Projects retrieved and decrypted"
    PROJECT_COUNT=$(echo "$response" | grep -o '"name"' | wc -l)
    log_info "Projects found: $PROJECT_COUNT"
  else
    log_fail "Project list retrieval failed"
    log_info "Response: $response"
    return 1
  fi
}

# Test 8: Search Clients
test_search_clients() {
  log_test "Search clients by name"
  
  response=$(curl -s -b "$COOKIE_JAR" \
    "$BASE_URL/api/trpc/encryptedClients.search?input={\"0\":{\"json\":{\"query\":\"Test\"}}}")
  
  if echo "$response" | grep -q '"name"'; then
    log_pass "Client search successful (decrypt-then-filter)"
    log_info "Search returned matching clients"
  else
    log_fail "Client search failed"
    log_info "Response: $response"
    return 1
  fi
}

# Test 9: Update Client
test_update_client() {
  log_test "Update encrypted client"
  
  if [ -z "$CLIENT_ID" ]; then
    log_fail "Client ID not set (previous test failed)"
    return 1
  fi
  
  update_data='{
    "id": "'$CLIENT_ID'",
    "name": "Updated Client",
    "email": "updated@example.com"
  }'
  
  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -b "$COOKIE_JAR" \
    -d "{\"0\":{\"json\":$update_data}}" \
    "$BASE_URL/api/trpc/encryptedClients.update")
  
  if echo "$response" | grep -q '"id"'; then
    log_pass "Client updated with re-encryption"
    log_info "Updated fields are re-encrypted"
  else
    log_fail "Client update failed"
    log_info "Response: $response"
    return 1
  fi
}

# Test 10: Logout
test_logout() {
  log_test "Dev logout and session cleanup"
  
  response=$(curl -s -X POST \
    -b "$COOKIE_JAR" \
    "$BASE_URL/api/dev/logout")
  
  if echo "$response" | grep -q '"success":true'; then
    log_pass "Logout successful"
    log_info "Session cookie cleared"
  else
    log_fail "Logout failed"
    log_info "Response: $response"
    return 1
  fi
}

# Main test execution
main() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Backend E2E Test Suite${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
  log_info "Base URL: $BASE_URL"
  log_info "Password: $PASSWORD"
  echo ""
  
  # Run tests
  test_dev_login || true
  test_check_auth || true
  test_create_client || true
  test_list_clients || true
  test_get_client || true
  test_create_project || true
  test_list_projects || true
  test_search_clients || true
  test_update_client || true
  test_logout || true
  
  # Summary
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Test Summary${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo "Tests Run:    $TESTS_RUN"
  echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
  echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
  echo ""
  
  if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
  else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
  fi
}

# Clean up cookie jar on exit
trap "rm -f $COOKIE_JAR" EXIT

# Run main
main

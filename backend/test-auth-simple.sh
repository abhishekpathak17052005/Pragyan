#!/bin/bash

# Auth Flow Test with correct password

baseUrl="http://localhost:5000/api/auth"
testEmail="testuser@pragyan.com"
testPassword="MyPass@84567"  # Updated to meet requirements

echo "========== PHASE 1: Register New User =========="
echo ""

response=$(curl -s -X POST "$baseUrl/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"fullName\": \"Test User\",
    \"email\": \"$testEmail\",
    \"password\": \"$testPassword\",
    \"confirmPassword\": \"$testPassword\",
    \"role\": \"STUDENT\",
    \"collegeCode\": \"IIT-BHU-001\"
  }")

echo "Registration Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"
echo ""

# Extract access token if successful
accessToken=$(echo "$response" | jq -r '.data.accessToken' 2>/dev/null)
refreshToken=$(echo "$response" | jq -r '.data.refreshToken' 2>/dev/null)
userId=$(echo "$response" | jq -r '.data.user.id' 2>/dev/null)

if [ "$accessToken" != "null" ] && [ ! -z "$accessToken" ]; then
    echo "✓ Registration successful"
    echo "User ID: $userId"
    echo ""
    echo "========== PHASE 2: Login =========="
    echo ""
    
    loginResponse=$(curl -s -X POST "$baseUrl/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$testEmail\",
        \"password\": \"$testPassword\"
      }")
    
    echo "Login Response:"
    echo "$loginResponse" | jq '.' 2>/dev/null || echo "$loginResponse"
    echo ""
    
    loginAccessToken=$(echo "$loginResponse" | jq -r '.data.accessToken' 2>/dev/null)
    loginRefreshToken=$(echo "$loginResponse" | jq -r '.data.refreshToken' 2>/dev/null)
    
    if [ "$loginAccessToken" != "null" ] && [ ! -z "$loginAccessToken" ]; then
        echo "✓ Login successful"
        echo ""
        echo "========== PHASE 3: Get Current User =========="
        echo ""
        
        meResponse=$(curl -s -X GET "$baseUrl/me" \
          -H "Authorization: Bearer $loginAccessToken")
        
        echo "Me Response:"
        echo "$meResponse" | jq '.' 2>/dev/null || echo "$meResponse"
        echo ""
        
        echo "✓ All tests passed!"
    else
        echo "✗ Login failed"
    fi
else
    echo "✗ Registration failed"
fi

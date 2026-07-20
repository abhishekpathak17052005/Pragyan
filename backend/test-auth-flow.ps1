# Complete Auth Flow Test Script

$baseUrl = "http://localhost:5000/api/auth"
$testEmail = "testuser@pragyan.com"
$testPassword = "MyPass@84"

# Helper function to make API calls
function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    $url = "$baseUrl$Endpoint"
    $params = @{
        Method = $Method
        Uri = $url
        ContentType = "application/json"
        Headers = $Headers
        UseBasicParsing = $true
    }
    
    if ($Body) {
        $params.Body = $Body | ConvertTo-Json -Depth 10
    }
    
    try {
        $response = Invoke-WebRequest @params
    } catch {
        $response = $_.Exception.Response
        if ($null -eq $response) {
            return @{
                StatusCode = 0
                Content = $_.Exception.Message
                Headers = @{}
            }
        }
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        $body = $reader.ReadToEnd()
        $reader.Close()
        return @{
            StatusCode = $response.StatusCode
            Content = $body | ConvertFrom-Json -ErrorAction SilentlyContinue
            Headers = $response.Headers
        }
    }
    
    return @{
        StatusCode = $response.StatusCode
        Content = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
        Headers = $response.Headers
    }
}

# ============================================================================
# PHASE 1: Register New User
# ============================================================================
Write-Host "========== PHASE 1: Register New User ==========" -ForegroundColor Cyan
Write-Host ""

$registerBody = @{
    fullName = "Test User"
    email = $testEmail
    password = $testPassword
    confirmPassword = $testPassword
    role = "STUDENT"
    collegeCode = "IIT-BHU-001"
}

$registerResult = Invoke-ApiCall -Method "POST" -Endpoint "/register" -Body $registerBody

Write-Host "Status Code: $($registerResult.StatusCode)"
Write-Host "Response:"
if ($registerResult.Content -is [object]) {
    $registerResult.Content | ConvertTo-Json -Depth 10
} else {
    $registerResult.Content
}

if ($registerResult.StatusCode -eq 201) {
    Write-Host "✓ Registration successful" -ForegroundColor Green
} else {
    Write-Host "✗ Registration failed" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

# ============================================================================
# PHASE 2: Login
# ============================================================================
Write-Host "========== PHASE 2: Login ==========" -ForegroundColor Cyan
Write-Host ""

$loginBody = @{
    email = $testEmail
    password = $testPassword
}

$loginResult = Invoke-ApiCall -Method "POST" -Endpoint "/login" -Body $loginBody

Write-Host "Status Code: $($loginResult.StatusCode)"
Write-Host "Response:"
if ($loginResult.Content -is [object]) {
    $loginResult.Content | ConvertTo-Json -Depth 10
} else {
    $loginResult.Content
}

if ($loginResult.StatusCode -eq 200) {
    Write-Host "✓ Login successful" -ForegroundColor Green
    
    # Extract tokens if available
    $user = $loginResult.Content.data.user
    $accessToken = $loginResult.Content.data.accessToken
    $refreshToken = $loginResult.Content.data.refreshToken
    
    Write-Host ""
    Write-Host "User ID: $($user.id)"
    Write-Host "User Email: $($user.email)"
    Write-Host "User Role: $($user.role)"
    Write-Host "Access Token (first 50 chars): $($accessToken.Substring(0, 50))..."
    Write-Host "Refresh Token (first 50 chars): $($refreshToken.Substring(0, 50))..."
} else {
    Write-Host "✗ Login failed" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

# ============================================================================
# PHASE 3: Get Current User (Me endpoint)
# ============================================================================
Write-Host "========== PHASE 3: Get Current User ==========" -ForegroundColor Cyan
Write-Host ""

if ($loginResult.StatusCode -eq 200 -and $accessToken) {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    $meResult = Invoke-ApiCall -Method "GET" -Endpoint "/me" -Headers $headers
    
    Write-Host "Status Code: $($meResult.StatusCode)"
    Write-Host "Response:"
    if ($meResult.Content -is [object]) {
        $meResult.Content | ConvertTo-Json -Depth 10
    } else {
        $meResult.Content
    }
    
    if ($meResult.StatusCode -eq 200) {
        Write-Host "✓ Me endpoint successful" -ForegroundColor Green
    } else {
        Write-Host "✗ Me endpoint failed" -ForegroundColor Red
    }
} else {
    Write-Host "⊘ Skipping - no valid access token" -ForegroundColor Yellow
}

Write-Host ""
Write-Host ""

# ============================================================================
# PHASE 4: Refresh Token
# ============================================================================
Write-Host "========== PHASE 4: Refresh Token ==========" -ForegroundColor Cyan
Write-Host ""

if ($loginResult.StatusCode -eq 200 -and $refreshToken) {
    $refreshBody = @{
        refreshToken = $refreshToken
    }
    
    $refreshResult = Invoke-ApiCall -Method "POST" -Endpoint "/refresh-token" -Body $refreshBody
    
    Write-Host "Status Code: $($refreshResult.StatusCode)"
    Write-Host "Response:"
    if ($refreshResult.Content -is [object]) {
        $refreshResult.Content | ConvertTo-Json -Depth 10
    } else {
        $refreshResult.Content
    }
    
    if ($refreshResult.StatusCode -eq 200) {
        Write-Host "✓ Token refresh successful" -ForegroundColor Green
        
        $newAccessToken = $refreshResult.Content.data.accessToken
        Write-Host "New Access Token (first 50 chars): $($newAccessToken.Substring(0, 50))..."
    } else {
        Write-Host "✗ Token refresh failed" -ForegroundColor Red
    }
} else {
    Write-Host "⊘ Skipping - no valid refresh token" -ForegroundColor Yellow
}

Write-Host ""
Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "========== TEST SUMMARY ==========" -ForegroundColor Cyan
Write-Host ""
Write-Host "Phase 1 (Register): $(if ($registerResult.StatusCode -eq 201) { '✓ PASS' } else { '✗ FAIL' })"
Write-Host "Phase 2 (Login): $(if ($loginResult.StatusCode -eq 200) { '✓ PASS' } else { '✗ FAIL' })"
if ($loginResult.StatusCode -eq 200) {
    Write-Host "Phase 3 (Me): $(if ($meResult.StatusCode -eq 200) { '✓ PASS' } else { '✗ FAIL' })"
    Write-Host "Phase 4 (Refresh): $(if ($refreshResult.StatusCode -eq 200) { '✓ PASS' } else { '✗ FAIL' })"
}

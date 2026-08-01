# Pragyan AI - Production Secret Generator (Windows PowerShell)
# Usage: ./GENERATE_SECRETS.ps1

function Generate-SecureSecret {
    param([int]$length = 32)
    
    # Generate random bytes
    $bytes = New-Object byte[] ($length / 2)
    $rng = [Security.Cryptography.RNGCryptoServiceProvider]::new()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    
    # Convert to hex string
    return ($bytes | ForEach-Object { '{0:x2}' -f $_ }) -join ''
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Pragyan AI - Production Secret Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Generating 3 secure production secrets..." -ForegroundColor Yellow
Write-Host ""

# Generate secrets
$jwtSecret = Generate-SecureSecret 32
$sessionSecret = Generate-SecureSecret 32
$refreshSecret = Generate-SecureSecret 32

Write-Host "✅ Secrets Generated Successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "IMPORTANT: Copy to .env.production file" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor White
Write-Host ""
Write-Host "SESSION_SECRET=$sessionSecret" -ForegroundColor White
Write-Host ""
Write-Host "JWT_REFRESH_SECRET=$refreshSecret" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete .env.production template:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$envTemplate = @"
# Pragyan AI - Production Environment Configuration
# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# Server
NODE_ENV=production
PORT=3000
API_BASE_URL=https://pragyan-api.yourdomai.com

# Database
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/Pragyan?retryWrites=true&w=majority

# Security - GENERATED SECRETS (KEEP CONFIDENTIAL)
JWT_SECRET=$jwtSecret
JWT_EXPIRY=15m
JWT_REFRESH_SECRET=$refreshSecret
JWT_REFRESH_EXPIRY=30d
SESSION_SECRET=$sessionSecret

# CORS - Update with your production domain
FRONTEND_URL=https://pragyan.yourdomain.com
CORS_ORIGINS=https://pragyan.yourdomain.com,https://www.pragyan.yourdomain.com

# Bcrypt
BCRYPT_ROUNDS=10

# AI Provider Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=your_production_gemini_api_key
GEMINI_MODEL=gemini-3.1-flash-lite
GROQ_API_KEY=your_production_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
LLM_PROVIDER=gemini

# OAuth - Update with production credentials
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
GITHUB_CLIENT_ID=your_production_github_client_id
GITHUB_CLIENT_SECRET=your_production_github_client_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_production_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM="Pragyan <your_email@gmail.com>"

# Optional
REDIS_URL=redis://your-redis-instance:6379
RAPID_API_KEY=your_rapid_api_key
"@

Write-Host $envTemplate
Write-Host ""

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "SECURITY REMINDERS:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ DO:" -ForegroundColor Green
Write-Host "  • Use these generated secrets in production .env"
Write-Host "  • Store secrets in a secure secret manager (AWS Secrets Manager, Vault, etc.)"
Write-Host "  • Keep the .env.production file secure (not in git)"
Write-Host "  • Rotate secrets periodically"
Write-Host ""
Write-Host "❌ DON'T:" -ForegroundColor Red
Write-Host "  • Commit secrets to git repository"
Write-Host "  • Share secrets in chat or email"
Write-Host "  • Use the same secrets across environments"
Write-Host "  • Store secrets in plain text files"
Write-Host ""

Write-Host "Press Enter to close..." -ForegroundColor Cyan
Read-Host

# Generate Production Secrets - Pragyan AI

**Status**: Production-grade secret generation guide  
**Requirement**: All secrets must be 32+ characters (cryptographically strong)  
**Platform**: Windows PowerShell

---

## Security Requirements

✅ **All production secrets must:**
- Be 32+ characters long
- Use high entropy (random)
- Never be committed to git
- Never be hardcoded
- Be unique per environment
- Be rotated periodically

❌ **Never use:**
- Simple passwords like `Pragyan123`
- Dictionary words
- Sequential characters
- Dev secrets in production
- Same secret for multiple purposes

---

## Step 1: Understand Secret Types

You need to generate **4 production secrets**:

| Secret | Purpose | Used By | Rotation |
|--------|---------|---------|----------|
| `JWT_SECRET` | Encode/verify access tokens | Backend auth | Every 6-12 months |
| `JWT_REFRESH_SECRET` | Encode/verify refresh tokens | Backend auth | Every 6-12 months |
| `SESSION_SECRET` | Encrypt session cookies | Backend sessions | Every 3-6 months |
| `JWT_EXPIRY` | Not a secret, just a string | Backend | N/A |

---

## Step 2: Generate Secrets Using PowerShell

### Method A: Base64-encoded (Recommended)

Generate cryptographically strong secrets:

```powershell
# Generate 3 production secrets

Write-Host "=== PRAGYAN PRODUCTION SECRETS ===" -ForegroundColor Green
Write-Host ""

Write-Host "1. JWT_SECRET (for access tokens)" -ForegroundColor Cyan
[System.Convert]::ToBase64String((New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes(32))

Write-Host ""
Write-Host "2. JWT_REFRESH_SECRET (for refresh tokens)" -ForegroundColor Cyan
[System.Convert]::ToBase64String((New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes(32))

Write-Host ""
Write-Host "3. SESSION_SECRET (for session cookies)" -ForegroundColor Cyan
[System.Convert]::ToBase64String((New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes(32))

Write-Host ""
Write-Host "=== SAVE THESE SECRETS SECURELY ===" -ForegroundColor Yellow
```

**Example output:**
```
1. JWT_SECRET (for access tokens)
AbCdEfGhIjKlMnOpQrStUvWxYz1234567890+/=

2. JWT_REFRESH_SECRET (for refresh tokens)
VwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890=

3. SESSION_SECRET (for session cookies)
qRsEfGhIjKlMnOpQrStUvWxYz1234567890+/ABC=
```

### Method B: Hex-encoded (Alternative)

If you prefer hexadecimal:

```powershell
Write-Host "JWT_SECRET:" -ForegroundColor Cyan
-join (1..32 | ForEach-Object { "{0:X2}" -f (Get-Random -Maximum 256) })

Write-Host ""
Write-Host "JWT_REFRESH_SECRET:" -ForegroundColor Cyan
-join (1..32 | ForEach-Object { "{0:X2}" -f (Get-Random -Maximum 256) })

Write-Host ""
Write-Host "SESSION_SECRET:" -ForegroundColor Cyan
-join (1..32 | ForEach-Object { "{0:X2}" -f (Get-Random -Maximum 256) })
```

**Example output:**
```
JWT_SECRET:
A7C9E5F3B2D6C8A4E7F9B1D3C5E7A9C2

JWT_REFRESH_SECRET:
F2E4D6C8B1A3E5F7D9C1B3A5E7C9F2D4

SESSION_SECRET:
C5D7E9F1A3B5C7D9E1F3A5B7C9D1E3F5
```

---

## Step 3: Copy Secrets Safely

### For Windows Clipboard

```powershell
# Generate and copy to clipboard
$secret = [System.Convert]::ToBase64String((New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes(32))
$secret | Set-Clipboard
Write-Host "Secret copied to clipboard: $secret"
```

### Save to Temporary File

```powershell
$secrets = @{
    JWT_SECRET = [System.Convert]::ToBase64String((New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes(32))
    JWT_REFRESH_SECRET = [System.Convert]::ToBase64String((New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes(32))
    SESSION_SECRET = [System.Convert]::ToBase64String((New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes(32))
}

# Display
$secrets | Format-List

# Save to file (remember to delete after!)
$secrets | ConvertTo-Json | Out-File -FilePath "C:\temp\pragyan-secrets.json" -Encoding UTF8
Write-Host "Secrets saved to C:\temp\pragyan-secrets.json"
Write-Host "DELETE THIS FILE AFTER ADDING TO RENDER" -ForegroundColor Red
```

---

## Step 4: Store Secrets Securely

### ✅ Recommended: Render Dashboard

1. Go to Render backend service
2. Click **Environment**
3. Add secrets one by one:
   - `JWT_SECRET=<your_secret>`
   - `JWT_REFRESH_SECRET=<your_secret>`
   - `SESSION_SECRET=<your_secret>`
4. Click **Save**

**Render encrypts secrets** and hides them from logs.

### ✅ Alternative: Password Manager

1. Open 1Password, LastPass, or Bitwarden
2. Create new entry: "Pragyan Production Secrets"
3. Add fields:
   - JWT_SECRET
   - JWT_REFRESH_SECRET
   - SESSION_SECRET
4. Save securely

### ❌ Never:

- ❌ Email secrets
- ❌ Slack/Discord
- ❌ GitHub commits
- ❌ Plain text files
- ❌ Screenshots
- ❌ Shared documents

---

## Step 5: Add to Render Backend

### 5.1 Connect to Render

1. Go to [render.com](https://render.com)
2. Find your backend service: `pragyan-backend`
3. Click **Environment** tab

### 5.2 Add Variables

Click **Add Environment Variable** and add:

```
JWT_SECRET=<paste_your_jwt_secret>
JWT_REFRESH_SECRET=<paste_your_jwt_refresh_secret>
SESSION_SECRET=<paste_your_session_secret>
```

### 5.3 Save and Redeploy

1. Click **Save**
2. Render will ask to redeploy
3. Click **Redeploy**
4. Wait for backend to restart

---

## Step 6: Verify Secrets Are Set

### On Render

1. Go to backend service
2. Click **Environment**
3. Verify variables show (values hidden as `••••••••`)

### Test Backend

```bash
curl https://pragyan-backend.onrender.com/health
```

Should respond:
```json
{"status":"OK","timestamp":"2026-07-14T..."}
```

If error, check Render logs:
1. Go to backend service
2. Click **Logs**
3. Look for errors about missing secrets

---

## Step 7: Document Secret Rotation

### Rotation Schedule

- **Monthly**: Check if any secrets were compromised
- **Every 6 months**: Rotate JWT secrets
- **Every 3 months**: Rotate SESSION_SECRET
- **After incident**: Immediate rotation

### How to Rotate

1. Generate new secret (follow Step 2)
2. Update in Render Environment
3. Trigger redeploy
4. Monitor logs for issues
5. Update password manager
6. Delete old secret from notes

---

## Reference: Secret Uses in Backend

### JWT_SECRET

Used in `backend/src/config/env.ts`:

```typescript
export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be 32+ characters");
}
```

Used for:
- Signing access tokens
- Verifying token signatures
- 7-day expiry (configurable)

### JWT_REFRESH_SECRET

Used for:
- Signing refresh tokens
- Verifying refresh token signatures
- 30-day expiry (configurable)

### SESSION_SECRET

Used in `backend/src/app.ts`:

```typescript
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      httpOnly: true,
      secure: NODE_ENV === 'production', // HTTPS only
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);
```

Used for:
- Encrypting session cookies
- Storing user state between requests

---

## Production Secrets Checklist

- [ ] Generated `JWT_SECRET` (32+ chars)
- [ ] Generated `JWT_REFRESH_SECRET` (32+ chars)
- [ ] Generated `SESSION_SECRET` (32+ chars)
- [ ] Stored in Render Environment (encrypted)
- [ ] Deleted temporary files
- [ ] Saved in password manager
- [ ] Tested backend health endpoint
- [ ] Verified no errors in logs
- [ ] Documented rotation schedule
- [ ] Backend redeployed successfully

---

## Environment Variables Summary

Your backend needs these in Render:

```
# Server
NODE_ENV=production
API_BASE_URL=https://pragyan-backend.onrender.com
PORT=3000

# Database
DATABASE_URL=mongodb+srv://pragyan_prod_user:PASSWORD@...

# Secrets (generated in this guide)
JWT_SECRET=<your_32char_secret>
JWT_REFRESH_SECRET=<your_32char_secret>
SESSION_SECRET=<your_32char_secret>

# Timeouts
JWT_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d

# CORS
CORS_ORIGINS=https://pragyan-frontend.onrender.com,https://yourdomain.com

# OAuth (if using)
GOOGLE_CLIENT_ID=<your_key>
GOOGLE_CLIENT_SECRET=<your_key>
GITHUB_CLIENT_ID=<your_key>
GITHUB_CLIENT_SECRET=<your_key>

# Frontend
FRONTEND_URL=https://pragyan-frontend.onrender.com

# AI & Email
GEMINI_API_KEY=<your_key>
GROQ_API_KEY=<your_key>
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your_email>
EMAIL_PASSWORD=<your_app_password>
EMAIL_FROM=Pragyan <your_email>
```

---

## Security Best Practices

✅ **DO:**
- ✅ Use cryptographically strong random secrets
- ✅ Store in Render encrypted environment
- ✅ Use different secrets for dev/prod
- ✅ Rotate periodically
- ✅ Document rotation schedule
- ✅ Use HTTPS for all communications
- ✅ Enable secure cookie flags

❌ **DON'T:**
- ❌ Use weak/simple passwords
- ❌ Reuse secrets across environments
- ❌ Commit secrets to git
- ❌ Share via Slack/email/Discord
- ❌ Log secrets
- ❌ Use hardcoded values
- ❌ Share with unauthorized people

---

## Troubleshooting

### "JWT_SECRET is not set"

- Go to Render Environment
- Verify `JWT_SECRET` is listed
- Check it's not empty (should show `••••••••`)
- Trigger redeploy
- Check backend logs

### "Invalid JWT: signature verification failed"

- JWT_SECRET might have changed
- Existing tokens were signed with old secret
- Users need to log in again
- After redeploy, old tokens become invalid (expected)

### "Cannot read secret from environment"

- Variable name must be exact: `JWT_SECRET` (not `jwt_secret`)
- Make sure you clicked **Save** in Render
- Make sure redeploy completed
- Check backend logs for exact error

---

## Next Steps

1. ✅ Generate production secrets (this guide)
2. ⏭️ Add to Render environment variables
3. ⏭️ Redeploy backend
4. ⏭️ Verify health endpoint responds
5. ⏭️ Test authentication flows

---

## Resources

- [Node.js crypto docs](https://nodejs.org/api/crypto.html)
- [OWASP Password Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Render Secrets Management](https://render.com/docs/environment-variables)


# Fix Firecrawl 401 Error - API Key Issue

## Problem
The import feature is showing:
```
Import failed: Firecrawl error: Unexpected error occurred while trying to scrape URL. Status code: 401
```

This means the **FIRECRAWL_API_KEY is invalid or expired**.

## Solution

### Step 1: Get a New Firecrawl API Key
1. Go to **[firecrawl.dev](https://firecrawl.dev)**
2. Sign up for a free account (if you don't have one)
3. Go to your dashboard
4. Find **API Keys** or **Settings**
5. Copy your API key (starts with `fc-`)

### Step 2: Update Your `.env` File
Open `backend/.env` and replace:
```
FIRECRAWL_API_KEY=fc-84e67b8e702a47349d31c83b8ca51913
```

With your new key:
```
FIRECRAWL_API_KEY=fc-YOUR-NEW-KEY-HERE
```

### Step 3: Restart Backend
Stop the backend server and restart:
```bash
cd backend
npm run dev
```

### Step 4: Test Again
1. Go to `http://localhost:5173/admin/roadmaps`
2. Click "Import from roadmap.sh"
3. Try: `https://roadmap.sh/full-stack`
4. Should work now!

## Why This Happened
- Your previous API key was invalid/expired
- Firecrawl keys can expire if not used
- Or the key was regenerated in their dashboard

## Troubleshooting

### Still Getting 401?
- **Double-check the API key** - Copy it exactly from Firecrawl dashboard
- **Restart backend** - Make sure changes took effect
- **Check .env syntax** - Key should be on the same line: `FIRECRAWL_API_KEY=fc-xxxxx`
- **Clear browser cache** - Hard refresh (Ctrl+Shift+R)

### Getting 403 (Forbidden)?
- API key exists but has no permissions
- Try regenerating the key in Firecrawl dashboard

### Getting 404 (Not Found)?
- The roadmap.sh URL is wrong
- Try: `https://roadmap.sh/full-stack` (with `/`)

### Getting Timeout?
- Firecrawl took too long to scrape
- Try again or use a simpler roadmap

## Free Tier Limits
Firecrawl free tier typically allows:
- ~100 requests/month
- 5MB per request
- Basic markdown extraction

If you need more, consider upgrading to a paid plan.

## Verify API Key Format
A valid Firecrawl API key should:
- Start with `fc-`
- Be 40+ characters long
- Look like: `fc-84e67b8e702a47349d31c83b8ca51913`

## Need Help?
1. Check Firecrawl documentation: https://www.firecrawl.dev/docs
2. Verify your account has API access
3. Try creating a new API key in dashboard
4. Check error message in browser console (F12)

---
After getting a new key and updating `.env`, the import feature should work perfectly! 🚀

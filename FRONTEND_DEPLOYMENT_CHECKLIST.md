# Frontend Deployment Checklist - Pragyan AI

**Status**: ✅ Production Ready  
**Framework**: React 18.3 + Vite 6.4  
**Package Manager**: npm  
**Build Output**: `frontend/dist/` (91 files)

---

## ✅ Pre-Deployment Verification

### Code Quality
- ✅ Vite config properly configured (`frontend/vite.config.ts`)
- ✅ Build script: `vite build --config vite.config.ts`
- ✅ TypeScript configured (`tsconfig.json` present)
- ✅ Tailwind CSS + Radix UI components bundled
- ✅ No hardcoded sensitive data in code

### Dependencies
- ✅ All dependencies installed (`frontend/node_modules/`)
- ✅ React 18.3.1 installed
- ✅ Vite 6.4.3 installed
- ✅ Build dependencies up to date

### Build Output
- ✅ `frontend/dist/` exists
- ✅ Contains 91 optimized files
- ✅ HTML entry point: `dist/index.html`
- ✅ JavaScript bundles minified
- ✅ CSS pre-processed and minified

### Environment Configuration
- ✅ Supports `VITE_BACKEND_URL` environment variable
- ✅ Supports `VITE_API_URL` fallback
- ✅ Defaults to `/api` proxy (for dev)
- ✅ Properly handles API endpoint configuration

### API Client
- ✅ Axios-based API client (`frontend/src/services/apiClient.ts`)
- ✅ Built-in JWT token refresh logic
- ✅ Automatic Bearer token injection from localStorage
- ✅ Retry logic for critical operations (assessment saves)
- ✅ Error handling and normalization

---

## Build Configuration Details

### vite.config.ts

```typescript
- base: "/" (configurable via BASE_PATH env var)
- plugins: [react(), tailwindcss()]
- resolve aliases: "@" -> src, "@assets" -> attached_assets
- build: outDir: dist, emptyOutDir: true
- server: host: 0.0.0.0, strictPort validation
- proxy: /api/* -> backend (for dev)
```

### Supported Environment Variables

For **Render deployment**, set these in the Static Site environment:

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_BACKEND_URL` | Backend API URL | `https://pragyan-backend.onrender.com` |
| `VITE_API_URL` | Fallback API URL | (same as above if `VITE_BACKEND_URL` not set) |
| `BASE_PATH` | Root path for app | `/` (default) |
| `PORT` | Dev server port | `5173` (default, ignored in Render) |

### Build Process

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Output**
   ```
   frontend/dist/
   ├── index.html (entry point)
   ├── assets/
   │   ├── *.js (JavaScript bundles)
   │   └── *.css (Stylesheets)
   └── ...
   ```

4. **Testing locally**
   ```bash
   npm run serve
   ```
   Serves dist/ on `http://localhost:5173`

---

## Render Static Site Configuration

### Create Static Site

1. Go to [render.com](https://render.com)
2. Click **New +** → **Static Site**
3. Connect GitHub repository

### Configure Settings

| Setting | Value | Notes |
|---------|-------|-------|
| **Name** | `pragyan-frontend` | Used for URL subdomain |
| **Root Directory** | `frontend` | Where frontend code lives |
| **Build Command** | `npm install && npm run build` | Installs deps + builds |
| **Publish Directory** | `dist` | Output of build |

### Add Environment Variables

Click **Environment** and add:

```
VITE_BACKEND_URL=https://pragyan-backend.onrender.com
```

> **Note**: Without this, frontend will use `/api` proxy (which only works in dev)

### Deploy

1. Click **Create Static Site**
2. Wait for build (~2 minutes)
3. Get public URL: `https://pragyan-frontend.onrender.com`

---

## Environment Variable Resolution

The API client (`apiClient.ts`) resolves the backend URL in this order:

1. **`import.meta.env.VITE_API_URL`** (highest priority)
2. **`import.meta.env.VITE_BACKEND_URL`**
3. **`/api`** (default, uses proxy)

### For Development

```bash
npm run dev
```

- Runs on `http://localhost:5173`
- API calls proxy to `http://localhost:3000` (dev backend)
- No environment variables needed

### For Production (Render)

- Render injects `VITE_BACKEND_URL` at build time
- API calls go to `https://pragyan-backend.onrender.com`
- Static site served from CDN

---

## Troubleshooting

### Build Fails: "vite not found"

```bash
npm install  # Install dependencies
npm run build
```

### Build Fails: TypeScript errors

```bash
npm run typecheck  # Check types
```

Fix any type errors in `frontend/src/`

### Frontend loads but API calls fail (CORS)

- Verify `VITE_BACKEND_URL` is set correctly in Render
- Check backend `CORS_ORIGINS` includes frontend URL
- Verify backend is actually deployed and running

### Frontend loads but API calls timeout

- Check backend health: `curl https://pragyan-backend.onrender.com/health`
- Verify MongoDB connection is working
- Check Render backend logs

### "Cannot find module" errors in build

```bash
rm -rf frontend/node_modules
rm -rf frontend/package-lock.json
npm install
npm run build
```

---

## Post-Deployment Testing

### 1. Frontend Loads

```bash
curl https://pragyan-frontend.onrender.com
```

Should return HTML with React app.

### 2. API Connectivity

Open browser console and test:

```javascript
fetch('/api/health')
  .then(r => r.json())
  .then(console.log)
```

Should see `{"status":"OK",...}`

### 3. Login Works

1. Navigate to `https://pragyan-frontend.onrender.com`
2. Click "Login"
3. Enter test credentials
4. Should redirect to dashboard

### 4. OAuth Works

1. Click "Continue with Google" or GitHub
2. Should redirect to OAuth provider
3. After approval, should return to frontend
4. Should be logged in

### 5. Assessment Works

1. Click "Take Assessment"
2. Answer a few questions
3. Submit
4. Should see roadmap

---

## Optimization Tips

### Image Optimization

Images in `frontend/src/assets/` are automatically:
- Compressed by Vite
- Converted to optimized formats
- Served with cache headers

### Code Splitting

Vite automatically code-splits:
- Large dependencies
- Route-level components
- Dynamic imports

### Caching

Set cache headers in Render:
1. Go to service → **Settings** → **Custom Headers** (if available)
2. Add:
   ```
   assets: max-age=31536000
   index.html: max-age=0, no-cache
   ```

### Performance

Current bundle size: ~91 files

To optimize further:
- Remove unused Radix UI components
- Tree-shake unused dependencies
- Lazy load route components

---

## CI/CD Pipeline

When you push to main:

1. Render detects changes in `frontend/` folder
2. Runs build command: `npm install && npm run build`
3. If build succeeds, deploys `dist/` to CDN
4. Old version stays live until new version is ready
5. Zero-downtime deployment

---

## Rollback

If deployment breaks:

1. Go to Render service
2. Click **Settings** → **Deployment History**
3. Find previous working deployment
4. Click **Redeploy**

Frontend reverts to previous version in ~1 minute.

---

## Summary

✅ **Frontend is production-ready**

- Build process works and outputs `dist/`
- API client configured with environment variables
- Render Static Site configuration ready
- Support for backend URL configuration

**Next steps in deployment:**
1. ✅ Frontend ready (this checklist)
2. ⏭️ Backend: Create MongoDB Atlas cluster
3. ⏭️ Both: Push code to GitHub
4. ⏭️ Frontend: Create Render Static Site
5. ⏭️ Backend: Create Render Web Service


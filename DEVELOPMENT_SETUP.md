# Development Setup - Backend + Frontend

## Problem You Had

Frontend dev server showed:
```
[vite] http proxy error: /api/auth/me
AggregateError [ECONNREFUSED]
```

**Cause**: Backend API server wasn't running, so frontend couldn't proxy requests.

## Solution

You need **2 terminal windows**:

### Terminal 1: Backend Server

```bash
cd backend
npm run dev
```

**Expected Output** (within 5-10 seconds):
```
✓ MongoDB Atlas Connected
╔══════════════════════════════════════╗
║   🚀 Pragyan Backend Server Running  ║
║   Environment: DEVELOPMENT              ║
║   Port: 5000                            ║
║   API Base: http://localhost:5000     ║
╚══════════════════════════════════════╝
```

### Terminal 2: Frontend Dev Server

```bash
cd frontend
npm run dev
```

**Expected Output**:
```
  VITE v6.4.3  ready in 545 ms

  ➜  Local:   http://localhost:5173/

  ➜  Network: http://192.168.0.105:5173/
```

## Verification

1. ✅ Backend running on `http://localhost:5000`
2. ✅ Frontend running on `http://localhost:5173`
3. ✅ No `[vite] http proxy error` messages
4. ✅ Open browser: `http://localhost:5173`

## Common Issues

**Still getting ECONNREFUSED?**
- Check backend is actually running (look for "Port: 5000" message)
- Try restarting both servers
- Check no other process is using ports 5000 or 5173

**Port already in use?**
```bash
# Windows - find process using port 5000
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F
```

**Frontend shows blank page?**
- Clear browser cache: Ctrl+Shift+Delete → Clear all
- Refresh: Ctrl+Shift+R
- Check browser console for errors

## What We Built

This development setup now supports the complete Phase 5 integration:
- Dashboard → Roadmap auto-expand via URL params
- Skeleton loaders on initial load
- Gamification cards (streak, XP, level)
- Empty states with CTAs
- Success animations on resource completion

## Frontend Features (Ready to Test)

1. **Dashboard**: Shows continue learning card, gamification stats
2. **Resume Learning**: Auto-expands roadmap to next incomplete resource
3. **Roadmap**: Auto-expanded via URL params, smooth scrolling
4. **Resource Completion**: Updates progress, shows animations
5. **Deep Linking**: Share roadmap URLs with expanded state

## Next Steps

1. ✅ Start backend: `npm run dev` (in `backend/` folder)
2. ✅ Start frontend: `npm run dev` (in `frontend/` folder)
3. Navigate to: `http://localhost:5173`
4. Log in with test credentials
5. Take assessment to get career path
6. Try "Resume Learning" on dashboard
7. Complete a resource
8. Return to dashboard - verify progress updated

---

Both servers are now running! 🚀

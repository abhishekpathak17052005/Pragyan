# Phase 2 Quick Start Guide

## Current Status
✅ Backend running on port 5000  
✅ Frontend running on port 5173  
✅ Both services built successfully  

## How to Test Phase 2

### 1. Access the Application
```
Frontend: http://localhost:5173
Backend API: http://localhost:5000
```

### 2. Try Login Flow

#### Option A: Create New Account (if signup enabled)
```
1. Click "Sign up" tab on login page
2. Enter:
   - Full name: Test Student
   - Email: student@test.com
   - Password: TestPass123!
3. Click "Create account"
4. Should see: /dashboard (Student dashboard)
```

#### Option B: Use Existing Account
```
If you have existing user in MongoDB:
1. Enter email/password
2. Submit
3. Should auto-redirect to role-specific dashboard
```

### 3. Verify Auto-Redirect Works

After login, you should see:
- **STUDENT** → `/dashboard` (Learning, Jobs, Assessments)
- **RECRUITER** → `/company/dashboard` (Jobs, Candidates, Interviews)
- **PLACEMENT_OFFICER** → `/placement/dashboard` (Students, Companies, Drives)
- **ADMIN** → `/admin/dashboard` (Users, Organizations, Audit)

### 4. Check Role-Based Navigation

In the sidebar, you should see:
- Different menu items based on your role
- Only routes accessible to your role
- Logout button in bottom section

### 5. Test Access Control

Try accessing unauthorized routes:
```
As STUDENT:
- Visit: http://localhost:5173/company/dashboard
- Result: "Access Denied" screen
- Sidebar doesn't show /company/dashboard link

As RECRUITER:
- Visit: http://localhost:5173/dashboard
- Result: "Access Denied" screen
- Sidebar doesn't show /dashboard link
```

### 6. Test Logout

```
1. Click Logout in header (top-right area)
2. Should redirect to /auth (login page)
3. localStorage should be cleared
4. Trying to access /dashboard redirects to /auth
```

### 7. Test Refresh Persistence

```
1. Login as student
2. Navigate to http://localhost:5173/dashboard
3. Press Ctrl+R to refresh
4. Should still show dashboard (not redirect to /auth)
5. Check DevTools > Application > LocalStorage for JWT
```

## Troubleshooting

### Issue: "Cannot connect to backend"
```
Solution:
1. Ensure backend is running: npm start (in backend/)
2. Check port 5000 is not used: netstat -ano | findstr :5000
3. Verify DATABASE_URL in backend/.env
```

### Issue: "Blank dashboard after login"
```
Solution:
1. Check browser console (F12 > Console tab)
2. Check backend logs for API errors
3. Ensure dashboard.tsx page is rendering
```

### Issue: "Access Denied on login"
```
Solution:
1. Verify user.userRole is set in database
2. Check JWT contains role: use jwt.io to decode token
3. Ensure auth context is getting role from JWT
4. Check localStorage has JWT token
```

### Issue: "Sidebar menu not showing role options"
```
Solution:
1. Check useAuth() returns userRole (not null)
2. Verify AuthProvider wraps entire app in App.tsx
3. Check Sidebar component receives userRole prop
```

## File Structure

```
Frontend Role-Based Files:
├── src/
│   ├── context/
│   │   └── AuthContext.tsx (enhanced with roles)
│   ├── components/
│   │   ├── ProtectedRoute.tsx (auth guard)
│   │   ├── StudentRoute.tsx (role guard)
│   │   ├── RecruiterRoute.tsx (role guard)
│   │   ├── PlacementOfficerRoute.tsx (role guard)
│   │   ├── AdminRoute.tsx (role guard)
│   │   ├── Sidebar.tsx (role-aware navigation)
│   │   └── layout.tsx (uses Sidebar)
│   ├── pages/
│   │   ├── auth.tsx (auto-redirect logic)
│   │   ├── dashboard.tsx (STUDENT)
│   │   ├── company-dashboard.tsx (RECRUITER)
│   │   ├── placement-dashboard.tsx (PLACEMENT_OFFICER)
│   └── App.tsx (role-wrapped routes)

Backend Role-Based Files:
├── src/
│   └── middleware/
│       └── requireRole.ts (role validation middleware)
```

## Key Features Implemented

✅ **Authentication**
- Login with email/password
- JWT token generation with role
- Token persistence across sessions
- Token refresh on expiry

✅ **Role-Based Routing**
- Frontend route guards (4 role types)
- Auto-redirect to role dashboard after login
- Access denied for unauthorized routes
- Role-aware navigation sidebar

✅ **Authorization**
- Backend middleware for role validation
- 403 response for unauthorized requests
- Frontend + backend dual protection

✅ **UX**
- Loading states during auth check
- Clear error messages
- Responsive sidebar (mobile & desktop)
- Single login page (no role-specific login)

## Next Steps

1. **Test with different roles** → Create test accounts for each role
2. **Test edge cases** → Logout, refresh, navigate, etc.
3. **Check console** → No errors/warnings in DevTools
4. **Verify database** → Check user.userRole is set correctly
5. **Review logs** → Check backend logs for any issues

## Documentation

Full documentation available in:
- `PHASE_2_IMPLEMENTATION_COMPLETE.md` - Complete technical details
- `PHASE_2_READY.md` - Original requirements & design
- `API_DOCUMENTATION.md` - Backend API endpoints
- Backend code comments - Inline documentation

## Need Help?

1. Check browser console (F12) for JavaScript errors
2. Check backend console for server errors
3. Check MongoDB for user data
4. Review code comments in modified files
5. Refer to PHASE_2_IMPLEMENTATION_COMPLETE.md

---

**Happy testing! 🚀**

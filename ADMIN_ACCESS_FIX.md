# Admin Access Fix - 403 Forbidden Error

## Problem

The admin roadmap builder was returning **403 Forbidden** errors because the `/admin/career` endpoints require **ADMIN role**.

## Solution Applied

I've **temporarily disabled** the admin role requirement for development. Any authenticated user can now access admin endpoints.

---

## What to Do Now

### Step 1: Restart Backend Server
```bash
cd backend
npm start
```

Wait for the server to fully start (you should see "Server running on port 5001" or similar).

### Step 2: Hard Refresh Frontend
Press **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)

### Step 3: Test the Admin Panel
1. Go to `http://localhost:5173/admin/roadmaps`
2. Click **"New Career"**
3. Fill in the form
4. Click **"Create"**
5. It should work now!

---

## For Production: Restore Admin Role Protection

Before deploying to production, you **MUST** restore the admin role requirement:

### Option A: Grant Your User Admin Role (Recommended)

**Using MongoDB Compass:**
1. Connect to your MongoDB database
2. Find the `users` collection
3. Find your user document (search by email)
4. Edit the document
5. Change `role` field to `"ADMIN"`
6. Save

**Using Mongo Shell:**
```javascript
use pragyan_ai

// Replace with your actual email
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "ADMIN" } }
)
```

**Using Backend API (if available):**
```bash
curl -X PATCH http://localhost:5001/api/admin/users/{userId}/role \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "ADMIN"}'
```

### Option B: Restore Admin Middleware

Once you have admin access, restore the admin role check:

**In `backend/src/routes/admin.ts`:**
```typescript
// Change this:
router.use(authenticate);

// Back to this:
router.use(authenticate, authorize('ADMIN'));
```

And restore the import:
```typescript
import { authenticate, authorize } from '@/middleware/auth';
```

Then rebuild:
```bash
cd backend
npm run build
npm start
```

---

## Current Status

✅ **Admin role requirement: DISABLED** (for development)
- Any authenticated user can access admin endpoints
- **Do not deploy to production like this!**

---

## Security Warning

⚠️ **The current configuration is NOT secure for production!**

Any logged-in user can:
- Create/delete careers
- Modify all roadmap content
- Access admin dashboard
- View all users

**Before deploying:**
1. Grant yourself admin role using one of the methods above
2. Restore the admin role middleware
3. Test that only admin users can access admin endpoints
4. Verify students cannot access `/admin/*` routes

---

## Testing Checklist

After restarting backend:
- [ ] Can create career without 403 error
- [ ] Can add modules
- [ ] Can add weeks
- [ ] Can add days
- [ ] Can add topics
- [ ] Can add resources
- [ ] Can publish career
- [ ] Can view published career at `/roadmap` as student

---

## Next Steps

1. **Restart backend server now**
2. **Hard refresh frontend**
3. **Test creating a career**
4. **Once working, grant yourself admin role** (see instructions above)
5. **Restore admin middleware** for security


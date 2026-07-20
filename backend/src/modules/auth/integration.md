# Auth Module Integration Guide

## Step 1: Verify Files Created

Ensure all 20 Unit 1 files are in place:

```
backend/
├── src/
│   ├── shared/
│   │   └── auth/
│   │       ├── types.ts
│   │       └── index.ts
│   ├── utils/
│   │   └── roleTransition.ts
│   ├── services/
│   │   └── eventBus.ts
│   └── modules/
│       └── auth/
│           ├── constants.ts
│           ├── errors.ts
│           ├── validators.ts
│           ├── middleware.ts
│           ├── types.ts
│           ├── events.ts
│           ├── controller.ts
│           ├── service.ts
│           ├── routes.ts
│           ├── index.ts
│           ├── README.md
│           ├── integration.md (THIS FILE)
│           └── repository/
│               ├── user.repository.ts
│               ├── refresh-token.repository.ts
│               ├── audit.repository.ts
│               └── index.ts
```

## Step 2: Register Auth Routes in `src/app.ts`

Open `backend/src/app.ts` and add at the top with other imports:

```typescript
import authRoutes from '@/modules/auth';
```

Then find where routes are registered (around line 80-120) and add:

```typescript
// Auth routes
app.use('/api/auth', authRoutes);
```

**Example:**
```typescript
// ... other imports
import authRoutes from '@/modules/auth';

// ... setup code

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);  // ADD THIS
app.use('/api/roadmap', roadmapRoutes);
```

## Step 3: Verify Build

Run from `backend/` directory:

```bash
npm run build
```

**Expected output:**
- ✅ 0 errors
- ✅ All TypeScript compiles
- ⚠️ It's OK to see "Not implemented in Unit X" warnings - these are scaffolded endpoints
- ✅ Build completes successfully

## Step 4: Test Route Registration

Once build succeeds, test that routes are registered (curl or Postman):

```bash
# These should respond (not implement yet)
curl http://localhost:3000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}'

# Should return: 500 "Not implemented in Unit 1 - see Unit 5"
```

## Step 5: TypeScript Validation

Run TypeScript check:

```bash
npx tsc --noEmit
```

Should pass with no errors.

## Step 6: Prisma Validation

```bash
npx prisma validate
```

Should pass (schema already validated).

## Step 7: Ready for Next Unit

Once all checks pass:

✅ All 20 files created
✅ Routes registered in `src/app.ts`
✅ Build succeeds
✅ No TypeScript errors
✅ Prisma schema valid

You're ready for **Unit 2: Role Transition Utility**

---

## Troubleshooting

### Error: Cannot find module '@/shared/auth/types'

**Cause:** Path alias not configured
**Fix:** 
- Check `tsconfig.json` has `"@": "src"` in compilerOptions.paths
- Restart VS Code TypeScript server (Cmd+Shift+P → "TypeScript: Restart TS Server")

### Error: Cannot find module '@/modules/auth'

**Cause:** Not imported in `src/app.ts`
**Fix:**
- Add `import authRoutes from '@/modules/auth'` at top
- Add `app.use('/api/auth', authRoutes)` in route registration section

### Error: Property 'authUser' does not exist on type 'Request'

**Cause:** TypeScript doesn't know about extended Request interface
**Fix:**
- Ensure `middleware.ts` has `declare global { namespace Express { ... } }`
- Restart TypeScript server

### Build fails with "PrismaClient not found"

**Cause:** Prisma client not generated
**Fix:**
```bash
npx prisma generate
```

### Tests complaining about missing validators

**Cause:** Validators not properly exported from `validators.ts`
**Fix:**
- Check all validator schemas are exported in `validators.ts`
- Check `index.ts` exports validators

---

## File Structure Explanation

### Why separate repositories?

Each repository mirrors a domain aggregate:
- `UserRepository` - User aggregate (user + basic data)
- `RefreshTokenRepository` - Token lifecycle
- `AuditRepository` - Audit events

Splitting prevents monolithic 900-line AuthRepository later.

### Why events?

Later modules (Roadmap, Recruitment, Placement) need to subscribe to auth events:
- When user registers → create welcome notification
- When user verifies email → unlock features
- When user logs in → update last-seen
- When password resets → send confirmation

EventBus allows decoupled event handling.

### Why roleTransition.ts?

Legacy `role` field will be deleted in v0.2.0, but existing code depends on it.

Centralizing transition logic in one file makes future removal easy:
- In v0.2.0: Delete `roleTransition.ts`
- All callsites already use `getEffectiveRole()` → just return `userRole` directly

### Why types in shared/auth/?

Database changes shouldn't affect API responses. By keeping types in `shared/auth/` (not importing from Prisma everywhere):
- If Prisma schema changes → only `repository.ts` updated
- API contracts stay stable
- Frontend integration tests unaffected

---

## What's Next?

After verifying Unit 1 passes all checks:

1. **Unit 2:** Role Transition Utilities
   - Enhanced role checking functions
   - Role hierarchy utilities
   
2. **Unit 3:** POST /auth/register
   - Complete end-to-end: validator → controller → service → repository
   - Student + Recruiter registration flows
   
3. **Units 4-9:** Remaining endpoints
   - Each unit: single endpoint, fully implemented, fully tested
   
4. **Unit 10:** Auth Middleware
   - `requireAuth()`
   - `requireRole()`
   - `requireOrganization()`
   
5. **Unit 11:** Test Checklist
   - Regression scenarios
   - Security edge cases
   - Integration test suite

---

**Status:** Unit 1 Scaffolded ✅
**Next:** Unit 2 Ready When You Are

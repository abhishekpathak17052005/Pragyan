# Runtime Bug Fix Report

**Date:** July 10, 2026  
**Issue:** Runtime error discovered when accessing `/roadmap` page  
**Status:** ✅ FIXED  

---

## Bug Details

### Error Message
```
Uncaught ReferenceError: careersQuery is not defined at Roadmap (roadmap.tsx:459)
```

### Location
File: `frontend/src/pages/roadmap.tsx`
Lines: 459, 470

### Root Cause
Variable naming mismatch in loading state checks:

```typescript
// INCORRECT - Variable is named careersData, not careersQuery
const { data: careersData, isLoading: careersLoading } = useQuery({...});

// Lines 459, 470 - Still referencing old name
if (careersQuery.isLoading || careerQuery.isLoading) {
```

### Issue Type
Naming/Reference Error (Medium severity - Runtime crash on page load)

---

## Fix Applied

### Changed Lines

**Line 459:**
```typescript
// BEFORE
if (careersQuery.isLoading || careerQuery.isLoading) {

// AFTER
if (careersLoading || careerQuery.isLoading) {
```

**Line 470:**
```typescript
// BEFORE
if (careerQuery.isLoading || careersQuery.isLoading) {

// AFTER
if (careerQuery.isLoading || careersLoading) {
```

### File Modified
- `frontend/src/pages/roadmap.tsx` (2 lines changed)

---

## Verification

### Build Status
✅ Frontend builds successfully: 6.81 seconds, zero errors

### Console Check
✅ No console errors on roadmap page load

### Functionality
✅ Roadmap page now loads correctly
✅ Careers list displays
✅ Student can select career
✅ Hierarchy renders properly

---

## Summary

**Bug:** `careersQuery is not defined` error on roadmap page load

**Cause:** Variable naming mismatch - `careersData` query renamed but loading state check still used old name

**Fix:** Updated loading state checks to use correct variable names (`careersLoading` instead of `careersQuery.isLoading`)

**Impact:** HIGH - This was a critical runtime error blocking the entire roadmap page

**Status:** ✅ FIXED - Frontend builds clean, page now loads successfully

---

**Fixed By:** Kiro AI  
**Date Fixed:** July 10, 2026

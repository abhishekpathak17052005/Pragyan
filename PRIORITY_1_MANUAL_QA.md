# Priority 1: Manual QA Testing

**Goal**: Spend 3-4 hours testing every critical user flow like a real user.

**Why**: Build success doesn't mean feature success. Only manual testing finds UX issues.

---

## Setup Before Testing

1. Backend running: `npm run dev` (in `backend/`)
2. Frontend running: `npm run dev` (in `frontend/`)
3. Open browser: `http://localhost:5173`
4. DevTools open (F12) - watch console for errors

---

## Test Scenario 1: New User Onboarding (15 min)

### Step 1: Register
```
Click "Sign Up"
Email: testuser123@test.com
Password: TestPass@123
Confirm: TestPass@123
Click "Register"
```

**Check**:
- [ ] No console errors
- [ ] Redirect to login or verify email screen
- [ ] Email confirmation (check inbox or skip if disabled)

### Step 2: Login
```
Click "Login"
Email: testuser123@test.com
Password: TestPass@123
Click "Login"
```

**Check**:
- [ ] Redirects to assessment or dashboard
- [ ] No console errors
- [ ] User name appears somewhere (header)

### Step 3: Assessment
```
Click "Take Assessment" (if on dashboard)
Read instructions
Answer 10-15 questions
```

**Check**:
- [ ] Questions load smoothly
- [ ] No timeouts
- [ ] Can scroll through all questions
- [ ] Submit button works
- [ ] Results page shows career recommendation

### Step 4: First Dashboard View
```
See dashboard with recommended career
```

**Check**:
- [ ] Dashboard loads in < 2 seconds
- [ ] Shows career title
- [ ] Shows "Resume Learning" button (or similar)
- [ ] Gamification cards visible (streak, XP, level)
- [ ] No broken images
- [ ] Layout not broken

---

## Test Scenario 2: Learning Flow (20 min)

### Prerequisites
- Complete assessment first (from Scenario 1)
- Should be on dashboard with career assigned

### Step 1: Resume Learning
```
Click "Resume Learning" button on dashboard
```

**Check**:
- [ ] Roadmap page loads in < 1 second
- [ ] Career title appears
- [ ] Module cards visible
- [ ] Progress bars show
- [ ] No skeleton loaders lingering > 2 seconds

### Step 2: Explore Roadmap
```
Click first module to expand
Look for weeks inside
Click a week to expand
Look for days inside
Click a day to expand
Look for topics inside
Click a topic to expand
Look for resources inside
```

**Check**:
- [ ] Each level expands smoothly
- [ ] No lag when expanding
- [ ] Resource list appears
- [ ] Resource cards show title, type, provider
- [ ] "Open" or "Complete" buttons visible

### Step 3: Open Resource
```
Click "Open" button on a resource
```

**Check**:
- [ ] New tab opens with resource URL
- [ ] Resource URL is real (not placeholder)
- [ ] Original roadmap tab still open

### Step 4: Complete Resource
```
Go back to roadmap tab
Click "Complete" or "Mark Done" button
```

**Check**:
- [ ] Checkmark animation appears (should be visible)
- [ ] "+5 XP" or similar floats up (optional but nice)
- [ ] Resource shows as completed (green checkmark?)
- [ ] Button changes to show "Completed"
- [ ] No console errors
- [ ] Completes in < 200 ms

### Step 5: Complete More Resources
```
Repeat step 3-4 for 3-4 more resources
```

**Check**:
- [ ] Progress bar increases each time
- [ ] Animations don't lag
- [ ] No duplicate XP awards
- [ ] Each completion smooth

### Step 6: Return to Dashboard
```
Click "Dashboard" link or go to /dashboard
```

**Check**:
- [ ] Dashboard loads in < 1 second
- [ ] Overall progress increased
- [ ] XP increased by correct amount (5 * number completed)
- [ ] Progress bar fills more than before
- [ ] "Resume Learning" now shows next incomplete resource

---

## Test Scenario 3: Deep Linking (10 min)

### Prerequisites
- Have a roadmap open with some modules expanded

### Step 1: Manual URL Construction
```
URL should look like:
/roadmap?moduleId=xyz&weekId=abc&dayId=def&topicId=ghi&resourceId=jkl

Copy the full URL from browser address bar
```

### Step 2: Test in New Tab
```
Open new tab
Paste URL
Press Enter
```

**Check**:
- [ ] Roadmap loads
- [ ] Same module is expanded as before
- [ ] Smooth scroll to resource position
- [ ] Resource visible and centered

### Step 3: Test in Incognito Window
```
Open incognito window
Paste URL
Press Enter
```

**Check**:
- [ ] Page loads (might redirect to login first)
- [ ] After login, returns to deep link
- [ ] Same state preserved

---

## Test Scenario 4: Progress Persistence (10 min)

### Prerequisites
- Have completed some resources
- Note current progress % and XP

### Step 1: Logout
```
Click logout / account menu
Click "Logout"
Confirm
```

**Check**:
- [ ] Redirects to login page
- [ ] Session cleared

### Step 2: Login Again
```
Enter same credentials
Click "Login"
```

**Check**:
- [ ] Logs in successfully
- [ ] Dashboard shows

### Step 3: Verify Progress
```
Check current progress % and XP
```

**Check**:
- [ ] Progress % same as before logout
- [ ] XP same as before logout
- [ ] No data loss
- [ ] Completed resources still show as completed

---

## Test Scenario 5: Mobile Responsiveness (15 min)

### Setup
```
F12 → Device Toolbar (Ctrl+Shift+M)
Toggle Device Mode
Select iPhone 12 (or similar)
```

### Test Dashboard
```
Refresh page
```

**Check**:
- [ ] Layout doesn't break
- [ ] Cards stack vertically (not squeezed)
- [ ] Buttons tappable (48x48px minimum)
- [ ] No horizontal scroll needed
- [ ] Text readable (not tiny)
- [ ] Gamification cards visible
- [ ] "Resume" button tappable

### Test Roadmap
```
Navigate to roadmap
```

**Check**:
- [ ] Module cards readable on small screen
- [ ] Can expand/collapse modules
- [ ] Resources visible
- [ ] "Complete" buttons tappable
- [ ] No horizontal scroll

### Test Forms (if applicable)
```
Go to assessment or admin forms
```

**Check**:
- [ ] Input fields full width
- [ ] Labels above inputs
- [ ] Buttons full width
- [ ] Touch-friendly (no tiny buttons)

---

## Test Scenario 6: Error Scenarios (15 min)

### Test 1: Slow Network
```
DevTools → Network tab
Throttle: Slow 3G
Navigate to dashboard
```

**Check**:
- [ ] Skeleton loaders appear
- [ ] Page doesn't feel frozen
- [ ] Can still interact (scroll, read)
- [ ] Data loads eventually
- [ ] No timeout errors after reasonable wait

### Test 2: Complete While Logged Out
```
Open dashboard
Open resource completion in DevTools
Edit local storage to clear auth token
Try to complete resource
```

**Check**:
- [ ] Error message appears (not crash)
- [ ] Message suggests "Please log in"
- [ ] Can still navigate back
- [ ] No console errors

### Test 3: Refresh During Loading
```
Go to dashboard
Press F5 immediately while it's loading
```

**Check**:
- [ ] Page recovers gracefully
- [ ] Doesn't stay in broken state
- [ ] Eventually loads
- [ ] No console errors

### Test 4: Missing Resource
```
Edit URL to invalid resourceId: /roadmap?resourceId=invalid123
Press Enter
```

**Check**:
- [ ] Page loads (doesn't crash)
- [ ] Shows empty state or error message
- [ ] Can still navigate away
- [ ] No console errors

---

## Test Scenario 7: Admin Flow (15 min)

### Prerequisites
- Create admin account or use existing
- Email: admin@pragyan.com

### Step 1: Login as Admin
```
Go to login page
Enter admin credentials
Click "Login"
```

**Check**:
- [ ] Admin dashboard appears (different from student)
- [ ] Admin menu/sidebar visible

### Step 2: Create Career
```
Click "Manage Careers" or "Careers"
Click "Create Career"
Fill in: Title, Description
Click "Save"
```

**Check**:
- [ ] Form submits without errors
- [ ] Career appears in list
- [ ] Can see it on student side

### Step 3: Add Module
```
Click career
Click "Add Module"
Fill in: Title, Description
Click "Save"
```

**Check**:
- [ ] Module appears under career
- [ ] Can expand/see module

### Step 4: Add Resource
```
Navigate to: Career > Module > Week > Day > Topic
Click "Add Resource"
Fill in: Title, URL, Provider, Type
Click "Save"
```

**Check**:
- [ ] Resource appears
- [ ] URL valid (can click "Open")
- [ ] No validation errors

### Step 5: Publish Career
```
Select career
Click "Publish"
Confirm
```

**Check**:
- [ ] Status changes to "Published"
- [ ] Student can see it
- [ ] Can still access it in student view

---

## Common Issues to Watch For

### Performance Issues
- [ ] Dashboard takes > 2 seconds
- [ ] Roadmap takes > 1 second
- [ ] Resource completion takes > 300 ms
- [ ] Animations lag (not 60 fps)

### Data Issues
- [ ] Progress doesn't sync between pages
- [ ] XP doesn't increase
- [ ] Resources show as uncompleted after refresh
- [ ] Career doesn't appear for student

### UI Issues
- [ ] Text overlapping or cut off
- [ ] Buttons not clickable
- [ ] Forms can't be submitted
- [ ] Layout broken on certain screen sizes

### Navigation Issues
- [ ] Links don't work
- [ ] Back button doesn't work
- [ ] Can't logout
- [ ] URL changes don't reflect page state

---

## Bug Report Template

For each issue found, document:

```
Title: [Brief description]

Steps to Reproduce:
1. 
2. 
3. 

Expected: 

Actual: 

Screenshots: (if UI issue)

Severity: Critical / High / Medium / Low
```

---

## Summary

After this testing:
- You should feel confident using the app
- Major bugs should be identified
- Performance baseline established
- User experience issues documented

**Then**: Fix critical issues first, then move to UI consistency pass.


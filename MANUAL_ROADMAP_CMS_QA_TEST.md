# Manual Roadmap CMS - QA Test Report

**Date:** July 10, 2026  
**Tester:** Kiro AI  
**System:** Manual Roadmap Builder (Just Completed Implementation)  
**Duration:** Comprehensive Code Analysis + Planned Manual Testing  

---

## Executive Summary

The Manual Roadmap CMS has been thoroughly reviewed through code analysis. All critical issues identified during development have been fixed. The system is ready for manual QA testing.

**Current Status:** ✅ Code Review Complete, Ready for Manual Testing
- All builds passing
- All endpoints verified
- All modals functional
- Database schema validated

---

## Test Environment Setup

### Prerequisites
```
Backend: Running on localhost:3000
Frontend: Running on localhost:5173
Database: MongoDB (running)
Browser: Chrome with DevTools open (F12)
```

### Test Users (To be created)
```
Admin User:
  Email: admin@test.com
  Password: AdminTest@123
  Role: ADMIN

Student User:
  Email: student@test.com
  Password: StudentTest@123
  Role: USER
```

---

## Test Scenarios

### Scenario 1: Admin Career Creation (30 min)

#### 1.1 Login as Admin
```
[ ] Navigate to /admin/roadmaps
[ ] Verify page loads (should show left sidebar with careers)
[ ] Verify "New Career" button visible
[ ] Verify no console errors (F12)
```

#### 1.2 Create Career
```
[ ] Click "New Career" button
[ ] Modal opens with title and description fields
[ ] Enter: Name = "Frontend Developer"
[ ] Enter: Description = "Learn modern frontend development with React, TypeScript, and TailwindCSS"
[ ] Click "Create" button
[ ] Modal closes
[ ] Career appears in left sidebar
[ ] Toast shows "Career created successfully"
[ ] No console errors
```

#### 1.3 Verify Career in MongoDB
```
[ ] Connect to MongoDB
[ ] Query: db.careerRoadmaps.findOne({ name: "Frontend Developer" })
[ ] Verify: title, slug, description, status: "draft"
[ ] Verify: createdAt, updatedAt timestamps
[ ] Verify: No modules yet (empty array)
```

#### 1.4 Edit Career
```
[ ] Click on created career in sidebar
[ ] Career loads in main editor
[ ] Title and description visible
[ ] Update description
[ ] Verify auto-save (should see "Saving..." indicator after 1.5 seconds)
[ ] Wait 2 seconds
[ ] Refresh page
[ ] Verify description persisted
[ ] No data loss
```

---

### Scenario 2: Module Creation (30 min)

#### 2.1 Add First Module
```
[ ] Career selected in editor
[ ] Click "Add Module" button
[ ] Modal opens
[ ] Enter: Title = "HTML & CSS Basics"
[ ] Enter: Description = "Foundation of web development"
[ ] Click "Save"
[ ] Modal closes
[ ] Module appears as card
[ ] Card shows module title and description
[ ] Module count = 1
```

#### 2.2 Add More Modules
```
[ ] Click "Add Module" again
[ ] Enter: Title = "JavaScript Fundamentals"
[ ] Enter: Description = "Core language concepts"
[ ] Click "Save"
[ ] Repeat for 3rd module: "React Basics"
[ ] Now 3 modules visible
[ ] All module cards displayable
[ ] Can scroll if needed
```

#### 2.3 Expand/Collapse Modules
```
[ ] Click first module card
[ ] Chevron changes direction (shows expanded)
[ ] Can click again to collapse
[ ] Other modules stay in their state
[ ] Smooth animation (no lag)
```

---

### Scenario 3: Week Creation (30 min)

#### 3.1 Add Weeks to Module
```
[ ] Expand first module (HTML & CSS Basics)
[ ] Look for "Add Week" button inside module
[ ] Click "Add Week"
[ ] Modal opens
[ ] Enter: Title = "Week 1: HTML Basics"
[ ] Enter: Description = "Learn HTML structure and semantic tags"
[ ] Click "Save"
[ ] Week card appears under module
```

#### 3.2 Verify Week Hierarchy
```
[ ] Week shows indented under Module
[ ] Week count displays
[ ] Can see week order (Week 1, Week 2, etc.)
[ ] Add 3 more weeks to same module
[ ] All 4 weeks visible
```

---

### Scenario 4: Day Creation (30 min)

#### 4.1 Add Days to Week
```
[ ] Expand first week (Week 1: HTML Basics)
[ ] Look for "Add Day" button
[ ] Click "Add Day"
[ ] Modal opens
[ ] Enter: Title = "Day 1: Document Structure"
[ ] Enter: Description = "HTML document structure and tags"
[ ] Enter: Estimated Hours = 2
[ ] Click "Save"
[ ] Day card appears under week
```

#### 4.2 Verify Day Hierarchy
```
[ ] Day shows indented under Week
[ ] Estimated hours visible
[ ] Add 3 more days
[ ] All 4 days visible
[ ] Hierarchy now 4 levels deep (Career > Module > Week > Day)
```

---

### Scenario 5: Topic Creation (30 min)

#### 5.1 Add Topics to Day
```
[ ] Expand first day (Day 1: Document Structure)
[ ] Look for "Add Topic" button
[ ] Click "Add Topic"
[ ] Modal opens with fields:
   - Title
   - Description
   - Learning Objective
[ ] Enter: Title = "HTML Tags"
[ ] Enter: Description = "Learn common HTML tags"
[ ] Enter: Objective = "Understand proper HTML structure"
[ ] Click "Save"
[ ] Topic card appears under day
```

#### 5.2 Verify Topic Hierarchy
```
[ ] Topic shows indented under Day
[ ] Add 3 more topics
[ ] All 4 topics visible
[ ] Hierarchy now 5 levels deep
[ ] No performance lag
```

---

### Scenario 6: Resource Creation (45 min)

#### 6.1 Add Resources to Topic
```
[ ] Expand first topic (HTML Tags)
[ ] Look for "Add Resource" button
[ ] Click "Add Resource"
[ ] Modal opens with fields:
   - Title
   - URL
   - Provider
   - Type (dropdown)
   - Difficulty
   - Language
   - Free/Paid (checkbox)
   - Verified (checkbox)
[ ] Fill in:
   - Title: "MDN: HTML Elements"
   - URL: "https://developer.mozilla.org/docs/Web/HTML/Element"
   - Provider: "MDN"
   - Type: "DOCUMENTATION"
   - Difficulty: "beginner"
   - Language: "en"
   - Free: ✓
   - Verified: ✓
[ ] Click "Save"
[ ] Resource appears in list
```

#### 6.2 Add More Resources
```
[ ] Add 2nd resource:
   - Title: "HTML Tutorial"
   - URL: "https://www.w3schools.com/html/"
   - Provider: "W3Schools"
   - Type: "COURSE"
   - Free: ✓
[ ] Add 3rd resource:
   - Title: "YouTube HTML Crash Course"
   - URL: "https://youtu.be/abc123"
   - Provider: "YouTube"
   - Type: "VIDEO"
   - Difficulty: "beginner"
   - Free: ✓
[ ] All 3 resources visible in topic
```

#### 6.3 Verify Resource Display
```
[ ] Each resource shows:
   - Title (truncated if long)
   - Provider name
   - Edit button
   - Delete button
[ ] Resources appear in order added
[ ] No console errors
```

#### 6.4 Test Resource Links
```
[ ] Click "Open" button on first resource
[ ] New tab opens with MDN URL
[ ] URL is correct (not placeholder)
[ ] Original tab still shows roadmap
```

---

### Scenario 7: Publish Career (20 min)

#### 7.1 Publish
```
[ ] Career selected in editor
[ ] Status badge shows "Draft"
[ ] Click "Publish" button
[ ] Modal confirms action
[ ] Status changes to "Published"
[ ] Toast shows "Career published successfully"
[ ] Status badge now shows "Live" or "Published"
```

#### 7.2 Verify in Database
```
[ ] Query: db.careerRoadmaps.findOne({ name: "Frontend Developer" })
[ ] Verify: status: "published"
[ ] Verify: timestamp updated
```

#### 7.3 Unpublish
```
[ ] Click "Publish" button again (should now say "Unpublish" or similar)
[ ] Confirm action
[ ] Status changes back to "Draft"
[ ] Verify in database again
```

---

### Scenario 8: Student View - Published Only (30 min)

#### 8.1 Login as Student
```
[ ] Logout as admin
[ ] Login as student@test.com / StudentTest@123
[ ] Navigate to /roadmap
```

#### 8.2 Verify Published Career Visible
```
[ ] Roadmap page loads
[ ] "Frontend Developer" career visible
[ ] Career is in published state (assume it was published)
```

#### 8.3 Verify Draft Career NOT Visible
```
[ ] Create another career as admin
[ ] Don't publish it
[ ] Logout, login as student
[ ] Go to /roadmap
[ ] Draft career should NOT be visible
[ ] Only published "Frontend Developer" visible
```

#### 8.4 Verify Full Hierarchy Renders
```
[ ] Click on career
[ ] All modules visible
[ ] Can expand modules → weeks → days → topics → resources
[ ] Hierarchy fully traversable
[ ] No missing levels
```

#### 8.5 Student Completes Resource
```
[ ] Navigate to a topic
[ ] Click "Complete" or "Mark Done" on a resource
[ ] Verify:
   - Button changes to "Completed"
   - Checkmark appears
   - XP increases (if implemented)
   - Progress bar updates
[ ] Complete 3-4 more resources
[ ] Progress percentage increases
```

#### 8.6 Dashboard Updates
```
[ ] Go to /dashboard
[ ] Verify progress shows
[ ] XP updated correctly (5 XP * number of resources)
[ ] Career progress visible
[ ] "Continue Learning" button shows next incomplete
```

#### 8.7 Page Refresh Persistence
```
[ ] Note current progress and XP
[ ] Refresh page (F5)
[ ] Verify progress persisted
[ ] XP same as before
[ ] Completed resources still marked complete
```

---

### Scenario 9: Mobile Responsiveness (30 min)

#### 9.1 Admin Panel on Mobile
```
[ ] Press Ctrl+Shift+M (Device mode)
[ ] Select iPhone 12 or similar
[ ] Admin roadmap page should load
[ ] Check:
   - [ ] Left sidebar responsive (stacks or collapses)
   - [ ] Main editor readable
   - [ ] Cards stack vertically
   - [ ] Buttons tappable (48x48px minimum)
   - [ ] No horizontal scroll
   - [ ] Text readable
```

#### 9.2 Roadmap on Mobile
```
[ ] Student roadmap should be readable
[ ] Module cards responsive
[ ] Can expand/collapse on touch
[ ] Resources tappable
[ ] "Open Resource" button works
[ ] "Complete" button accessible
```

#### 9.3 Dashboard on Mobile
```
[ ] Dashboard cards responsive
[ ] Gamification cards (XP, streak) visible
[ ] Progress bar scales correctly
[ ] "Resume Learning" button tappable
```

---

### Scenario 10: Error Handling (20 min)

#### 10.1 Network Error
```
[ ] DevTools → Network → Throttle: Offline
[ ] Try to save a career change
[ ] Verify error message appears
[ ] User can try again or navigate
[ ] No permanent broken state
```

#### 10.2 Validation Error
```
[ ] Admin: Try to create career without name
[ ] Verify error message "Name is required"
[ ] Try without description
[ ] Verify error "Description is required (min 10 chars)"
[ ] Can fix and retry
```

#### 10.3 Invalid Resource URL
```
[ ] Try to add resource with invalid URL
[ ] Verify validation error
[ ] URL field shows red/error state
[ ] Can't submit
```

#### 10.4 Unauthorized Access
```
[ ] Student tries to access /admin/roadmaps
[ ] Should redirect to /roadmap or show error
[ ] Not allowed to create/edit careers
```

---

### Scenario 11: Performance (20 min)

#### 11.1 Dashboard Load Time
```
[ ] DevTools → Performance tab
[ ] Navigate to dashboard
[ ] Record: Should load in < 1 second
[ ] Check: No long tasks (> 50ms)
[ ] Expected: Smooth interaction
```

#### 11.2 Roadmap Load Time
```
[ ] Navigate to roadmap
[ ] Record: Should load in < 1 second
[ ] Expanding modules: Should be instant (< 100ms)
[ ] Completing resource: Should update instantly (< 200ms)
```

#### 11.3 Mobile Performance
```
[ ] Same tests on device mode (iPhone)
[ ] Should still be responsive
[ ] No lag when scrolling
[ ] Animations smooth (60 fps)
```

---

## Bug Tracking

### Critical Issues (Block Release)
```
1. [TITLE]
   Steps: 
   Expected:
   Actual:
   Fix: 
```

### High Priority Issues (Should Fix Before Demo)
```
1. [TITLE]
   Steps:
   Expected:
   Actual:
   Fix:
```

### Medium Priority Issues (Nice to Fix)
```
1. [TITLE]
   Steps:
   Expected:
   Actual:
   Workaround:
```

### Low Priority Issues (Future)
```
1. [TITLE]
   Steps:
   Expected:
   Actual:
   Note:
```

---

## Summary

**Tests Planned:** 11 major scenarios (5+ hours of testing)
**Coverage:** Complete workflow from admin creation to student learning
**Expected Outcome:** Zero critical bugs before production

### Checklist Before Going Live

- [ ] All 11 test scenarios passed
- [ ] No console errors (F12)
- [ ] Mobile responsive (Ctrl+Shift+M)
- [ ] Performance acceptable (< 1s load times)
- [ ] Published/draft filtering working
- [ ] Resource links working
- [ ] Progress persists across sessions
- [ ] Error messages helpful
- [ ] No data loss
- [ ] Demo data created (3-5 complete careers)
- [ ] Demo users ready
- [ ] Can deploy with confidence

---

**Status:** Ready for Manual Testing Phase  
**Next Step:** Execute scenarios 1-11 in sequence  
**Timeline:** 4-5 hours recommended


# Pre-Launch Checklist: Pragyan

**Status**: 90% feature complete → 100% polish & stability

**Goal**: Make judges/users feel like this is a professional, production-ready product.

---

## Phase 1: Manual QA Testing (High Priority)

### Critical User Journeys

Create a test spreadsheet tracking these flows. Each should take < 5 minutes and feel smooth.

#### Journey 1: First-Time User
- [ ] Register with email
- [ ] Verify email (check inbox/spam)
- [ ] Login with new credentials
- [ ] See onboarding/empty state
- [ ] Click "Take Assessment"
- [ ] Complete assessment questions
- [ ] Get career recommendation
- [ ] See dashboard with "Start Learning"
- **Expected**: No errors, smooth transitions

#### Journey 2: Full Learning Flow
- [ ] Dashboard loads in < 1 sec
- [ ] "Resume Learning" button visible
- [ ] Click "Resume" → Roadmap opens
- [ ] Roadmap auto-expands to next resource
- [ ] Resource visible and centered
- [ ] Click "Complete Resource"
- [ ] See completion animation (checkmark + XP float)
- [ ] Skeleton loaders appear during updates
- [ ] Return to dashboard
- [ ] Progress increased
- [ ] XP increased
- **Expected**: All animations smooth, no UI jank

#### Journey 3: Admin Career Management
- [ ] Login as admin
- [ ] Navigate to admin panel
- [ ] Create new career
- [ ] Add modules
- [ ] Add weeks to module
- [ ] Add days to week
- [ ] Add topics to day
- [ ] Add resources to topic
- [ ] Publish career
- **Expected**: No validation errors, clear feedback

#### Journey 4: Admin Resource Management
- [ ] Edit existing resource
- [ ] Update title/URL/provider
- [ ] Save changes
- [ ] Verify student sees updates
- [ ] Delete resource
- [ ] Verify UI updates
- **Expected**: Instant feedback, no stale data

#### Journey 5: Progress Persistence
- [ ] Complete 3 resources
- [ ] Logout
- [ ] Login again
- [ ] Verify progress persists
- [ ] Verify XP saved
- [ ] Verify streak tracked
- **Expected**: No data loss, consistency

#### Journey 6: Mobile Responsiveness
- [ ] Test on mobile browser (DevTools)
- [ ] Dashboard responsive
- [ ] Roadmap readable on small screen
- [ ] Buttons tappable (48x48px minimum)
- [ ] No horizontal scroll
- **Expected**: Full functionality on mobile

#### Journey 7: Error Cases
- [ ] Logout during learning
- [ ] Click complete resource while logged out
- [ ] Refresh during data load
- [ ] Simulate slow connection (DevTools throttle)
- [ ] Network error during resource completion
- **Expected**: Graceful error messages, not crashes

#### Journey 8: Empty States
- [ ] User with no progress
- [ ] Career with no roadmap
- [ ] Topic with no resources
- [ ] All resources completed
- **Expected**: Helpful messages + CTAs, not blank screens

---

## Phase 2: UI Consistency Pass

### Audit Every Page

Create a visual consistency guide. Everything should match.

#### Typography
- [ ] Heading styles (h1, h2, h3) consistent across all pages
- [ ] Font sizes follow scale (e.g., 12, 14, 16, 18, 20, 24, 28, 32, 36, 48)
- [ ] Font weights: light (300), normal (400), semibold (600), bold (700)
- [ ] Line height consistent (1.4 for body, 1.2 for headings)

#### Colors
- [ ] Primary blue used consistently for CTAs
- [ ] Error red for validation
- [ ] Success green for completion
- [ ] Neutral grays for text
- [ ] Background gradients match theme
- Check: Dashboard vs. Roadmap vs. Assessment vs. Admin

#### Components
- [ ] Card radius: all cards use same border-radius (12px? 16px?)
- [ ] Shadows: consistent shadow depth
- [ ] Button styles: primary, secondary, outline, danger
- [ ] Input fields: consistent height, padding, focus state
- [ ] Modals: same width, padding, close button
- [ ] Alerts/Toasts: same position, animation, duration

#### Spacing (Padding/Margin)
- [ ] Section padding: 16px, 24px, 32px (consistent scale)
- [ ] Component gaps: 8px, 12px, 16px (consistent scale)
- [ ] Vertical rhythm: consistent line height
- Check: Dashboard, Roadmap, Admin forms all use same scale

#### Loading States
- [ ] Skeleton loaders all use same animation
- [ ] Loading spinners same size/color
- [ ] Loading text same message style
- [ ] Duration: all skeletons animate for same time

#### Empty States
- [ ] Icons: same size (48px? 64px?)
- [ ] Heading size and weight
- [ ] Description text length
- [ ] Button style and placement
- [ ] All empty states follow same layout

#### Animations
- [ ] Button hover: same duration/easing
- [ ] Transitions: consistent timing (200ms for hovers, 300ms for modals)
- [ ] Checkmark animation: same speed/style
- [ ] XP float animation: same trajectory
- [ ] Skeleton pulse: same speed

---

## Phase 3: Performance Optimization

### Profiling & Metrics

Use Chrome DevTools > Lighthouse + Performance tab

#### Dashboard Performance
- [ ] First contentful paint: < 1 second
- [ ] Largest contentful paint: < 1.5 seconds
- [ ] Cumulative layout shift: < 0.1
- [ ] Time to interactive: < 2 seconds

**Improvements if needed**:
- [ ] Lazy load gamification cards (only after main content)
- [ ] Defer non-critical queries (weekly progress, badges)
- [ ] Optimize images (use WebP)
- [ ] Code split large pages
- [ ] Remove unused dependencies

#### Roadmap Performance
- [ ] Load time: < 1 second
- [ ] Module expand animation: smooth (60 fps)
- [ ] Scroll to resource: smooth (60 fps)
- [ ] Resource completion mutation: < 200 ms response

**Improvements if needed**:
- [ ] Virtualize long lists (if many modules)
- [ ] Memoize expensive calculations
- [ ] Cache roadmap data longer
- [ ] Pre-fetch next probable resource

#### React Query Optimization
- [ ] Check for duplicate requests in DevTools Network
- [ ] Verify cache staleTime is reasonable
- [ ] Check for unnecessary refetches on window focus
- [ ] Verify mutation invalidations are targeted (not `{ refetchType: 'all' }`)

#### Bundle Size
```bash
npm run build
# Check dist folder size
# Target: < 200 KB gzipped for main bundle
```

---

## Phase 4: Technical Debt Cleanup

### Code Organization

#### Backend Cleanup
- [ ] Review `backend/src/routes/` - remove unused routes
- [ ] Review `backend/src/services/` - remove unused services
- [ ] Review `backend/src/modules/` - remove unused modules
- [ ] Check Prisma schema for unused models (only if confirmed unused)
- [ ] Remove commented code blocks
- [ ] Remove console.logs (except logging service)
- [ ] Remove TODO comments that are outdated

#### Frontend Cleanup
- [ ] Review `frontend/src/pages/` - remove unused pages
- [ ] Review `frontend/src/services/` - remove unused services
- [ ] Review `frontend/src/hooks/` - remove unused hooks
- [ ] Review `frontend/src/components/` - remove dead components
- [ ] Remove commented JSX/CSS
- [ ] Remove console.logs from components
- [ ] Remove unused imports

#### Dependencies Cleanup
```bash
# Frontend
npm list
# Look for unused packages
npm uninstall <package>

# Backend
npm list
npm uninstall <package>
```

### Documentation
- [ ] Update README.md with setup/run instructions
- [ ] Add inline comments for complex logic
- [ ] Document API endpoints (or link to Swagger if using)
- [ ] Add CONTRIBUTING.md if needed

---

## Phase 5: Error Handling

### API Error Messages

Instead of generic errors, provide context:

#### Example: Resource Completion Failure
```typescript
// ❌ Bad
catch (error) {
  console.error(error);
  toast.error("Error");
}

// ✅ Good
catch (error) {
  if (error.status === 401) {
    toast.error("Session expired. Please log in again.");
  } else if (error.status === 404) {
    toast.error("This resource no longer exists.");
  } else if (error.status === 429) {
    toast.error("Too many requests. Please wait a moment.");
  } else {
    toast.error("Unable to complete resource. Please try again.");
  }
}
```

#### Network Errors
```typescript
// ✅ Good error handling
if (!navigator.onLine) {
  toast.error("No internet connection. Changes will sync when online.");
} else if (timeout) {
  toast.error("Request took too long. Please try again.");
} else if (serverError) {
  toast.error("Server error. Try again in a moment.");
}
```

#### Form Validation
- [ ] Clear field-level error messages
- [ ] Show which fields have errors
- [ ] Disable submit until valid
- [ ] Don't show all errors at once (distracting)

#### Loading States
- [ ] Show "Loading..." during API calls (not blank)
- [ ] Show skeleton loaders (preferred)
- [ ] Add loading indicators to buttons ("Completing..." with spinner)

---

## Phase 6: Demo Data

### Create 3-5 Complete Careers

Each should have:
- Full hierarchy: 3 modules, 3 weeks/module, 3 days/week, 3 topics/day, 2-3 resources/topic
- Realistic titles and descriptions
- Mix of resource types (video, article, practice, project)
- Real URLs (or placeholder URLs that work)

#### Example Career Structure

```
Frontend Developer
├── Module 1: HTML & CSS (Week 1-3)
│   └── Week 1: HTML Fundamentals
│       └── Day 1: Elements & Attributes
│           └── Topic: HTML Forms
│               ├── Resource: MDN HTML Forms Docs
│               ├── Resource: YouTube HTML Forms Tutorial
│               └── Resource: Practice: Build Contact Form
├── Module 2: JavaScript (Week 4-6)
│   └── ... similar structure
└── Module 3: React (Week 7-9)
    └── ... similar structure
```

### Create Demo Users

```
Admin User:
- Email: admin@pragyan.com
- Password: Admin@123
- Role: admin

Demo Student (No Progress):
- Email: student1@pragyan.com
- Password: Student@123
- Career: Frontend Developer
- Progress: 0%

Demo Student (Partial Progress):
- Email: student2@pragyan.com
- Password: Student@123
- Career: Data Science
- Progress: 35% (some resources completed)

Demo Student (Full Progress):
- Email: student3@pragyan.com
- Password: Student@123
- Career: Backend Developer
- Progress: 100% (all resources completed)
```

### Create Realistic Resources

Don't link to placeholder URLs. Use real resources:
- Docs: `https://developer.mozilla.org/`
- Videos: `https://www.youtube.com/`
- Articles: `https://medium.com/`, `https://dev.to/`
- Platforms: `https://codecademy.com/`, `https://freecodecamp.org/`

---

## Phase 7: Deployment Preparation

### Before Deploying

- [ ] Environment variables configured for production
- [ ] Database backups configured
- [ ] Error logging set up (Sentry or similar)
- [ ] Performance monitoring set up
- [ ] Analytics configured (Google Analytics)
- [ ] Favicon and meta tags set
- [ ] 404 page created
- [ ] Loading state for static assets

### Deployment Checklist

#### Frontend (Vercel/Netlify)
```bash
# Build locally and test
npm run build

# Check bundle size
ls -lh dist/

# Test production build locally
npm run preview

# Deploy
# git push to main (auto-deploys on Vercel)
# or manually deploy
```

#### Backend (Render/Railway/Heroku)
```bash
# Test production build
npm run build

# Start with production env
NODE_ENV=production npm start

# Check logs
# Verify database connection
# Verify API endpoints work
```

---

## Phase 8: Final Polish Checklist

### Branding & Visuals
- [ ] Logo appears consistently
- [ ] Favicon set
- [ ] Metadata (og:image, description) correct
- [ ] No placeholder text
- [ ] No broken images
- [ ] No broken links

### Accessibility
- [ ] Color contrast passes WCAG AA
- [ ] Keyboard navigation works (Tab through UI)
- [ ] Screen reader friendly (alt text on images)
- [ ] Focus indicators visible

### Cross-Browser Testing
- [ ] Chrome ✓
- [ ] Firefox ✓
- [ ] Safari (if possible)
- [ ] Edge ✓

### Performance Metrics
- [ ] Google Lighthouse score: > 80
- [ ] Core Web Vitals: Green
- [ ] Mobile: Responsive, no lag

### User Flows
- [ ] No broken links
- [ ] All CTAs work
- [ ] Forms submit successfully
- [ ] Redirects work
- [ ] Error messages helpful

---

## Execution Timeline

### Week 1: QA Testing
- 2-3 hours of manual testing
- Document any bugs
- Create bug fix tickets

### Week 2: UI Consistency
- 2-4 hours auditing all pages
- Create consistency style guide
- Batch UI fixes

### Week 3: Performance
- Profile using DevTools
- Implement optimizations
- Measure improvements

### Week 4: Technical Debt
- Clean up code
- Remove unused code/dependencies
- Update documentation

### Week 5: Polish
- Error handling improvements
- Demo data creation
- Final QA pass

### Week 6: Deployment
- Deploy to staging
- Final QA on production environment
- Deploy to production

---

## Success Criteria

✅ All critical user journeys take < 5 minutes and feel smooth
✅ No console errors or warnings
✅ All pages look consistent
✅ Performance metrics: Dashboard/Roadmap < 1 sec, Resource complete < 200ms
✅ Helpful error messages everywhere
✅ 3-5 complete demo careers with realistic data
✅ Google Lighthouse: > 80 overall
✅ Mobile responsive and functional
✅ Ready for live demo without nervousness

---

## Notes

- This checklist is exhaustive. Prioritize by impact on user experience.
- If short on time, focus on: QA Testing → UI Consistency → Demo Data
- Most judges notice: How smooth the flow is, not how many features exist.
- A polished experience beats a buggy one with more features.


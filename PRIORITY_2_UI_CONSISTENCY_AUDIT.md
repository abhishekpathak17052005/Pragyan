# Priority 2: UI Consistency Audit

**Goal**: Make the entire app feel like ONE product, not several mini-projects.

**Time**: 2-3 hours

---

## Audit Methodology

1. Open all major pages in separate browser tabs
2. Take a screenshot of each page
3. Compare visually for inconsistencies
4. Document what needs to be standardized

---

## Pages to Audit

- [ ] Login page
- [ ] Register page
- [ ] Assessment page
- [ ] Dashboard
- [ ] Roadmap
- [ ] Admin careers page
- [ ] Admin career detail page
- [ ] Admin forms (create/edit)

---

## Audit Checklist

### 1. Typography Scale

**Current Pages**: Dashboard, Roadmap, Assessment, Admin

**Questions**:
- What heading sizes are used? (h1, h2, h3, h4)
- What font sizes in pixels? (12, 14, 16, 18, 20, 24, 28, 32, 36, 48?)
- Are they consistent across pages?

**Template**:
```css
/* Proposed consistent scale */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 28px;
--text-4xl: 32px;
--text-5xl: 36px;
--text-6xl: 48px;
```

**Font Weights**:
- Light: 300
- Normal: 400
- Semibold: 600
- Bold: 700

**Action Items**:
- [ ] List all heading sizes found in each page
- [ ] Create standard scale
- [ ] Update all pages to use standard scale

---

### 2. Color Palette

**Current Pages**: All pages

**Questions**:
- What primary color? (Blue shade? RGB?)
- What secondary colors?
- What text colors?
- What background colors?
- What error/success colors?

**Template**:
```css
/* Proposed consistent palette */
--primary: #3b82f6;      /* Bright blue */
--primary-dark: #1e40af; /* Dark blue */
--secondary: #10b981;    /* Green */
--danger: #ef4444;       /* Red */
--warning: #f59e0b;      /* Amber */
--success: #10b981;      /* Green */
--text-primary: #1f2937;
--text-secondary: #6b7280;
--text-muted: #9ca3af;
--bg-light: #f3f4f6;
--bg-lighter: #f9fafb;
--border: #e5e7eb;
```

**Action Items**:
- [ ] Screenshot each page and note colors used
- [ ] Extract actual color values (use color picker)
- [ ] Create standard palette CSS file
- [ ] Update all pages to use palette variables

---

### 3. Card Styling

**Where**: Dashboard cards, Roadmap module cards, Admin cards

**Questions**:
- Border radius: 8px? 12px? 16px?
- Box shadow: light? medium? heavy?
- Padding: 16px? 24px? 32px?
- Border: yes/no? color?

**Template**:
```css
/* Proposed consistent card */
.card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  border: 1px solid #e5e7eb;
  background: white;
}

.card-compact {
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 16px;
}

.card-elevated {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 32px;
}
```

**Action Items**:
- [ ] Screenshot each card type
- [ ] Measure border-radius (DevTools)
- [ ] Measure padding (DevTools)
- [ ] Measure box-shadow (DevTools)
- [ ] Create standard card styles

---

### 4. Button Styling

**Where**: Dashboard, Roadmap, Forms, Admin

**Questions**:
- Button heights: 32px? 40px? 48px?
- Padding: 8px 16px? 12px 24px?
- Border radius: square? rounded?
- Hover state: color change? shadow? scale?
- Active/focus state: outline? shadow?

**Template**:
```css
/* Proposed consistent buttons */
.btn-primary {
  background: #3b82f6;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms;
}

.btn-primary:hover {
  background: #1e40af;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
}

.btn-secondary:hover {
  background: #eff6ff;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 12px;
}

.btn-lg {
  padding: 14px 32px;
  font-size: 16px;
}
```

**Action Items**:
- [ ] Screenshot button states (default, hover, active, disabled)
- [ ] Measure all button dimensions
- [ ] List all button variants found
- [ ] Create standard button component

---

### 5. Input Fields

**Where**: Login, Register, Forms, Admin

**Questions**:
- Height: 36px? 40px? 48px?
- Padding: 8px? 12px?
- Border: yes/no? color?
- Border radius: 4px? 8px?
- Focus state: outline? shadow? color change?

**Template**:
```css
.input {
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 200ms;
}

.input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.input-error {
  border-color: #ef4444;
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}
```

**Action Items**:
- [ ] Screenshot input states (default, focus, error, disabled)
- [ ] Measure input height/padding
- [ ] Create standard input component

---

### 6. Spacing Scale

**Where**: All pages

**Questions**:
- What spacing is used? 4px, 8px, 12px, 16px, 24px, 32px?
- Is it consistent?
- How are margins/padding distributed?

**Template**:
```css
/* Proposed consistent spacing scale */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-8: 48px;
--space-10: 64px;
--space-12: 80px;

/* Usage */
.section { margin-bottom: var(--space-6); } /* 32px */
.card { padding: var(--space-5); }           /* 24px */
.text-group { gap: var(--space-2); }         /* 8px */
```

**Action Items**:
- [ ] Document all spacing values used
- [ ] Create standard spacing scale
- [ ] Update all components

---

### 7. Loading States

**Where**: Dashboard, Roadmap, Forms

**Questions**:
- Skeleton loader speed: 1s pulse? 2s?
- Spinner color: matches primary?
- Loading text style: matches body text?

**Template**:
```css
/* Skeleton loader animation */
@keyframes skeleton-loading {
  0% { background-color: #e5e7eb; }
  50% { background-color: #f3f4f6; }
  100% { background-color: #e5e7eb; }
}

.skeleton {
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 8px;
}
```

**Action Items**:
- [ ] Verify all loading states use same animation
- [ ] Ensure consistent timing
- [ ] Ensure consistent color

---

### 8. Empty States

**Where**: Dashboard (no career), Roadmap (no content), etc.

**Questions**:
- Icon size: 48px? 64px? 80px?
- Icon color: primary? gray?
- Heading size: h3? h4?
- Description text: body? small?
- Button: primary? secondary?

**Template**:
```tsx
// Proposed consistent empty state
<div className="empty-state">
  <div className="empty-icon">🎯</div>
  <h3 className="empty-title">No Career Yet</h3>
  <p className="empty-description">Take your assessment to get started.</p>
  <button className="btn-primary">Take Assessment</button>
</div>

/* Styles */
.empty-state {
  text-align: center;
  padding: 64px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.empty-description {
  font-size: 14px;
  color: #6b7280;
  max-width: 320px;
  margin: 0;
}
```

**Action Items**:
- [ ] Screenshot all empty states
- [ ] Standardize icon size/color
- [ ] Standardize text sizes
- [ ] Standardize button placement

---

### 9. Animations & Transitions

**Where**: All interactive elements

**Questions**:
- Button hover duration: 150ms? 200ms? 300ms?
- Fade in duration: 200ms? 300ms?
- Scale animation: 200ms? 300ms?
- Easing: ease-in-out? ease?

**Template**:
```css
/* Proposed consistent animations */
--transition-fast: 150ms ease-in-out;
--transition-base: 200ms ease-in-out;
--transition-slow: 300ms ease-in-out;

/* Button hover */
.btn { transition: all var(--transition-base); }

/* Fade in */
.fade-in { animation: fade-in var(--transition-base); }
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
.slide-up { animation: slide-up var(--transition-base); }
@keyframes slide-up {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

**Action Items**:
- [ ] Document all transition speeds used
- [ ] Create standard timing variables
- [ ] Update all animations to be consistent

---

### 10. Shadows

**Where**: Elevated elements (cards, modals, dropdowns)

**Questions**:
- How many shadow levels? (light, medium, heavy?)
- Exact shadow values (CSS box-shadow)?

**Template**:
```css
/* Proposed consistent shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.2);

.card { box-shadow: var(--shadow-md); }
.modal { box-shadow: var(--shadow-xl); }
.input:focus { box-shadow: var(--shadow-sm); }
```

**Action Items**:
- [ ] Screenshot elements with shadows
- [ ] Extract shadow values
- [ ] Create standard shadow variables

---

## Execution Plan

### Step 1: Screenshot All Pages (30 min)
```bash
# Open in separate tabs
- http://localhost:5173/login
- http://localhost:5173/register
- http://localhost:5173/assessment
- http://localhost:5173/dashboard
- http://localhost:5173/roadmap
- http://localhost:5173/admin (if accessible)

# Take screenshots of each
# Note page dimensions (mobile, tablet, desktop)
```

### Step 2: Create Audit Spreadsheet (30 min)
```
Create a spreadsheet with columns:
- Element (Button, Card, Input, etc.)
- Page Found
- Font Size
- Color
- Border Radius
- Padding
- Box Shadow
- Notes
```

### Step 3: Create Design System File (45 min)
```
Create: frontend/src/styles/design-system.css

Include all standard values:
- Color variables
- Typography scale
- Spacing scale
- Shadow levels
- Border radius
- Transition timing
```

### Step 4: Update Components (60-90 min)
```
Update each component to use design system:
- Button.tsx
- Card.tsx
- Input.tsx
- Empty states
- Skeleton loaders
- Modals
- Forms
```

### Step 5: Test & Verify (30 min)
```
- Check all pages render correctly
- Ensure no visual regressions
- Test all states (hover, focus, active)
```

---

## Success Criteria

✅ All pages feel visually cohesive
✅ Typography consistent across all pages
✅ Colors from standard palette
✅ Buttons/inputs/cards standardized
✅ Spacing follows scale
✅ Animations have consistent timing
✅ Empty states follow same pattern
✅ No visual debt remaining

---

## After This Phase

1. You'll have a design system document
2. Consistent visual language
3. Easier to onboard contributors
4. Easier to maintain code
5. Product feels polished and professional


# Roadmap UI Design System

## Color Palette

### Primary Colors
- **Blue 600**: `#2563eb` - Main brand color
- **Blue 700**: `#1d4ed8` - Darker variant
- **Blue 800**: `#1e40af` - Darkest variant
- **Indigo 600**: `#4f46e5` - Accent color

### Secondary Colors
- **Orange 500**: `#f97316` - Flame/energy indicator
- **Orange 100**: `#fed7aa` - Background for icon
- **White**: `#ffffff` - Card backgrounds
- **Slate 600**: `#475569` - Text labels
- **Slate 700**: `#334155` - Primary text

### Gradients
- **Header Gradient**: `from-blue-600 via-blue-700 to-blue-800`
- **Progress Gradient**: `from-blue-600 to-blue-700`
- **Text Gradient**: `from-blue-600 to-blue-700` (for percentage)

## Typography

### Font Family
- Primary: Inter (sans-serif)
- Fallback: system fonts

### Font Sizes & Weights

#### Headlines
| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Main Title | 4xl-6xl | 900 (black) | Career path name |
| Section Title | 2xl | 900 (black) | "Your Progress" |
| Card Labels | xs | 900 (black) | "MODULES", "DAYS" |

#### Body Text
| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Description | lg | 300 (light) | Career description |
| Stats Value | 5xl-6xl | 900 (black) | Progress percentage |
| Supporting | xs | 500 (medium) | "to complete" |

### Text Hierarchy
```
Hero Title           → 4xl-6xl, weight-900
Description         → lg, weight-300
Card Title          → sm, weight-900 uppercase
Card Value          → 4xl, weight-900
Badge Text          → sm, weight-600
```

## Spacing System

### Padding
- Hero Section: `px-6 md:px-10 py-12 md:py-16`
- Cards: `p-6` (main), `p-4` (sub-cards)
- Badges: `px-4 py-2.5`

### Gaps
- Header Elements: `gap-3 to gap-10`
- Stats Badges: `gap-3`
- Stats Grid: `gap-3`
- Main Grid: `gap-8 lg:gap-10`

### Margins
- Section Spacing: `space-y-4` to `space-y-6`
- Element Spacing: `mb-4`, `mt-2`, etc.

## Border Radius

| Size | Value | Usage |
|------|-------|-------|
| Rounded | 8px | Icon containers |
| Rounded-lg | 12px | Stat cards |
| Rounded-xl | 16px | Progress card |
| Rounded-2xl | 24px | Hero section |
| Rounded-3xl | 32px | Container |

## Shadow System

```
Default: shadow-lg (medium depth)
Hover:   shadow-xl (elevated)
Hero:    shadow-2xl (maximum)
Cards:   shadow-lg → shadow-xl (on hover)
```

## Interaction Patterns

### Hover States
```
Icon Container:  bg-opacity increase + scale-110
Badges:          scale-105 + brightness increase
Cards:           shadow enhancement + scale-105 (origin-left)
Button:          background darkening + translate-y-0.5
```

### Transitions
- Duration: 200-300ms
- Easing: ease-out
- Properties: all, transform, shadow

### Active States
Button pressed:
```
Transform: translate-y-0.5 (press effect)
Transition: smooth 200ms
```

## Component Specifications

### Progress Circle
- Size: 80px × 80px
- Stroke Width: 8px
- Gradient: Linear (blue-600 to blue-700)
- Animation: Smooth stroke-dasharray transition

### Progress Bar
- Height: 10px (h-2.5)
- Background: Slate-200
- Fill: Blue gradient
- Transition: 500ms ease-out

### Stat Badges
- Width: Full container
- Height: 40px (py-2.5)
- Background: White/10 with backdrop blur
- Border: 1px white/20

### CTA Button
- Height: 48px
- Border Radius: 12px
- Background: Blue-600 → Blue-700 (hover)
- Text Color: White
- Icon: Animated on hover

## Responsive Breakpoints

### Mobile (< 768px)
- Grid: 1 column (full width)
- Hero Title: 4xl
- Padding: px-6 py-12
- Stats: Visible but stacked

### Tablet (768px - 1024px)
- Grid: 1 column
- Hero Title: 5xl
- Padding: px-8 py-14
- Stats: Optimized spacing

### Desktop (> 1024px)
- Grid: 5 columns (3 left, 2 right)
- Hero Title: 6xl
- Padding: px-10 py-16
- Stats: Side-by-side

## Animations

### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
Duration: 300ms
```

### Hover Scale
```css
transform: scale(1.05)
transition: transform 300ms ease-out
```

### Button Press
```css
transform: translateY(2px)
transition: transform 200ms ease-out
```

## Accessibility

### Color Contrast
- Text on white: 7:1+ (WCAG AAA)
- Text on blue: 4.5:1+ (WCAG AA)
- Icon to background: 3:1+ (WCAG AA)

### Touch Targets
- Minimum: 44px × 44px
- Button: 48px height
- Badge: 40px height

### Focus States
- Outline: 2px solid blue-600
- Offset: 2px
- Radius: Match element

## Best Practices

### Performance
1. Use CSS transforms for animations (GPU accelerated)
2. Minimize repaints with will-change sparingly
3. Lazy load background images
4. Optimize SVG for circular progress

### Maintainability
1. Use Tailwind utility classes consistently
2. Document custom animations in CSS comments
3. Group related styles with @layer directives
4. Keep magic numbers to a minimum

### User Experience
1. Provide visual feedback for all interactions
2. Ensure sufficient contrast in all states
3. Use meaningful icons paired with text
4. Maintain consistent spacing throughout

## Future Enhancement Opportunities

1. **Dark Mode**: Invert color scheme
   - Background: Slate-900 → Slate-950
   - Text: White → Slate-100
   - Cards: Slate-800 with white/5 borders

2. **Animation Variants**:
   - Entrance: Staggered animations
   - Scroll: Parallax effects
   - Progress: Celebrate milestones

3. **Customization**:
   - Per-career-path branding
   - Theme switching
   - Custom color selection

4. **Micro-interactions**:
   - Progress pulse animation
   - Badge unlock animations
   - Streak counters

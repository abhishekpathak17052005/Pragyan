# 🚀 Quick Start Guide - Learning Platform UI

## Installation

The redesigned learning platform is already integrated. No additional dependencies needed!

```bash
# All dependencies already in package.json:
# - framer-motion@12.4.0 ✅
# - react@18.3.1 ✅
# - tailwindcss@4.1.0 ✅
# - @radix-ui/* ✅

npm install  # If starting fresh
npm run dev  # Development server
npm run build  # Production build
```

## Usage

### 1. Wrap Your App with Gamification

```tsx
// main.tsx or app.tsx
import { GamificationProvider } from '@/components/gamification';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GamificationProvider>
      <App />
    </GamificationProvider>
  </React.StrictMode>
);
```

### 2. Add Gamification Display Layer

```tsx
// In your root layout or app component
import { GamificationDisplay } from '@/components/gamification';

export function App() {
  return (
    <>
      <GamificationDisplay />
      <Routes>
        <Route path="/roadmap" element={<Roadmap />} />
      </Routes>
    </>
  );
}
```

### 3. Use Learning Components

```tsx
import { 
  HeroSection, 
  JourneyTimeline, 
  ProgressSidebar 
} from '@/components/learning';

export function Roadmap() {
  const career = { /* career data */ };
  const stats = { progress: 45, xp: 1500, streak: 7 };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Hero */}
      <div className="lg:col-span-3">
        <HeroSection
          career={career}
          progress={stats.progress}
          xp={stats.xp}
          streak={stats.streak}
          onContinue={() => console.log('Continue!')}
        />
      </div>

      {/* Sidebar */}
      <ProgressSidebar
        currentLevel={2}
        totalXp={stats.xp}
        streak={stats.streak}
        currentWeek={1}
        currentDay={3}
      />

      {/* Journey */}
      <div className="lg:col-span-3 mt-8">
        <JourneyTimeline
          career={career}
          onLessonClick={(id) => console.log('Lesson:', id)}
        />
      </div>
    </div>
  );
}
```

### 4. Trigger Gamification Events

```tsx
import { useGamification } from '@/components/gamification';

function CompleteLessonButton() {
  const { 
    addXPAnimation, 
    addBadgeUnlock, 
    addLevelUp,
    addMotivation 
  } = useGamification();

  const handleComplete = () => {
    // Show XP animation
    addXPAnimation(100);

    // Check for badge
    if (lessonCount === 5) {
      addBadgeUnlock('First 5', '🎯', 'You completed 5 lessons!');
    }

    // Check for level up
    if (totalXp % 1000 === 0) {
      addLevelUp(totalXp / 1000);
    }

    // Show motivation
    addMotivation('🔥 You\'re on a roll! Keep going!');
  };

  return (
    <button onClick={handleComplete}>
      ✓ Complete Lesson
    </button>
  );
}
```

## Components Reference

### HeroSection
```tsx
<HeroSection
  career={career}        // CareerRoadmap object
  progress={45}          // 0-100
  xp={5000}             // Total XP
  streak={7}            // Current streak
  onContinue={() => {}} // Callback
/>
```

### JourneyTimeline
```tsx
<JourneyTimeline
  career={career}              // CareerRoadmap with modules
  onLessonClick={(id) => {}}   // Callback on lesson click
/>
```

### ProgressSidebar
```tsx
<ProgressSidebar
  currentLevel={5}             // User level
  totalXp={5000}              // Total XP earned
  streak={7}                  // Current streak
  currentWeek={1}             // Current week
  currentDay={3}              // Current day
  dailyGoal={{               // Daily goals
    lessons: 1,
    xp: 100
  }}
  achievements={[]}           // Array of achievement objects
/>
```

### ResourceCard
```tsx
<ResourceCard
  resource={resource}         // CareerResource object
  isCompleted={false}        // Completion state
  onOpen={(url) => {}}       // Open link callback
  onComplete={(id) => {}}    // Complete resource callback
/>
```

### LessonCard
```tsx
<LessonCard
  id="lesson-1"
  title="Introduction to HTML"
  description="Learn HTML basics"
  dayNumber={1}
  state="current"            // locked|current|completed|skipped|bonus
  estimatedTime={30}
  difficulty="Beginner"
  xpReward={100}
  skills={['HTML', 'Web']}
  onStart={() => {}}
  onContinue={() => {}}
/>
```

## Gamification Events

### Available Events

```tsx
// XP Animation (floating +XP badge)
addXPAnimation(100);

// Badge Unlock (celebration animation)
addBadgeUnlock('First Lesson', '🎯', 'You completed your first lesson!');

// Level Up (full-screen animation)
addLevelUp(5);

// Streak Update
addStreakUpdate(7);

// Milestone
addMilestone('Week 1 Complete', 'You finished your first week!');

// Motivation Message
addMotivation('🔥 Keep going! You\'re doing great!');
```

## Dark Mode

### Enable Dark Mode

The components automatically support dark mode:

```tsx
// Add dark class to html element
<html className="dark">
  <App />
</html>
```

All components use `dark:` prefix classes for automatic dark mode support.

## Customization

### Custom Colors

Edit colors in the components or override with Tailwind:

```tsx
<div className="bg-gradient-to-br from-blue-600 to-indigo-800 dark:from-blue-900 dark:to-slate-900">
  {/* Override with your colors */}
</div>
```

### Custom Animations

Modify animation durations and effects in component files:

```tsx
transition={{ duration: 1, ease: 'easeOut' }}  // Change duration
animate={{ opacity: [0, 1, 0.5] }}             // Change effect
```

## Troubleshooting

### Animations Not Smooth?
- Ensure Framer Motion is installed: `npm install framer-motion`
- Check browser support (Chrome 90+, Firefox 88+, etc.)
- Disable reduced motion: `prefers-reduced-motion: no-preference`

### Dark Mode Not Working?
- Add `dark` class to html element
- Ensure Tailwind CSS is configured with dark mode
- Check for CSS specificity conflicts

### Components Not Rendering?
- Verify imports are correct: `from '@/components/learning'`
- Ensure `GamificationProvider` wraps your app
- Check React version (18.3.1+)

### Build Errors?
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf dist`
- Run `npm run build` again

## Performance Tips

1. **Memoization**: Components are pre-memoized with `React.memo()`
2. **Code Splitting**: Use dynamic imports for less critical pages
3. **Animation Optimization**: Only animate visible elements
4. **Bundle Size**: Tree-shake unused components
5. **Lazy Loading**: Load resource cards on demand

## Browser DevTools

### Debugging Animations
```javascript
// In Chrome DevTools console
// Slow down animations
document.documentElement.style.animationPlayState = 'paused';

// Speed up animations
document.documentElement.style.animationPlayState = 'running';
```

### Accessing Gamification Context
```javascript
// Debug gamification events
const events = document.querySelector('[data-gamification]');
console.log(events);
```

## Testing

### Test Animations
```tsx
import { render, screen } from '@testing-library/react';
import { HeroSection } from '@/components/learning';

test('renders hero section with animation', () => {
  render(
    <HeroSection 
      career={mockCareer} 
      progress={50}
      xp={1000}
      streak={5}
      onContinue={() => {}}
    />
  );
  
  expect(screen.getByText(/50%/)).toBeInTheDocument();
});
```

### Test Gamification
```tsx
import { GamificationProvider, useGamification } from '@/components/gamification';

test('triggers XP animation', () => {
  const { result } = renderHook(() => useGamification(), {
    wrapper: GamificationProvider
  });

  act(() => {
    result.current.addXPAnimation(100);
  });

  expect(result.current.events).toHaveLength(1);
});
```

## Resources

- 📖 Full Documentation: `LEARNING_EXPERIENCE_REDESIGN.md`
- 📋 Project Summary: `REDESIGN_SUMMARY.md`
- 🎨 Design System: Check component files for color/spacing constants
- 🚀 Next Steps: See `ROADMAP_REDESIGN_COMPLETE.md`

## Support

For questions about specific components:
1. Check the component file comments
2. Review the full documentation
3. Look at the type definitions
4. Test in browser DevTools

---

**Ready to use!** 🎉

Start by wrapping your app with `GamificationProvider` and importing components. The redesigned learning experience is fully functional and production-ready.

Happy coding! 🚀

# Career Icons Feature Implementation

## Overview
Unique icons for each career role are now stored in the database and displayed on the frontend roadmap pages. Each career role has a distinctive icon (e.g., AI Engineer → 🤖 Robot, Cybersecurity → 🛡️ Shield, Data Scientist → 📊 Chart).

## Architecture

### Backend Changes

#### 1. **Database Schema** (`backend/prisma/schema.prisma`)
- Added `icon?: String` field to `CareerRoadmap` model
- Stores Lucide icon name (e.g., "robot", "shield", "chart-bar")
- Optional field - existing careers will be updated via migration

#### 2. **Icon Mapping Utility** (`backend/src/modules/career-roadmap/icon-mapping.ts`)
- `CAREER_ICON_MAP`: Maps career titles to icon names
- `getIconForCareer(title: string)`: Automatically selects appropriate icon for a career title
- Supports 25+ career types with smart keyword matching

**Icon Mappings:**
```
AI Engineer → "robot"
Cybersecurity → "shield"
Data Scientist → "chart-bar"
Frontend Developer → "code"
Backend Developer → "server"
Fullstack Developer → "layers"
Cloud Engineer → "cloud"
Mobile Developer → "smartphone"
Game Developer → "gamepad2"
QA Engineer → "checkmark-circle"
Database Engineer → "database"
Systems Engineer → "cpu"
```

#### 3. **Career Service Updates** (`backend/src/modules/career-roadmap/career-roadmap.service.ts`)
- `createCareer()`: Auto-assigns icon if not provided
- `updateCareer()`: Supports manual icon override
- Icon is intelligently selected based on career title using `getIconForCareer()`

#### 4. **Validators** (`backend/src/modules/career-roadmap/career-roadmap.validators.ts`)
- Updated `createCareerSchema` to include optional `icon` field
- Validates icon string: min 1 char, max 100 chars

#### 5. **Migration Script** (`backend/scripts/add-career-icons.ts`)
- One-time script to add icons to existing careers
- Usage: `npx ts-node scripts/add-career-icons.ts`
- Reads career title, assigns appropriate icon, updates database

### Frontend Changes

#### 1. **Icon Map** (`frontend/src/lib/iconMap.ts`)
- Maps icon names to Lucide React components
- `ICON_MAP`: Record of icon names → icon components
- `getIconComponent(iconName)`: Returns Lucide icon component
- Graceful fallback to `Briefcase` icon if name not found

**Available Icons:**
```
robot → Bot
shield → Shield
chart-bar → BarChart3
code → Code
server → Server
layers → Layers
cloud → Cloud
smartphone → Smartphone
gamepad2 → Gamepad2
checkmark-circle → CheckCircle2
database → Database
cpu → Cpu
briefcase → Briefcase (default)
brain → Brain
```

#### 2. **Type Definitions** (`frontend/src/types/api.ts`)
- Added `icon?: string | null` to `CareerRoadmapSummary` interface
- `CareerRoadmap` inherits icon field

#### 3. **HeroSection Component** (`frontend/src/components/learning/HeroSection.tsx`)
- Displays career icon next to career title
- Icon animation: `scale + rotate` enter animation
- Styled with semi-transparent background and border
- Responsive: scales down on mobile

**Display:**
```
┌─────────────────────────────────┐
│  🤖  AI Engineer                │
│       Your learning path        │
│       Master AI fundamentals... │
└─────────────────────────────────┘
```

## API Changes

### Create Career Endpoint
**POST** `/api/career-roadmap`

Request body now accepts optional `icon`:
```json
{
  "name": "AI Engineer",
  "description": "...",
  "icon": "robot"  // optional
}
```

Response includes icon:
```json
{
  "id": "123",
  "title": "AI Engineer",
  "icon": "robot",
  ...
}
```

### Update Career Endpoint
**PATCH** `/api/career-roadmap/:id`

Can update icon:
```json
{
  "icon": "shield"
}
```

### List Careers Endpoint
**GET** `/api/career-roadmap`

Returns careers with icons:
```json
{
  "id": "123",
  "title": "AI Engineer",
  "icon": "robot",
  ...
}
```

## Smart Icon Assignment

The `getIconForCareer()` function uses intelligent keyword matching:

1. **Exact match** on normalized title
2. **Keyword match** - checks if career contains mapped keywords
3. **Reverse match** - checks if keywords contain the career term
4. **Fallback** - returns "briefcase" icon if no match

Examples:
- "AI Engineer" → matches "ai engineer" → "robot"
- "Machine Learning" → contains "machine learning" → "brain"
- "Frontend Dev" → contains "frontend developer" → "code"
- "Unknown Role" → no match → "briefcase" (default)

## Implementation Steps

### To Add Icons to Existing Careers:

```bash
cd backend

# Run the migration script
npx ts-node scripts/add-career-icons.ts
```

This will:
1. Find all careers without icons
2. Determine appropriate icon based on career title
3. Update database with icons
4. Log results

### To Manually Set an Icon:

```bash
# Via API
PATCH /api/career-roadmap/:careerId
{
  "icon": "shield"
}
```

Or via admin panel:
1. Edit career
2. Select icon from dropdown
3. Save

## Testing

### Backend
```typescript
import { getIconForCareer } from '@/modules/career-roadmap/icon-mapping';

// Test icon assignment
console.log(getIconForCareer('AI Engineer'));           // "robot"
console.log(getIconForCareer('Cybersecurity'));        // "shield"
console.log(getIconForCareer('Data Scientist'));       // "chart-bar"
console.log(getIconForCareer('Unknown Job'));          // "briefcase"
```

### Frontend
```tsx
import { getIconComponent } from '@/lib/iconMap';
import { Bot } from 'lucide-react';

const IconComponent = getIconComponent('robot');
// renders: <Bot />

const fallback = getIconComponent('unknown');
// renders: <Briefcase /> (default)
```

## Benefits

✅ **Visual Differentiation** - Each role instantly recognizable by icon
✅ **Database-Driven** - Icons stored and queryable in MongoDB
✅ **Live & Dynamic** - Update icons anytime without code changes
✅ **Scalable** - Easy to add new icon mappings
✅ **Consistent** - Same icons across all platforms
✅ **Accessible** - Icons paired with text labels
✅ **Animated** - Smooth entrance animations in UI
✅ **Fallback Support** - Unknown roles gracefully fallback to default icon

## Future Enhancements

- Icon editor in admin dashboard
- Custom icon upload support
- Icon search/filter by type
- Icon preferences in user settings
- Icon theme variations (light/dark/color)
- Analytics: track which icons users interact with most

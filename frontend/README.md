
# Pragyan Frontend

React + TypeScript frontend for the Pragyan AI-powered career guidance platform.

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** – fast dev server and bundler
- **Tailwind CSS** – utility-first styling
- **Motion** – animations
- **Radix UI / shadcn** – accessible component primitives
- **MUI (Material UI)** – additional UI components and icons
- **Recharts** – data visualization
- **React Router v7** – client-side routing

## 📁 Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | LandingPage | Marketing / hero page |
| `/auth` | Auth | Login & registration (email/password, Google, GitHub) |
| `/auth/success` | AuthSuccess | OAuth callback handler |
| `/dashboard` | Dashboard | User dashboard with stats and progress |
| `/assessment` | Assessment | AI-powered adaptive career assessment |
| `/results` | Results | Career match results |
| `/analysis` | DetailedAnalysis | In-depth skill gap analysis |
| `/roadmap` | Roadmap | Learning roadmap with task tracking |
| `/jobs` | Jobs | Job marketplace |
| `/assistant` | Assistant | AI chat assistant |
| `/profile` | Profile | User profile management |

## 🚀 Running the code

```bash
# Install dependencies
npm install

# Start the development server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

> The backend must be running on `http://localhost:5000` for the frontend to function correctly. See the [root README](../README.md) for full setup instructions.

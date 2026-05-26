
# 🚀 Pragyan - AI-Powered Career Guidance & Learning Platform

> An intelligent, adaptive ecosystem for career discovery, skill development, and job matching powered by AI and data-driven recommendations.

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-purple)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Seeding Data](#seeding-data)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**Pragyan** is a comprehensive AI-powered platform designed to revolutionize career guidance through:

- **Adaptive Assessment Engine**: Dynamic questionnaires that learn from user responses
- **Intelligent Career Matching**: Data-driven career recommendations based on skills, interests, and market demand
- **Structured Learning Roadmaps**: Comprehensive learning paths from beginner to advanced
- **Job Market Intelligence**: Real-time job opportunities aligned with career goals
- **AI-Powered Insights**: Personalized recommendations and analysis using Gemini API

### Who Is It For?

- 🎓 **Students** - Explore career paths and plan education
- 👨‍💼 **Job Seekers** - Find ideal roles matching your skills
- 📚 **Career Changers** - Understand skill gaps and learning needs
- 🏫 **Educational Institutions** - Integrate career guidance into curriculum

---

## ✨ Key Features

### Core Capabilities

- ✅ **User Authentication** - Secure JWT-based auth with refresh tokens + Google & GitHub OAuth
- ✅ **Adaptive Assessment** - AI-powered dynamic questionnaires
- ✅ **Career Intelligence** - 16+ diverse career paths with skill mappings
- ✅ **Learning Roadmaps** - 5 comprehensive roadmaps with 100+ modules
- ✅ **Job Marketplace** - 20+ opportunities aligned with careers
- ✅ **Progress Tracking** - XP system, achievements, streak counters
- ✅ **Skill Analytics** - Detailed gap analysis and recommendations
- ✅ **AI Chat Assistant** - Conversational guidance powered by Gemini
- ✅ **Profile Management** - User profile with GitHub repository integration
- ✅ **AI Memory Profiling** - Persistent personalization across sessions

### Technical Excellence

- 🔒 **Production-Safe** - MongoDB Atlas + Prisma ORM with replica-set support
- 🚀 **Highly Scalable** - Microservices architecture, Redis caching
- ⚡ **Performance Optimized** - Lazy loading, route splitting, optimized queries
- 🎨 **Modern UI** - React 18, Motion, Tailwind CSS, shadcn/Radix UI components
- 📱 **Fully Responsive** - Mobile-first design approach
- 🔍 **SEO Ready** - Server-side rendering support

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool (dev server on port 5173)
- **Tailwind CSS** - Styling
- **Motion** - Animations
- **Radix UI / shadcn** - Accessible component primitives
- **MUI (Material UI)** - Additional UI components & icons
- **Recharts** - Data visualization
- **React Router v7** - Client-side routing

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - MongoDB ORM
- **MongoDB Atlas** - Cloud database
- **JWT** - Authentication
- **Passport.js** - OAuth 2.0 (Google & GitHub)
- **Gemini API** - AI/LLM integration
- **Redis** - Caching (optional)

---

## 📁 Project Structure

```
Pragyan/
├── frontend/                    # React application (port 5173)
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/          # Page components
│   │   │   │   ├── LandingPage.tsx
│   │   │   │   ├── Auth.tsx
│   │   │   │   ├── AuthSuccess.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Assessment.tsx
│   │   │   │   ├── Results.tsx
│   │   │   │   ├── DetailedAnalysis.tsx
│   │   │   │   ├── Roadmap.tsx
│   │   │   │   ├── Jobs.tsx
│   │   │   │   ├── Assistant.tsx
│   │   │   │   └── Profile.tsx
│   │   │   ├── components/     # Reusable components
│   │   │   └── App.tsx
│   │   ├── context/            # React context (Auth)
│   │   ├── services/           # API service clients
│   │   ├── types/              # TypeScript type definitions
│   │   └── styles/             # Global styles
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                     # Node.js server (port 5000)
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   ├── controllers/        # Route handlers
│   │   ├── services/           # Business logic
│   │   ├── middleware/         # Express middleware
│   │   ├── config/             # Configuration
│   │   ├── ai/                 # AI integration
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts
│   ├── scripts/
│   │   ├── seedAll.ts
│   │   ├── seedCareers.ts
│   │   ├── seedRoadmaps.ts
│   │   ├── seedJobs.ts
│   │   └── smokeTestv2.ts
│   ├── package.json
│   └── tsconfig.json
│
├── README.md
└── package.json
```

---

## 💻 Installation & Setup

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** v9+ or **pnpm** v8+
- **MongoDB Atlas** account ([Sign up free](https://www.mongodb.com/cloud/atlas))
- **Gemini API** key ([Get here](https://ai.google.dev/))

### Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Or with pnpm
pnpm install
```

### Step 2: Configure Environment

Create `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (MongoDB Atlas)
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/Pragyan?retryWrites=true&w=majority"

# JWT
JWT_SECRET="change_this_to_secure_random_string"
JWT_EXPIRY="7d"
JWT_REFRESH_SECRET="change_this_too"
JWT_REFRESH_EXPIRY="30d"

# CORS & Frontend
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
FRONTEND_URL=http://localhost:5173

# AI
AI_PROVIDER=gemini
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-1.5-flash"

# OAuth - Google (optional)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# OAuth - GitHub (optional)
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"

# Optional
REDIS_URL="redis://localhost:6379"
```

### Step 3: Initialize Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Create MongoDB collections and indexes
npx prisma db push

# Seed with intelligent data
npx tsx scripts/seedAll.ts
```

---

## 🚀 Quick Start

### Development Mode

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
# Backend running on http://localhost:5000
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
# Frontend running on http://localhost:5173
```

Then open **http://localhost:5173** in your browser!

### Production Build

```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd backend && npm run build

# Start backend
npm run start
```

---

## 🏃 Available Commands

### Backend

```bash
npm run dev              # Development with hot reload
npm run build            # Build TypeScript
npm run start            # Run production server
npm run test             # Run tests
npm run seed             # Seed database
npx prisma generate     # Generate Prisma client
npx prisma db push      # Push schema to MongoDB
```

### Frontend

```bash
npm run dev              # Dev server (port 5173)
npm run build            # Production build
npm run preview          # Preview build
```

### Seeding

```bash
cd backend

# Seed all data (careers, roadmaps, jobs)
npx tsx scripts/seedAll.ts

# Or individual seeds
npx tsx scripts/seedCareers.ts
npx tsx scripts/seedRoadmaps.ts
npx tsx scripts/seedJobs.ts
```

---

## 🌱 Seeded Data

### What's Included

**16 Career Paths**:
- Software Engineering (Full Stack, Backend, Frontend, DevOps)
- AI/ML (ML Engineer, Data Scientist)
- Cybersecurity (Security Engineer, Pentester)
- Cloud (Cloud Architect, Infrastructure)
- Design (UI/UX, Product Design)
- Government (IAS Officer)
- Defence (Military Officer)
- Teaching (School Teacher)
- Medicine (Doctor)
- Finance (Investment Banker)
- Marketing & Entrepreneurship

**5 Learning Roadmaps**:
1. Full Stack Web Development (12 weeks, 120 hours)
2. Python for Data Science (16 weeks, 160 hours)
3. Cybersecurity Fundamentals (10 weeks, 100 hours)
4. UPSC Exam Preparation (52 weeks, 520 hours)
5. UI/UX Design Mastery (12 weeks, 120 hours)

**100+ Learning Modules** with structured weeks, days, and tasks

**21 Job Listings** with salaries, companies, and skill requirements

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register      - Create account
POST   /api/auth/login         - Login
POST   /api/auth/refresh-token - Refresh token
POST   /api/auth/logout        - Logout
GET    /api/auth/me            - Get current user
PATCH  /api/auth/me            - Update profile
GET    /api/auth/google        - Start Google OAuth
GET    /api/auth/github        - Start GitHub OAuth
```

### Assessment & Careers
```
POST   /api/assessment/generate - Generate assessment
POST   /api/assessment/submit    - Submit answers
GET    /api/assessment/result    - Get results
GET    /api/career-matching     - Matched careers
GET    /api/recommendations     - Career recommendations
```

### Learning
```
GET    /api/roadmaps           - All roadmaps
GET    /api/roadmaps/:id       - Roadmap details
GET    /api/progress           - User progress
POST   /api/progress/update    - Update progress
GET    /api/skills             - Available skills
```

### Jobs & AI
```
GET    /api/jobs               - Job listings
GET    /api/jobs/:id           - Job details
POST   /api/jobs/apply         - Apply for job
POST   /api/ai/chat            - Chat with AI
GET    /api/ai/suggestions     - AI suggestions
```

---

## 🗄️ Database Schema

**Collections**:
- `User` - User profiles with XP, streak, and skills
- `SocialAccount` - Linked OAuth accounts (Google, GitHub)
- `GithubRepository` - Synced GitHub repositories
- `RefreshToken` - JWT refresh token storage
- `Career` - Career definitions
- `CareerSkillMapping` - Required skills per career
- `CareerInterestMapping` - Interest alignment per career
- `Skill` - Structured skill definitions with modules
- `WeeklyModule` - Weekly learning modules per skill
- `DailyTask` - Daily tasks with XP rewards
- `Resource` - Learning resources per task
- `Roadmap` - Learning paths
- `Week`, `Day`, `Task` - Roadmap structure
- `Job` - Job listings
- `JobApplication` - User job applications
- `AssessmentResult` - Assessment results
- `AssessmentSession` - Session snapshots
- `UserProgress` - Learning progress
- `UserAchievement` - Unlocked achievements
- `AIMemoryProfile` - Persistent AI personalization data
- `PersonalityProfile` - Mentor type and learning style
- `LearningVelocity` - Pacing and velocity metrics
- `DecisionSnapshot` - Adaptive engine decision history

---

## 🧪 Testing

### Run E2E Smoke Test

```bash
cd backend
npx tsx scripts/smokeTestv2.ts

# Expected: 5+ tests pass ✅
```

### Run Unit Tests

```bash
cd backend
npm run test
```

---

## 🔐 Security

- ✅ JWT authentication with refresh tokens
- ✅ Password hashing (bcryptjs)
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ Input validation (Zod)
- ✅ Environment variables protected
- ✅ Error handling (no sensitive leaks)

---

## 🐛 Troubleshooting

### MongoDB Connection Failed

```
Error: Connection refused
```

**Fix**:
1. Check `DATABASE_URL` in `backend/.env`
2. Verify IP whitelist in MongoDB Atlas (or use 0.0.0.0/0)
3. Ensure cluster is running (not paused)
4. Test with `mongosh`:
   ```bash
   mongosh "mongodb+srv://user:pass@cluster.mongodb.net/Pragyan"
   ```

### Prisma Client Error

```
EPERM: operation not permitted
```

**Fix** (Windows):
```bash
# Stop Node processes, then regenerate
npx prisma generate
```

### Frontend Blank Page

**Fix**:
1. Verify backend on port 5000: `curl http://localhost:5000/health`
2. Check `CORS_ORIGINS` includes `http://localhost:5173`
3. Clear browser cache, reload
4. Check browser console for errors

---

## 📊 Performance Metrics

- Frontend Bundle: ~900KB (gzipped)
- API Response: <200ms typical
- Database Queries: Optimized with indexes
- Caching: Redis + in-memory fallback

---

## 🚢 Deployment

### MongoDB Atlas Setup

1. Create cluster: [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user
3. Whitelist IP (0.0.0.0/0 for dev, specific IPs for prod)
4. Get connection URI
5. Set as `DATABASE_URL` in `backend/.env`

### Required Environment Variables

- `DATABASE_URL` - MongoDB URI
- `JWT_SECRET` - Random secure string
- `JWT_REFRESH_SECRET` - Another random string
- `GEMINI_API_KEY` - From Google AI
- `CORS_ORIGINS` - Your domain(s)
- `FRONTEND_URL` - Frontend URL (for OAuth callbacks)
- `NODE_ENV` - "production"
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google OAuth (optional)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - For GitHub OAuth (optional)

### Docker

```bash
docker build -t pragyan-backend backend/
docker run -p 5000:5000 \
  -e DATABASE_URL="..." \
  -e JWT_SECRET="..." \
  pragyan-backend
```

---

## 📞 Support & Contributing

### Report Bugs

Include:
- Steps to reproduce
- Expected vs actual behavior
- Environment (Node version, OS)
- Error messages/logs

### Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/xyz`
3. Commit: `git commit -m 'Add xyz'`
4. Push: `git push origin feature/xyz`
5. Open Pull Request

---

## 📜 License

MIT License - see LICENSE file for details.

---

## 🎉 Acknowledgments

- MongoDB for database infrastructure
- Google AI for Gemini API
- React and Node.js communities
- All contributors

---

## 🗺️ Future Roadmap

- [ ] Video learning integration
- [ ] Mobile app (React Native)
- [ ] Live mentoring
- [ ] Portfolio builder
- [ ] Interview prep
- [ ] Blockchain credentials
- [ ] Community features

---

**Made with ❤️ for Career Guidance**

Latest Update: May 2026
  
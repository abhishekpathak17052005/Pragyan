# Pragyan AI - Terms & Workflows Summary

## 🎯 What is Pragyan AI?

Pragyan is a **comprehensive AI-powered career readiness platform** that helps students:
1. **Discover careers** through multi-phase assessments
2. **Identify skill gaps** through intelligent analysis
3. **Learn systematically** via personalized roadmaps
4. **Track progress** with gamification (XP, levels, streaks)
5. **Find jobs** through skill-based matching
6. **Get mentored** by AI counselor (Gemini-powered)

---

## 🔑 Core Terminology

### **User Types**
- **Student**: Learns, takes assessments, completes roadmaps
- **Recruiter**: Posts jobs, reviews applications
- **Placement Officer**: Manages hiring drives
- **Admin**: Manages system, audits actions

### **Key Workflows**

| Workflow | Trigger | Process | Output |
|----------|---------|---------|--------|
| **Assessment** | Student clicks "Start Assessment" | 7 phases (interests, skills, experience) | Career recommendations + Skill gaps |
| **Learning** | Student selects career | Modules → Weeks → Days → Topics → Resources | Progress tracking + XP/Achievements |
| **Job Matching** | Student ready for jobs | System matches skills vs job requirements | Eligible jobs with match % |
| **Placement Drive** | Placement officer schedules event | Company + Date + Student registration | Placements + Job offers |
| **Audit** | Any admin/user action | Log captured (actor, action, changes) | Immutable audit trail |

---

## 📊 Data Flow Map

```
STUDENT JOURNEY
─────────────────────────────────────────────────────────────

1. REGISTRATION
   ↓
   User created → Email verified → StudentProfile created

2. ASSESSMENT (7 phases, ~90 min)
   ↓
   Phase 1-7 answers collected → UserAssessmentAnswer records
   ↓
   AssessmentResult generated with scores

3. CAREER RECOMMENDATIONS
   ↓
   AI Algorithm: Interests + Skills + Experience → Career matching
   ↓
   CSVCareerMatch (top 100 careers ranked)
   ↓
   CareerRecommendationSnapshot (cached for dashboard)
   ↓
   SkillGapAnalysis for top 5 careers

4. LEARNING PATHWAY
   ↓
   Select career → CareerRoadmap loaded
   ↓
   Module 1 (Foundations) → Module 2 (Applied) → Module 3 (Projects)
   ↓
   Each day:
   - Display topics
   - Show resources
   - Complete quiz
   - Award XP
   ↓
   UserResourceProgress tracked per resource
   ↓
   UserProgress updated (overall roadmap progress)
   ↓
   Achievements unlocked (streak milestones, etc.)

5. ADAPTIVE LEARNING
   ↓
   Background job calculates LearningVelocity
   ↓
   If too fast: Increase difficulty (RoadmapMutation)
   ↓
   If too slow: Add support resources (RoadmapMutation)
   ↓
   Personalized pacing

6. JOB ELIGIBILITY
   ↓
   After 2 weeks: Calculate JobEligibility for all jobs
   ↓
   Background: Match student skills vs job requirements
   ↓
   Result: List of eligible jobs with match %

7. JOB APPLICATION
   ↓
   Student applies → JobApplication created
   ↓
   Recruiter reviews → Interview scheduled
   ↓
   Offer extended → Placement achieved

8. CONTINUED TRACKING
   ↓
   PlacementReadiness score updated daily
   ↓
   AuditLog records all actions
   ↓
   Analytics generated (placement rate, skill trends)
```

---

## 🎓 Assessment Phases (in detail)

### **Phase 1: Profile Collection** (5 min)
- **Questions**: Name, education level, college, branch, year, CGPA
- **Purpose**: Build user context
- **Output**: UserAssessmentAnswer records

### **Phase 2: Interest Discovery** (5 min)
- **Questions**: Career interests, work environment preferences, work style
- **Purpose**: Identify interest alignment with careers
- **Output**: Interest tags stored in user profile

### **Phase 3: Capability Discovery** (10 min)
- **Questions**: Current skills, programming languages, tools, certifications
- **Purpose**: Assess technical capability baseline
- **Output**: Skill inventory in user profile

### **Phase 4: Technical Assessment** (20 min)
- **Questions**: Coding problems, problem-solving scenarios, algorithms
- **Purpose**: Evaluate coding ability level
- **Output**: Technical score, code proficiency level

### **Phase 5: Career Readiness** (10 min)
- **Questions**: Portfolio projects, certifications, interview prep
- **Purpose**: Assess job market readiness
- **Output**: Readiness score, missing items list

### **Phase 6: Aptitude Testing** (15 min)
- **Questions**: Logic puzzles, reasoning tests, domain-specific aptitude
- **Purpose**: Measure analytical ability
- **Output**: Aptitude scores

### **Phase 7: Personality & Soft Skills** (10 min)
- **Questions**: Communication, leadership, teamwork, learning style
- **Purpose**: Assess soft skills fit
- **Output**: Personality profile for AI adaptation

---

## 💡 Career Matching Algorithm

```
INPUTS:
├── User Signals (from assessment):
│   ├── Interests (tags)
│   ├── Current skills
│   ├── Experience level
│   ├── Education
│   ├── Work style preferences
│   └── Personality profile
│
└── Career Data (from database):
    ├── Required skills
    ├── Preferred skills
    ├── Personality fit
    ├── Typical work environment
    └── Career progression

SCORING (0-100):
├── Skill match: 40% weight
├── Interest alignment: 30% weight
├── Experience fit: 20% weight
├── Education level: 10% weight
└── Final score = weighted sum

CONFIDENCE LEVELS:
├── High (>80): Strong fit
├── Medium (50-80): Good match, potential fit
└── Low (<50): Poor fit, may need upskilling

OUTPUT:
├── CSVCareerMatch records (all careers scored)
├── Top 100 careers by score
├── For top 5: SkillGapAnalysis (missing skills identified)
└── AssessmentRoadmap (learning path for #1 choice)
```

---

## 🏗️ Learning Roadmap Structure

```
CAREER ROADMAP (e.g., "Frontend Developer")
│
├─ MODULE 1: FOUNDATIONS (Weeks 1-2)
│  │
│  ├─ WEEK 1: HTML & CSS Basics
│  │  ├─ DAY 1: HTML Semantics
│  │  │  ├─ Topic 1: HTML Structure
│  │  │  │  ├─ Resource 1: MDN Guide (Article)
│  │  │  │  ├─ Resource 2: YouTube Tutorial (Video)
│  │  │  │  └─ Resource 3: CodePen Examples (Practice)
│  │  │  ├─ Topic 2: Common Tags
│  │  │  └─ Topic 3: Mini Project
│  │  │
│  │  ├─ DAY 2: CSS Layouts
│  │  │  ├─ Topic 1: Flexbox
│  │  │  ├─ Topic 2: Grid
│  │  │  └─ Topic 3: Mini Project
│  │  │
│  │  ├─ DAY 3: Responsive Design
│  │  │  ├─ Topic 1: Media Queries
│  │  │  ├─ Topic 2: Mobile First
│  │  │  └─ Topic 3: Project
│  │  │
│  │  ├─ DAY 4: Practice
│  │  └─ DAY 5: Quiz & Review
│  │
│  └─ WEEK 2: JavaScript Fundamentals
│     ├─ DAY 1-5: (similar structure)
│
├─ MODULE 2: APPLIED PRACTICE (Weeks 3-4)
│  │ (harder problems, real-world scenarios)
│
└─ MODULE 3: PROJECTS (Weeks 5-6)
   └─ (portfolio projects, interview prep)

PROGRESS TRACKING:
├─ UserResourceProgress (per resource): completed, time spent
├─ TaskProgress (per daily task): completed status
├─ UserProgress (overall): % complete, current day, XP earned
└─ CompletedRoadmap (when finished): timestamp
```

---

## 🎮 Gamification System

### **XP (Experience Points)**
```
Task completed → Base XP (10-50 points) + Streak Bonus
Calculation:
- Base: 10-50 depending on difficulty
- Streak Bonus: 1.5x to 3x multiplier
- Quiz Bonus: +10-20 XP if score >80%
- Achievement Bonus: +100-500 when unlocked

Example:
- Simple task (10 XP) + 5 day streak (2x) = 20 XP
- Hard task (50 XP) + 20 day streak (3x) = 150 XP
```

### **Levels**
```
Level = XP_EARNED / 1000 (approximately)

Milestones:
- Level 1: 0 XP (start)
- Level 5: 5,000 XP (1st achievement)
- Level 10: 10,000 XP (milestone)
- Level 50: 50,000 XP (advanced)
- Level 100: 100,000 XP (mastery)
```

### **Streaks**
```
Streak = consecutive active days (logged in + activity)

Mechanics:
- +1 streak for each day active
- Reset to 0 if missed a day
- 7-day streak unlocks "Week Warrior" achievement
- 30-day streak unlocks "Learning Master" achievement

Bonuses by streak length:
- 1-5 days: 1.5x XP multiplier
- 6-10 days: 1.8x XP multiplier
- 11-20 days: 2.0x XP multiplier
- 20+ days: 2.5x-3.0x XP multiplier
```

### **Achievements**
```
Examples:
├─ First Task Completed: Complete 1 task
├─ Week Warrior: 7-day streak
├─ Learning Master: 30-day streak
├─ Career Ready: Complete full roadmap
├─ Job Offer: Get placed (first job)
├─ Skill Expert: Master a skill (90%+ proficiency)
└─ Mentor: Help 5 other students

Award: Badges + XP Bonus + Social recognition
```

---

## 🤖 AI Personalization Features

### **AIMemoryProfile**
- Stores aggregated learning signals
- Strengths and weaknesses
- Learning preferences
- Personality traits
- Updated after each major activity

### **PersonalityProfile**
- Mentor communication style (formal/casual/encouraging)
- Learning style preference (visual/textual/hands-on)
- Pace preference (fast/normal/slow)
- Goal orientation (career/learning/balance)

### **LearningVelocity**
```
Calculated weekly:
Velocity = (Tasks Completed / Days Active) per week

Response:
- <1: Below baseline → Offer support + hints
- 1-2: Normal → Maintain
- 2-3: Above baseline → Increase difficulty
- >3: Exceptional → Accelerate or offer harder projects

Used for: RoadmapMutation (adapt roadmap pacing)
```

### **AI Counselor (Gemini)**
```
User question → System context (profile, roadmap, skills)
         ↓
Include in prompt to Gemini:
- AssessmentResult summary
- Current roadmap progress
- Skill gaps
- Learning velocity
- Personality profile
         ↓
Gemini generates personalized response
         ↓
Response cached in RecommendationSnapshot (24hr TTL)
         ↓
Display with estimated time, difficulty, prerequisites
```

---

## 💼 Job Matching & Recruitment

### **Job Eligibility Calculation**
```
For each job posting:

Required Skills Match:
├─ Extract from job description
├─ Compare vs student skills
├─ Calculate match % (0-100%)

Weighted Scoring:
├─ Required skills: 50% weight
├─ Preferred skills: 30% weight
├─ Experience level: 15% weight
├─ Education level: 5% weight

Result: JobEligibility score
├─ >70%: Eligible (show in feed)
├─ 50-70%: Near-eligible (with upskilling path)
├─ <50%: Not eligible (show skill gap)
```

### **Recruitment Pipeline**
```
Recruiter Posts Job
      ↓
System indexes (SkillIndexEntry)
      ↓
Background job calculates JobEligibility
      ↓
Students see eligible jobs
      ↓
Student applies (JobApplication)
      ↓
Recruiter reviews + interviews (InterviewSchedule)
      ↓
Offer decision (SELECTED/REJECTED)
      ↓
Placement recorded + Analytics updated
```

---

## 📈 Admin & Analytics

### **Audit Logging**
```
Every action logged to AuditLog:
├─ Actor (who did it): admin user ID
├─ Target (who affected): target user ID
├─ Action: LOGIN, PASSWORD_RESET, USER_SUSPENDED, etc.
├─ Changes: JSON delta (before → after)
├─ Metadata: IP address, user agent, timestamp
└─ Status: SUCCESS or FAILED

Query capabilities:
├─ By action type (filter by LOGIN, PASSWORD_RESET, etc.)
├─ By user (all actions on/by a user)
├─ By date range (weekly, monthly, yearly)
└─ By status (failed attempts, suspicious activity)
```

### **Placement Readiness Score**
```
Daily calculation for each student:

Score = (0.3 × Skills%) + (0.2 × XP%) + (0.3 × JobsEligible%) + (0.1 × Profile%) + (0.1 × Interview%)

Where:
├─ Skills%: Completed skills / Total needed (0-100)
├─ XP%: Current XP / Expected for stage (0-100)
├─ JobsEligible%: (Eligible jobs / Total jobs) × 100
├─ Profile%: Completeness (resume, projects, etc.)
└─ Interview%: Interview readiness signals

Rating:
├─ 0-40: 🔴 Needs Improvement
├─ 40-60: 🟡 In Progress
├─ 60-80: 🟢 Well Prepared
└─ 80-100: 🟢🟢 Highly Ready

Used for: Notifications, admin dashboard, job recommendations
```

---

## 🔐 Security & Privacy

### **Data Protection**
```
✓ Passwords: bcrypt hashed
✓ Tokens: One-time, TTL-based expiration
✓ Audit Trail: All actions logged immutably
✓ Debug Access: Special audit for sensitive queries
✓ PII: Only essential data stored
```

### **Access Control**
```
Role-based permissions:
├─ Admin: Full system access + audit viewing
├─ Recruiter: Job posting + application viewing
├─ Placement Officer: Hiring drive management
└─ Student: Personal profile + roadmap access
```

---

## 📊 Key Metrics & Formulas

### **Career Match Score**
```
Score = (30% × Skill_Match) + (25% × Interest_Match) + (20% × Experience_Match) + (15% × Education_Match) + (10% × Personality_Match)

Range: 0-100
Interpretation:
- >80: Excellent fit
- 60-80: Good fit
- 40-60: Possible fit (upskilling needed)
- <40: Poor fit
```

### **Learning Velocity Formula**
```
Velocity = Tasks_Completed / Days_Active

Performance Bands:
- <1: Slow (needs support)
- 1-2: Normal (maintain)
- 2-3: Fast (increase challenge)
- >3: Very Fast (acceleration)
```

### **Skill Proficiency Level**
```
Proficiency = (Completed_Topics / Total_Topics) × 100

Levels:
- 0-25%: Beginner (learning concepts)
- 26-50%: Intermediate (building projects)
- 51-75%: Advanced (optimizing solutions)
- 76-100%: Expert (teaching others)
```

---

## 🚀 Quick Start Checklist for New Developers

- [ ] Read PRAGYAN_WORKFLOW_GUIDE.md (comprehensive reference)
- [ ] Review PRAGYAN_QUICK_REFERENCE.md (quick lookup)
- [ ] Understand user flows (6 main flows documented)
- [ ] Study data model relationships
- [ ] Check code in backend/src/modules/:
  - [ ] career-roadmap/ (roadmap logic)
  - [ ] auth/ (authentication)
  - [ ] assessment/ (assessment logic)
- [ ] Familiarize with frontend components:
  - [ ] /pages/admin-roadmap-builder-optimized.tsx (new builder)
  - [ ] /pages/ai-counselor.tsx (AI chat interface)
  - [ ] /pages/dashboard.tsx (student dashboard)
- [ ] Set up local environment (.env files)
- [ ] Run backend: `npm start` (port 3000)
- [ ] Run frontend: `npm start` (port 5173)
- [ ] Test: Hit http://localhost:5173/admin/roadmaps

---

## 📞 Support & Documentation

**Files**:
1. **PRAGYAN_WORKFLOW_GUIDE.md** - Complete system guide (this knowledge base)
2. **PRAGYAN_QUICK_REFERENCE.md** - Cheat sheet for terms
3. **ROADMAP_OPTIMIZATION_VERIFICATION.md** - Deployment verification

**Next Steps**:
- Deploy optimized builder to production
- Monitor admin dashboard performance
- Collect user feedback
- Plan iterative feature additions (module creation UI, etc.)

---

**Created**: July 14, 2026  
**Version**: 1.0  
**Status**: Complete & Ready for Reference


# Pragyan AI - Complete Workflow Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Core Terms & Definitions](#core-terms--definitions)
3. [User Workflows](#user-workflows)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Feature Workflows](#feature-workflows)

---

## System Overview

**Pragyan AI** is a comprehensive **career readiness & placement platform** that uses AI-driven assessments, skill gap analysis, personalized roadmaps, and job matching to help students prepare for placements and career transitions.

### Key Participants:
- **Students**: Primary users seeking career guidance and skill development
- **Recruiters**: Companies posting jobs and recruiting talent
- **Placement Officers**: College administrators managing placement drives
- **Admins**: System administrators managing content, users, and audit logs

---

## Core Terms & Definitions

### **Authentication & Roles**

| Term | Definition | Workflow |
|------|------------|----------|
| **User** | Core entity representing any person in the system | Created via registration/OAuth → Email verification → Role assignment |
| **UserRole** | Role assigned to user (ADMIN, RECRUITER, PLACEMENT_OFFICER, STUDENT) | Set during registration or by admin invitation |
| **Organization** | Institution/Company (College, University, Startup, Company) | Created by admin; Students/Recruiters linked to organization |
| **StudentProfile** | Extended profile for student users (GPA, skills, resume, etc.) | Auto-created when student joins; Updated by student |
| **RecruiterProfile** | Extended profile for recruiter users (Company, designation, verification) | Created during recruiter onboarding; Verified by admin |
| **PlacementOfficerProfile** | Profile for college placement coordinators | Created for college staff; Manages hiring drives |

### **Assessment & Discovery**

| Term | Definition | Workflow |
|------|------------|----------|
| **Assessment** | Multi-phase questionnaire to discover user profile | Phase 1-7 → Collect info (interests, skills, experience) → Generate recommendations |
| **AssessmentSession** | Single attempt of assessment by a user | User starts → Completes phases → Saved in DB with answers |
| **AssessmentAnswer** | Individual response to assessment questions | Stored per question; Used for analysis |
| **UserAssessmentAnswer** | Structured assessment response with metadata | Phase-specific; Includes question, answer, topic, difficulty |
| **AssessmentPhase** | Component phases (Phase 1: Profile, Phase 2: Interests, etc.) | Sequential → User can revisit → Influences final recommendations |

**Assessment Phases:**
1. **Phase 1 - Profile Collection**: Name, education, experience level
2. **Phase 2 - Interest Discovery**: Career interests, work preferences  
3. **Phase 3 - Capability Discovery**: Skills assessment, domain expertise
4. **Phase 4 - Technical Assessment**: Coding ability, problem-solving
5. **Phase 5 - Career Readiness**: Portfolio, certifications, interview prep
6. **Phase 6 - Aptitude Testing**: Logic, reasoning, domain-specific aptitude
7. **Phase 7 - Personality & Soft Skills**: Communication, leadership, teamwork

### **Career Recommendations**

| Term | Definition | Workflow |
|------|------------|----------|
| **CareerRole** | Job role from knowledge base (e.g., "Frontend Developer") | Stores skills, tools, salaries, career path, difficulty |
| **CareerMatch** | Calculated match between user profile & career | User profile + Role requirements → Similarity score (0-100) |
| **CSVCareerMatch** | Structured match result from CSV dataset | Assessment answers → Skill extraction → Career matching algorithm |
| **CareerRecommendationSnapshot** | Cached set of career recommendations for user | Generated after assessment; Stores top careers + full rankings |
| **SkillGapAnalysis** | Analysis of skills user has vs. career needs | Target career + User skills → Missing skills identified → Learning path |
| **CareerPerformanceScore** | User's overall readiness score for job market | Assessment scores + Completed learning + XP → Performance metric |

### **Learning & Development**

| Term | Definition | Workflow |
|------|------------|----------|
| **Skill** | Discrete technical or soft skill (e.g., "JavaScript", "Communication") | Stored in master database; Linked to careers, tasks, and learning resources |
| **DailyTask** | Atomic learning task (e.g., "Learn Array Methods") | Assigned daily; Contains description, subtasks, resources, XP reward |
| **WeeklyModule** | Collection of tasks for a week | Organized by skill; Contains multiple daily tasks |
| **Resource** | Learning material (video, article, documentation) | Attached to tasks; Has URL, platform, type, description |
| **LearningResource** | Curated resource for roadmap topics | Stored centrally; Tracks difficulty, provider, estimated time |
| **ResourceLearningHistory** | Tracks student's engagement with resources | User + Resource → Completion %, quiz score, time spent, notes |
| **TaskProgress** | Tracks completion of daily tasks by user | User + Task → Completed flag, completion date |

### **Roadmaps**

| Term | Definition | Workflow |
|------|------------|----------|
| **Roadmap** (Legacy) | Old linear learning path by career/skill | Category → Weeks → Days → Tasks → Resources |
| **CareerRoadmap** | New AI-optimized career learning path | Manual creation; Contains Modules → Weeks → Days → Topics → Resources |
| **CareerRoadmapModule** | Largest unit of career roadmap (e.g., "Foundations", "Advanced Projects") | Contains 2+ weeks; Has description, ordering |
| **CareerRoadmapWeek** | Week-long learning block | 5-7 days of focused learning; Part of module |
| **CareerRoadmapDay** | Single day's learning goals | 3-5 topics; ~6-8 hours of work; XP reward |
| **CareerRoadmapTopic** | Specific topic to learn (e.g., "React Hooks") | Learning objective + 2-5 resources; Part of day |
| **CareerRoadmapResource** | Resource for a topic | URL, provider, type (video/article/project), difficulty level |
| **UserRoadmap** | Tracks user's progress on a roadmap | User + Roadmap → Progress %, started, completed flags |
| **UserProgress** | Detailed progress tracking | Days completed, tasks completed, XP earned, streak, current position |

### **Gamification & Motivation**

| Term | Definition | Workflow |
|------|------------|----------|
| **XP (Experience Points)** | Points earned for completing tasks | Base XP per task + Bonuses (streaks, difficulty) → Cumulative total |
| **Level** | User progression tier (1-100) | Increases with XP accumulation; Unlocks achievements |
| **Streak** | Consecutive days of learning activity | +1 for each active day; Reset if missed → XP bonus |
| **Achievement** | Badge/milestone (e.g., "First 10 Days", "Streak Master") | Unlock conditions defined in code → Awarded via system |
| **UserXpLog** | Audit trail of XP changes | Tracks reason, amount, metadata for each XP change |
| **UserAchievement** | Records when user unlocks achievement | User + Achievement code + Unlock time |
| **DailyQuiz** | Daily short quiz for XP & engagement | ~5 questions; Takes 10 min; Awards XP bonus |
| **DailyQuizAttempt** | User's attempt of daily quiz | Score, XP awarded, timestamp |
| **UserDailyLearning** | Summary of daily activity (tasks, XP earned) | Auto-tracked; Used for streak calculation & analytics |

### **AI Personalization**

| Term | Definition | Workflow |
|------|------------|----------|
| **AIMemoryProfile** | Long-term memory of user's learning profile | Aggregates signals (strengths, weaknesses, preferences) → Updated over time |
| **PersonalityProfile** | User's personality for AI adaptation | Mentor type, communication tone, learning style preferences |
| **LearningVelocity** | Speed of user's learning progress | Calculated over rolling window; Used to adjust roadmap pacing |
| **RecommendationHistory** | Log of all recommendations made to user | Stores item, reason, score, source; Used for feedback loops |
| **RecommendationSnapshot** | Cached recommendation output to avoid repeat AI calls | Request hash → Cached response; TTL-based expiration |
| **RoadmapMutation** | Adaptive change to user's roadmap | Branching, pacing adjustment, milestone shift; Records reason & date |
| **DecisionSnapshot** | Snapshot of AI engine's evaluation at a point in time | Full career list with scores; Used for analysis & iteration |

### **Recruitment**

| Term | Definition | Workflow |
|------|------------|----------|
| **Job** (Legacy) | Generic job listing | Title, company, location, salary, skills required, apply link |
| **RecruiterJob** | Structured job posting by recruiter | Title, description, salary range, skills, experience, location, deadline |
| **Company** | Employer organization | Name, industry, size, location, hiring domains, logo, description |
| **HiringDrive** | Campus recruitment event | Company + Date + Venue + Deadline; Organized by placement officer |
| **JobApplication** | User's application to a job | User + Job → Status (APPLIED, SHORTLISTED, SELECTED, etc.) |
| **JobEligibility** | Calculated match between student & job | Compares required skills vs. student skills → Match % & eligibility |
| **PlacementReadiness** | Student's job-readiness score | Combines completed skills, XP, eligible jobs count, next actions |

### **Admin & Auditing**

| Term | Definition | Workflow |
|------|------------|----------|
| **AuditLog** | Record of system actions (login, password reset, user suspended) | Action type + Actor + Target + Changes + Timestamp + IP → Immutable |
| **VerificationToken** | One-time token for email/password reset | Purpose-specific (EMAIL_VERIFY, PASSWORD_RESET, etc.); TTL-based |
| **RefreshToken** | Session token for API auth | Secure storage (hashed); Family ID for rotation; Device tracking |
| **Notification** | Alert to user (via email, push, SMS, in-app) | Type (account_verification, job_application, etc.); Read status tracking |
| **IntelligenceDebugAudit** | Log of admin debug access to sensitive user data | Admin ID + Endpoint + Target user + Filters + Timestamp |

---

## User Workflows

### **Workflow 1: Student Registration & Setup**

```
1. User visits landing page
   ↓
2. Clicks "Sign Up" → Registration form (email, password, full name)
   ↓
3. Validation → Email sent with verification link
   ↓
4. User clicks verification link → Status changes to ACTIVE
   ↓
5. Redirect to onboarding → Collect basic profile (college, branch, year, CGPA)
   ↓
6. StudentProfile created
   ↓
7. User directed to dashboard
```

### **Workflow 2: Assessment & Career Discovery**

```
1. Student navigates to Assessments section
   ↓
2. Clicks "Start New Assessment"
   ↓
3. AssessmentSession created
   ↓
4. Phase 1: Profile Collection
   - Questions about education, experience, background
   - Stored in UserAssessmentAnswer
   ↓
5. Phase 2: Interest Discovery
   - Career interests, work environment preferences
   - Work style questions
   ↓
6. Phase 3-5: Capability, Technical, Readiness
   - Skill inventory
   - Coding problems
   - Portfolio/certification info
   ↓
7. Final Submission
   - All answers compiled
   - AssessmentResult created
   - AI analysis triggered
   ↓
8. Career Recommendations Generated
   - Extract user profile signals
   - Run matching algorithm vs. CareerRole database
   - Generate CSVCareerMatch records (top 10 careers)
   - Create CareerRecommendationSnapshot
   ↓
9. SkillGapAnalysis created for top 3 careers
   ↓
10. AssessmentRoadmap created with recommended learning path
    ↓
11. User directed to Results Dashboard
    - Top career recommendations
    - Skill gaps for each career
    - Recommended learning roadmap
```

### **Workflow 3: Personalized Learning Path**

```
1. User selects career from recommendations
   ↓
2. CareerRoadmap loaded (e.g., "Full Stack Developer")
   ↓
3. Module 1: Foundations → Module 2: Applied → Module 3: Projects
   ↓
4. Each day (CareerRoadmapDay):
   - Display daily topics (CareerRoadmapTopic)
   - Show resources for each topic (CareerRoadmapResource)
   - Track completion (UserResourceProgress)
   ↓
5. User completes task → XP awarded
   - Base XP + streak bonus
   - UserXpLog entry created
   - User level updated if threshold reached
   ↓
6. Achievement checks:
   - First task completed?
   - Week streak reached?
   - Award achievement if unlocked
   ↓
7. Daily quiz offered
   - User completes quiz
   - DailyQuizAttempt logged
   - Extra XP awarded if passed
   ↓
8. Weekly progress summary
   - UserProgress updated
   - PlacementReadiness score recalculated
   - Streak counter incremented (if active daily)
   ↓
9. LearningVelocity calculated
   - Tasks completed / time elapsed
   - Compared to baseline
   - If too fast → Difficulty increased
   - If too slow → Hints/support offered
   ↓
10. Adaptive mutations considered
    - Roadmap pacing adjusted?
    - Topics branched based on weakness?
    - RoadmapMutation recorded
```

### **Workflow 4: Job Search & Application**

```
1. User completes at least 2 weeks of learning
   ↓
2. Navigates to Jobs section
   ↓
3. System calculates JobEligibility for all posted jobs
   - Compares required skills vs. user skills
   - Generates match %
   ↓
4. Display filtered jobs (only eligible or close to eligible)
   ↓
5. User clicks Apply
   ↓
6. JobApplication created (status: APPLIED)
   ↓
7. Notification sent to recruiter
   ↓
8. Recruiter can accept/shortlist/reject
   - Status updated in JobApplication
   - Notification sent to student
   ↓
9. If shortlisted → Interview scheduled (InterviewSchedule created)
   ↓
10. If selected → Status = SELECTED
    - Achievement unlocked: "First Job Offer"
    - PlacementReadiness updated
```

### **Workflow 5: Recruiter Job Posting**

```
1. Recruiter logs in
   ↓
2. Creates new job posting (RecruiterJob)
   - Title, description, skills, salary, location, deadline
   ↓
3. Job status: DRAFT
   ↓
4. Recruiter publishes → Status: OPEN
   ↓
5. System indexes job (ItJobRole, SkillIndexEntry)
   ↓
6. Matching algorithm runs in background
   - Extract skills from job description
   - Find matching students from database
   ↓
7. Students see job in feed
   ↓
8. Students can apply (JobApplication created)
   ↓
9. Recruiter reviews applications
   - Can bookmark candidates (CandidateBookmark)
   - Can schedule interviews (InterviewSchedule)
   - Can send messages (RecruiterMessage)
   ↓
10. Update application status through pipeline
    - APPLIED → SHORTLISTED → SELECTED/REJECTED
```

### **Workflow 6: Placement Drive**

```
1. Placement officer creates hiring drive (HiringDrive)
   - Company, date, venue, mode, registration deadline
   ↓
2. Drive status: UPCOMING
   ↓
3. Students notified of drive
   ↓
4. Students register
   ↓
5. On drive date:
   - Drive status changes to ONGOING
   - Event happens (interview, assessment, etc.)
   ↓
6. Results published
   - JobApplications created/updated
   - Selected students notified
   ↓
7. Drive status: COMPLETED
   - Placement statistics calculated
   - Report generated
```

---

## Data Flow Architecture

### **Core Data Relationships**

```
User (center)
├── StudentProfile (1:1)
├── RecruiterProfile (1:1)
├── PlacementOfficerProfile (1:1)
├── Organization (many:1)
├── AssessmentSession (1:many)
├── UserAssessmentAnswer (1:many)
├── AssessmentResult (1:1 latest)
├── CareerMatch (1:many)
├── CSVCareerMatch (1:many)
├── SkillGapAnalysis (1:many)
├── UserRoadmap (1:many)
├── UserProgress (1:many)
├── UserResourceProgress (1:many)
├── TaskProgress (1:many)
├── UserXpLog (1:many)
├── UserAchievement (1:many)
├── AIMemoryProfile (1:1)
├── PersonalityProfile (1:1)
├── LearningVelocity (1:many)
├── JobApplication (1:many)
└── AuditLog (1:many)

Career Recommendation Engine:
Assessment answers → UserAssessmentAnswer aggregation
├── Extract interests, skills, experience
├── Run similarity algorithm vs. CareerRole
├── Score all 500+ careers
├── Create CSVCareerMatch records (top 100)
├── Create CareerRecommendationSnapshot (top 20)
├── Generate SkillGapAnalysis for top 5
└── Create AssessmentRoadmap

Learning Path Execution:
CareerRoadmap (selected by user)
├── Module 1, 2, 3 (in order)
├── Each module → Week 1-4
├── Each week → Day 1-5
├── Each day → Topic 1-5 (CareerRoadmapTopic)
├── Each topic → Resource 1-5 (CareerRoadmapResource)
└── Track all: UserResourceProgress (completed, time spent)

Job Matching:
RecruiterJob (posted)
├── Extract required skills
├── Index in SkillIndexEntry
├── Background job: find matching students
├── Calculate JobEligibility for each student
├── Notify high-match students
└── Track JobApplication for each apply

Admin Audit:
Every sensitive action → AuditLog record
├── Actor (admin ID)
├── Target (affected user ID)
├── Action (LOGIN, PASSWORD_RESET, etc.)
├── Changes (JSON delta)
├── Metadata (IP, user agent)
└── Immutable timestamp
```

---

## Feature Workflows

### **AI Counselor (Gemini Integration)**

```
1. Student clicks "AI Counselor"
   ↓
2. System loads or creates MentorConversation
   ↓
3. Student types query (e.g., "How do I learn React?")
   ↓
4. System checks RecommendationSnapshot cache
   - If found & fresh: Use cached response
   - If not: Call Gemini API
   ↓
5. Request to Gemini includes:
   - Student's AssessmentResult summary
   - Current roadmap progress
   - Skill gaps
   - Learning velocity
   - Personality profile (tone preference, etc.)
   ↓
6. Gemini generates personalized response
   ↓
7. Response cached in RecommendationSnapshot (24hr TTL)
   ↓
8. MentorMessage stored with role: "assistant"
   ↓
9. If user requests note generation:
   - GeneratedNote created
   - Content stored as markdown/PDF
   - Cached for future retrieval
   ↓
10. Response displayed in chat UI
    - With estimated time, difficulty, prerequisites
    - Links to resources
```

### **Adaptive Roadmap Mutation**

```
1. Background job runs daily:
   - Check each active user's learning velocity
   ↓
2. If user too fast (>150% baseline):
   - Difficulty increased
   - Pacing accelerated
   - RoadmapMutation created: "Accelerated pacing"
   ↓
3. If user too slow (<50% baseline):
   - Additional hints offered
   - Check for weak skills
   - Offer optional reinforcement week
   - RoadmapMutation created: "Added support resources"
   ↓
4. If user hasn't logged in 3+ days:
   - Push notification sent
   - Streak at risk notification
   ↓
5. If user shows weakness in topic (low quiz score):
   - Extra resources suggested
   - Topic added to SkillGapAnalysis
   - Recommended optional review day
   - RoadmapMutation created: "Added review for weak topic"
```

### **Placement Readiness Scoring**

```
Daily background job:
1. For each user:
   ↓
2. Fetch:
   - Completed skills (from SkillProgress)
   - Total XP (from User.xp)
   - Job-eligible count (from JobEligibility)
   - Active assessment results
   ↓
3. Calculate score:
   - Skills completion: 30% weight
   - XP earned: 20% weight
   - Job eligibility: 30% weight
   - Profile completeness: 10% weight
   - Interview readiness: 10% weight
   ↓
4. Determine label:
   - <40: "Needs Improvement"
   - 40-60: "In Progress"
   - 60-80: "Well Prepared"
   - >80: "Highly Ready"
   ↓
5. Create PlacementReadiness record
   ↓
6. If score >70: Notify of eligible jobs
   ↓
7. Dashboard displays score + progress chart
```

### **Audit Logging**

```
Every sensitive action:
1. Action occurs (login, password reset, user suspended, etc.)
   ↓
2. Middleware captures:
   - Actor (admin ID)
   - Target (affected user ID)
   - Action type
   - IP address
   - User agent
   - Changes (JSON)
   ↓
3. AuditLog record created (immutable)
   ↓
4. Admin can query audit logs:
   - By action type (LOGIN, PASSWORD_RESET, etc.)
   - By actor
   - By target user
   - By date range
   ↓
5. IntelligenceDebugAudit for sensitive queries:
   - When admin views sensitive user data
   - What filters were applied
   - Timestamp + endpoint logged
   ↓
6. Monthly audit report generated
   - Login attempts by org
   - Account actions
   - Admin access to sensitive data
```

---

## Summary: Complete User Journey

```
Student Registration
    ↓
Email Verification
    ↓
Profile Setup (StudentProfile creation)
    ↓
Start Multi-Phase Assessment (AssessmentSession)
    ↓ [Phase 1-7: Collect interests, skills, experience]
    ↓
Career Recommendations Generated (CSVCareerMatch, CareerRecommendationSnapshot)
    ↓
Skill Gap Analysis (SkillGapAnalysis for top 3 careers)
    ↓
Select Roadmap (e.g., "Full Stack Developer")
    ↓
Begin Learning (CareerRoadmap: Modules → Weeks → Days → Topics → Resources)
    ↓ [Daily: Learn topics, complete quiz, earn XP, track progress]
    ↓
AI Mentor Support (Gemini-powered counseling, note generation)
    ↓ [Weekly: Adaptive mutations based on velocity]
    ↓
2+ Weeks of Learning Completed
    ↓
Job Eligibility Calculated (JobEligibility for all posted jobs)
    ↓
Browse & Apply to Jobs (JobApplication)
    ↓
Interview Scheduled (InterviewSchedule)
    ↓
Placement Offer Received (JobApplication status: SELECTED)
    ↓
Career Journey Begins
```

---

## Key Admin Features

1. **Audit Logs Dashboard**: Real-time monitoring of all system actions
2. **User Management**: Suspend/activate/reset users; View audit trail
3. **Content Management**: Create/edit career roadmaps, topics, resources
4. **Recruitment Management**: Manage hiring drives, company approvals
5. **Analytics**: Placement stats, skill gap trends, career distributions
6. **Bulk Operations**: Export data, generate reports, cleanup old data

---

## Performance & Caching

- **Career Recommendations**: Cached in RecommendationSnapshot (24hr TTL)
- **Roadmap Queries**: Redis caching on admin roadmap list (10min TTL)
- **User Profile**: In-memory caching during session
- **Job Matching**: Background indexing with SkillIndexEntry

---

**Last Updated**: July 2026  
**Version**: 1.0

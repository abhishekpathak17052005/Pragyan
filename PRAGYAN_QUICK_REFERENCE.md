# Pragyan AI - Quick Reference Guide

## 🎯 Core Modules

### 1. **Authentication & Users**
- **Registration**: Email + password → Email verification → Role assignment
- **Roles**: ADMIN, RECRUITER, PLACEMENT_OFFICER, STUDENT
- **Profiles**: StudentProfile, RecruiterProfile, PlacementOfficerProfile
- **Key Fields**: Email, fullName, userRole, accountStatus (EMAIL_PENDING, ACTIVE, SUSPENDED)

### 2. **Assessment System** (7 Phases)
| Phase | Focus | Duration |
|-------|-------|----------|
| 1 | Profile & Education | 5 min |
| 2 | Career Interests | 5 min |
| 3 | Skills & Capabilities | 10 min |
| 4 | Technical Assessment | 20 min |
| 5 | Career Readiness | 10 min |
| 6 | Aptitude Testing | 15 min |
| 7 | Personality & Soft Skills | 10 min |

**Output**: AssessmentResult + Recommended careers (CSVCareerMatch)

### 3. **Career Discovery & Matching**
```
Assessment Answers
    ↓
Extract Signals (interests, skills, experience)
    ↓
Match vs. 500+ career roles (CareerRole database)
    ↓
Generate Recommendations (CSVCareerMatch)
    ↓
Create Skill Gap Analysis
    ↓
Generate Learning Roadmap (AssessmentRoadmap)
```

### 4. **Learning Roadmaps**
**Structure**:
```
CareerRoadmap (e.g., "Frontend Developer")
  ├── Module 1: Foundations (weeks 1-2)
  │    ├── Week 1
  │    │    ├── Day 1 → Topics → Resources
  │    │    ├── Day 2 → Topics → Resources
  │    │    └── Day 3 → Topics → Resources
  │    └── Week 2 → ...
  ├── Module 2: Applied Practice (weeks 3-4)
  └── Module 3: Projects & Interview Prep (weeks 5-6)
```

**Progress Tracking**:
- UserResourceProgress (per resource)
- TaskProgress (per task)
- UserProgress (overall roadmap)

### 5. **Gamification**
| Element | Mechanism | Usage |
|---------|-----------|-------|
| **XP** | Awarded per task; Multiplied by streak bonus | Level advancement |
| **Level** | 1-100; Increases with XP | User progression milestone |
| **Streak** | Days of consecutive activity; Reset if missed | Motivation + XP multiplier |
| **Achievement** | Unlock conditions checked after tasks | Engagement badges |

**Tracking**: UserXpLog (audit trail), UserAchievement (unlocks)

### 6. **AI Personalization**
- **AIMemoryProfile**: Long-term learning profile
- **PersonalityProfile**: Mentor type, communication tone
- **LearningVelocity**: Speed of progress (tasks/time)
- **RecommendationSnapshot**: Cached AI outputs (24hr TTL)
- **RoadmapMutation**: Adaptive changes (pacing, topics)

### 7. **Job Matching & Recruitment**
```
Recruiter posts job (RecruiterJob)
    ↓
Extract required skills + Index (SkillIndexEntry)
    ↓
Background: Calculate JobEligibility for all students
    ↓
Students see jobs by match %
    ↓
Student applies (JobApplication created)
    ↓
Recruiter reviews applications
    ↓
Schedule interview (InterviewSchedule)
    ↓
Make offer (JobApplication status: SELECTED)
```

### 8. **Admin Features**
- **AuditLog**: Every action logged (immutable)
- **IntelligenceDebugAudit**: Debug access tracking
- **VerificationToken**: Email/password reset tokens
- **Notification**: Multi-channel alerts (email, push, SMS, in-app)

---

## 📊 Key Data Models

### User-Centric
- **User** → Central entity
- **StudentProfile** → Extended student info
- **RecruiterProfile** → Recruiter verification
- **Organization** → College/Company affiliation

### Assessment-Centric
- **AssessmentSession** → Test attempt
- **UserAssessmentAnswer** → Responses
- **AssessmentResult** → Scoring

### Career-Centric
- **CareerRole** → Job role master data
- **CareerMatch** → User ↔ Career scoring
- **CSVCareerMatch** → Structured recommendations
- **SkillGapAnalysis** → Skills needed vs. available

### Learning-Centric
- **CareerRoadmap** → Course structure
- **CareerRoadmapModule/Week/Day/Topic/Resource** → Hierarchy
- **UserResourceProgress** → Completion tracking
- **UserProgress** → Overall roadmap progress

### Job-Centric
- **RecruiterJob** → Job posting
- **JobApplication** → Application record
- **JobEligibility** → Skill-based match
- **InterviewSchedule** → Interview booking

---

## 🔄 Common Workflows

### Quick Start (Student):
1. Register → Email verify → Profile setup
2. Start assessment (7 phases, ~90 min)
3. View career recommendations
4. Select career + begin roadmap
5. Learn (daily tasks + resources)
6. Apply to jobs → Interview → Offer

### Recruiter:
1. Create company profile
2. Post job (RecruiterJob)
3. System matches with students
4. Review applications (JobApplication)
5. Schedule interviews
6. Make offers

### Placement Officer:
1. Create hiring drive (HiringDrive)
2. Companies register
3. Students register
4. Event occurs
5. Track placements

### Admin:
1. View audit logs (AuditLog)
2. Manage users (suspend, reset, verify)
3. Create/edit roadmaps
4. Monitor placement metrics
5. Debug access (IntelligenceDebugAudit)

---

## 💾 Important Queries

### Find Student's Career Recommendations:
```sql
// Top 10 matching careers for a student
CSVCareerMatch (userId) 
  SORT BY overallScore DESC
  LIMIT 10
```

### Find Eligible Jobs for Student:
```sql
// Jobs student is qualified for
JobEligibility (userId)
  WHERE matchPercentage >= 70
  SORT BY matchPercentage DESC
```

### Check Student Progress on Roadmap:
```sql
UserProgress (userId, roadmapId)
  → progressPercentage, currentDay, xp earned, streak
```

### Find Skill Gaps for Target Career:
```sql
SkillGapAnalysis (userId, careerTitle)
  → missingSkills, partialSkills, masteredSkills
```

---

## 🎛️ Configuration & Tuning

### XP Settings:
- Base XP per task: 10-50
- Streak multiplier: 1.5x-3x based on streak length
- Achievement bonus: 100-500 XP
- Quiz bonus: 10-20 XP

### Roadmap Settings:
- Module duration: 2-4 weeks
- Week duration: 5 days (Mon-Fri)
- Day duration: 6-8 hours study
- Topics per day: 3-5
- Resources per topic: 2-5

### Career Matching:
- Skill weight: 40%
- Interest weight: 30%
- Experience weight: 20%
- Education weight: 10%

### Job Eligibility:
- Required skills match: 70%+
- Preferred skills: 40%+
- Min overall match: 50%

---

## 🚀 Performance Optimization

### Caching:
- **RecommendationSnapshot**: AI outputs (24hr TTL)
- **Admin careers list**: Redis (10min TTL)
- **User roadmap**: Session memory

### Indexing:
- User.userRole, User.accountStatus
- CareerRole.requiredSkills
- CSVCareerMatch.overallScore
- JobEligibility.matchPercentage
- AssessmentResult.createdAt

### Background Jobs:
- Daily XP log cleanup
- Learning velocity calculation
- Roadmap mutation evaluation
- Job eligibility batch update
- Placement readiness scoring

---

## 🔐 Security Notes

1. **Passwords**: Hashed (bcrypt)
2. **Tokens**: One-time, TTL-based (VerificationToken, RefreshToken)
3. **Audit Trail**: All actions logged immutably
4. **Debug Access**: Special audit for admin data access
5. **Data Privacy**: Only store necessary PII

---

## 📱 API Endpoints (Examples)

### Assessment:
- `POST /api/assessment/start` → Create AssessmentSession
- `POST /api/assessment/:id/submit-phase` → Submit phase answers
- `GET /api/assessment/:id/results` → Get recommendations

### Learning:
- `GET /api/roadmaps` → List available roadmaps
- `POST /api/roadmaps/:id/enroll` → Start roadmap
- `PUT /api/resources/:id/mark-complete` → Track progress

### Jobs:
- `GET /api/jobs` → List jobs
- `POST /api/jobs/:id/apply` → Submit application
- `GET /api/jobs/eligible` → My eligible jobs

### Admin:
- `GET /api/admin/audit-logs` → View audit trail
- `POST /api/admin/users/:id/suspend` → Suspend user
- `GET /api/admin/analytics` → Placement stats

---

## 📝 Status Values

### Account Status:
- EMAIL_PENDING → Awaiting email verification
- ACTIVE → Fully activated
- SUSPENDED → Temporarily disabled
- REJECTED → Onboarding rejected

### Application Status:
- APPLIED → Initial submission
- SHORTLISTED → Advanced to next round
- SELECTED → Offer extended
- REJECTED → Not selected
- ACCEPTED → Offer accepted

### Roadmap Status:
- draft → In development
- published → Active/available
- deprecated → Old version

### Job Status:
- DRAFT → In preparation
- OPEN → Accepting applications
- CLOSED → Application deadline passed
- FILLED → Position filled

---

## 🎓 Learning Velocity Formula

```
Velocity = (Tasks Completed / Days Active) per week

Performance Levels:
- <1: Below baseline (offer support)
- 1-2: Normal (maintain)
- 2-3: Above baseline (offer harder tasks)
- >3: Exceptional (consider acceleration)
```

---

## 📊 Placement Readiness Score

```
Score = (0.3 × Skills %) + (0.2 × XP %) + (0.3 × Eligible Jobs %) + (0.1 × Profile %) + (0.1 × Interview %)

Rating:
- 0-40: Needs Improvement (🔴)
- 40-60: In Progress (🟡)
- 60-80: Well Prepared (🟢)
- 80-100: Highly Ready (🟢🟢)
```

---

**Quick Commands**:
- Check student progress: `User.xp`, `User.level`, `User.streak`
- List recommendations: `CSVCareerMatch` sorted by `overallScore`
- Find weak areas: `SkillGapAnalysis.missingSkills`
- Job match: `JobEligibility.matchPercentage`
- Track learning: `UserProgress.progressPercentage`


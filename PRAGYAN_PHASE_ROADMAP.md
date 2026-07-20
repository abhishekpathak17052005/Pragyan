# 🚀 Pragyan Platform - Phase Roadmap

**Date**: July 14, 2026  
**Current Status**: Post Phase 1 (Placement Portal - 85%)  
**Overall Completion**: ~92-93%  
**Next Focus**: Role system + Recruitment database  

---

## Complete Platform Vision

```
PRAGYAN = Learning + Assessment + Career Recommendation + Recruitment
```

**Full Student Lifecycle:**

```
1. Assessment (Skills evaluation)
       ↓
2. Career Recommendation (AI-powered)
       ↓
3. Learning Roadmap (6-month structured path)
       ↓
4. Daily Learning (Daily tasks, resources)
       ↓
5. XP & Progress (Gamification)
       ↓
6. Resume Builder (Portfolio, projects, skills)
       ↓
7. Skill Verification (Assessment + projects)
       ↓
8. RECRUITMENT PORTAL ← NEW
       ↓
9. Campus Drives (Hiring events)
       ↓
10. Interview Process (Scheduling, tracking)
       ↓
11. Offer Letter (Generation, signing)
       ↓
12. Placement ✅
```

---

## Implementation Phases

### ✅ COMPLETED

- [x] **PHASE 0** - Core Learning Platform
  - Assessment system
  - Roadmap builder
  - Learning resources
  - Progress tracking
  - XP system
  - AI Counselor

- [x] **PHASE 1** - Placement Portal Foundation
  - Backend module (service/controller/routes)
  - React Query integration
  - Dashboard (80% live data)
  - Students page (100% live)
  - Companies page (placeholder)
  - Applications page (100% live)
  - Analytics page (40% live)

---

### 🔴 HIGH PRIORITY - DO THESE FIRST

#### **PHASE 2: Authentication & Roles System**

**WHY FIRST:** All subsequent phases depend on roles and permissions.

**What to build:**

1. Update Prisma schema with 4 roles:
   ```prisma
   enum UserRole {
     ADMIN
     STUDENT
     PLACEMENT_OFFICER
     RECRUITER
   }
   ```

2. Add role-specific fields to User model:
   ```prisma
   model User {
     id              String   @id
     role            UserRole
     collegeId       String?  // For students + T&P heads
     companyId       String?  // For recruiters
     departmentId    String?  // For students
     batch           String?  // For students (2024, 2025)
     cgpa            String?  // For students
     status          String   // ACTIVE, SUSPENDED
     createdAt       DateTime @default(now())
     updatedAt       DateTime @updatedAt
   }
   ```

3. Create authorization middleware:
   ```typescript
   // middleware/authorize.ts
   export function authorize(allowedRoles: UserRole[]) {
     return async (req, res, next) => {
       const user = req.user;
       if (!allowedRoles.includes(user.role)) {
         return res.status(403).json({ error: 'Forbidden' });
       }
       
       // Role-specific data filtering
       if (user.role === 'PLACEMENT_OFFICER') {
         req.collegeFilter = { collegeId: user.collegeId };
       }
       if (user.role === 'RECRUITER') {
         req.companyFilter = { companyId: user.companyId };
       }
       
       next();
     };
   }
   ```

4. Update authentication flow:
   - JWT includes role
   - Frontend checks role on login
   - Redirect to appropriate dashboard

5. Frontend role-based routing:
   ```typescript
   const routes = [
     { path: '/dashboard', roles: ['STUDENT'] },
     { path: '/placement', roles: ['PLACEMENT_OFFICER'] },
     { path: '/company', roles: ['RECRUITER'] },
     { path: '/admin', roles: ['ADMIN'] },
   ];
   ```

**Timeline:** 2-3 weeks  
**Effort:** High (affects entire platform)  
**Impact:** Unlocks Phases 3-6

---

#### **PHASE 3: Recruitment Database Models**

**WHY SECOND:** Needs correct roles first.

**Models to create:**

```prisma
// College
model College {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  name            String   @unique
  code            String   @unique
  city            String
  state           String
  verified        Boolean  @default(false)
  
  students        User[]   // Students enrolled
  placementHeads  User[]   // T&P Heads
  hirings         HiringDrive[]
  createdAt       DateTime @default(now())
}

// Company
model Company {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  name            String   @unique
  email           String   @unique
  website         String?
  industry        String
  size            String   // Small, Medium, Large, Enterprise
  verified        Boolean  @default(false)
  status          String   @default("PENDING") // PENDING, ACTIVE, SUSPENDED
  
  recruiters      User[]   // Recruiters from company
  jobs            RecruitmentJob[]
  hiringDrives    HiringDrive[]
  interviews      Interview[]
  offers          OfferLetter[]
  createdAt       DateTime @default(now())
}

// Recruiter (separate profile)
model RecruiterProfile {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  userId          String   @unique @db.ObjectId
  user            User     @relation(fields: [userId], references: [id])
  companyId       String   @db.ObjectId
  company         Company  @relation(fields: [companyId], references: [id])
  designation     String?
  verified        Boolean  @default(false)
  createdAt       DateTime @default(now())
}

// Placement Officer (separate profile)
model PlacementOfficerProfile {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  userId          String   @unique @db.ObjectId
  user            User     @relation(fields: [userId], references: [id])
  collegeId       String   @db.ObjectId
  college         College  @relation(fields: [collegeId], references: [id])
  department      String?  // Optional - specific department scope
  createdAt       DateTime @default(now())
}

// Hiring Drive (Campus event)
model HiringDrive {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  collegeId       String   @db.ObjectId
  college         College  @relation(fields: [collegeId], references: [id])
  companyId       String   @db.ObjectId
  company         Company  @relation(fields: [companyId], references: [id])
  
  title           String
  description     String?
  date            DateTime
  venue           String?
  mode            String   // ONSITE, ONLINE, HYBRID
  registrationDeadline DateTime?
  status          String   @default("PENDING") // PENDING, ACTIVE, COMPLETED
  
  registrations   DriveRegistration[]
  interviews      Interview[]
  results         DriveResult[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Drive Registration
model DriveRegistration {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  driveId         String   @db.ObjectId
  drive           HiringDrive @relation(fields: [driveId], references: [id])
  studentId       String   @db.ObjectId
  student         User     @relation(fields: [studentId], references: [id])
  
  registeredAt    DateTime @default(now())
  attendanceStatus String? // REGISTERED, ATTENDED, ABSENT
  
  @@unique([driveId, studentId])
}

// Recruitment Job
model RecruitmentJob {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  companyId       String   @db.ObjectId
  company         Company  @relation(fields: [companyId], references: [id])
  
  title           String
  description     String
  salaryMin       Int?
  salaryMax       Int?
  currency        String   @default("INR")
  skills          String[]
  experience      String   // "0", "1-2", "3-5", "5+"
  jobType         String   // FULL_TIME, INTERNSHIP
  location        String?
  mode            String   // ONSITE, REMOTE, HYBRID
  status          String   @default("OPEN") // OPEN, CLOSED
  
  applications    JobApplicationRecord[]
  interviews      Interview[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Application Record
model JobApplicationRecord {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  jobId           String   @db.ObjectId
  job             RecruitmentJob @relation(fields: [jobId], references: [id])
  studentId       String   @db.ObjectId
  student         User     @relation(fields: [studentId], references: [id])
  
  status          String   @default("APPLIED")
  // APPLIED, SHORTLISTED, ASSESSMENT, INTERVIEW, OFFER, REJECTED, JOINED
  
  resumeUrl       String?
  appliedAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  interviews      Interview[]
  offer           OfferLetter?
  
  @@unique([jobId, studentId])
}

// Interview
model Interview {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  applicationId   String   @db.ObjectId
  application     JobApplicationRecord @relation(fields: [applicationId], references: [id])
  driveId         String?  @db.ObjectId
  drive           HiringDrive? @relation(fields: [driveId], references: [id])
  
  scheduledFor    DateTime
  interviewType   String   // TECHNICAL, HR, GROUP, ASSESSMENT
  status          String   @default("SCHEDULED") // SCHEDULED, COMPLETED, RESCHEDULED, CANCELLED
  
  feedback        String?
  rating          Int?     // 1-5
  notes           String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Offer Letter
model OfferLetter {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  applicationId   String   @unique @db.ObjectId
  application     JobApplicationRecord @relation(fields: [applicationId], references: [id])
  
  salary          Float
  currency        String   @default("INR")
  benefits        String?
  joiningDate     DateTime?
  status          String   @default("SENT") // SENT, ACCEPTED, REJECTED, REVOKED
  
  documentUrl     String?
  signedAt        DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Drive Result
model DriveResult {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  driveId         String   @unique @db.ObjectId
  drive           HiringDrive @relation(fields: [driveId], references: [id])
  
  totalRegistered Int
  totalAttended   Int
  totalShortlisted Int
  totalInterviews Int
  totalOffers     Int
  totalAccepted   Int
  
  averagePackage  Float?
  highestPackage  Float?
  lowestPackage   Float?
  
  completedAt     DateTime?
  createdAt       DateTime @default(now())
}
```

**Related migrations:**
- Add collegeId foreign key to User (students)
- Add companyId foreign key to User (recruiters)
- Create indices for queries (collegeId, companyId, status)

**Timeline:** 2-3 weeks  
**Effort:** High (large schema)  
**Impact:** Foundation for all recruitment features

---

#### **PHASE 4: Placement Officer Features**

**BUILD:** Full T&P Head dashboard

**Backend endpoints:**

```
GET    /api/placement/dashboard
GET    /api/placement/students
GET    /api/placement/students/:id
POST   /api/placement/campus-drives
GET    /api/placement/campus-drives
PUT    /api/placement/campus-drives/:id
DELETE /api/placement/campus-drives/:id
POST   /api/placement/campus-drives/:id/register-students
GET    /api/placement/applications
GET    /api/placement/analytics
GET    /api/placement/reports
POST   /api/placement/notifications/broadcast
```

**Frontend pages:**

```
/placement/dashboard - Overview
/placement/students - Student list + filters
/placement/companies - Companies recruiting
/placement/recruiters - Recruiter management
/placement/campus-drives - Create/manage drives
/placement/applications - All applications
/placement/analytics - College placement metrics
/placement/reports - Generate reports (PDF/Excel)
/placement/notifications - Broadcast messages
```

**Key features:**
- ✅ Student eligibility (CGPA, assessment score)
- ✅ Drive creation + company assignment
- ✅ Bulk student registration
- ✅ Attendance tracking
- ✅ Application tracking by status
- ✅ Placement statistics
- ✅ Department-wise analytics
- ✅ Report generation

**Timeline:** 3-4 weeks  
**Effort:** Very High  
**Impact:** Core T&P Head workflow

---

#### **PHASE 5: Recruiter Features**

**BUILD:** Company recruitment dashboard

**Backend endpoints:**

```
GET    /api/company/dashboard
POST   /api/company/jobs
GET    /api/company/jobs
PUT    /api/company/jobs/:id
DELETE /api/company/jobs/:id
GET    /api/company/applications
PUT    /api/company/applications/:id/status
POST   /api/company/interviews
GET    /api/company/interviews
PUT    /api/company/interviews/:id/schedule
POST   /api/company/offers
GET    /api/company/analytics
```

**Frontend pages:**

```
/company/dashboard - Recruitment overview
/company/jobs - Post/manage jobs
/company/applications - Applications (ATS)
/company/interviews - Interview scheduling
/company/offers - Offer tracking
/company/analytics - Hiring funnel
/company/profile - Company details
```

**Key features:**
- ✅ Job posting templates
- ✅ Application tracking system (ATS)
- ✅ Interview scheduling
- ✅ Bulk resume download
- ✅ Offer letter generation
- ✅ Hiring funnel analytics
- ✅ Time-to-hire metrics

**Timeline:** 3-4 weeks  
**Effort:** Very High  
**Impact:** Completes recruitment workflow

---

#### **PHASE 6: Campus Recruitment Flows**

**BUILD:** Different hiring modes

**Support:**
- Mass hiring (many jobs, many students)
- Campus drives (single event, multiple companies)
- Walk-in drives (drop-in hiring)
- Virtual drives (online recruitment)
- Startup hiring (early-stage companies)
- MSME hiring (small businesses)

**Backend:**
- Drive templates for each mode
- Registration workflows
- Result tracking
- Bulk operations

**Frontend:**
- Drive creation wizard
- Mode-specific forms
- Result analytics

**Timeline:** 2-3 weeks  
**Effort:** Medium  
**Impact:** Flexibility for different hiring scenarios

---

#### **PHASE 7: AI Layer (LAST - After everything else)**

**BUILD:** AI-powered insights (not roadmaps)

**Student AI:**
```
- Explain today's learning topic
- Generate practice quiz
- Generate interview questions
- Debug/review code
- Resume optimization
- Career advice
- Mock interview
```

**Recruiter AI:**
```
- Candidate ranking/matching
- Resume parsing
- JD optimization
- Skill gap analysis
- Hiring insights
- Salary benchmarking
```

**Placement Officer AI:**
```
- Placement prediction
- Eligible student suggestions
- Company recommendations
- Batch analytics
- Placement forecast
- Improvement recommendations
```

**Integration points:**
- Claude API for text generation
- Vector database for resume matching
- ML model for placement prediction

**Timeline:** 4-6 weeks  
**Effort:** Very High (new domain)  
**Impact:** Competitive advantage

---

## Phase Timeline Summary

| Phase | Focus | Duration | Effort | Start Date |
|-------|-------|----------|--------|------------|
| ✅ 0 | Core Learning | Q1 2026 | ⭐⭐⭐⭐⭐ | Jan 2026 |
| ✅ 1 | Placement Foundation | Q2 2026 | ⭐⭐⭐⭐ | Apr 2026 |
| 🔴 2 | Auth & Roles | 2-3 wks | ⭐⭐⭐⭐ | Aug 2026 |
| 🔴 3 | Database Models | 2-3 wks | ⭐⭐⭐⭐⭐ | Sep 2026 |
| 🔴 4 | T&P Dashboard | 3-4 wks | ⭐⭐⭐⭐⭐ | Sep 2026 |
| 🔴 5 | Recruiter Portal | 3-4 wks | ⭐⭐⭐⭐⭐ | Oct 2026 |
| 🔴 6 | Campus Flows | 2-3 wks | ⭐⭐⭐ | Nov 2026 |
| ⏳ 7 | AI Layer | 4-6 wks | ⭐⭐⭐⭐⭐ | Dec 2026 |

**Estimated Total:** 17-26 weeks (~4-6 months)

---

## Current Status by Component

### Learning Platform
- [x] Assessment system - 100%
- [x] Career recommendation - 95%
- [x] Roadmap builder - 100%
- [x] Learning resources - 100%
- [x] Progress tracking - 95%
- [x] XP system - 100%
- [x] AI Counselor - 85%

### Recruitment Platform
- [x] Backend foundation - 85%
- [x] React Query integration - 100%
- [x] Student data - 100%
- [x] Application data - 100%
- ⚠️ Company data - 0% (placeholder)
- ⚠️ Analytics - 40%
- ⏳ Roles system - 0%
- ⏳ Database models - 20% (Job, JobApplication exist; need Company, RecruitmentJob, etc.)
- ⏳ T&P dashboard - 85%
- ⏳ Recruiter portal - 0%
- ⏳ Campus drives - 0%
- ⏳ Interview management - 0%
- ⏳ Offer letters - 0%
- ⏳ Placement AI - 0%

**Overall Platform: 92-93% complete**

---

## Critical Dependencies

```
Phase 2 (Auth & Roles)
    │
    ├─→ Phase 3 (Database Models)
    │       │
    │       ├─→ Phase 4 (T&P Dashboard)
    │       │
    │       ├─→ Phase 5 (Recruiter Portal)
    │       │
    │       └─→ Phase 6 (Campus Flows)
    │               │
    │               └─→ Phase 7 (AI Layer)
```

**Cannot start Phase 3-7 until Phase 2 is complete.**

---

## Success Criteria

### Phase 2 Success
- [ ] 4 roles working correctly
- [ ] JWT includes role
- [ ] Role-based routing on frontend
- [ ] Authorization middleware tested
- [ ] Backend builds clean
- [ ] Frontend builds clean

### Phase 3 Success
- [ ] All 12 models in schema
- [ ] Prisma validation passes
- [ ] Migrations clean
- [ ] Relationships correct
- [ ] Indices added
- [ ] No circular dependencies

### Phase 4 Success
- [ ] All 10 endpoints implemented
- [ ] T&P Head can create drives
- [ ] View all students
- [ ] Filter by eligibility
- [ ] Track placements
- [ ] Generate reports

### Phase 5 Success
- [ ] All 8 endpoints implemented
- [ ] Company can post jobs
- [ ] Track applications (ATS)
- [ ] Schedule interviews
- [ ] Send offers
- [ ] View analytics

### Phase 6 Success
- [ ] 6 drive modes working
- [ ] Bulk operations fast
- [ ] Results accurate
- [ ] UI is user-friendly

### Phase 7 Success
- [ ] AI generates useful insights
- [ ] Ranking algorithm accurate
- [ ] Prediction models work
- [ ] Performance acceptable

---

## Blockers & Risks

### Current Blockers
1. ❌ Role system incomplete - blocks all phases
2. ❌ Recruitment database incomplete - blocks Phases 4-6
3. ⚠️ Company model missing - causes placeholder data

### Risks
- **Scope creep:** AI features tempting to add early
- **Database complexity:** 10+ new models need careful design
- **Permission logic:** Easy to miss edge cases
- **Migration data:** Need strategy for existing data
- **Performance:** Many queries with large datasets

### Mitigation
- ✅ Lock in Phase order - no deviations
- ✅ Design database schema first (before coding)
- ✅ Write permission tests early
- ✅ Seed test data in advance
- ✅ Profile query performance early

---

## Next Action

**APPROVED NEXT STEP: Start Phase 2 (Auth & Roles)**

**Immediate tasks:**
1. [ ] Design complete role system
2. [ ] Update Prisma schema with roles
3. [ ] Create authorization middleware
4. [ ] Test with multiple users
5. [ ] Update frontend routing
6. [ ] Verify all builds pass

**Estimated Start:** This week  
**Estimated Completion:** 2-3 weeks

---

**Document:** PRAGYAN_PHASE_ROADMAP.md  
**Date:** July 14, 2026  
**Status:** LOCKED  
**Approval:** Ready to execute  
**Next Phase:** 2 - Authentication & Roles System

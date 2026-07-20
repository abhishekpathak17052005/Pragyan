# 👑 Pragyan Platform - Role & Permission Architecture

**Date**: July 14, 2026  
**Status**: RECOMMENDED ARCHITECTURE  
**Current Implementation**: Partial (Student + Admin only)  
**Target**: 4-role system for recruitment platform  

---

## Architecture Overview

```
                    🌍 PRAGYAN PLATFORM

                      👑 ADMIN (Super)
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    🎓 STUDENT        👨‍💼 PLACEMENT_OFFICER   🏢 RECRUITER
    (Learner)         (T&P Head)          (Company HR)
```

---

## Role Definitions

### 1️⃣ ADMIN (Super Administrator)

**Who:** Pragyan platform team members

**Access Level:** 👑 UNLIMITED

**Dashboard:**
- `/admin/dashboard`
- `/admin/users` - All students, recruiterrs, TPOs
- `/admin/colleges` - Manage colleges
- `/admin/companies` - Verify companies
- `/admin/analytics` - Global analytics
- `/admin/settings` - Platform configuration

**Permissions:**
```
✅ Create/Read/Update/Delete any user
✅ View all placement data across all colleges
✅ Verify/suspend companies
✅ Verify/suspend recruiters
✅ Manage platform configuration
✅ Access all reports
✅ Configure AI settings
✅ Manage subscriptions
✅ System administration
```

**Cannot:**
```
❌ Nothing - Super Admin has all permissions
```

**Sidebar:**
```
Dashboard
├─ Overview
├─ Analytics
├─ Performance

Users
├─ Students
├─ Recruiters
├─ T&P Heads
├─ Admins

Colleges
├─ List
├─ Create
├─ Performance

Companies
├─ All Companies
├─ Verification Queue
├─ Suspended

Placements
├─ Global Analytics
├─ Department Wise
├─ College Wise
├─ Package Trends

Settings
├─ General
├─ Email
├─ Roles & Permissions
├─ AI Configuration
├─ Subscriptions
```

---

### 2️⃣ PLACEMENT_OFFICER (T&P Head / Training & Placement Officer)

**Who:** College placement/training officers, departmental T&P heads

**Access Level:** 🏫 COLLEGE-LEVEL

**Dashboard:**
- `/placement/dashboard` - College placement overview
- `/placement/students` - All students in college
- `/placement/companies` - Companies recruiting from college
- `/placement/recruiters` - Recruiters assigned to college
- `/placement/campus-drives` - Create/manage drives
- `/placement/applications` - Track all applications
- `/placement/analytics` - College analytics
- `/placement/reports` - Generate reports

**Permissions:**
```
✅ View all students in college
✅ Filter students by department/batch/cgpa
✅ View student profiles (resume, projects, etc.)
✅ View all job applications from college
✅ Filter applications by company/status
✅ Create campus drives
✅ Edit campus drives they created
✅ Assign companies to drives
✅ Assign students to drives
✅ Mark attendance for drives
✅ View hiring funnel analytics
✅ Generate placement reports
✅ Export data (PDF/Excel)
✅ Broadcast notifications to students
✅ Contact recruiters (email/schedule)
✅ View company profiles
```

**Cannot:**
```
❌ Edit/Delete other T&P Head's drives
❌ Create/edit student profiles
❌ Delete applications
❌ Modify company verification status
❌ Access another college's data
❌ Change platform settings
❌ View super-admin dashboard
```

**Data Scope:**
```
Students: Own college only
Companies: Companies recruiting from own college
Applications: Only from own college students
Analytics: Own college metrics only
Drives: Only drives at own college
```

**Sidebar:**
```
Dashboard
├─ Overview Cards
├─ Placement Stats
├─ Trending Placements

Students
├─ List
├─ Search & Filter
├─ Student Profile Drawer
├─ Download List

Companies
├─ Active Companies
├─ Top Recruiters
├─ Company Details

Recruiters
├─ List
├─ Contact Info
├─ Assigned Drives

Campus Drives
├─ Create Drive
├─ List Drives
├─ Edit (own only)
├─ Mark Attendance
├─ Results

Applications
├─ All Applications
├─ Filter by Status
├─ Filter by Company
├─ Application Timeline

Analytics
├─ Placement %
├─ Department-wise %
├─ Company-wise Distribution
├─ Package Distribution
├─ Hiring Funnel
├─ Top Skills
├─ Time to Placement

Reports
├─ Placement Report
├─ Department Report
├─ Company Report
├─ Drive Report
├─ Export Options
```

**Key Features:**
- ✅ Drag-drop company assignment
- ✅ Bulk student registration
- ✅ Auto-calculate placement %
- ✅ Notification system
- ✅ Email integration
- ✅ Download reports

---

### 3️⃣ RECRUITER (Company HR / Talent Acquisition)

**Who:** Company HR, recruiters, talent acquisition professionals

**Access Level:** 🏢 COMPANY-SPECIFIC

**Dashboard:**
- `/company/dashboard` - Recruitment overview
- `/company/jobs` - Post/manage jobs
- `/company/applications` - View applications
- `/company/hiring-drives` - Schedule drives
- `/company/analytics` - Hiring metrics
- `/company/settings` - Company profile

**Permissions:**
```
✅ Create job postings
✅ Edit own job postings
✅ Delete own job postings
✅ View applications to own jobs
✅ Update application status (shortlist/reject/offer)
✅ Schedule interviews
✅ View hiring drive results
✅ Download applicant resumes
✅ Message students (if feature exists)
✅ View hiring analytics
✅ Create campus drives
✅ Edit own campus drives
✅ View own company profile
```

**Cannot:**
```
❌ View other companies' data
❌ View other recruiters' jobs
❌ Access admin features
❌ Create T&P Head accounts
❌ Modify company verification status
❌ Access student data outside applications
❌ View other colleges' recruitment
```

**Data Scope:**
```
Jobs: Only own company jobs
Applications: Only to own company jobs
Drives: Only own company drives
Students: Only those who applied to own jobs
Companies: Own company only
```

**Sidebar:**
```
Dashboard
├─ Overview Cards
├─ Active Applications
├─ Upcoming Drives
├─ Hiring Metrics

Jobs
├─ Create Job
├─ List Jobs
├─ Edit (own only)
├─ Applications per Job

Applications
├─ All Applications
├─ Filter by Job
├─ Filter by Status
├─ Timeline
├─ Bulk Actions

Hiring Drives
├─ Create Drive
├─ List Drives
├─ Edit (own only)
├─ Results & Feedback

Analytics
├─ Hiring Funnel
├─ Applications Trend
├─ Conversion Rate
├─ Time to Hire

Company Profile
├─ Edit Profile
├─ Manage Recruiters
├─ View Statistics
├─ Settings
```

**Key Features:**
- ✅ Job posting templates
- ✅ Bulk resume download
- ✅ Applicant tracking (ATS)
- ✅ Interview scheduling
- ✅ Offer letter generation
- ✅ Analytics dashboard

---

### 4️⃣ STUDENT (Learner)

**Who:** Students / Learning platform users

**Access Level:** 👤 PERSONAL

**Dashboard:**
- `/dashboard` - Learning overview
- `/assessments` - Take assessments
- `/roadmaps` - Learning paths
- `/jobs` - Browse jobs
- `/my-applications` - Track applications
- `/hiring-drives` - Register for drives
- `/profile` - User profile
- `/my-applications-status` - Application timeline

**Permissions:**
```
✅ View own profile
✅ Update own profile
✅ Upload resume/portfolio
✅ View job listings
✅ Apply for jobs
✅ View own applications
✅ Register for campus drives
✅ Download offer letters
✅ Update LinkedIn/GitHub profiles
✅ Track placement status
✅ Take assessments
✅ View learning roadmaps
✅ Complete learning tasks
✅ Earn XP/badges
✅ Build portfolio
```

**Cannot:**
```
❌ View other students' profiles
❌ View other students' applications
❌ Access recruiter features
❌ Access T&P Head features
❌ Create jobs
❌ See hiring analytics (overall)
❌ Access admin features
```

**Data Scope:**
```
Profile: Own only
Applications: Own only
Assessments: Own only
Jobs: All available jobs
Companies: Company profiles only (public)
Drives: Can register for college drives
```

**Sidebar:**
```
Dashboard
├─ Learning Progress
├─ Placement Status
├─ Applied Jobs

Career
├─ Career Discovery
├─ AI Counselor
├─ Roadmaps
├─ Resources

Assessments
├─ Available Assessments
├─ My Results
├─ Certification Tracker

Learning
├─ Learning Paths
├─ Daily Tasks
├─ Resources
├─ Progress

Placement
├─ Browse Jobs
├─ My Applications
├─ Hiring Drives
├─ Download Offers

Profile
├─ Personal Info
├─ Resume
├─ Portfolio
├─ GitHub/LinkedIn
├─ Skills
├─ Certifications

Settings
├─ Preferences
├─ Notifications
├─ Privacy
├─ Account
```

**Key Features:**
- ✅ Resume builder
- ✅ Portfolio showcase
- ✅ Application tracking
- ✅ Interview prep
- ✅ Learning resources
- ✅ Skill assessments

---

## Database Schema

### Current (Partial)
```prisma
enum UserRole {
  ADMIN     // Admin only - IMPLEMENTED ✅
  USER      // Student only - IMPLEMENTED ✅
}
```

### Target (Complete)
```prisma
enum UserRole {
  ADMIN              // Super Admin
  STUDENT            // Learner
  PLACEMENT_OFFICER  // T&P Head
  RECRUITER          // Company HR
}
```

### User Model Extension Needed
```prisma
model User {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  email           String   @unique
  fullName        String
  role            UserRole

  // Student fields
  collegeId       String?  @db.ObjectId              // For students
  departmentId    String?  @db.ObjectId              // For students
  batch           String?                            // For students (2023, 2024, etc.)
  cgpa            String?                            // For students
  
  // Recruiter fields
  companyId       String?  @db.ObjectId              // For recruiters
  designation     String?                            // For recruiters
  
  // T&P Head fields
  collegeId       String?  @db.ObjectId              // For T&P Heads
  department      String?                            // For T&P Heads (optional dept scope)
  
  // Common
  phone           String?
  avatar          String?
  emailVerified   Boolean  @default(false)
  status          String   @default("ACTIVE")        // ACTIVE, SUSPENDED, INACTIVE
  
  // Relations
  student         StudentProfile?                    // 1:1 with student fields
  recruiter       RecruiterProfile?                  // 1:1 with recruiter fields
  tpoHead         TPOProfile?                        // 1:1 with T&P Head fields
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model College {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  name            String   @unique
  code            String   @unique
  city            String
  state           String
  verified        Boolean  @default(false)
  
  // Relations
  students        User[]                             // Students from this college
  tpoHeads        User[]                             // TPOs managing this college
  hirings         HiringDrive[]                      // Drives at this college
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Company {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  name            String   @unique
  email           String   @unique
  website         String?
  industry        String
  size            String?                            // Small, Medium, Large, Enterprise
  verified        Boolean  @default(false)
  status          String   @default("PENDING")       // PENDING, ACTIVE, SUSPENDED
  
  // Relations
  recruiters      User[]                             // Recruiters from this company
  jobs            Job[]                              // Job postings
  hiringDrives    HiringDrive[]                      // Drives
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model HiringDrive {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  collegeId       String   @db.ObjectId
  college         College  @relation(fields: [collegeId], references: [id])
  companyId       String   @db.ObjectId
  company         Company  @relation(fields: [companyId], references: [id])
  
  date            DateTime
  venue           String
  status          String   @default("PENDING")       // PENDING, ACTIVE, COMPLETED
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## API Endpoint Organization by Role

### Public Endpoints (No Auth Required)
```
GET /api/jobs - Browse jobs
GET /api/companies - Browse companies
POST /api/students/register - Create student account
```

### Student Endpoints
```
GET    /api/profile
PUT    /api/profile
POST   /api/applications - Apply for job
GET    /api/applications - View own applications
GET    /api/hiring-drives - View available drives
POST   /api/hiring-drives/:id/register
```

### Recruiter Endpoints
```
GET    /api/company/jobs
POST   /api/company/jobs
PUT    /api/company/jobs/:id
DELETE /api/company/jobs/:id
GET    /api/company/applications
PUT    /api/company/applications/:id/status
GET    /api/company/analytics
```

### T&P Head Endpoints
```
GET    /api/placement/students
GET    /api/placement/applications
POST   /api/placement/campus-drives
PUT    /api/placement/campus-drives/:id
GET    /api/placement/analytics
GET    /api/placement/reports
```

### Admin Endpoints
```
GET    /api/admin/users
PUT    /api/admin/users/:id/role
POST   /api/admin/colleges
GET    /api/admin/analytics
PUT    /api/admin/companies/:id/verify
```

---

## Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────┐
│                        LOGIN                            │
│                    (email + password)                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Generate JWT Token  │
        │  Include role inside │
        └──────────────────────┘
                   │
                   ▼
    ┌──────────────┴──────────────┐
    │        Check Role           │
    └──────────┬───┬───┬───┬──────┘
               │   │   │   │
        ┌──────┘   │   │   └──────┐
        │          │   │          │
        ▼          ▼   ▼          ▼
    ADMIN     STUDENT  TPO    RECRUITER
        │          │   │          │
        ▼          ▼   ▼          ▼
    /admin    /dashboard /placement /company
```

### JWT Token Example
```json
{
  "sub": "user_id_123",
  "email": "john@college.edu",
  "role": "PLACEMENT_OFFICER",
  "collegeId": "college_456",
  "iat": 1234567890,
  "exp": 1234671490
}
```

### Permission Check Middleware
```typescript
// middleware/authorize.ts

export function authorize(allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // From JWT
    
    if (!user || !allowedRoles.includes(user.role)) {
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

// Usage
router.get(
  '/placement/students',
  authenticate,
  authorize([UserRole.PLACEMENT_OFFICER, UserRole.ADMIN]),
  getStudents
);
```

---

## Frontend Routing by Role

```typescript
// routes/index.ts

const routes: RouteConfig[] = [
  // Public
  { path: '/login', component: Login },
  { path: '/jobs', component: PublicJobsList },
  
  // Student routes
  { path: '/dashboard', component: StudentDashboard, roles: ['STUDENT'] },
  { path: '/applications', component: MyApplications, roles: ['STUDENT'] },
  
  // T&P Head routes
  { path: '/placement/dashboard', component: PlacementDashboard, roles: ['PLACEMENT_OFFICER'] },
  { path: '/placement/students', component: PlacementStudents, roles: ['PLACEMENT_OFFICER'] },
  
  // Recruiter routes
  { path: '/company/dashboard', component: CompanyDashboard, roles: ['RECRUITER'] },
  { path: '/company/jobs', component: CompanyJobs, roles: ['RECRUITER'] },
  
  // Admin routes
  { path: '/admin/dashboard', component: AdminDashboard, roles: ['ADMIN'] },
  { path: '/admin/users', component: AdminUsers, roles: ['ADMIN'] },
];

// Auth guard
function ProtectedRoute({ roles, ...rest }) {
  const user = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to="/unauthorized" />;
  
  return <Route {...rest} />;
}
```

---

## Implementation Roadmap

### ✅ Done
- [x] Admin + Student roles
- [x] Basic authentication

### 🚧 In Progress
- [ ] Placement Portal Phase 1 (partial)
- [ ] Company data models

### 📋 Todo
- [ ] PLACEMENT_OFFICER role + endpoints
- [ ] RECRUITER role + endpoints
- [ ] College model + management
- [ ] Permission system
- [ ] Authorization middleware
- [ ] Frontend role-based routing
- [ ] Each role's full sidebar
- [ ] Role-specific dashboards

---

## Benefits of This Architecture

### For Students
✅ Clear learning and job application path  
✅ No access to recruitment operations  
✅ Privacy protected

### For T&P Heads
✅ Full visibility into college placements  
✅ Manage campus drives  
✅ Track company interactions  
✅ Generate reports

### For Recruiters
✅ Dedicated company space  
✅ Post jobs, track applications  
✅ Schedule interviews  
✅ Hiring analytics

### For Admins
✅ Platform oversight  
✅ Verify companies/recruiters  
✅ Global analytics  
✅ User management

### For Security
✅ Data isolation by role  
✅ Clear permission boundaries  
✅ Audit trail possible  
✅ No data leakage

---

## Next Steps

1. **Update Prisma Schema** - Add new role + models
2. **Implement Auth Middleware** - Role-based access control
3. **Build T&P Head Features** - Campus drive management, reports
4. **Build Recruiter Features** - Job posting, application tracking
5. **Update Frontend** - Role-based routing and sidebars
6. **Add Permission Checks** - Every endpoint protected
7. **Testing** - Multi-role user testing

---

**Document**: PRAGYAN_ROLE_ARCHITECTURE.md  
**Date**: July 14, 2026  
**Status**: RECOMMENDED DESIGN  
**Next Action**: Implement in Phase 2

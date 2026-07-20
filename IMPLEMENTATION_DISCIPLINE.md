# 📏 Pragyan: Implementation Discipline Guide

**Date:** July 14, 2026  
**Status:** ✅ LOCKED - BINDING RULES  
**Audience:** All developers on Pragyan  

---

## Three Immutable Rules

### Rule 1: Module Independence (5/5 Priority)

**Every module is independent. Period.**

❌ **Wrong:**
```typescript
// In Roadmap Service
const jobData = await prisma.job.findMany();  // Accessing Recruitment table
```

✅ **Right:**
```typescript
// In Roadmap Service
const jobData = await recruitmentService.getActiveJobs();
```

**Or use events:**
```typescript
// Roadmap subscribes to event
eventBus.on('job_published', (job) => {
  // Update roadmap recommendations based on new job
});
```

**Why?**
- Easy to debug (changes in one module don't break others)
- Easy to replace (can swap recruitment service without touching roadmap)
- Easy to test (mock services instead of databases)
- Easy to scale (each module has its own database eventually)

---

### Rule 2: Thin Controllers (5/5 Priority)

Controllers should **never** contain business logic.

❌ **Wrong (200 lines of logic in controller):**
```typescript
router.post('/register', async (req, res) => {
  // Validate email format
  // Check if email exists
  // Hash password
  // Create user
  // Generate token
  // Send email
  // Log audit event
  // Return response
  // ... 200 lines ...
});
```

✅ **Right (Controller delegates to service):**
```typescript
router.post('/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

**Controller responsibilities:**
1. Receive request
2. Validate request structure
3. Call service
4. Return response

**Service responsibilities:**
- Business logic
- Data validation
- External integrations
- Event publishing

**Repository responsibilities:**
- Database queries only

**Why?**
- Easy to test (service logic, not HTTP logic)
- Easy to reuse (service can be called from anywhere)
- Easy to read (one controller file = one endpoint definition)
- Easy to maintain (changes to logic don't require controller changes)

---

### Rule 3: Folder Structure (Never Change)

**All modules follow this structure:**

```
backend/src/modules

├── authentication/
│   ├── controller.ts
│   ├── service.ts
│   ├── repository.ts
│   ├── validators.ts
│   ├── routes.ts
│   ├── types.ts
│   ├── events.ts
│   └── index.ts
│
├── assessment/
│   ├── controller.ts
│   ├── service.ts
│   ├── repository.ts
│   ├── validators.ts
│   ├── routes.ts
│   ├── types.ts
│   ├── events.ts
│   └── index.ts
│
├── roadmap/
├── progress/
├── recruitment/
├── placement/
├── ai/
├── analytics/
│
└── shared/
    ├── middleware/
    ├── services/
    ├── utils/
    └── types/
```

**Every file serves a purpose:**

| File | Purpose |
|------|---------|
| controller.ts | HTTP endpoints |
| service.ts | Business logic |
| repository.ts | Database queries |
| validators.ts | Input validation |
| routes.ts | Route definitions |
| types.ts | TypeScript types |
| events.ts | Event definitions |
| index.ts | Module exports |

**Never deviate from this structure.**

---

## Module Template

Use this template for every new module:

```typescript
// assessment/controller.ts
import { Router, Request, Response } from 'express';
import { assessmentService } from './service';
import { validateAssessment } from './validators';

export const router = Router();

router.post('/create', async (req: Request, res: Response) => {
  try {
    const validated = validateAssessment(req.body);
    const result = await assessmentService.create(validated);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
```

```typescript
// assessment/service.ts
import { prisma } from '@/lib/prisma';
import { assessmentRepository } from './repository';
import { eventBus } from '@/shared/events';

export const assessmentService = {
  async create(data: CreateAssessmentDTO) {
    // Business logic here
    const assessment = await assessmentRepository.create(data);
    
    // Publish event
    eventBus.emit('assessment_created', assessment);
    
    return assessment;
  },

  async complete(assessmentId: string, userId: string) {
    const result = await assessmentRepository.complete(assessmentId, userId);
    
    // Publish event
    eventBus.emit('assessment_completed', { assessmentId, userId, result });
    
    return result;
  }
};
```

```typescript
// assessment/repository.ts
import { prisma } from '@/lib/prisma';

export const assessmentRepository = {
  async create(data: CreateAssessmentDTO) {
    return prisma.assessment.create({ data });
  },

  async findById(id: string) {
    return prisma.assessment.findUnique({ where: { id } });
  },

  async complete(assessmentId: string, userId: string) {
    return prisma.assessmentResult.create({
      data: { assessmentId, userId }
    });
  }
};
```

```typescript
// assessment/validators.ts
export function validateAssessment(data: any) {
  if (!data.title) throw new Error('Title required');
  if (!data.questions) throw new Error('Questions required');
  return data;
}
```

```typescript
// assessment/routes.ts
import { Router } from 'express';
import { requireAuth } from '@/shared/middleware';
import { requirePermission } from '@/shared/middleware';
import * as controller from './controller';

export const router = Router();

router.post(
  '/create',
  requireAuth,
  requirePermission('CREATE_ASSESSMENT'),
  controller.createAssessment
);

router.post(
  '/:id/complete',
  requireAuth,
  requirePermission('COMPLETE_ASSESSMENT'),
  controller.completeAssessment
);

export default router;
```

```typescript
// assessment/types.ts
export interface Assessment {
  id: string;
  title: string;
  questions: Question[];
  createdAt: Date;
}

export interface CreateAssessmentDTO {
  title: string;
  questions: Question[];
}
```

```typescript
// assessment/events.ts
export const ASSESSMENT_EVENTS = {
  CREATED: 'assessment_created',
  COMPLETED: 'assessment_completed',
  DELETED: 'assessment_deleted'
};
```

```typescript
// assessment/index.ts
export * from './types';
export { assessmentService } from './service';
export { router } from './routes';
export { ASSESSMENT_EVENTS } from './events';
```

**Use this exact template for every module.**

---

## Development Process

### Before Each Phase

- [ ] Read the phase specification
- [ ] Understand module dependencies
- [ ] Plan folder structure
- [ ] Get sign-off on requirements

### During Implementation

- [ ] Follow folder structure exactly
- [ ] Keep controllers thin
- [ ] Put logic in services
- [ ] Data queries in repositories
- [ ] Validate in validators
- [ ] Define events in events.ts
- [ ] Export in index.ts
- [ ] Write tests as you go

### End of Phase

**All checks must pass:**

```bash
# Backend
npm run build          # ✅ 0 errors
npm run lint           # ✅ 0 warnings
npm run test           # ✅ All pass

# Frontend
npm run build          # ✅ 0 errors
npm run lint           # ✅ 0 warnings

# Prisma
npx prisma validate    # ✅ Valid

# Git
git diff main..branch  # ✅ Reviewed
git push               # ✅ Ready for merge

# Documentation
README.md updated      # ✅ Complete
API.md updated         # ✅ Endpoints listed
CHANGELOG.md updated   # ✅ Changes noted
```

**No merge to main until all pass.**

---

## The Seven Phases (Sequential, No Skipping)

### Phase 2: Authentication
- Duration: 3-4 weeks
- Deliverable: JWT, roles, permissions, audit logs
- Freeze: After complete

### Phase 3: Roadmap CMS
- Duration: 2-3 weeks
- Deliverable: Roadmap builder, course structure
- Freeze: After complete

### Phase 4: Learning Progress
- Duration: 2-3 weeks
- Deliverable: Student progress tracking, assessments
- Freeze: After complete

### Phase 5: Recruitment
- Duration: 3-4 weeks
- Deliverable: Job posting, applications, hiring drives
- Freeze: After complete

### Phase 6: Placement
- Duration: 2-3 weeks
- Deliverable: Interviews, offers, analytics
- Freeze: After complete

### Phase 7: AI Mentor
- Duration: 3-4 weeks
- Deliverable: AI-powered recommendations
- Freeze: After complete

**Total: 16-20 weeks (4-5 months)**

---

## Code Review Checklist

Before merging ANY code:

- [ ] Follows folder structure
- [ ] Controllers are thin
- [ ] Business logic in services
- [ ] Database queries in repositories
- [ ] No cross-module database access
- [ ] Events published correctly
- [ ] Error handling present
- [ ] Logging present
- [ ] Tests included
- [ ] Documentation updated
- [ ] Builds pass (backend + frontend)
- [ ] Linting passes
- [ ] No console.log() in production code
- [ ] No TODO comments without tickets
- [ ] No hardcoded values

---

## Common Mistakes (Don't Do These)

❌ **Mistake 1: Calling another module's database**
```typescript
// Wrong
const students = await prisma.user.findMany({
  where: { role: 'STUDENT' }
});
```

✅ **Correct**
```typescript
// Right
const students = await authService.getAllStudents();
```

---

❌ **Mistake 2: 500 lines in a controller**
```typescript
router.post('/register', async (req, res) => {
  // 500 lines of logic
});
```

✅ **Correct**
```typescript
router.post('/register', async (req, res) => {
  const result = await authService.register(req.body);
  res.json(result);
});
```

---

❌ **Mistake 3: Business logic in repository**
```typescript
// Wrong
export const assessmentRepository = {
  async submitWithValidation(data) {
    if (!data.answers) throw new Error('No answers');
    if (data.answers.length < 5) throw new Error('Too few answers');
    // ... more validation ...
    return prisma.assessment.create({ data });
  }
};
```

✅ **Correct**
```typescript
// Right - Validation in validator
export function validateSubmission(data) {
  if (!data.answers) throw new Error('No answers');
  if (data.answers.length < 5) throw new Error('Too few answers');
}

// Service calls validator
export const assessmentService = {
  async submit(data) {
    validateSubmission(data);
    return assessmentRepository.create(data);
  }
};
```

---

❌ **Mistake 4: Direct event emission in controller**
```typescript
// Wrong
router.post('/submit', async (req, res) => {
  const result = await assessmentService.submit(req.body);
  eventBus.emit('assessment_completed', result);  // Controller publishing events
  res.json(result);
});
```

✅ **Correct**
```typescript
// Right - Service publishes events
export const assessmentService = {
  async submit(data) {
    const result = await repository.create(data);
    eventBus.emit('assessment_completed', result);  // Service publishes
    return result;
  }
};

// Controller just calls service
router.post('/submit', async (req, res) => {
  const result = await assessmentService.submit(req.body);
  res.json(result);
});
```

---

❌ **Mistake 5: Creating new folder structure**
```
// Wrong - Don't do this
recruitment/
  ├─ models/
  ├─ utils/
  ├─ helpers/
  ├─ services/
  └─ routes/
```

✅ **Correct**
```
// Right - Always use this
recruitment/
  ├─ controller.ts
  ├─ service.ts
  ├─ repository.ts
  ├─ validators.ts
  ├─ routes.ts
  ├─ types.ts
  ├─ events.ts
  └─ index.ts
```

---

## Development Mantra

> "If I need to reach into another module's database, I'm doing it wrong."

> "If my controller has more than 20 lines, I'm doing it wrong."

> "If my folder structure doesn't match the template, I'm doing it wrong."

**When in doubt, follow the rules. They exist to keep the codebase maintainable.**

---

## For the AI Agent (Kiro/Claude)

When implementing Pragyan, use this instruction for every task:

```
You are implementing Pragyan, a production SaaS platform with strict architecture rules.

RULES (Non-Negotiable):
1. Modules are independent. No module accesses another module's database tables.
   If module A needs data from module B, call module B's service or use events.

2. Controllers are thin. Maximum 20 lines per endpoint.
   All business logic goes in service.ts.
   All database queries go in repository.ts.
   All validation goes in validators.ts.

3. Folder structure is fixed. Every module has:
   controller.ts, service.ts, repository.ts, validators.ts, routes.ts, types.ts, events.ts, index.ts
   Never create new files or folders beyond these.

BEFORE completing any task:
- Frontend builds without errors: npm run build
- Backend builds without errors: npm run build
- No TypeScript errors: tsc --noEmit
- All endpoints tested and working

DO NOT:
- Redesign the database schema
- Change the module structure
- Add new files or folders
- Let controllers grow beyond 20 lines
- Have modules access each other's tables
- Skip testing or builds
```

---

## Final Checklist

**Before declaring Phase complete:**

```
Database
  ✅ Prisma migrations run
  ✅ Schema valid
  ✅ All indexes created

Backend
  ✅ npm run build passes (0 errors)
  ✅ npm run lint passes (0 warnings)
  ✅ npm run test passes (all pass)
  ✅ All endpoints tested
  ✅ Postman collection updated
  ✅ Error handling present
  ✅ Logging present

Frontend
  ✅ npm run build passes (0 errors)
  ✅ npm run lint passes (0 warnings)
  ✅ All pages functional
  ✅ Responsive design verified
  ✅ Accessibility checked

Git & Documentation
  ✅ Commit messages clear
  ✅ PR/MR description complete
  ✅ README.md updated
  ✅ API.md updated
  ✅ CHANGELOG.md updated

Code Quality
  ✅ Folder structure matches template
  ✅ Controllers are thin (< 20 lines)
  ✅ Business logic in services
  ✅ Database queries in repositories
  ✅ No cross-module database access
  ✅ Events published correctly
  ✅ Code reviewed by peer
```

**Phase complete only when ALL checks pass.**

---

## You Are Now Ready

You have:
- ✅ Locked architecture
- ✅ Clear rules
- ✅ Module templates
- ✅ Development process
- ✅ Quality checklist

**Start building. Follow the rules. Deliver quality.**

---

**Document:** IMPLEMENTATION_DISCIPLINE.md  
**Date:** July 14, 2026  
**Status:** ✅ BINDING - ALL DEVELOPERS  
**Next:** Phase 2 Implementation Begins

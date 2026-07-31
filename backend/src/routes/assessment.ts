// src/routes/assessment.ts

import { Router } from 'express';
import * as assessmentController from '@/controllers/assessment';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/auth';
import { validate } from '@/middleware/validator';
import { assessmentAnswersSchema } from '@/validators/assessment';
import { assessmentCreateSchema } from '@/validators/assessment';
import { prisma } from '@/lib/prisma';
import * as decisionController from '@/controllers/assessmentDecisionTree';
import * as hybridAssessmentController from '@/controllers/hybridAssessment';
import discoveryRoutes from '@/routes/assessmentDiscovery';
import interestRoutes from '@/routes/assessmentInterest';
import capabilityRoutes from '@/routes/assessmentCapability';

const router = Router();

// ── Phase 1: Profile Collection ───────────────────────────────────────────────
router.post('/phase-1', authenticate, assessmentController.savePhase1);
router.get('/phase-1', authenticate, assessmentController.getPhase1);
router.put('/phase-1', authenticate, assessmentController.savePhase1); // idempotent update

// ── Phase 2: Interest, Domain & Career Discovery ──────────────────────────────
router.post('/phase-2', authenticate, assessmentController.savePhase2);
router.get('/phase-2', authenticate, assessmentController.getPhase2);
router.put('/phase-2', authenticate, assessmentController.savePhase2); // idempotent update

// ── Phase 3: Adaptive AI Assessment ──────────────────────────────────────────
// Verify Phase 1 and 2 are completed before allowing Phase 3 start
router.post('/phase-3/start', authenticate, async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  // Check Phase 1 and Phase 2 completion
  const [phase1, phase2] = await Promise.all([
    prisma.assessmentSession.findFirst({
      where: { userId: req.user.id, phase: 1 },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.assessmentSession.findFirst({
      where: { userId: req.user.id, phase: 2 },
      orderBy: { completedAt: 'desc' },
    }),
  ]);

  if (!phase1 || !phase2) {
    return res.status(400).json({
      success: false,
      error: 'Phase 1 and 2 must be completed before starting Phase 3',
      missingPhases: {
        phase1: !phase1,
        phase2: !phase2,
      },
    });
  }

  return next();
}, assessmentController.startPhase3);

// ── Phase 4: Adaptive Domain-Specific Technical Assessment ───────────────────
// Verify Phase 2 is completed before allowing Phase 4 start
router.post('/phase-4/start', authenticate, async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const phase2 = await prisma.assessmentSession.findFirst({
    where: { userId: req.user.id, phase: 2 },
    orderBy: { completedAt: 'desc' },
  });

  if (!phase2) {
    return res.status(400).json({
      success: false,
      error: 'Phase 2 must be completed before starting Phase 4',
    });
  }

  return next();
}, assessmentController.startPhase4);
router.post('/phase-4/answer', authenticate, assessmentController.answerPhase4);
router.post('/phase-4/submit', authenticate, assessmentController.submitPhase4);

// ── Phase 5: AI Specialization Detection & Career Role Identification ────────
// Verify Phase 1 and 2 are completed before allowing Phase 5 start
router.post('/phase-5/start', authenticate, async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const [phase1, phase2] = await Promise.all([
    prisma.assessmentSession.findFirst({
      where: { userId: req.user.id, phase: 1 },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.assessmentSession.findFirst({
      where: { userId: req.user.id, phase: 2 },
      orderBy: { completedAt: 'desc' },
    }),
  ]);

  if (!phase1 || !phase2) {
    return res.status(400).json({
      success: false,
      error: 'Phase 1 and 2 must be completed before starting Phase 5',
      missingPhases: {
        phase1: !phase1,
        phase2: !phase2,
      },
    });
  }

  return next();
}, assessmentController.startPhase5);
router.post('/phase-5/answer', authenticate, assessmentController.answerPhase5);
router.post('/phase-5/submit', authenticate, assessmentController.submitPhase5);

// ── Phase 6: AI Confidence Validation & Skill Gap Analysis ───────────────────
// Verify Phase 1 and 2 are completed before allowing Phase 6 start
router.post('/phase-6/start', authenticate, async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const [phase1, phase2] = await Promise.all([
    prisma.assessmentSession.findFirst({
      where: { userId: req.user.id, phase: 1 },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.assessmentSession.findFirst({
      where: { userId: req.user.id, phase: 2 },
      orderBy: { completedAt: 'desc' },
    }),
  ]);

  if (!phase1 || !phase2) {
    return res.status(400).json({
      success: false,
      error: 'Phase 1 and 2 must be completed before starting Phase 6',
      missingPhases: {
        phase1: !phase1,
        phase2: !phase2,
      },
    });
  }

  return next();
}, assessmentController.startPhase6);
router.post('/phase-6/answer', authenticate, assessmentController.answerPhase6);
router.post('/phase-6/validate', authenticate, assessmentController.validatePhase6);

// ── Phase 7: AI Career Recommendation Engine & Final Report ──────────────────
// Verify Phase 1 and 2 are completed before allowing Phase 7
router.post('/phase-7/generate', authenticate, async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const [phase1, phase2] = await Promise.all([
    prisma.assessmentSession.findFirst({
      where: { userId: req.user.id, phase: 1 },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.assessmentSession.findFirst({
      where: { userId: req.user.id, phase: 2 },
      orderBy: { completedAt: 'desc' },
    }),
  ]);

  if (!phase1 || !phase2) {
    return res.status(400).json({
      success: false,
      error: 'Phase 1 and 2 must be completed before generating Phase 7 report',
      missingPhases: {
        phase1: !phase1,
        phase2: !phase2,
      },
    });
  }

  return next();
}, assessmentController.generatePhase7Report);
router.get('/report', authenticate, assessmentController.getPhase7Report);

router.get('/start', assessmentController.startAssessment);
router.post('/start', assessmentController.startAssessment);
router.post('/answer', authenticate, assessmentController.answerAssessment);
router.post('/submit', authenticate, assessmentController.submitAdaptiveAssessment);
router.get('/results/:id', authenticate, assessmentController.getAdaptiveAssessmentResult);

router.get('/questions', assessmentController.getQuestions);
router.get('/questions/:category', assessmentController.getQuestionsByCategory);

router.post('/create', authenticate, authorize('ADMIN'), validate(assessmentCreateSchema), assessmentController.createAssessment);

router.post('/submit-legacy', authenticate, validate(assessmentAnswersSchema), assessmentController.submitAssessment);
router.get('/result/:resultId', authenticate, assessmentController.getAssessmentResult);
router.post('/save', authenticate, validate(assessmentAnswersSchema), assessmentController.saveAssessment);
router.get('/history', authenticate, assessmentController.getAssessmentHistory);
router.get('/latest', authenticate, assessmentController.getLatestAssessment);

// Hybrid 3-phase assessment engine imported from backend (1).zip.
router.post('/hybrid/parse-resume', authenticate, hybridAssessmentController.parseResume);
router.post('/hybrid/answers', authenticate, hybridAssessmentController.saveHybridAnswers);
router.get('/hybrid/domain-questions/:domain', hybridAssessmentController.getDomainQuestions);
router.post('/hybrid/start', hybridAssessmentController.startHybridAssessment);
router.post('/hybrid/:sessionId/answer', hybridAssessmentController.submitHybridAnswer);

router.use('/discovery', discoveryRoutes);
router.use('/interest', interestRoutes);
router.use('/capability', capabilityRoutes);

/**
 * GET /api/assessment/metadata
 * Get assessment coverage info - what careers/skills/interests are covered
 */
router.get('/metadata', async (_req, res) => {
  try {
    console.log('[Assessment Metadata] Fetching coverage statistics');
    
    const [careerCount, skillCount, interestCount, careers] = await Promise.all([
      prisma.career.count(),
      prisma.careerSkillMapping.count(),
      prisma.careerInterestMapping.count(),
      prisma.career.findMany({ take: 10, select: { title: true, category: true } }),
    ]);

    const categories = [...new Set(careers.flatMap((c) => c.category ? [c.category] : []))];

    console.log(`[Assessment Metadata] Retrieved ${careerCount} careers, ${skillCount} skills, ${interestCount} interests`);

    return res.json({
      success: true,
      data: {
        assessmentCoverage: {
          totalJobRoles: careerCount,
          totalSkillsInDataset: skillCount,
          totalInterestsMapped: interestCount,
          uniqueCategories: categories.length,
          categories: categories.sort(),
          questionsGenerated: 15,
          message: `Assessment is dynamically generated from ${careerCount} job roles with ${skillCount} skill mappings and ${interestCount} interest mappings`
        },
        sampleCareers: careers.slice(0, 5).map((c) => c.title),
        status: 'Dataset-driven assessment system active'
      }
    });
  } catch (error) {
    console.error('[Assessment Metadata] Error fetching metadata:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch assessment metadata'
    });
  }
});

// Admin-only: persist a generated assessment
router.post('/generate', authenticate, authorize('ADMIN'), assessmentController.generateAndCreateAssessment);

// Adaptive next-question endpoint
router.post('/next', assessmentController.getNextQuestions);

// Decision-tree assessment endpoints (configuration-driven)
router.get('/decision/start', decisionController.startDecision);
router.post('/decision/next', decisionController.answerDecision);
router.post('/decision/complete', authenticate, decisionController.finishDecision);
router.get('/decision/result/:sessionId', authenticate, decisionController.getResult);

export default router;

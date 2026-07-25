// src/controllers/assessment.ts

import { Request, Response } from 'express';
import { assessmentService } from '@/services/assessment';
import { adaptiveAssessmentService } from '@/services/adaptive-assessment';
import { generateCareerEnhancements } from '@/ai/resultEnhancer';
import { sendSuccess, sendError } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';
import { prisma } from '@/lib/prisma';
import { authService } from '@/services/auth';

export const startAssessment = asyncHandler(async (req: Request, res: Response) => {
  const started = await adaptiveAssessmentService.startAssessment(req.user?.id);
  return sendSuccess(res, started, 201, 'Assessment session started');
});

export const answerAssessment = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, questionId, answer } = req.body || {};

  if (!sessionId || !questionId || !answer) {
    return sendError(res, 400, 'sessionId, questionId and answer are required');
  }

  const response = await adaptiveAssessmentService.answerQuestion({
    sessionId: String(sessionId),
    questionId: String(questionId),
    answer: String(answer),
    userId: req.user?.id,
  });

  return sendSuccess(res, response, 200, 'Answer recorded');
});

export const getQuestions = asyncHandler(async (_req: Request, res: Response) => {
  console.log('[Assessment Controller] getQuestions: Fetching questions');
  try {
    const questions = await assessmentService.getQuestions();
    console.log(`[Assessment Controller] getQuestions: Returning ${questions.length} questions`);
    return sendSuccess(res, questions, 200, 'Questions fetched successfully');
  } catch (err) {
    console.error('[Assessment Controller] getQuestions: Error', err);
    throw err;
  }
});

export const getQuestionsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;
  const questions = await assessmentService.getQuestionsByCategory(category);

  return sendSuccess(res, questions, 200, 'Questions fetched successfully');
});

export const submitAssessment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    console.warn('[submitAssessment] Unauthorized - no user');
    return sendError(res, 401, 'Unauthorized');
  }

  // Log incoming request metadata for debugging persistence issues
  console.log('[submitAssessment] Headers:', {
    authorization: req.headers.authorization ? 'present' : 'missing',
    'content-length': req.headers['content-length'] || 'unknown',
  });

  const { answers } = req.body;

  if (!answers || typeof answers !== 'object') {
    console.warn('[submitAssessment] Invalid answers format');
    return sendError(res, 400, 'Invalid answers format');
  }

  console.log(`[submitAssessment] Processing for user ${req.user.id} with ${Object.keys(answers).length} answers`);
  let svcResult;
  try {
    svcResult = await assessmentService.submitAssessment(req.user.id, answers);
    console.log('[submitAssessment] Service returned result, persisted:', !!(svcResult as any)?.assessmentResult);
  } catch (err) {
    console.error('[submitAssessment] Service threw an error:', (err as any)?.message || err);
    return sendError(res, 500, 'Failed to process assessment');
  }

  // Non-authoritative Gemini enhancement: schedule async so AI downtime doesn't block the response
  const combined = (svcResult as any).combinedMatches || [];
  console.log('[submitAssessment] Scheduling AI enhancements (async)');
  void (async () => {
    console.log('[AI ENHANCE START]', { userId: req.user?.id, timestamp: new Date().toISOString() });
    try {
      await generateCareerEnhancements(answers, combined || []);
      console.log('[AI ENHANCE SUCCESS]', { userId: req.user?.id, timestamp: new Date().toISOString() });
      // Optionally persist or emit telemetry here
    } catch (err) {
      console.error('[AI ENHANCE ERROR]', { userId: req.user?.id, error: (err as any)?.message || err, timestamp: new Date().toISOString() });
    }
  })();
  const enhancements = null; // not included synchronously

  // Prepare response: include persisted result, deterministic matches, summary and enhancements
  const response = {
    persisted: (svcResult as any).assessmentResult,
    combinedMatches: (svcResult as any).combinedMatches || null,
    summary: (svcResult as any).summary,
    enhancements,
    aiEnhancementScheduled: true,
  };
  
  console.log('[submitAssessment] Returning response with', Object.keys(response));
  // If persistence failed, include a clear flag for the frontend
  if (!response.persisted) {
    console.warn('[submitAssessment] Persistence missing in response - communicating to frontend');
    try {
      const { contextAggregator } = await import('@/services/contextAggregator');
      void contextAggregator.invalidate(req.user.id).catch(() => undefined);
    } catch (e) {
      // ignore
    }
    return sendSuccess(res, { ...response, persisted: null, persistenceWarning: 'Persistence failed; result returned deterministically' }, 201, 'Assessment submitted with persistence warning');
  }

  try {
    const { contextAggregator } = await import('@/services/contextAggregator');
    await contextAggregator.invalidate(req.user.id);
  } catch (e) {
    // ignore
  }

  return sendSuccess(res, response, 201, 'Assessment submitted successfully');
});

export const getNextQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, answers, limit } = req.body || {};

  if (sessionId) {
    try {
      const next = await adaptiveAssessmentService.getNextQuestion(String(sessionId));
      return sendSuccess(res, next, 200, 'Next question fetched');
    } catch (error: any) {
      if (String(error?.message || '').toLowerCase().includes('not found')) {
        return sendError(res, 404, 'Assessment session not found or expired');
      }
      return sendError(res, 400, 'Unable to fetch next question');
    }
  }

  if (!answers || typeof answers !== 'object') {
    console.warn('[getNextQuestions] Invalid answers payload');
    return sendError(res, 400, 'Invalid answers payload');
  }

  console.log(`[getNextQuestions] Fetching next questions with limit=${limit}`);
  const next = await assessmentService.getNextQuestions(answers, Number(limit) || 3);
  console.log(`[getNextQuestions] Returning ${next.length} next questions`);
  return sendSuccess(res, next, 200, 'Next questions fetched');
});

export const getAssessmentResult = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { resultId } = req.params;
  const result = await assessmentService.getAssessmentResult(req.user.id, resultId);

  return sendSuccess(res, result, 200, 'Assessment result fetched successfully');
});

export const submitAdaptiveAssessment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { sessionId } = req.body || {};
  if (!sessionId) {
    return sendError(res, 400, 'sessionId is required');
  }

  let result;
  try {
    result = await adaptiveAssessmentService.submitAssessment({
      sessionId: String(sessionId),
      userId: req.user.id,
    });
  } catch (error: any) {
    if (String(error?.message || '').toLowerCase().includes('not found')) {
      return sendError(res, 404, 'Assessment session not found or expired');
    }
    return sendError(res, 400, 'Unable to submit adaptive assessment');
  }

  // Schedule AI enhancements asynchronously so submission is not blocked by external AI availability
  void (async () => {
    console.log('[AI ENHANCE(adaptive) START]', { userId: req.user?.id, sessionId: sessionId || null, timestamp: new Date().toISOString() });
    try {
      await generateCareerEnhancements(
        {
          path: result.summary?.topMatch?.career || '',
          strengths: result.summary?.strengths || [],
          weaknesses: result.summary?.weaknesses || [],
        } as any,
        result.allMatches || []
      );
      console.log('[AI ENHANCE(adaptive) SUCCESS]', { userId: req.user?.id, sessionId: sessionId || null, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('[AI ENHANCE(adaptive) ERROR]', { userId: req.user?.id, sessionId: sessionId || null, error: (err as any)?.message || err, timestamp: new Date().toISOString() });
    }
  })();

  // Persist Phase 3 cognitive results to assessmentSession so Phase 4 can read them.
  // We upsert: if a phase-3 record already exists (created by startPhase3), update it;
  // otherwise create a new one. This is fire-and-forget — don't block the response.
  void (async () => {
    try {
      const userId = req.user!.id;
      const cognitiveAnalysis = {
        phase: 3,
        sessionId: String(sessionId),
        confidence: result.confidence ?? 0,
        topMatches: (result.topMatches || []).slice(0, 5).map((m: any) => ({
          career: m.career,
          score: m.score ?? m.match ?? 0,
          matchedSkills: m.matchedSkills ?? [],
        })),
        traits: result.summary?.scores ?? {},
        careerScores: Object.fromEntries(
          (result.topMatches || []).slice(0, 10).map((m: any) => [m.career, m.score ?? m.match ?? 0])
        ),
        strengths: result.summary?.strengths ?? [],
        weaknesses: result.summary?.weaknesses ?? [],
        completedAt: new Date().toISOString(),
      };

      // Check if a phase-3 record already exists from startPhase3
      const existing = await prisma.assessmentSession.findFirst({
        where: { userId, phase: 3 },
        orderBy: { completedAt: 'desc' },
      });

      if (existing) {
        await prisma.assessmentSession.update({
          where: { id: existing.id },
          data: {
            analysis: JSON.stringify(cognitiveAnalysis),
            completedAt: new Date(),
          },
        });
      } else {
        await prisma.assessmentSession.create({
          data: {
            userId,
            phase: 3,
            answers: JSON.stringify({ phase: 3, sessionId: String(sessionId) }),
            selectedOptions: [],
            analysis: JSON.stringify(cognitiveAnalysis),
            completedAt: new Date(),
          },
        });
      }

      console.log('[Phase 3] Cognitive results persisted to assessmentSession for user', userId);
    } catch (err) {
      console.error('[Phase 3] Failed to persist cognitive results:', (err as any)?.message || err);
    }
  })();

  try {
    const { contextAggregator } = await import('@/services/contextAggregator');
    await contextAggregator.invalidate(req.user.id);
  } catch (e) {
    // ignore
  }

  return sendSuccess(res, {
    ...result,
    ai: null,
    aiEnhancementScheduled: true,
    nextPhase: 4,
    nextPhaseRoute: '/assessment/phase-4',
    assessmentCompleted: false,
  }, 201, 'Adaptive assessment submitted');
});

export const getAdaptiveAssessmentResult = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { id } = req.params;
  const result = await adaptiveAssessmentService.getResultById(req.user.id, id);
  if (!result) {
    return sendError(res, 404, 'Result not found');
  }

  return sendSuccess(res, result, 200, 'Adaptive result fetched');
});

export const saveAssessment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    console.warn('[saveAssessment] Unauthorized - no user');
    return sendError(res, 401, 'Unauthorized');
  }

  const { answers } = req.body;

  if (!answers || typeof answers !== 'object') {
    console.warn('[saveAssessment] Invalid answers format');
    return sendError(res, 400, 'Invalid answers format');
  }

  console.log(`[saveAssessment] Saving session for user ${req.user.id} with ${Object.keys(answers).length} answers`);
  const result = await assessmentService.saveAssessmentSession(req.user.id, answers);
  console.log(`[saveAssessment] Session saved with ID ${result.id}`);
  return sendSuccess(res, result, 201, 'Assessment saved successfully');
});

export const getAssessmentHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const history = await assessmentService.getAssessmentHistory(req.user.id);
  return sendSuccess(res, history, 200, 'Assessment history fetched successfully');
});

export const getLatestAssessment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const latest = await assessmentService.getLatestAssessment(req.user.id);
  return sendSuccess(res, latest, 200, 'Latest assessment fetched successfully');
});

export const createAssessment = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, questions } = req.body;

  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return sendError(res, 400, 'Invalid payload: title and questions are required');
  }

  const created = await assessmentService.createAssessment({ title, description, questions });
  return sendSuccess(res, created, 201, 'Assessment created successfully');
});

export const generateAndCreateAssessment = asyncHandler(async (req: Request, res: Response) => {
  const { title = 'AI Generated Assessment', description = 'Generated from dataset with Gemini enhancements' } = req.body || {};

  // Deterministic generation from dataset
  const questions = await assessmentService.getQuestions();

  if (!questions || !questions.length) {
    return sendError(res, 500, 'Failed to generate questions');
  }

  const mapped = (questions as any[]).map((q) => ({ questionText: q.question || '', options: q.options || [], category: q.category || '' }));

  const created = await assessmentService.createAssessment({ title, description, questions: mapped });
  return sendSuccess(res, created, 201, 'AI-generated assessment created');
});

// ── Phase 1: Profile Collection ───────────────────────────────────────────────

export const savePhase1 = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const { phase1Schema } = await import('@/validators/assessment');
  const parsed = phase1Schema.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return sendError(res, 400, firstError?.message ?? 'Validation failed');
  }

  const { personalInfo: pi, education: edu, careerGoal, experience: exp } = parsed.data;
  const userId = req.user.id;

  // ── Single source of truth: route through authService.updateUserProfile ──
  // This ensures contextAggregator.invalidate fires, snapshot updates, and
  // every other part of the app reading the User record sees the latest data.
  await authService.updateUserProfile(userId, {
    firstName:              pi.firstName,
    lastName:               pi.lastName,
    fullName:               `${pi.firstName} ${pi.lastName}`.trim(),
    age:                    pi.age,
    gender:                 pi.gender,
    country:                pi.country,
    state:                  pi.state,
    city:                   pi.city,
    location:               `${pi.city}, ${pi.state}, ${pi.country}`.trim(),
    // Education
    currentStatus:          edu.currentStatus,
    education:              edu.highestQualification,
    currentCourse:          edu.degree ?? edu.highestQualification,
    collegeName:            edu.collegeName,
    university:             edu.university,
    degree:                 edu.degree,
    branch:                 edu.branch,
    currentYear:            edu.currentYear,
    expectedGraduationYear: edu.expectedGraduationYear ?? undefined,
    cgpa:                   edu.cgpaOrPercentage,
    // Career goal
    careerGoal,
    careerTrack:            careerGoal,
    // Experience
    programmingExperience:  exp.programmingExperience,
    skillLevel:             exp.programmingExperience,
    previouslyWorked:       exp.previouslyWorked,
    experienceType:         exp.previouslyWorked ? 'experienced' : 'fresher',
    experience:             exp.previouslyWorked ? `${exp.yearsOfExperience ?? 0} years` : 'fresher',
    yearsOfExperience:      exp.yearsOfExperience ?? undefined,
    currentCompany:         exp.currentCompany,
    currentRole:            exp.currentRole,
  } as any);

  // Persist raw phase data in AssessmentSession for audit / phase tracking
  const session = await prisma.assessmentSession.create({
    data: {
      userId,
      phase: 1,
      answers: JSON.stringify({ phase: 1, ...parsed.data }),
      selectedOptions: [],
      analysis: JSON.stringify({
        phase: 1,
        completionPercent: 100,
        personalInfo:  pi,
        education:     edu,
        careerGoal,
        experience:    exp,
        savedAt:       new Date().toISOString(),
      }),
      completedAt: new Date(),
    },
  });

  return sendSuccess(res, {
    sessionId:         session.id,
    phase:             1,
    completionPercent: 100,
    nextPhase:         2,
    redirectTo:        '/assessment/phase-2',
  }, 201, 'Phase 1 saved successfully');
});

export const getPhase1 = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  // Return most recent phase-1 session
  const session = await prisma.assessmentSession.findFirst({
    where: { userId: req.user.id, phase: 1 },
    orderBy: { completedAt: 'desc' },
  });

  if (!session) {
    return sendSuccess(res, null, 200, 'No phase 1 data found');
  }

  let analysis: Record<string, unknown> = {};
  try { analysis = JSON.parse(session.analysis); } catch { /* ignore */ }

  return sendSuccess(res, {
    sessionId:         session.id,
    phase:             1,
    completionPercent: 100,
    personalInfo:      (analysis as any).personalInfo  ?? null,
    education:         (analysis as any).education     ?? null,
    careerGoal:        (analysis as any).careerGoal    ?? null,
    experience:        (analysis as any).experience    ?? null,
    savedAt:           (analysis as any).savedAt       ?? session.completedAt,
  }, 200, 'Phase 1 data retrieved');
});

// ── Phase 2: Interest, Domain & Career Discovery ──────────────────────────────

export const savePhase2 = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const startTs = Date.now();
  const userId = req.user.id;
  console.log('[savePhase2] request start', { userId, path: req.path, timestamp: new Date().toISOString() });

  const { phase2Schema } = await import('@/validators/assessment');
  const parsed = phase2Schema.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    console.warn('[savePhase2] validation failed', { userId, error: firstError?.message });
    return sendError(res, 400, firstError?.message ?? 'Validation failed');
  }

  const data = parsed.data;

  // ── Sync long-term preferences to User Profile (single source of truth) ──────
  // careerGoal, interests (preferredDomains), preferences (workStyle + learningStyle)
  try {
    console.log('[savePhase2] syncing profile', { userId, careerObjective: data.careerObjective, domainsCount: data.preferredDomains.length });
    await authService.updateUserProfile(userId, {
      careerGoal:  data.careerObjective,
      careerTrack: data.careerObjective,
      interests:   data.preferredDomains,
      preferences: [...data.workStyle, ...data.learningStyle],
    } as any);
  } catch (err) {
    console.error('[savePhase2] updateUserProfile failed:', { userId, message: (err as any)?.message || err });
    // Continue — we still want to persist the raw phase data for audit and to allow Phase 3 to start.
  }

  // ── Build baseline AI payload for Phase 3 ─────────────────────────────────────
  // Fetch Phase 1 data from most recent phase-1 session
  const phase1Session = await prisma.assessmentSession.findFirst({
    where: { userId, phase: 1 },
    orderBy: { completedAt: 'desc' },
  });

  let phase1Analysis: Record<string, unknown> = {};
  try {
    phase1Analysis = phase1Session ? JSON.parse(phase1Session.analysis) : {};
  } catch { /* ignore */ }

  // Fetch user profile for baseline context
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      fullName: true, age: true, gender: true, location: true,
      education: true, currentCourse: true, cgpa: true,
      currentStatus: true, degree: true, branch: true,
      experienceType: true, experience: true,
      programmingExperience: true, currentCompany: true, currentRole: true,
    },
  });

  const baselinePayload = {
    userProfile: {
      fullName:              user?.fullName,
      age:                   user?.age,
      gender:                user?.gender,
      location:              user?.location,
      experienceType:        user?.experienceType,
      programmingExperience: user?.programmingExperience,
      currentCompany:        user?.currentCompany,
      currentRole:           user?.currentRole,
    },
    education: {
      highestQualification: user?.education,
      currentCourse:        user?.currentCourse,
      cgpa:                 user?.cgpa,
      currentStatus:        user?.currentStatus,
      degree:               user?.degree,
      branch:               user?.branch,
      ...(phase1Analysis as any)?.education,
    },
    careerGoal:       data.careerObjective,
    preferredDomains: data.preferredDomains,
    favoriteSubjects: data.favoriteSubjects,
    skillConfidence:  data.skillConfidence,
    workStyle:        data.workStyle,
    learningStyle:    data.learningStyle,
    motivation:       data.motivation,
  };

  // ── Persist phase 2 data in AssessmentSession ─────────────────────────────────
  let session;
  try {
    session = await prisma.assessmentSession.create({
      data: {
        userId,
        phase: 2,
        answers: JSON.stringify({ phase: 2, ...data }),
        selectedOptions: data.preferredDomains,
        analysis: JSON.stringify({
          phase:             2,
          completionPercent: 100,
          careerObjective:   data.careerObjective,
          preferredDomains:  data.preferredDomains,
          skillConfidence:   data.skillConfidence,
          favoriteSubjects:  data.favoriteSubjects,
          workStyle:         data.workStyle,
          learningStyle:     data.learningStyle,
          motivation:        data.motivation,
          baselinePayload,
          savedAt:           new Date().toISOString(),
        }),
        completedAt: new Date(),
      },
    });
    console.log('[savePhase2] session persisted', { userId, sessionId: session.id, durationMs: Date.now() - startTs });
  } catch (err) {
    console.error('[savePhase2] failed to persist AssessmentSession:', { userId, message: (err as any)?.message || err });
    return sendError(res, 500, 'Failed to save phase 2 data; database error');
  }

  try {
    // success response
    return sendSuccess(res, {
      sessionId:         session.id,
      phase:             2,
      completionPercent: 100,
      nextPhase:         3,
      redirectTo:        '/assessment/phase-3',
      baselinePayload,
    }, 201, 'Phase 2 saved successfully');
  } catch (err) {
    console.error('[savePhase2] failed to send success response', { userId, message: (err as any)?.message || err });
    return sendError(res, 500, 'Failed to complete save operation');
  }

  return sendSuccess(res, {
    sessionId:         session.id,
    phase:             2,
    completionPercent: 100,
    nextPhase:         3,
    redirectTo:        '/assessment/phase-3',
    baselinePayload,
  }, 201, 'Phase 2 saved successfully');
});

export const getPhase2 = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const session = await prisma.assessmentSession.findFirst({
    where: { userId: req.user.id, phase: 2 },
    orderBy: { completedAt: 'desc' },
  });

  if (!session) return sendSuccess(res, null, 200, 'No phase 2 data found');

  let analysis: Record<string, unknown> = {};
  try { analysis = JSON.parse(session.analysis); } catch { /* ignore */ }

  return sendSuccess(res, {
    sessionId:         session.id,
    phase:             2,
    completionPercent: 100,
    careerObjective:   (analysis as any).careerObjective  ?? null,
    preferredDomains:  (analysis as any).preferredDomains ?? [],
    skillConfidence:   (analysis as any).skillConfidence  ?? null,
    favoriteSubjects:  (analysis as any).favoriteSubjects ?? [],
    workStyle:         (analysis as any).workStyle        ?? [],
    learningStyle:     (analysis as any).learningStyle    ?? [],
    motivation:        (analysis as any).motivation       ?? null,
    baselinePayload:   (analysis as any).baselinePayload  ?? null,
    savedAt:           (analysis as any).savedAt          ?? session.completedAt,
  }, 200, 'Phase 2 data retrieved');
});

// ── Phase 3: Adaptive AI Assessment ──────────────────────────────────────────

export const startPhase3 = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const userId = req.user.id;

  // Load baseline payload from most recent phase-2 session
  const phase2Session = await prisma.assessmentSession.findFirst({
    where: { userId, phase: 2 },
    orderBy: { completedAt: 'desc' },
  });

  if (!phase2Session) {
    return sendError(res, 400, 'Phase 2 must be completed before starting Phase 3');
  }

  let baseline: Record<string, unknown> = {};
  try {
    const analysis = JSON.parse(phase2Session.analysis);
    baseline = (analysis as any).baselinePayload ?? analysis;
  } catch { /* ignore */ }

  // Start adaptive session (reuses existing adaptive engine)
  const started = await adaptiveAssessmentService.startAssessment(userId);

  // Persist phase-3 start record
  await prisma.assessmentSession.create({
    data: {
      userId,
      phase: 3,
      answers: JSON.stringify({ phase: 3, sessionId: started.sessionId }),
      selectedOptions: [],
      analysis: JSON.stringify({
        phase: 3,
        sessionId: started.sessionId,
        baselinePayload: baseline,
        startedAt: new Date().toISOString(),
      }),
      completedAt: new Date(),
    },
  });

  return sendSuccess(res, {
    sessionId:      started.sessionId,
    question:       started.question,
    confidence:     started.confidence,
    progress:       started.progress,
    baselinePayload: baseline,
    phase:          3,
    nextPhase:      4,
    nextPhaseRoute: '/assessment/phase-4',
    assessmentCompleted: false,
  }, 201, 'Phase 3 started');
});

// ── Phase 4: Adaptive Domain-Specific Technical Assessment ───────────────────

export const startPhase4 = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const userId = req.user.id;

  // Load Phase 2 (domains + baseline) — required for domain-specific questions
  const phase2Session = await prisma.assessmentSession.findFirst({
    where: { userId, phase: 2 },
    orderBy: { completedAt: 'desc' },
  });

  if (!phase2Session) {
    return sendError(res, 400, 'Phase 2 must be completed before starting Phase 4');
  }

  let phase2Analysis: any = {};
  try {
    phase2Analysis = JSON.parse(phase2Session.analysis);
  } catch { /* ignore */ }

  // Extract domains — try all possible locations where Phase 2 may store them
  const domains: string[] =
    phase2Analysis.baselinePayload?.preferredDomains ||
    phase2Analysis.preferredDomains ||
    phase2Analysis.domains ||
    [];

  // If still empty, fall back to general software domains so Phase 4 can proceed
  const effectiveDomains = domains.length > 0
    ? domains
    : ['Full Stack Development', 'Software Development'];

  // Load Phase 3 (cognitive profile) — optional, gracefully skipped if missing
  const phase3Session = await prisma.assessmentSession.findFirst({
    where: { userId, phase: 3 },
    orderBy: { completedAt: 'desc' },
  });

  let cognitiveProfile: Record<string, any> = {};
  if (phase3Session) {
    try {
      const phase3Analysis = JSON.parse(phase3Session.analysis);
      cognitiveProfile = {
        confidence: phase3Analysis.confidence || 0,
        traits: phase3Analysis.traits || {},
        careerScores: phase3Analysis.careerScores || {},
      };
    } catch { /* ignore */ }
  }

  // Load Phase 1 (profile context) — optional, gracefully skipped if missing
  const phase1Session = await prisma.assessmentSession.findFirst({
    where: { userId, phase: 1 },
    orderBy: { completedAt: 'desc' },
  });

  let profileContext: Record<string, any> = {};
  if (phase1Session) {
    try {
      const phase1Analysis = JSON.parse(phase1Session.analysis);
      profileContext = {
        education: phase1Analysis.education?.highestQualification || phase1Analysis.education || 'Not specified',
        experienceLevel: phase1Analysis.experience?.programmingExperience || phase1Analysis.experienceLevel || 'Beginner',
        careerGoal: phase1Analysis.careerGoal || 'Explore Career Options',
        currentYear: phase1Analysis.education?.currentYear || phase1Analysis.currentYear || 'Not specified',
      };
    } catch { /* ignore */ }
  }

  // Dynamically import Phase 4 service
  const { phase4TechnicalAssessmentService } = await import('@/services/phase4TechnicalAssessment');

  const started = await phase4TechnicalAssessmentService.startAssessment({
    userId,
    domains: effectiveDomains,
    cognitiveProfile,
    profileContext,
  });

  return sendSuccess(res, {
    ...started,
    nextPhase: 5,
    nextPhaseRoute: '/assessment/phase-5',
    assessmentCompleted: false,
  }, 201, 'Phase 4 started');
});

export const answerPhase4 = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const { sessionId, questionId, answer } = req.body;

  if (!sessionId || !questionId || !answer) {
    return sendError(res, 400, 'sessionId, questionId, and answer are required');
  }

  const { phase4TechnicalAssessmentService } = await import('@/services/phase4TechnicalAssessment');

  const result = await phase4TechnicalAssessmentService.answerQuestion({
    sessionId,
    questionId,
    answer,
  });

  return sendSuccess(res, result, 200, 'Answer recorded');
});

export const submitPhase4 = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const { sessionId } = req.body;

  if (!sessionId) {
    return sendError(res, 400, 'sessionId is required');
  }

  const { phase4TechnicalAssessmentService } = await import('@/services/phase4TechnicalAssessment');

  const result = await phase4TechnicalAssessmentService.submitAssessment({
    sessionId,
    userId: req.user.id,
  });

  return sendSuccess(res, {
    ...result,
    nextPhase: 5,
    nextPhaseRoute: '/assessment/phase-5',
    assessmentCompleted: false,
  }, 200, 'Phase 4 assessment completed');
});

// ── Phase 5: AI Specialization Detection & Career Role Identification ─────────

export const startPhase5 = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const userId = req.user.id;

  // Load Phase 1 (profile)
  const phase1Session = await prisma.assessmentSession.findFirst({
    where: { userId, phase: 1 },
    orderBy: { completedAt: 'desc' },
  });

  if (!phase1Session) {
    return sendError(res, 400, 'Phase 1 must be completed before starting Phase 5');
  }

  let phase1Analysis: any = {};
  try {
    phase1Analysis = JSON.parse(phase1Session.analysis);
  } catch { /* ignore */ }

  const profileContext = {
    education: phase1Analysis.education?.highestQualification || 'Not specified',
    experienceLevel: phase1Analysis.experience?.programmingExperience || 'Beginner',
    careerGoal: phase1Analysis.careerGoal || 'Explore Career Options',
  };

  // Load Phase 2 (domains)
  const phase2Session = await prisma.assessmentSession.findFirst({
    where: { userId, phase: 2 },
    orderBy: { completedAt: 'desc' },
  });

  if (!phase2Session) {
    return sendError(res, 400, 'Phase 2 must be completed before starting Phase 5');
  }

  let phase2Analysis: any = {};
  try {
    phase2Analysis = JSON.parse(phase2Session.analysis);
  } catch { /* ignore */ }

  const phase2Domains: string[] =
    phase2Analysis.baselinePayload?.preferredDomains ||
    phase2Analysis.preferredDomains ||
    phase2Analysis.domains ||
    [];

  // Fall back to general domains rather than blocking — Phase 5 works with any domain set
  const effectivePhase2Domains = phase2Domains.length > 0
    ? phase2Domains
    : ['Full Stack Development', 'Software Development'];

  // Load Phase 3 (cognitive profile)
  const phase3Session = await prisma.assessmentSession.findFirst({
    where: { userId, phase: 3 },
    orderBy: { completedAt: 'desc' },
  });

  let phase3CognitiveProfile: Record<string, any> = {};
  if (phase3Session) {
    try {
      const phase3Analysis = JSON.parse(phase3Session.analysis);
      phase3CognitiveProfile = {
        confidence: phase3Analysis.confidence || 0,
        traits: phase3Analysis.traits || {},
        careerScores: phase3Analysis.careerScores || {},
      };
    } catch { /* ignore */ }
  }

  // Load Phase 4 (technical profile)
  const phase4Session = await prisma.assessmentSession.findFirst({
    where: { userId, phase: 4 },
    orderBy: { completedAt: 'desc' },
  });

  let phase4TechnicalProfile: Record<string, any> = {};
  if (phase4Session) {
    try {
      const phase4Analysis = JSON.parse(phase4Session.analysis);
      phase4TechnicalProfile = {
        technicalConfidence: phase4Analysis.technicalConfidence || 0,
        domainScores: phase4Analysis.domainScores || {},
        technicalStrengths: phase4Analysis.strengths || [],
        technicalWeaknesses: phase4Analysis.weaknesses || [],
        knowledgeGaps: phase4Analysis.knowledgeGaps || [],
      };
    } catch { /* ignore */ }
  }

  // Dynamically import Phase 5 service
  const { phase5SpecializationDetectionService } = await import('@/services/phase5SpecializationDetection');

  const started = await phase5SpecializationDetectionService.startAssessment({
    userId,
    profileContext,
    phase2Domains: effectivePhase2Domains,
    phase3CognitiveProfile,
    phase4TechnicalProfile,
  });

  // Normalize predictedRoles to the shape the frontend expects: { role, matchScore, category, skillsRequired }
  const rawStarted = started as any;
  const normalizedPredictedRoles = (rawStarted.predictedRoles || []).map((r: any) => ({
    role: r.roleTitle || r.role || 'Unknown Role',
    matchScore: Math.round((r.matchScore ?? r.score ?? r.confidence ?? 0.7) * 100),
    category: r.category || r.domain || undefined,
    skillsRequired: r.requiredSkills || r.skillsRequired || [],
  }));

  return sendSuccess(res, {
    ...rawStarted,
    predictedRoles: normalizedPredictedRoles,
  }, 201, 'Phase 5 started');
});

export const answerPhase5 = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const { sessionId, questionId, answer } = req.body;

  if (!sessionId || !questionId || !answer) {
    return sendError(res, 400, 'sessionId, questionId, and answer are required');
  }

  const { phase5SpecializationDetectionService } = await import('@/services/phase5SpecializationDetection');

  const result = await phase5SpecializationDetectionService.answerQuestion({
    sessionId,
    questionId,
    answer,
  });

  return sendSuccess(res, result, 200, 'Answer recorded');
});

export const submitPhase5 = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const { sessionId } = req.body;

  if (!sessionId) {
    return sendError(res, 400, 'sessionId is required');
  }

  const { phase5SpecializationDetectionService } = await import('@/services/phase5SpecializationDetection');

  const raw = await phase5SpecializationDetectionService.submitAssessment({
    sessionId,
    userId: req.user.id,
  });

  // Normalize the response to match the frontend's expected shape.
  // The service returns { sessionId, confidence, summary: { recommendedRole, alternativeRoles, ... } }
  // The frontend expects { resultId, sessionId, confidence, summary: { bestCareerRoles, specializationLevel, ... } }
  const svc = raw as any;
  const svcSummary = svc.summary || {};
  const specializationScore = svc.confidence ?? 0;

  // Build bestCareerRoles from recommendedRole + alternativeRoles
  const bestCareerRoles: Array<{ role: string; matchScore: number; category?: string; readiness: number }> = [];
  if (svcSummary.recommendedRole) {
    bestCareerRoles.push({
      role: svcSummary.recommendedRole,
      matchScore: Math.round(specializationScore * 100),
      readiness: svcSummary.roleReadiness ?? Math.round(specializationScore * 100),
    });
  }
  if (Array.isArray(svcSummary.alternativeRoles)) {
    for (const alt of svcSummary.alternativeRoles.slice(0, 4)) {
      bestCareerRoles.push({
        role: typeof alt === 'string' ? alt : alt.role,
        matchScore: typeof alt === 'object' ? (alt.readiness ?? Math.round(specializationScore * 80)) : Math.round(specializationScore * 80),
        readiness: typeof alt === 'object' ? (alt.readiness ?? Math.round(specializationScore * 80)) : Math.round(specializationScore * 80),
      });
    }
  }

  // Derive specializationLevel from confidence score
  const specScore = specializationScore * 100;
  const specializationLevel =
    specScore >= 85 ? 'Expert' :
    specScore >= 70 ? 'Senior' :
    specScore >= 50 ? 'Mid-Level' : 'Entry-Level';

  const normalized = {
    resultId: svc.sessionId,   // use sessionId as resultId — stable unique ID
    sessionId: svc.sessionId,
    confidence: svc.confidence,
    summary: {
      bestCareerRoles,
      roleReadiness: svcSummary.roleReadiness
        ? (typeof svcSummary.roleReadiness === 'object'
            ? svcSummary.roleReadiness
            : { [svcSummary.recommendedRole || 'General']: svcSummary.roleReadiness })
        : {},
      specializationLevel,
      specializationScore: specScore,
      strengthAreas: svcSummary.specializationStrengths || svcSummary.strengthAreas || [],
      missingCompetencies: svcSummary.missingCompetencies || [],
      confidenceScore: specScore,
      careerFitAnalysis: svcSummary.careerFitAnalysis ||
        `Based on your assessment, you show strong alignment with ${svcSummary.recommendedRole || 'your target role'}.`,
      industryReadiness: svcSummary.industryReadiness || {},
      nextSteps: svcSummary.recommendedActions || svcSummary.nextSteps || [
        'Complete Phase 6 for confidence validation',
        'Build projects in your recommended role area',
        'Review skill gaps and start targeted learning',
      ],
    },
  };

  return sendSuccess(res, {
    ...normalized,
    nextPhase: 6,
    nextPhaseRoute: '/assessment/phase-6',
    assessmentCompleted: false,
  }, 200, 'Phase 5 assessment completed');
});

// ── Phase 6: AI Confidence Validation & Skill Gap Analysis ───────────────────

export const startPhase6 = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const userId = req.user.id;

  // Verify Phase 1-5 are completed
  const [phase1, phase2] = await Promise.all([
    prisma.assessmentSession.findFirst({
      where: { userId, phase: 1 },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.assessmentSession.findFirst({
      where: { userId, phase: 2 },
      orderBy: { completedAt: 'desc' },
    }),
  ]);

  if (!phase1 || !phase2) {
    return sendError(res, 400, 'Phase 1 and 2 must be completed before Phase 6');
  }

  // Dynamically import Phase 6 service
  const { phase6ConfidenceValidationService } = await import('@/services/phase6ConfidenceValidation');

  const validation = await phase6ConfidenceValidationService.startValidation({ userId });

  return sendSuccess(res, validation, 201, 'Phase 6 validation started');
});

export const answerPhase6 = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const { sessionId, questionId, answer } = req.body;

  if (!sessionId || !questionId || !answer) {
    return sendError(res, 400, 'sessionId, questionId, and answer are required');
  }

  const { phase6ConfidenceValidationService } = await import('@/services/phase6ConfidenceValidation');

  const result = await phase6ConfidenceValidationService.answerFollowUpQuestion({
    sessionId,
    questionId,
    answer,
  });

  return sendSuccess(res, result, 200, 'Follow-up answer recorded');
});

export const validatePhase6 = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const { sessionId } = req.body;

  if (!sessionId) {
    return sendError(res, 400, 'sessionId is required');
  }

  const { phase6ConfidenceValidationService } = await import('@/services/phase6ConfidenceValidation');

  const result = await phase6ConfidenceValidationService.completeValidation({
    sessionId,
    userId: req.user.id,
  });

  return sendSuccess(res, {
    ...result,
    nextPhase: 7,
    nextPhaseRoute: '/assessment/phase-7',
    assessmentCompleted: false,
  }, 200, 'Phase 6 validation completed');
});

// ── Phase 7: AI Career Recommendation Engine & Final Report ──────────────────

export const generatePhase7Report = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const userId = req.user.id;

  // Verify Phase 1-6 are completed (minimum Phase 1-2 required)
  const [phase1, phase2] = await Promise.all([
    prisma.assessmentSession.findFirst({
      where: { userId, phase: 1 },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.assessmentSession.findFirst({
      where: { userId, phase: 2 },
      orderBy: { completedAt: 'desc' },
    }),
  ]);

  if (!phase1 || !phase2) {
    return sendError(res, 400, 'Phase 1 and 2 must be completed before Phase 7');
  }

  // Dynamically import Phase 7 service
  const { phase7FinalReportService } = await import('@/services/phase7FinalReport');

  const report = await phase7FinalReportService.generateFinalReport({ userId });

  return sendSuccess(res, report, 201, 'Final career report generated successfully');
});

export const getPhase7Report = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const { phase7FinalReportService } = await import('@/services/phase7FinalReport');

  const report = await phase7FinalReportService.getReport(req.user.id);

  if (!report) {
    return sendError(res, 404, 'No assessment report found. Please complete Phase 7 first.');
  }

  return sendSuccess(res, report, 200, 'Assessment report retrieved successfully');
});

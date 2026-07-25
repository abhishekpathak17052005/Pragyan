import { prisma } from '@/lib/prisma';
import redisClient from '@/lib/redis';
import { callLLM, parseLLMJson } from './hybridAssessment/llmClient';
import { parseJsonAsync } from '@/utils/jsonWorker';
import { publishTelemetryEvent, TelemetryEvent } from '@/lib/aiTelemetry';

const SESSION_TTL_SECONDS = 60 * 60 * 3; // 3 hours
const MIN_OVERALL_CONFIDENCE = 0.80; // 80% - proceed to Phase 7 if met
const MAX_FOLLOWUP_QUESTIONS = 5;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConfidenceScores {
  overall: number;
  cognitive: number;
  technical: number;
  domain: number;
  careerRole: number;
  communication: number;
  learning: number;
}

export interface SkillGapAnalysis {
  technicalSkills: {
    strong: string[];
    intermediate: string[];
    beginner: string[];
    missing: string[];
  };
  softSkills: {
    communication: string;
    teamwork: string;
    leadership: string;
    adaptability: string;
    problemSolving: string;
  };
  careerReadiness: {
    industryReadiness: number;
    internshipReadiness: number;
    placementReadiness: number;
    advancedLearningReadiness: number;
  };
}

export interface ReadinessScores {
  overallCareerReadiness: number;
  technicalReadiness: number;
  cognitiveReadiness: number;
  domainReadiness: number;
  communicationReadiness: number;
  leadershipReadiness: number;
}

export interface Phase6FollowUpQuestion {
  questionId: string;
  questionText: string;
  questionType: 'MCQ' | 'Short-Answer' | 'Scenario' | 'Self-Assessment';
  options: string[];
  targetArea: string; // e.g., "Technical Depth", "Communication", "Career Clarity"
  reason: string; // Why this question is being asked
}

export interface Phase6Session {
  sessionId: string;
  userId: string;
  // Aggregated data from previous phases
  phase1Data: Record<string, any>;
  phase2Data: Record<string, any>;
  phase3Data: Record<string, any>;
  phase4Data: Record<string, any>;
  phase5Data: Record<string, any>;
  // Confidence calculation
  confidenceScores: ConfidenceScores;
  skillGapAnalysis: SkillGapAnalysis;
  readinessScores: ReadinessScores;
  // Follow-up questions (if needed)
  needsFollowUp: boolean;
  lowConfidenceAreas: string[];
  followUpQuestions: Phase6FollowUpQuestion[];
  followUpAnswers: Record<string, string>;
  // Validation status
  assessmentValidated: boolean;
  validationStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'NEEDS_MORE_DATA';
  completionPercentage: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Phase6ValidationResult {
  assessmentComplete: boolean;
  proceedToPhase7: boolean;
  confidenceScores: ConfidenceScores;
  skillGapAnalysis: SkillGapAnalysis;
  readinessScores: ReadinessScores;
  recommendations: string[];
  nextSteps: string[];
}

// ── Phase 6 System Prompt ─────────────────────────────────────────────────────

const PHASE6_SYSTEM_PROMPT = `
You are the Pragyan AI Phase 6 Confidence Validation Engine.

OBJECTIVE:
Your role is to determine if the AI has collected SUFFICIENT information across all 5 previous phases to make RELIABLE career recommendations.

This is NOT a new assessment. You are validating the quality and completeness of existing data.

INPUTS YOU RECEIVE:
- Phase 1: User Profile (education, experience, career goal)
- Phase 2: Selected domains, skill confidence levels
- Phase 3: Cognitive profile with confidence score
- Phase 4: Technical assessment with domain scores
- Phase 5: Specialized career roles with readiness scores

YOUR TASKS:

1. CONFIDENCE EVALUATION
Calculate confidence scores for each dimension:
- Cognitive Confidence (from Phase 3 cognitive profile, traits)
- Technical Confidence (from Phase 4 technical scores, strengths/weaknesses)
- Domain Confidence (from Phase 2 domains + Phase 4 domain readiness)
- Career Role Confidence (from Phase 5 role predictions, specialization)
- Communication Confidence (inferred from Phase 3 traits, Phase 5 experience questions)
- Learning Confidence (from skill progression, Phase 2 learning style)

2. OVERALL CONFIDENCE CALCULATION
Weighted average:
- Cognitive: 15%
- Technical: 30%
- Domain: 20%
- Career Role: 25%
- Communication: 5%
- Learning: 5%

3. IDENTIFY KNOWLEDGE GAPS
Check for:
- Missing technical concepts
- Weak practical experience
- Incomplete specialization evidence
- Unclear communication ability
- Uncertain career preference
- Inconsistent answers across phases
- Low confidence areas (< 70%)

4. INTELLIGENT FOLLOW-UP QUESTIONS (ONLY IF NEEDED)
IF overall confidence < 80% OR any dimension < 70%:
- Generate 3-5 TARGETED questions for low-confidence areas ONLY
- NEVER repeat questions from previous phases
- Questions must significantly improve recommendation accuracy
- Focus on validation, not new assessment

Question Types:
- MCQ: Quick validation of technical knowledge
- Short-Answer: Clarify career goals or preferences
- Scenario: Validate practical experience claims
- Self-Assessment: User's self-awareness of strengths/weaknesses

5. SKILL GAP ANALYSIS
Classify skills into:
- Strong Skills: Demonstrated proficiency (Phase 4 + 5)
- Intermediate Skills: Basic understanding, needs practice
- Beginner Skills: Mentioned but not validated
- Missing Skills: Required for target career but not present

Soft Skills Assessment:
- Communication: High/Medium/Low
- Teamwork: High/Medium/Low
- Leadership: High/Medium/Low
- Adaptability: High/Medium/Low
- Problem Solving: High/Medium/Low

Career Readiness Scores (0-100):
- Industry Readiness: Ready for specific industry
- Internship Readiness: Ready for internships
- Placement Readiness: Ready for full-time roles
- Advanced Learning Readiness: Ready for higher studies

6. READINESS SCORES
Calculate (0-100 scale):
- Overall Career Readiness
- Technical Readiness
- Cognitive Readiness
- Domain Readiness
- Communication Readiness
- Leadership Readiness

7. VALIDATION DECISION
Determine:
- Is assessment complete? (YES if confidence >= 80%)
- Is additional questioning required? (YES if confidence < 80%)
- Is confidence sufficient? (YES if >= 80%)
- Is career prediction reliable? (YES if Career Role Confidence >= 80%)

RESPONSE FORMAT (JSON):
{
  "confidenceScores": {
    "overall": number (0.0-1.0),
    "cognitive": number (0.0-1.0),
    "technical": number (0.0-1.0),
    "domain": number (0.0-1.0),
    "careerRole": number (0.0-1.0),
    "communication": number (0.0-1.0),
    "learning": number (0.0-1.0)
  },
  "skillGapAnalysis": {
    "technicalSkills": {
      "strong": string[],
      "intermediate": string[],
      "beginner": string[],
      "missing": string[]
    },
    "softSkills": {
      "communication": "High" | "Medium" | "Low",
      "teamwork": "High" | "Medium" | "Low",
      "leadership": "High" | "Medium" | "Low",
      "adaptability": "High" | "Medium" | "Low",
      "problemSolving": "High" | "Medium" | "Low"
    },
    "careerReadiness": {
      "industryReadiness": number (0-100),
      "internshipReadiness": number (0-100),
      "placementReadiness": number (0-100),
      "advancedLearningReadiness": number (0-100)
    }
  },
  "readinessScores": {
    "overallCareerReadiness": number (0-100),
    "technicalReadiness": number (0-100),
    "cognitiveReadiness": number (0-100),
    "domainReadiness": number (0-100),
    "communicationReadiness": number (0-100),
    "leadershipReadiness": number (0-100)
  },
  "needsFollowUp": boolean,
  "lowConfidenceAreas": string[],
  "followUpQuestions": [
    {
      "questionId": string,
      "questionText": string,
      "questionType": "MCQ" | "Short-Answer" | "Scenario" | "Self-Assessment",
      "options": string[],
      "targetArea": string,
      "reason": string
    }
  ] | null,
  "assessmentValidated": boolean,
  "validationStatus": "COMPLETE" | "NEEDS_MORE_DATA",
  "recommendations": string[],
  "nextSteps": string[]
}

CRITICAL RULES:
1. NEVER ask questions already answered in Phase 1-5
2. Follow-up questions ONLY if they significantly improve confidence
3. Maximum ${MAX_FOLLOWUP_QUESTIONS} follow-up questions
4. If overall confidence >= ${MIN_OVERALL_CONFIDENCE * 100}%, set assessmentValidated = true
5. Skill gap analysis must be based on ACTUAL data from phases, not assumptions
6. Readiness scores must be conservative and evidence-based
7. Recommendations must be actionable and specific
`.trim();

// ── Service Class ─────────────────────────────────────────────────────────────

export class Phase6ConfidenceValidationService {
  private getSessionKey(sessionId: string) {
    return `phase6:session:${sessionId}`;
  }

  private async saveSession(session: Phase6Session) {
    await redisClient.set(this.getSessionKey(session.sessionId), JSON.stringify(session), SESSION_TTL_SECONDS);
  }

  private async loadSession(sessionId: string): Promise<Phase6Session | null> {
    const raw = await redisClient.get(this.getSessionKey(sessionId));
    return raw ? JSON.parse(raw) : null;
  }

  async startValidation(input: { userId: string }) {
    const sessionId = `p6_${input.userId}_${Date.now()}`;
    const now = new Date().toISOString();

    // Load all previous phase data
    const [phase1, phase2, phase3, phase4, phase5] = await Promise.all([
      prisma.assessmentSession.findFirst({
        where: { userId: input.userId, phase: 1 },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.assessmentSession.findFirst({
        where: { userId: input.userId, phase: 2 },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.assessmentSession.findFirst({
        where: { userId: input.userId, phase: 3 },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.assessmentSession.findFirst({
        where: { userId: input.userId, phase: 4 },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.assessmentSession.findFirst({
        where: { userId: input.userId, phase: 5 },
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    if (!phase1 || !phase2) {
      throw new Error('Phase 1 and 2 must be completed before Phase 6');
    }

    // Parse phase data
    const phase1Data = this.parseAnalysis(phase1.analysis);
    const phase2Data = this.parseAnalysis(phase2.analysis);
    const phase3Data = phase3 ? this.parseAnalysis(phase3.analysis) : {};
    const phase4Data = phase4 ? this.parseAnalysis(phase4.analysis) : {};
    const phase5Data = phase5 ? this.parseAnalysis(phase5.analysis) : {};

    // Call LLM for validation analysis
    const userPrompt = this.buildValidationPrompt({
      phase1Data,
      phase2Data,
      phase3Data,
      phase4Data,
      phase5Data,
    });

    const llmStart = Date.now();
    const raw = await callLLM({
      systemPrompt: PHASE6_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.3, // Lower temperature for analytical task
    });
    const llmLatencyMs = Date.now() - llmStart;

    const validation = await this.parseValidationResponse(raw);

    // Create session
    const session: Phase6Session = {
      sessionId,
      userId: input.userId,
      phase1Data,
      phase2Data,
      phase3Data,
      phase4Data,
      phase5Data,
      confidenceScores: validation.confidenceScores,
      skillGapAnalysis: validation.skillGapAnalysis,
      readinessScores: validation.readinessScores,
      needsFollowUp: validation.needsFollowUp,
      lowConfidenceAreas: validation.lowConfidenceAreas,
      followUpQuestions: validation.followUpQuestions || [],
      followUpAnswers: {},
      assessmentValidated: validation.assessmentValidated,
      validationStatus: validation.assessmentValidated ? 'COMPLETE' : (validation.needsFollowUp ? 'IN_PROGRESS' : 'PENDING'),
      completionPercentage: validation.assessmentValidated ? 100 : (validation.needsFollowUp ? 50 : 80),
      isCompleted: validation.assessmentValidated && !validation.needsFollowUp,
      createdAt: now,
      updatedAt: now,
    };

    await this.saveSession(session);

    publishTelemetryEvent(TelemetryEvent.ASSESSMENT_STARTED, {
      sessionId,
      userId: input.userId,
      phase: 6,
      overallConfidence: validation.confidenceScores.overall,
      needsFollowUp: validation.needsFollowUp,
      llmLatencyMs,
    });

    return {
      sessionId: session.sessionId,
      confidenceScores: session.confidenceScores,
      skillGapAnalysis: session.skillGapAnalysis,
      readinessScores: session.readinessScores,
      needsFollowUp: session.needsFollowUp,
      lowConfidenceAreas: session.lowConfidenceAreas,
      followUpQuestions: session.needsFollowUp ? session.followUpQuestions : [],
      assessmentValidated: session.assessmentValidated,
      validationStatus: session.validationStatus,
      completionPercentage: session.completionPercentage,
      recommendations: validation.recommendations || [],
      nextSteps: validation.nextSteps || [],
    };
  }

  async answerFollowUpQuestion(input: {
    sessionId: string;
    questionId: string;
    answer: string;
  }) {
    const session = await this.loadSession(input.sessionId);
    if (!session) throw new Error('Session not found or expired');
    if (session.isCompleted) throw new Error('Validation already completed');

    // Store answer
    session.followUpAnswers[input.questionId] = input.answer;

    // Check if all follow-up questions are answered
    const allAnswered = session.followUpQuestions.every(
      q => session.followUpAnswers[q.questionId]
    );

    if (allAnswered) {
      // Re-evaluate confidence with follow-up answers
      const reEvalPrompt = this.buildReEvaluationPrompt(session);
      const raw = await callLLM({
        systemPrompt: PHASE6_SYSTEM_PROMPT,
        userPrompt: reEvalPrompt,
        temperature: 0.3,
      });

      const updatedValidation = await this.parseValidationResponse(raw);

      session.confidenceScores = updatedValidation.confidenceScores;
      session.assessmentValidated = updatedValidation.assessmentValidated;
      session.validationStatus = updatedValidation.assessmentValidated ? 'COMPLETE' : 'NEEDS_MORE_DATA';
      session.completionPercentage = updatedValidation.assessmentValidated ? 100 : 90;
      session.isCompleted = updatedValidation.assessmentValidated;
    }

    session.updatedAt = new Date().toISOString();
    await this.saveSession(session);

    const remainingQuestions = session.followUpQuestions.filter(
      q => !session.followUpAnswers[q.questionId]
    );

    return {
      confidenceScores: session.confidenceScores,
      assessmentValidated: session.assessmentValidated,
      validationStatus: session.validationStatus,
      completionPercentage: session.completionPercentage,
      nextQuestion: remainingQuestions.length > 0 ? remainingQuestions[0] : null,
      allQuestionsAnswered: allAnswered,
    };
  }

  async completeValidation(input: { sessionId: string; userId: string }): Promise<Phase6ValidationResult> {
    const session = await this.loadSession(input.sessionId);
    if (!session) throw new Error('Session not found');

    // Force completion if not already done
    if (!session.isCompleted) {
      session.assessmentValidated = session.confidenceScores.overall >= MIN_OVERALL_CONFIDENCE;
      session.validationStatus = 'COMPLETE';
      session.completionPercentage = 100;
      session.isCompleted = true;
      await this.saveSession(session);
    }

    // Persist to database
    await prisma.assessmentSession.create({
      data: {
        userId: input.userId,
        phase: 6,
        answers: JSON.stringify(session.followUpAnswers),
        selectedOptions: Object.values(session.followUpAnswers),
        analysis: JSON.stringify({
          sessionId: session.sessionId,
          confidenceScores: session.confidenceScores,
          skillGapAnalysis: session.skillGapAnalysis,
          readinessScores: session.readinessScores,
          assessmentValidated: session.assessmentValidated,
          validationStatus: session.validationStatus,
          lowConfidenceAreas: session.lowConfidenceAreas,
          followUpQuestions: session.followUpQuestions.length,
          followUpAnswers: Object.keys(session.followUpAnswers).length,
        }),
        completedAt: new Date(),
      },
    });

    publishTelemetryEvent(TelemetryEvent.ASSESSMENT_COMPLETED, {
      sessionId: session.sessionId,
      userId: input.userId,
      phase: 6,
      overallConfidence: session.confidenceScores.overall,
      assessmentValidated: session.assessmentValidated,
    });

    return {
      assessmentComplete: session.isCompleted,
      proceedToPhase7: session.assessmentValidated && session.confidenceScores.overall >= MIN_OVERALL_CONFIDENCE,
      confidenceScores: session.confidenceScores,
      skillGapAnalysis: session.skillGapAnalysis,
      readinessScores: session.readinessScores,
      recommendations: this.generateRecommendations(session),
      nextSteps: this.generateNextSteps(session),
    };
  }

  // ── Helper Methods ────────────────────────────────────────────────────────

  private parseAnalysis(analysis: string): Record<string, any> {
    try {
      return JSON.parse(analysis);
    } catch {
      return {};
    }
  }

  private buildValidationPrompt(input: {
    phase1Data: Record<string, any>;
    phase2Data: Record<string, any>;
    phase3Data: Record<string, any>;
    phase4Data: Record<string, any>;
    phase5Data: Record<string, any>;
  }): string {
    return `
PHASE 1 - USER PROFILE:
Education: ${input.phase1Data.education?.highestQualification || 'Not specified'}
Experience: ${input.phase1Data.experience?.programmingExperience || 'Beginner'}
Career Goal: ${input.phase1Data.careerGoal || 'Not specified'}

PHASE 2 - INTERESTS & DOMAINS:
Selected Domains: ${input.phase2Data.baselinePayload?.preferredDomains?.join(', ') || input.phase2Data.preferredDomains?.join(', ') || 'None'}
Skill Confidence: ${JSON.stringify(input.phase2Data.baselinePayload?.skillConfidence || input.phase2Data.skillConfidence || {}, null, 2)}

PHASE 3 - COGNITIVE PROFILE:
Overall Confidence: ${input.phase3Data.confidence || 'N/A'}
Traits: ${JSON.stringify(input.phase3Data.traits || {}, null, 2)}
Career Scores: ${JSON.stringify(input.phase3Data.careerScores || {}, null, 2)}

PHASE 4 - TECHNICAL ASSESSMENT:
Technical Confidence: ${input.phase4Data.technicalConfidence || 'N/A'}
Domain Scores: ${JSON.stringify(input.phase4Data.domainScores || {}, null, 2)}
Strengths: ${input.phase4Data.strengths?.join(', ') || 'None identified'}
Weaknesses: ${input.phase4Data.weaknesses?.join(', ') || 'None identified'}
Knowledge Gaps: ${input.phase4Data.knowledgeGaps?.join(', ') || 'None identified'}

PHASE 5 - CAREER SPECIALIZATION:
Specialization Confidence: ${input.phase5Data.specializationConfidence || 'N/A'}
Primary Role: ${input.phase5Data.primaryRole || 'Not predicted'}
Role Readiness: ${JSON.stringify(input.phase5Data.roleReadiness || {}, null, 2)}
Strengths: ${input.phase5Data.detectedStrengths?.join(', ') || 'None'}
Missing Competencies: ${input.phase5Data.missingCompetencies?.join(', ') || 'None'}

NOW PERFORM CONFIDENCE VALIDATION:
1. Calculate confidence scores for all dimensions
2. Identify any low-confidence areas (< 70%)
3. Perform skill gap analysis
4. Calculate readiness scores
5. Determine if follow-up questions are needed
6. If needed, generate 3-5 targeted questions for low-confidence areas ONLY
`.trim();
  }

  private buildReEvaluationPrompt(session: Phase6Session): string {
    const answersText = Object.entries(session.followUpAnswers)
      .map(([qId, answer]) => {
        const question = session.followUpQuestions.find(q => q.questionId === qId);
        return `Q: ${question?.questionText}\nA: ${answer}\nTarget Area: ${question?.targetArea}`;
      })
      .join('\n\n');

    return `
${this.buildValidationPrompt({
  phase1Data: session.phase1Data,
  phase2Data: session.phase2Data,
  phase3Data: session.phase3Data,
  phase4Data: session.phase4Data,
  phase5Data: session.phase5Data,
})}

FOLLOW-UP QUESTIONS ANSWERED:
${answersText}

RE-EVALUATE confidence scores considering these follow-up answers.
Determine if assessment is now validated (overall confidence >= ${MIN_OVERALL_CONFIDENCE * 100}%).
`.trim();
  }

  private async parseValidationResponse(raw: string): Promise<any> {
    try {
      return await parseJsonAsync<any>(raw);
    } catch (error) {
      publishTelemetryEvent(TelemetryEvent.LLM_PARSE_ERROR, {
        reason: error instanceof Error ? error.message : String(error),
        parser: 'worker',
        phase: 6,
      });
      return parseLLMJson<any>(raw);
    }
  }

  private generateRecommendations(session: Phase6Session): string[] {
    const recommendations: string[] = [];

    if (session.confidenceScores.technical < 0.80) {
      recommendations.push('Focus on strengthening technical skills through hands-on projects');
    }
    if (session.confidenceScores.domain < 0.80) {
      recommendations.push('Deepen knowledge in selected domains through specialized courses');
    }
    if (session.confidenceScores.communication < 0.70) {
      recommendations.push('Improve communication skills through practice and feedback');
    }
    if (session.skillGapAnalysis.technicalSkills.missing.length > 5) {
      recommendations.push(`Address ${session.skillGapAnalysis.technicalSkills.missing.length} missing technical skills`);
    }
    if (session.readinessScores.overallCareerReadiness < 70) {
      recommendations.push('Build more practical experience through internships or projects');
    }

    return recommendations.length > 0 ? recommendations : ['Continue building on existing strengths'];
  }

  private generateNextSteps(session: Phase6Session): string[] {
    const steps: string[] = [];

    if (session.assessmentValidated) {
      steps.push('Proceed to Phase 7 for personalized career recommendations');
      steps.push('Review your skill gap analysis');
      steps.push('Start working on missing competencies');
    } else {
      steps.push('Address low-confidence areas identified');
      steps.push('Complete additional validation if needed');
      steps.push('Revisit previous phases if necessary');
    }

    return steps;
  }
}

export const phase6ConfidenceValidationService = new Phase6ConfidenceValidationService();

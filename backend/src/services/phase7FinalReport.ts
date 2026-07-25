import { prisma } from '@/lib/prisma';
import { recommendationEngineService } from './recommendation-engine';
import { roadmapGenerationService } from './roadmap-generation';
import { callLLM, parseLLMJson } from './hybridAssessment/llmClient';
import { parseJsonAsync } from '@/utils/jsonWorker';
import { publishTelemetryEvent, TelemetryEvent } from '@/lib/aiTelemetry';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Phase7CareerRecommendation {
  role: string;
  matchScore: number;
  confidenceScore: number;
  category: string;
  whySelected: string[];
  industryDemand: string;
  expectedGrowth: string;
  averageSalary?: string;
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
}

export interface Phase7SkillGap {
  technical: {
    excellent: string[];
    strong: string[];
    intermediate: string[];
    beginner: string[];
    missing: string[];
  };
  soft: {
    communication: string;
    leadership: string;
    collaboration: string;
    adaptability: string;
    problemSolving: string;
    criticalThinking: string;
  };
}

export interface Phase7ReadinessScores {
  internshipReadiness: number;
  placementReadiness: number;
  professionalReadiness: number;
  leadershipReadiness: number;
}

export interface Phase7Certification {
  name: string;
  provider: string;
  relevance: string;
  difficulty: string;
  estimatedCost?: string;
}

export interface Phase7ProjectRecommendation {
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  skills: string[];
  estimatedDuration: string;
}

export interface Phase7ResourceRecommendation {
  title: string;
  type: 'Documentation' | 'Video' | 'Article' | 'Book' | 'Course' | 'Practice';
  url?: string;
  provider: string;
  relevance: string;
}

export interface Phase7AIReport {
  userSummary: {
    profileOverview: string;
    education: string;
    careerGoal: string;
  };
  assessmentSummary: {
    cognitiveAnalysis: string;
    technicalAnalysis: string;
    domainAnalysis: string;
    specializationAnalysis: string;
  };
  topRecommendations: Phase7CareerRecommendation[];
  strengths: string[];
  weaknesses: string[];
  skillGaps: Phase7SkillGap;
  readinessScores: Phase7ReadinessScores;
  personalizedRoadmap: {
    roadmapId?: string;
    careerTitle: string;
    estimatedDuration: string;
    milestones: string[];
  };
  certifications: Phase7Certification[];
  resources: Phase7ResourceRecommendation[];
  projects: Phase7ProjectRecommendation[];
  finalAdvice: string;
  nextSteps: string[];
  generatedAt: string;
}

// ── Phase 7 System Prompt ─────────────────────────────────────────────────────

const PHASE7_SYSTEM_PROMPT = `
You are the Pragyan AI Final Career Report Generator.

OBJECTIVE:
Generate a comprehensive, professional, and actionable career assessment report based on all 6 completed assessment phases.

This is the FINAL phase. No more questions. Your job is to synthesize everything into clear, personalized career guidance.

INPUTS YOU RECEIVE:
- Phase 1: User Profile (education, experience, career goal)
- Phase 2: Selected domains, skill confidence levels
- Phase 3: Cognitive profile (traits, confidence, career scores)
- Phase 4: Technical assessment (domain scores, strengths, weaknesses, knowledge gaps)
- Phase 5: Specialization detection (predicted roles, role readiness, missing competencies)
- Phase 6: Confidence validation (overall confidence, skill gap analysis, readiness scores)
- Existing Career Recommendations (from recommendation engine)

YOUR TASKS:

1. USER SUMMARY
Create a concise profile overview:
- Who they are (student, professional, career switcher)
- Education background
- Career aspirations
- Current skill level

2. ASSESSMENT SUMMARY
Synthesize findings from all phases:
- Cognitive Analysis: Key traits, learning style, problem-solving ability
- Technical Analysis: Programming proficiency, domain expertise, hands-on experience
- Domain Analysis: Strongest domains, specialization readiness
- Specialization Analysis: Role fit, industry alignment

3. EXPLAINABLE CAREER RECOMMENDATIONS
For EACH recommended career role, explain:
- Why this role matches the user (be specific)
- Which assessment responses supported this
- Which strengths align with the role
- Which domains contributed to the match
- Which technical skills were validated
- Which cognitive traits fit the role requirements

Example:
"Machine Learning Engineer (94% match) - Your strong performance in Python, mathematics, and problem-solving (Phase 4), combined with your analytical thinking and detail-oriented nature (Phase 3), make you an excellent fit. You demonstrated advanced understanding of ML concepts and showed high interest in AI/ML domains (Phase 2). Your hands-on project experience validates practical readiness."

4. COMPREHENSIVE SKILL GAP ANALYSIS

Technical Skills:
- Excellent: Demonstrated mastery (validated in Phase 4/5)
- Strong: Solid understanding (validated through questions)
- Intermediate: Basic grasp (mentioned but needs practice)
- Beginner: Awareness only (mentioned but not validated)
- Missing: Required for target career but absent

Soft Skills (evaluate based on all phases):
- Communication: High/Medium/Low (from Phase 3 traits, Phase 5 responses)
- Leadership: High/Medium/Low
- Collaboration: High/Medium/Low
- Adaptability: High/Medium/Low
- Problem Solving: High/Medium/Low (Phase 3 + Phase 4 validated)
- Critical Thinking: High/Medium/Low

5. READINESS SCORES (0-100 scale)
Calculate based on ALL phases:
- Internship Readiness: Ready for internships in recommended roles
- Placement Readiness: Ready for full-time positions
- Professional Readiness: Industry-ready with required skills
- Leadership Readiness: Ready for team lead or mentor roles

6. CERTIFICATION RECOMMENDATIONS
Recommend 3-5 certifications:
- Relevant to TOP recommended career role
- Appropriate for current skill level
- Industry-recognized (AWS, Azure, GCP, CompTIA, Cisco, etc.)
- Include provider, relevance, difficulty

7. PROJECT RECOMMENDATIONS
Suggest 3-5 projects:
- Beginner: 1-2 projects (if skill level is entry)
- Intermediate: 2-3 projects (if skill level is mid)
- Advanced: 1-2 projects (if skill level is senior)
- Projects MUST align with recommended career path
- Include title, description, skills used, duration

8. RESOURCE RECOMMENDATIONS
Suggest 5-7 learning resources:
- Official documentation for key technologies
- YouTube courses/channels
- Books (if appropriate)
- Articles/tutorials
- Practice platforms (LeetCode, HackerRank, etc.)
- Online courses (Udemy, Coursera, etc.)
- Resources MUST be tailored to skill gaps and career goals

9. FINAL ADVICE
Provide 3-5 sentences of personalized career guidance:
- Acknowledge strengths
- Address skill gaps constructively
- Provide realistic timeline
- Encourage continuous learning
- Be supportive and motivating

10. NEXT STEPS
List 5-7 actionable steps:
- Immediate actions (this week)
- Short-term goals (this month)
- Medium-term goals (3-6 months)
- Long-term goals (6-12 months)
- Steps should be specific and achievable

RESPONSE FORMAT (JSON):
{
  "userSummary": {
    "profileOverview": string,
    "education": string,
    "careerGoal": string
  },
  "assessmentSummary": {
    "cognitiveAnalysis": string,
    "technicalAnalysis": string,
    "domainAnalysis": string,
    "specializationAnalysis": string
  },
  "topRecommendations": [
    {
      "role": string,
      "matchScore": number (0-100),
      "confidenceScore": number (0-100),
      "category": string,
      "whySelected": string[] (3-5 specific reasons),
      "industryDemand": "High" | "Medium" | "Low",
      "expectedGrowth": string,
      "averageSalary": string (optional),
      "requiredSkills": string[],
      "matchedSkills": string[],
      "missingSkills": string[]
    }
  ],
  "strengths": string[] (5-7 key strengths),
  "weaknesses": string[] (3-5 areas for improvement),
  "skillGaps": {
    "technical": {
      "excellent": string[],
      "strong": string[],
      "intermediate": string[],
      "beginner": string[],
      "missing": string[]
    },
    "soft": {
      "communication": "High" | "Medium" | "Low",
      "leadership": "High" | "Medium" | "Low",
      "collaboration": "High" | "Medium" | "Low",
      "adaptability": "High" | "Medium" | "Low",
      "problemSolving": "High" | "Medium" | "Low",
      "criticalThinking": "High" | "Medium" | "Low"
    }
  },
  "readinessScores": {
    "internshipReadiness": number (0-100),
    "placementReadiness": number (0-100),
    "professionalReadiness": number (0-100),
    "leadershipReadiness": number (0-100)
  },
  "certifications": [
    {
      "name": string,
      "provider": string,
      "relevance": string,
      "difficulty": "Beginner" | "Intermediate" | "Advanced",
      "estimatedCost": string (optional)
    }
  ],
  "resources": [
    {
      "title": string,
      "type": "Documentation" | "Video" | "Article" | "Book" | "Course" | "Practice",
      "url": string (optional),
      "provider": string,
      "relevance": string
    }
  ],
  "projects": [
    {
      "title": string,
      "description": string,
      "difficulty": "Beginner" | "Intermediate" | "Advanced",
      "skills": string[],
      "estimatedDuration": string
    }
  ],
  "finalAdvice": string (3-5 sentences),
  "nextSteps": string[] (5-7 actionable steps)
}

CRITICAL RULES:
1. Be SPECIFIC and PERSONAL - reference actual assessment data
2. Explanations must be clear to non-technical users
3. All recommendations must be ACTIONABLE
4. Match scores must be evidence-based (not inflated)
5. Skill gaps must be honest but constructive
6. Resources must be relevant and accessible
7. Timeline estimates must be realistic
8. Tone should be professional yet encouraging
9. Avoid generic advice - personalize everything
`.trim();

// ── Service Class ─────────────────────────────────────────────────────────────

export class Phase7FinalReportService {
  async generateFinalReport(input: { userId: string }): Promise<Phase7AIReport> {
    const userId = input.userId;

    // Step 1: Load all phase data
    const [phase1, phase2, phase3, phase4, phase5, phase6, user] = await Promise.all([
      prisma.assessmentSession.findFirst({
        where: { userId, phase: 1 },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.assessmentSession.findFirst({
        where: { userId, phase: 2 },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.assessmentSession.findFirst({
        where: { userId, phase: 3 },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.assessmentSession.findFirst({
        where: { userId, phase: 4 },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.assessmentSession.findFirst({
        where: { userId, phase: 5 },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.assessmentSession.findFirst({
        where: { userId, phase: 6 },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!phase1 || !phase2) {
      throw new Error('Phase 1 and 2 must be completed before Phase 7');
    }

    // Step 2: Parse phase data
    const phase1Data = this.parseAnalysis(phase1.analysis);
    const phase2Data = this.parseAnalysis(phase2.analysis);
    const phase3Data = phase3 ? this.parseAnalysis(phase3.analysis) : {};
    const phase4Data = phase4 ? this.parseAnalysis(phase4.analysis) : {};
    const phase5Data = phase5 ? this.parseAnalysis(phase5.analysis) : {};
    const phase6Data = phase6 ? this.parseAnalysis(phase6.analysis) : {};

    // Step 3: Generate career recommendations using existing engine
    const recommendations = await recommendationEngineService.generateRecommendations(userId);

    // Step 4: Build comprehensive user profile for LLM
    const userPrompt = this.buildFinalReportPrompt({
      phase1Data,
      phase2Data,
      phase3Data,
      phase4Data,
      phase5Data,
      phase6Data,
      recommendations,
      user,
    });

    // Step 5: Generate AI report
    const llmStart = Date.now();
    const raw = await callLLM({
      systemPrompt: PHASE7_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.4, // Balanced creativity and consistency
    });
    const llmLatencyMs = Date.now() - llmStart;

    const aiReport = await this.parseReportResponse(raw);

    // Step 6: Generate or activate personalized roadmap
    const topCareer = recommendations.topCareer;
    let roadmapId: string | undefined;
    
    if (topCareer) {
      try {
        const existingRoadmap = await prisma.userRoadmap.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        if (!existingRoadmap) {
          // Generate new roadmap
          const skillLevel = phase4Data.technicalConfidence >= 0.80 ? 'Intermediate' : 'Beginner';
          const roadmap = await roadmapGenerationService.generatePersonalizedRoadmap(
            userId,
            topCareer.career,
            skillLevel
          );
          roadmapId = roadmap.id;
        } else {
          roadmapId = existingRoadmap.roadmapId;
        }
      } catch (error) {
        console.error('Error generating roadmap:', error);
      }
    }

    // Step 7: Build final report
    const finalReport: Phase7AIReport = {
      userSummary: aiReport.userSummary,
      assessmentSummary: aiReport.assessmentSummary,
      topRecommendations: aiReport.topRecommendations.slice(0, 5).map((rec: any, index: number) => ({
        role: rec.role || recommendations.careerMatches[index]?.career || 'Career Role',
        matchScore: rec.matchScore || recommendations.careerMatches[index]?.match || 0,
        confidenceScore: rec.confidenceScore || 85,
        category: rec.category || recommendations.careerMatches[index]?.category || 'Technology',
        whySelected: rec.whySelected || ['Strong technical skills', 'Domain expertise', 'Career alignment'],
        industryDemand: rec.industryDemand || 'High',
        expectedGrowth: rec.expectedGrowth || 'Strong growth expected',
        averageSalary: rec.averageSalary,
        requiredSkills: rec.requiredSkills || recommendations.careerMatches[index]?.requiredSkills || [],
        matchedSkills: rec.matchedSkills || [],
        missingSkills: rec.missingSkills || recommendations.careerMatches[index]?.missingSkills || [],
      })),
      strengths: aiReport.strengths || [],
      weaknesses: aiReport.weaknesses || [],
      skillGaps: aiReport.skillGaps || {
        technical: { excellent: [], strong: [], intermediate: [], beginner: [], missing: [] },
        soft: { communication: 'Medium', leadership: 'Medium', collaboration: 'Medium', adaptability: 'Medium', problemSolving: 'Medium', criticalThinking: 'Medium' },
      },
      readinessScores: aiReport.readinessScores || {
        internshipReadiness: 70,
        placementReadiness: 60,
        professionalReadiness: 50,
        leadershipReadiness: 40,
      },
      personalizedRoadmap: {
        roadmapId,
        careerTitle: topCareer?.career || 'Career Development',
        estimatedDuration: this.calculateRoadmapDuration(phase4Data.technicalConfidence),
        milestones: this.generateMilestones(topCareer?.career || 'Career'),
      },
      certifications: aiReport.certifications || [],
      resources: aiReport.resources || [],
      projects: aiReport.projects || [],
      finalAdvice: aiReport.finalAdvice || 'Continue building your skills and gaining practical experience.',
      nextSteps: aiReport.nextSteps || ['Complete your personalized roadmap', 'Build portfolio projects', 'Apply for internships'],
      generatedAt: new Date().toISOString(),
    };

    // Step 8: Persist report to database
    await prisma.assessmentSession.create({
      data: {
        userId,
        phase: 7,
        answers: JSON.stringify({ reportGenerated: true }),
        selectedOptions: [],
        analysis: JSON.stringify({
          topRecommendations: finalReport.topRecommendations,
          strengths: finalReport.strengths,
          weaknesses: finalReport.weaknesses,
          skillGaps: finalReport.skillGaps,
          readinessScores: finalReport.readinessScores,
          roadmapId: finalReport.personalizedRoadmap.roadmapId,
          certifications: finalReport.certifications,
          projects: finalReport.projects,
          generatedAt: finalReport.generatedAt,
        }),
        completedAt: new Date(),
      },
    });

    // Step 9: Update user profile (sync long-term data only)
    await this.syncUserProfile(userId, finalReport);

    publishTelemetryEvent(TelemetryEvent.ASSESSMENT_COMPLETED, {
      userId,
      phase: 7,
      topCareer: topCareer?.career,
      matchScore: topCareer?.match,
      roadmapGenerated: !!roadmapId,
      llmLatencyMs,
    });

    return finalReport;
  }

  async getReport(userId: string): Promise<Phase7AIReport | null> {
    const phase7Session = await prisma.assessmentSession.findFirst({
      where: { userId, phase: 7 },
      orderBy: { completedAt: 'desc' },
    });

    if (!phase7Session) return null;

    const analysis = this.parseAnalysis(phase7Session.analysis);
    
    // Reconstruct report from stored data
    return {
      userSummary: {
        profileOverview: '',
        education: '',
        careerGoal: '',
      },
      assessmentSummary: {
        cognitiveAnalysis: '',
        technicalAnalysis: '',
        domainAnalysis: '',
        specializationAnalysis: '',
      },
      topRecommendations: analysis.topRecommendations || [],
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      skillGaps: analysis.skillGaps || {
        technical: { excellent: [], strong: [], intermediate: [], beginner: [], missing: [] },
        soft: { communication: 'Medium', leadership: 'Medium', collaboration: 'Medium', adaptability: 'Medium', problemSolving: 'Medium', criticalThinking: 'Medium' },
      },
      readinessScores: analysis.readinessScores || {
        internshipReadiness: 70,
        placementReadiness: 60,
        professionalReadiness: 50,
        leadershipReadiness: 40,
      },
      personalizedRoadmap: {
        roadmapId: analysis.roadmapId,
        careerTitle: analysis.topRecommendations?.[0]?.role || 'Career Development',
        estimatedDuration: '6-12 months',
        milestones: [],
      },
      certifications: analysis.certifications || [],
      resources: [],
      projects: analysis.projects || [],
      finalAdvice: '',
      nextSteps: [],
      generatedAt: analysis.generatedAt || phase7Session.completedAt.toISOString(),
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

  private buildFinalReportPrompt(input: {
    phase1Data: Record<string, any>;
    phase2Data: Record<string, any>;
    phase3Data: Record<string, any>;
    phase4Data: Record<string, any>;
    phase5Data: Record<string, any>;
    phase6Data: Record<string, any>;
    recommendations: any;
    user: any;
  }): string {
    const { phase1Data, phase2Data, phase3Data, phase4Data, phase5Data, phase6Data, recommendations } = input;

    return `
PHASE 1 - USER PROFILE:
Full Name: ${input.user?.fullName || 'User'}
Education: ${phase1Data.education?.highestQualification || 'Not specified'}
Current Status: ${phase1Data.education?.currentStatus || 'Not specified'}
Experience: ${phase1Data.experience?.programmingExperience || 'Beginner'}
Career Goal: ${phase1Data.careerGoal || 'Not specified'}
Years of Experience: ${phase1Data.experience?.yearsOfExperience || 0}

PHASE 2 - INTERESTS & DOMAINS:
Selected Domains: ${phase2Data.baselinePayload?.preferredDomains?.join(', ') || phase2Data.preferredDomains?.join(', ') || 'General'}
Favorite Subjects: ${phase2Data.baselinePayload?.favoriteSubjects?.join(', ') || phase2Data.favoriteSubjects?.join(', ') || 'None'}
Skill Confidence:
${JSON.stringify(phase2Data.baselinePayload?.skillConfidence || phase2Data.skillConfidence || {}, null, 2)}
Work Style: ${phase2Data.baselinePayload?.workStyle?.join(', ') || phase2Data.workStyle?.join(', ') || 'Not specified'}
Learning Style: ${phase2Data.baselinePayload?.learningStyle?.join(', ') || phase2Data.learningStyle?.join(', ') || 'Not specified'}

PHASE 3 - COGNITIVE ASSESSMENT:
Overall Confidence: ${phase3Data.confidence || 'N/A'}
Traits: ${JSON.stringify(phase3Data.traits || {}, null, 2)}
Career Scores: ${JSON.stringify(phase3Data.careerScores || {}, null, 2)}
Top Career Matches: ${phase3Data.suggestedCareers?.join(', ') || 'None'}

PHASE 4 - TECHNICAL ASSESSMENT:
Technical Confidence: ${phase4Data.technicalConfidence || 'N/A'}
Domain Scores: ${JSON.stringify(phase4Data.domainScores || {}, null, 2)}
Technical Strengths: ${phase4Data.technicalStrengths?.join(', ') || phase4Data.strengths?.join(', ') || 'None'}
Technical Weaknesses: ${phase4Data.technicalWeaknesses?.join(', ') || phase4Data.weaknesses?.join(', ') || 'None'}
Knowledge Gaps: ${phase4Data.knowledgeGaps?.join(', ') || 'None'}

PHASE 5 - CAREER SPECIALIZATION:
Specialization Confidence: ${phase5Data.specializationConfidence || 'N/A'}
Primary Role: ${phase5Data.primaryRole || 'Not predicted'}
Predicted Roles: ${phase5Data.predictedRoles?.map((r: any) => `${r.roleTitle} (${Math.round(r.matchScore)}%)`).join(', ') || 'None'}
Role Readiness: ${JSON.stringify(phase5Data.roleReadiness || {}, null, 2)}
Detected Strengths: ${phase5Data.detectedStrengths?.join(', ') || 'None'}
Missing Competencies: ${phase5Data.missingCompetencies?.join(', ') || 'None'}

PHASE 6 - CONFIDENCE VALIDATION:
Overall Confidence: ${Math.round((phase6Data.confidenceScores?.overall || 0.75) * 100)}%
Cognitive Confidence: ${Math.round((phase6Data.confidenceScores?.cognitive || 0.75) * 100)}%
Technical Confidence: ${Math.round((phase6Data.confidenceScores?.technical || 0.75) * 100)}%
Domain Confidence: ${Math.round((phase6Data.confidenceScores?.domain || 0.75) * 100)}%
Career Role Confidence: ${Math.round((phase6Data.confidenceScores?.careerRole || 0.75) * 100)}%
Communication Confidence: ${Math.round((phase6Data.confidenceScores?.communication || 0.75) * 100)}%
Learning Confidence: ${Math.round((phase6Data.confidenceScores?.learning || 0.75) * 100)}%

Skill Gap Analysis:
- Strong Skills: ${phase6Data.skillGapAnalysis?.technicalSkills?.strong?.join(', ') || 'None'}
- Missing Skills: ${phase6Data.skillGapAnalysis?.technicalSkills?.missing?.join(', ') || 'None'}

Readiness Scores:
- Career Readiness: ${Math.round(phase6Data.readinessScores?.overallCareerReadiness || 70)}%
- Technical Readiness: ${Math.round(phase6Data.readinessScores?.technicalReadiness || 70)}%
- Cognitive Readiness: ${Math.round(phase6Data.readinessScores?.cognitiveReadiness || 70)}%

EXISTING CAREER RECOMMENDATIONS (from recommendation engine):
${recommendations.careerMatches.slice(0, 5).map((c: any, i: number) => `
${i + 1}. ${c.career} - ${Math.round(c.match)}% match
   Category: ${c.category || 'Technology'}
   Confidence: ${c.confidenceLevel}
   Reasons: ${c.reasons.join('; ')}
   Required Skills: ${c.requiredSkills.slice(0, 5).join(', ')}
   Missing Skills: ${c.missingSkills.slice(0, 3).join(', ') || 'None'}
`).join('\n')}

RECOMMENDED SKILLS (from recommendation engine):
${recommendations.skillRecommendations.slice(0, 5).map((s: any) => `- ${s.skill}: ${s.reason}`).join('\n')}

NOW GENERATE THE COMPREHENSIVE FINAL CAREER REPORT.
Use ALL the data above to create personalized, explainable, and actionable recommendations.
`.trim();
  }

  private async parseReportResponse(raw: string): Promise<any> {
    try {
      return await parseJsonAsync<any>(raw);
    } catch (error) {
      publishTelemetryEvent(TelemetryEvent.LLM_PARSE_ERROR, {
        reason: error instanceof Error ? error.message : String(error),
        parser: 'worker',
        phase: 7,
      });
      return parseLLMJson<any>(raw);
    }
  }

  private calculateRoadmapDuration(technicalConfidence: number): string {
    if (technicalConfidence >= 0.85) return '3-6 months';
    if (technicalConfidence >= 0.70) return '6-9 months';
    if (technicalConfidence >= 0.50) return '9-12 months';
    return '12-18 months';
  }

  private generateMilestones(careerTitle: string): string[] {
    return [
      `Complete foundational learning for ${careerTitle}`,
      `Build 2-3 portfolio projects related to ${careerTitle}`,
      'Master core technical skills',
      'Gain practical experience',
      `Prepare for ${careerTitle} interviews`,
      'Apply for positions',
    ];
  }

  private async syncUserProfile(userId: string, report: Phase7AIReport) {
    const topRecommendation = report.topRecommendations[0];
    
    if (!topRecommendation) return;

    // Update only long-term career information
    await prisma.user.update({
      where: { id: userId },
      data: {
        careerTrack: topRecommendation.role,
        skills: report.skillGaps.technical.strong.concat(report.skillGaps.technical.excellent).slice(0, 10),
        interests: report.topRecommendations.map(r => r.category).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5),
        // Note: NOT storing AI reasoning, confidence scores, or temporary assessment data
        // User model stores ONLY long-term profile information
      },
    });
  }
}

export const phase7FinalReportService = new Phase7FinalReportService();

import { api } from "@/services/apiClient";
import type { AssessmentQuestion, AssessmentResult, AssessmentSaveResponse, AuthUser } from "@/types/api";

export interface AssessmentProfileInput {
  profile: Partial<AuthUser>;
  resume?: File | null;
  careerPreference?: string;
}

// ── Adaptive Assessment Types ─────────────────────────────────────────────────

export interface AdaptiveQuestion {
  id: string;
  question: string;
  category: string;
  type: "single-choice" | "likert" | "multi-choice";
  options: string[];
}

export interface AdaptiveProgress {
  answered: number;
  totalRelevant: number;
}

export interface AdaptiveStartResponse {
  sessionId: string;
  question: AdaptiveQuestion;
  confidence: number;
  progress: AdaptiveProgress;
}

export interface AdaptiveAnswerResponse {
  sessionId: string;
  confidence: number;
  nextQuestion?: AdaptiveQuestion | null;
  shouldSubmit: boolean;
  progress: AdaptiveProgress;
}

export interface AdaptiveCareerMatch {
  careerId?: string;
  career: string;
  category?: string;
  match?: number;
  score: number;
  weightedScore?: number;
  cosineScore?: number;
  matchedSkills: string[];
  missingSkills: string[];
  personalityFit?: number;
  futureDemand?: string;
  growthRate?: string;
  salaryRange?: string;
  reasons?: string[];
  skillGaps?: string[];
}

export interface AdaptiveResultSummary {
  scores?: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  roadmap?: Record<string, string[]>;
  topMatch?: AdaptiveCareerMatch | null;
  secondaryMatches?: AdaptiveCareerMatch[];
  suggestedCareers?: string[];
  confidence?: number;
  learningRoadmap?: {
    week1: string[];
    week2: string[];
    week3: string[];
    week4: string[];
  };
}

export interface AdaptiveSubmitResponse {
  resultId: string;
  sessionId?: string;
  confidence: number;
  nextPhase?: number;
  nextPhaseRoute?: string;
  assessmentCompleted?: boolean;
  topMatches: AdaptiveCareerMatch[];
  allMatches: AdaptiveCareerMatch[];
  summary: AdaptiveResultSummary;
  ai?: {
    personalityAnalysis?: string;
    careerExplanations?: Record<string, string>;
    roadmapAdvice?: string;
  };
  persisted?: {
    id: string;
    userId: string;
    suggestedCareers?: string[];
    strengths?: string[];
    weaknesses?: string[];
    createdAt?: string;
  };
}

export interface AdaptiveAssessmentResult {
  id: string;
  userId?: string;
  sessionId?: string;
  confidence: number;
  topMatches: AdaptiveCareerMatch[];
  allMatches?: AdaptiveCareerMatch[];
  summary: AdaptiveResultSummary;
  ai?: {
    personalityAnalysis?: string;
    careerExplanations?: Record<string, string>;
    roadmapAdvice?: string;
  };
  createdAt?: string;
  suggestedCareers?: string[];
  scores?: Record<string, number>;
  strengths?: string[];
  weaknesses?: string[];
}

// ── Phase 1 Types ─────────────────────────────────────────────────────────────

export interface Phase1PersonalInfo {
  firstName: string;
  lastName: string;
  age: number;
  gender: "Male" | "Female" | "Non-binary" | "Prefer not to say";
  country: string;
  state: string;
  city: string;
}

export interface Phase1Education {
  currentStatus:
    | "School Student"
    | "Diploma Student"
    | "College Student"
    | "Graduate"
    | "Working Professional"
    | "Career Switcher";
  highestQualification:
    | "10th" | "12th" | "Diploma" | "B.Tech" | "B.E."
    | "BCA" | "MCA" | "BSc" | "M.Tech" | "MBA" | "Other";
  collegeName?: string;
  university?: string;
  degree?: string;
  branch?: string;
  currentYear?: "1st" | "2nd" | "3rd" | "4th" | "Completed";
  expectedGraduationYear?: number | null;
  cgpaOrPercentage?: string;
}

export interface Phase1Experience {
  programmingExperience: "Beginner" | "Intermediate" | "Advanced";
  previouslyWorked: boolean;
  yearsOfExperience?: number | null;
  currentCompany?: string;
  currentRole?: string;
}

export type CareerGoal =
  | "Get Internship"
  | "Get Job"
  | "Upskill"
  | "Career Switch"
  | "Higher Studies"
  | "Freelancing"
  | "Start Startup";

export interface Phase1Input {
  personalInfo: Phase1PersonalInfo;
  education: Phase1Education;
  careerGoal: CareerGoal;
  experience: Phase1Experience;
}

export interface Phase1SaveResponse {
  sessionId: string;
  phase: number;
  completionPercent: number;
  nextPhase: number;
  redirectTo: string;
}

export interface Phase1Data {
  sessionId: string;
  phase: number;
  completionPercent: number;
  personalInfo: Phase1PersonalInfo | null;
  education: Phase1Education | null;
  careerGoal: CareerGoal | null;
  experience: Phase1Experience | null;
  savedAt: string | null;
}

// ── Phase 2 Types ─────────────────────────────────────────────────────────────

export type CareerObjective =
  | "Get Internship"
  | "Get Placement"
  | "Get Full-time Job"
  | "Career Switch"
  | "Higher Studies"
  | "Freelancing"
  | "Build Startup"
  | "Explore Career Options";

export type SkillConfidenceLevel =
  | "No Experience"
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Expert";

export interface SkillConfidence {
  programming:    SkillConfidenceLevel;
  mathematics:    SkillConfidenceLevel;
  problemSolving: SkillConfidenceLevel;
  communication:  SkillConfidenceLevel;
  teamwork:       SkillConfidenceLevel;
  leadership:     SkillConfidenceLevel;
}

export type WorkStyle =
  | "Remote" | "Hybrid" | "Office" | "Startup" | "MNC" | "Research"
  | "Product Company" | "Service Company" | "Government" | "Freelancing";

export type LearningStyle =
  | "Reading Documentation" | "Watching Videos" | "Building Projects"
  | "Hands-on Practice" | "Live Classes" | "Coding Challenges" | "Research Papers";

export type CareerMotivation =
  | "Passion" | "High Salary" | "Innovation" | "Job Security"
  | "Entrepreneurship" | "Research" | "Personal Interest" | "Family Influence";

export interface Phase2Input {
  careerObjective:  CareerObjective;
  preferredDomains: string[];
  skillConfidence:  SkillConfidence;
  favoriteSubjects: string[];
  workStyle:        WorkStyle[];
  learningStyle:    LearningStyle[];
  motivation:       CareerMotivation;
}

export interface Phase2SaveResponse {
  sessionId:         string;
  phase:             number;
  completionPercent: number;
  nextPhase:         number;
  redirectTo:        string;
  baselinePayload:   Record<string, unknown>;
}

export interface Phase2Data {
  sessionId:         string;
  phase:             number;
  completionPercent: number;
  careerObjective:   CareerObjective | null;
  preferredDomains:  string[];
  skillConfidence:   SkillConfidence | null;
  favoriteSubjects:  string[];
  workStyle:         WorkStyle[];
  learningStyle:     LearningStyle[];
  motivation:        CareerMotivation | null;
  baselinePayload:   Record<string, unknown> | null;
  savedAt:           string | null;
}

// ── Domain catalog ────────────────────────────────────────────────────────────

export interface DomainGroup {
  group: string;
  items: string[];
}

export const DOMAIN_CATALOG: DomainGroup[] = [
  {
    group: "Software Development",
    items: [
      "Frontend Development", "Backend Development", "Full Stack Development",
      "Mobile App Development", "Desktop Development",
    ],
  },
  {
    group: "Artificial Intelligence",
    items: [
      "Artificial Intelligence", "Machine Learning", "Deep Learning",
      "NLP", "Computer Vision", "Generative AI", "MLOps",
    ],
  },
  {
    group: "Data",
    items: ["Data Science", "Data Analytics", "Data Engineering", "Business Intelligence"],
  },
  {
    group: "Cyber Security",
    items: [
      "SOC", "Penetration Testing", "Ethical Hacking", "Digital Forensics",
      "Cloud Security", "Malware Analysis", "Threat Intelligence", "Governance Risk & Compliance",
    ],
  },
  {
    group: "Cloud",
    items: ["AWS", "Azure", "Google Cloud"],
  },
  {
    group: "DevOps",
    items: ["DevOps", "Site Reliability Engineering", "Platform Engineering"],
  },
  {
    group: "Programming",
    items: ["Competitive Programming", "System Design", "Software Architecture"],
  },
  {
    group: "Emerging Technologies",
    items: ["Blockchain", "IoT", "Robotics", "Embedded Systems", "AR/VR", "Quantum Computing"],
  },
  {
    group: "Design",
    items: ["UI/UX", "Product Design", "Graphic Design"],
  },
  {
    group: "Business",
    items: ["Product Management", "Project Management", "Business Analysis", "Technical Consulting"],
  },
];

export const FAVORITE_SUBJECTS = [
  "DSA", "DBMS", "Operating Systems", "Computer Networks", "OOP",
  "Web Development", "AI", "Cyber Security", "Cloud Computing",
  "Software Engineering", "Data Science",
] as const;

export const CAREER_OBJECTIVES: CareerObjective[] = [
  "Get Internship", "Get Placement", "Get Full-time Job", "Career Switch",
  "Higher Studies", "Freelancing", "Build Startup", "Explore Career Options",
];

export const SKILL_CONFIDENCE_LEVELS: SkillConfidenceLevel[] = [
  "No Experience", "Beginner", "Intermediate", "Advanced", "Expert",
];

export const WORK_STYLES: WorkStyle[] = [
  "Remote", "Hybrid", "Office", "Startup", "MNC", "Research",
  "Product Company", "Service Company", "Government", "Freelancing",
];

export const LEARNING_STYLES: LearningStyle[] = [
  "Reading Documentation", "Watching Videos", "Building Projects",
  "Hands-on Practice", "Live Classes", "Coding Challenges", "Research Papers",
];

export const CAREER_MOTIVATIONS: CareerMotivation[] = [
  "Passion", "High Salary", "Innovation", "Job Security",
  "Entrepreneurship", "Research", "Personal Interest", "Family Influence",
];

// ── Phase 4 Types ─────────────────────────────────────────────────────────────

export interface Phase4Question {
  questionId:   string;
  questionText: string;
  questionType: "MCQ" | "Scenario" | "Conceptual" | "Practical" | "Experience";
  options:      string[];
  topic:        string;
  domain:       string;
  difficulty:   "Foundation" | "Intermediate" | "Advanced" | "Expert";
  codeSnippet?: string | null;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const assessmentService = {
  // Legacy methods (backward compatible)
  async saveProfile(input: AssessmentProfileInput) {
    return api.patch<AuthUser>("/auth/me", {
      ...input.profile,
      careerTrack: input.careerPreference || input.profile.careerTrack,
    });
  },

  saveSkills(input: { skills: string[]; interests?: string[]; preferences?: string[] }) {
    return api.patch<AuthUser>("/auth/me", input);
  },

  getQuestions() {
    return api.get<AssessmentQuestion[]>("/assessment/questions");
  },

  saveAssessment(answers: Record<string, string>) {
    return api.post<AssessmentSaveResponse>("/assessment/save", { answers });
  },

  submitAssessment(answers: Record<string, string>) {
    return api.post<AssessmentResult>("/assessment/submit-legacy", { answers });
  },

  // ── Adaptive Assessment Methods ─────────────────────────────────────────────

  async startAdaptiveAssessment(): Promise<AdaptiveStartResponse> {
    return api.post<AdaptiveStartResponse>("/assessment/start");
  },

  async answerAdaptiveQuestion(
    sessionId: string,
    questionId: string,
    answer: string | string[]
  ): Promise<AdaptiveAnswerResponse> {
    return api.post<AdaptiveAnswerResponse>("/assessment/answer", {
      sessionId,
      questionId,
      answer,
    });
  },

  async submitAdaptiveAssessment(sessionId: string): Promise<AdaptiveSubmitResponse> {
    return api.post<AdaptiveSubmitResponse>("/assessment/submit", { sessionId });
  },

  async getAdaptiveResult(resultId: string): Promise<AdaptiveAssessmentResult> {
    return api.get<AdaptiveAssessmentResult>(`/assessment/results/${resultId}`);
  },

  async getLatestAssessment() {
    return api.get<AdaptiveAssessmentResult>("/assessment/latest");
  },

  // ── Phase 1: Profile Collection ─────────────────────────────────────────────

  async savePhase1(data: Phase1Input): Promise<Phase1SaveResponse> {
    return api.postWithRetry<Phase1SaveResponse>("/assessment/phase-1", data);
  },

  async getPhase1(): Promise<Phase1Data | null> {
    return api.get<Phase1Data | null>("/assessment/phase-1");
  },

  async updatePhase1(data: Phase1Input): Promise<Phase1SaveResponse> {
    return api.putWithRetry<Phase1SaveResponse>("/assessment/phase-1", data);
  },

  // ── Phase 2: Interest, Domain & Career Discovery ─────────────────────────────

  async savePhase2(data: Phase2Input): Promise<Phase2SaveResponse> {
    return api.postWithRetry<Phase2SaveResponse>("/assessment/phase-2", data);
  },

  async getPhase2(): Promise<Phase2Data | null> {
    return api.get<Phase2Data | null>("/assessment/phase-2");
  },

  async updatePhase2(data: Phase2Input): Promise<Phase2SaveResponse> {
    return api.putWithRetry<Phase2SaveResponse>("/assessment/phase-2", data);
  },

  // ── Phase 3: Adaptive AI Assessment ──────────────────────────────────────────

  async startPhase3() {
    return api.post<{
      sessionId:       string;
      question:        AdaptiveQuestion;
      confidence:      number;
      progress:        AdaptiveProgress;
      baselinePayload: Record<string, unknown>;
      phase:           number;      nextPhase?:      number;
      nextPhaseRoute?: string;
      assessmentCompleted?: boolean;    }>("/assessment/phase-3/start");
  },

  // ── Phase 4: Adaptive Domain-Specific Technical Assessment ───────────────────

  async startPhase4() {
    return api.post<{
      sessionId:  string;
      question:   Phase4Question;
      confidence: number;
      progress:   { answered: number; totalRelevant: number };      nextPhase?: number;
      nextPhaseRoute?: string;
      assessmentCompleted?: boolean;    }>("/assessment/phase-4/start");
  },

  async answerPhase4Question(sessionId: string, questionId: string, answer: string) {
    return api.post<{
      confidence:      number;
      progress:        { answered: number; totalRelevant: number };
      nextQuestion:    Phase4Question | null;
      shouldSubmit:    boolean;
      reasoningToast:  string;
    }>("/assessment/phase-4/answer", { sessionId, questionId, answer });
  },

  async submitPhase4Assessment(sessionId: string) {
    return api.post<{
      resultId:  string;
      sessionId: string;
      confidence: number;      nextPhase?: number;
      nextPhaseRoute?: string;
      assessmentCompleted?: boolean;      summary: {
        domainReadiness:       Record<string, number>;
        technicalStrengths:    string[];
        technicalWeaknesses:   string[];
        knowledgeGaps:         string[];
        skillScores:           Record<string, number>;
      };
    }>("/assessment/phase-4/submit", { sessionId });
  },

  // ── Phase 5: AI Specialization Detection & Career Role Identification ────────

  async startPhase5() {
    return api.post<{
      sessionId:        string;
      predictedRoles:   Array<{
        role: string;
        matchScore: number;
        category?: string;
        skillsRequired?: string[];
      }>;
      question:         Phase4Question;
      confidence:       number;
      progress:         { answered: number; totalRelevant: number };      nextPhase?:       number;
      nextPhaseRoute?:  string;
      assessmentCompleted?: boolean;    }>("/assessment/phase-5/start");
  },

  async answerPhase5Question(sessionId: string, questionId: string, answer: string) {
    return api.post<{
      confidence:      number;
      progress:        { answered: number; totalRelevant: number };
      nextQuestion:    Phase4Question | null;
      shouldSubmit:    boolean;
      adaptiveReason?: string;
    }>("/assessment/phase-5/answer", { sessionId, questionId, answer });
  },

  async submitPhase5Assessment(sessionId: string) {
    return api.post<{
      resultId:  string;
      sessionId: string;
      confidence: number;
      summary: {
        bestCareerRoles:      Array<{
          role: string;
          matchScore: number;
          category?: string;
          readiness: number;
        }>;
        roleReadiness:        Record<string, number>;
        specializationLevel:  "Entry-Level" | "Mid-Level" | "Senior" | "Expert";
        specializationScore:  number;
        strengthAreas:        string[];
        missingCompetencies:  string[];
        confidenceScore:      number;
        careerFitAnalysis:    string;
        industryReadiness:    Record<string, number>;
        nextSteps:            string[];
      };
    }>("/assessment/phase-5/submit", { sessionId });
  },

  // ── Phase 6: AI Confidence Validation & Skill Gap Analysis ───────────────────

  async startPhase6() {
    return api.post<{
      sessionId: string;
      confidenceScores: {
        overall: number;
        cognitive: number;
        technical: number;
        domain: number;
        careerRole: number;
        communication: number;
        learning: number;
      };
      skillGapAnalysis: {
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
      };
      readinessScores: {
        overallCareerReadiness: number;
        technicalReadiness: number;
        cognitiveReadiness: number;
        domainReadiness: number;
        communicationReadiness: number;
        leadershipReadiness: number;
      };
      needsFollowUp: boolean;
      lowConfidenceAreas: string[];
      followUpQuestions: Array<{
        questionId: string;
        questionText: string;
        questionType: 'MCQ' | 'Short-Answer' | 'Scenario' | 'Self-Assessment';
        options: string[];
        targetArea: string;
        reason: string;
      }>;
      assessmentValidated: boolean;
      validationStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'NEEDS_MORE_DATA';
      completionPercentage: number;
      recommendations: string[];
      nextSteps: string[];
    }>("/assessment/phase-6/start");
  },

  async answerPhase6Question(sessionId: string, questionId: string, answer: string) {
    return api.post<{
      confidenceScores: {
        overall: number;
        cognitive: number;
        technical: number;
        domain: number;
        careerRole: number;
        communication: number;
        learning: number;
      };
      assessmentValidated: boolean;
      validationStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'NEEDS_MORE_DATA';
      completionPercentage: number;
      nextQuestion: {
        questionId: string;
        questionText: string;
        questionType: 'MCQ' | 'Short-Answer' | 'Scenario' | 'Self-Assessment';
        options: string[];
        targetArea: string;
        reason: string;
      } | null;
      allQuestionsAnswered: boolean;
    }>("/assessment/phase-6/answer", { sessionId, questionId, answer });
  },

  async validatePhase6Assessment(sessionId: string) {
    return api.post<{
      assessmentComplete: boolean;
      proceedToPhase7: boolean;
      nextPhase?: number;
      nextPhaseRoute?: string;
      assessmentCompleted?: boolean;
      confidenceScores: {
        overall: number;
        cognitive: number;
        technical: number;
        domain: number;
        careerRole: number;
        communication: number;
        learning: number;
      };
      skillGapAnalysis: {
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
      };
      readinessScores: {
        overallCareerReadiness: number;
        technicalReadiness: number;
        cognitiveReadiness: number;
        domainReadiness: number;
        communicationReadiness: number;
        leadershipReadiness: number;
      };
      recommendations: string[];
      nextSteps: string[];
    }>("/assessment/phase-6/validate", { sessionId });
  },

  // ── Phase 7: AI Career Recommendation Engine & Final Report ──────────────────

  async generatePhase7Report() {
    return api.post<Phase7AIReport>("/assessment/phase-7/generate");
  },

  async getPhase7Report() {
    return api.get<Phase7AIReport | null>("/assessment/report");
  },
};

// ── Phase 7 Types ─────────────────────────────────────────────────────────────

export interface Phase7CareerRecommendation {
  role: string;
  matchScore: number;
  confidenceScore: number;
  category: string;
  whySelected: string[];
  industryDemand: "High" | "Medium" | "Low";
  expectedGrowth: string;
  averageSalary?: string;
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
}

export interface Phase7Certification {
  name: string;
  provider: string;
  relevance: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  estimatedCost?: string;
  link?: string;
}

export interface Phase7Resource {
  title: string;
  type: "Course" | "Book" | "Tutorial" | "Documentation" | "Video" | "Blog";
  url?: string;
  provider?: string;
  relevance: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
}

export interface Phase7Project {
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  skills: string[];
  estimatedDuration: string;
  portfolio?: boolean;
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
  skillGaps: {
    technical: {
      excellent: string[];
      strong: string[];
      intermediate: string[];
      beginner: string[];
      missing: string[];
    };
    soft: {
      communication: "High" | "Medium" | "Low";
      leadership: "High" | "Medium" | "Low";
      collaboration: "High" | "Medium" | "Low";
      adaptability: "High" | "Medium" | "Low";
      problemSolving: "High" | "Medium" | "Low";
      criticalThinking: "High" | "Medium" | "Low";
    };
  };
  readinessScores: {
    internshipReadiness: number;
    placementReadiness: number;
    professionalReadiness: number;
    leadershipReadiness: number;
  };
  personalizedRoadmap: {
    roadmapId?: string;
    careerTitle: string;
    estimatedDuration: string;
    milestones: string[];
  };
  certifications: Phase7Certification[];
  resources: Phase7Resource[];
  projects: Phase7Project[];
  finalAdvice: string;
  nextSteps: string[];
  generatedAt: string;
}

import { api } from "@/services/apiClient";

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AICareerRecommendation {
  career: string;
  score: number;
  reason?: string;
  icon?: string; // Career icon name for UI display
}

export interface AIChatAction {
  id: string;
  label: string;
  description?: string;
  route: string;
  type?: string;
}

export interface AIChatResponse {
  conversationId: string;
  reply: string;
  provider?: string;
  fallbackUsed?: boolean;
  actions?: AIChatAction[];
}

export interface MentorContext {
  career?: string;
  roadmap?: string;
  currentDay?: string;
  weakSkills?: string[];
  completedSkills?: string[];
  currentGoal?: string;
  placementReadiness?: number;
}

export interface MentorConversation {
  conversationId: string;
  title: string;
}

export interface AssessmentReportInput {
  topMatches: unknown[];
  confidence?: number;
  strengths?: string[];
  weaknesses?: string[];
  targetCareer?: string;
}

export interface LearningRoadmapInput {
  targetCareer: string;
  skillGaps?: string[];
  timelineWeeks?: number;
  profileSummary?: string;
}

export const aiService = {
  startConversation(context: MentorContext = {}) {
    return api.post<MentorConversation>("/mentor/conversation", { context });
  },
  chat(message: string, conversationId: string | undefined, context: MentorContext = {}) {
    return api.post<AIChatResponse>("/mentor/chat", { message, conversationId, context });
  },
  recordActionEvent(payload: { actionId: string; actionType: string; label?: string; route: string; source?: string }) {
    return api.post('/ai/action-event', payload);
  },
  getCareerRecommendations() {
    return api.get<AICareerRecommendation[]>("/ai/recommend-careers");
  },
  getTopCareer() {
    return api.get<any>('/career-matching/top-career').then((match) => ({
      career: match?.career?.title || match?.career || "",
      score: match?.matchScore || match?.score || 0,
      reason: Array.isArray(match?.reasons) ? match.reasons[0] : match?.reason || undefined,
    }));
  },
  generateAssessmentReport(input: AssessmentReportInput) {
    return api.post<{ report: unknown; mode: string }>("/ai/report", input);
  },
  generateLearningRoadmap(input: LearningRoadmapInput) {
    return api.post<{ roadmap: unknown; mode: string; fallback?: boolean }>("/ai/roadmap", input);
  },
};

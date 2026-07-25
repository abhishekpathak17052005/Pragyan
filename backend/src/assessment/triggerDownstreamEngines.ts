import { prisma } from '@/lib/prisma';
import { callLLM, parseLLMJson } from '@/assessment/llmClient';
import { RECOMMENDATION_SYSTEM_PROMPT, ROADMAP_SYSTEM_PROMPT, buildRecommendationUserPrompt, buildRoadmapUserPrompt } from '@/assessment/promptTemplates';

export interface RecommendationResult {
  recommendedCareer: string;
  confidenceScore: number;
  reasoning: string;
}

export interface RoadmapTask {
  title: string;
  description: string;
  estimatedMinutes: number;
}

export interface RoadmapModule {
  title: string;
  topics: Array<{ title: string; tasks: RoadmapTask[] }>;
}

export interface Roadmap {
  domain: string;
  track: {
    title: string;
    modules: RoadmapModule[];
  };
}

export interface DailyPlan {
  mode: 'Recovery' | 'Growth' | 'Stretch';
  date: string;
  tasks: RoadmapTask[];
}

export interface MentorContext {
  weakTopics: string[];
  assessmentSummary: string;
  proactiveWarnings: string[];
}

export interface DownstreamResult {
  recommendation: RecommendationResult;
  roadmap: Roadmap;
  dailyPlan: DailyPlan;
  mentorContext: MentorContext;
}

export class DownstreamEngineService {
  public async triggerDownstreamEngines(session: { id: string; userId: string; isCompleted: boolean; finalSummary?: any; profile: Record<string, unknown> }): Promise<DownstreamResult> {
    if (!session.isCompleted || !session.finalSummary) {
      throw new Error('Assessment session must be completed with a final summary to trigger downstream engines.');
    }

    const recommendationRaw = await callLLM({
      systemPrompt: RECOMMENDATION_SYSTEM_PROMPT,
      userPrompt: buildRecommendationUserPrompt(session as any),
      temperature: 0.2,
    });
    const recommendation = await parseLLMJson<RecommendationResult>(recommendationRaw);

    const roadmapRaw = await callLLM({
      systemPrompt: ROADMAP_SYSTEM_PROMPT,
      userPrompt: buildRoadmapUserPrompt(session as any, recommendation.recommendedCareer),
      temperature: 0.2,
    });
    const roadmap = await parseLLMJson<Roadmap>(roadmapRaw);

    const dailyPlan: DailyPlan = {
      mode: session.finalSummary.recommendedMode || 'Growth',
      date: new Date().toISOString().slice(0, 10),
      tasks: (roadmap.track.modules.flatMap((module) => module.topics.flatMap((topic) => topic.tasks))).slice(0, 3),
    };

    const mentorContext: MentorContext = {
      weakTopics: session.finalSummary.weakTopics || [],
      assessmentSummary: `Strengths: ${session.finalSummary.strengths?.join(', ') || 'none'}`,
      proactiveWarnings: (session.finalSummary.weakTopics || []).map((topic: string) => `Review ${topic} before moving to the next module.`),
    };

    const roadmapPayload = {
      sessionId: session.id,
      domain: roadmap.domain,
      recommendedRole: recommendation.recommendedCareer,
      skillGaps: session.finalSummary.skillGaps || [],
      track: roadmap.track as any,
      dailyPlan: dailyPlan as any,
    };

    await prisma.assessmentRoadmap.upsert({
      where: { userId: session.userId },
      update: roadmapPayload,
      create: {
        userId: session.userId,
        ...roadmapPayload,
      },
    });

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        careerTrack: recommendation.recommendedCareer,
        currentTitle: recommendation.recommendedCareer,
        skills: Array.from(new Set([...(session.finalSummary.strengths || []), ...(session.finalSummary.skillGaps || [])])),
        interests: session.finalSummary.weakTopics || [],
        preferences: session.finalSummary.skillGaps || [],
      },
    });

    return {
      recommendation,
      roadmap,
      dailyPlan,
      mentorContext,
    };
  }
}

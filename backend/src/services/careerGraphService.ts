import { prisma } from '@/lib/prisma';
import { callLLM, parseLLMJson } from '@/assessment/llmClient';

const prismaAny = prisma as any;

interface RoleFilters {
  careerCluster?: string;
  industry?: string;
  difficulty?: string;
  remoteFriendly?: boolean;
}

interface SkillGapItem {
  skillName: string;
  weight: number;
  required: boolean;
  preferred: boolean;
}

interface RoadmapMilestone {
  phase: string;
  title: string;
  items: string[];
}

interface RoadmapResponse {
  title: string;
  description: string;
  milestones: RoadmapMilestone[];
  capstoneProject?: string;
}

export const careerGraphService = {
  async getRoleById(jobId: string) {
    return prismaAny.careerRole.findUnique({ where: { jobId } });
  },

  async getRoleByTitle(title: string) {
    return prismaAny.careerRole.findFirst({ where: { jobTitle: title } });
  },

  async listRoles(filters: RoleFilters = {}) {
    const where: Record<string, unknown> = {};

    if (filters.careerCluster) where.careerCluster = filters.careerCluster;
    if (filters.industry) where.industry = filters.industry;
    if (filters.difficulty) where.difficulty = filters.difficulty;
    if (typeof filters.remoteFriendly === 'boolean') where.remoteFriendly = filters.remoteFriendly;

    return prismaAny.careerRole.findMany({ where });
  },

  async getSkillGapAnalysis(userSkills: string[], targetJobId: string): Promise<SkillGapItem[]> {
    const role = await this.getRoleById(targetJobId);
    if (!role) return [];

    const skillNames = new Set(userSkills.map((skill: string) => skill.trim().toLowerCase()));
    const weightRows = (await prismaAny.careerSkillWeight.findMany({ where: { jobTitle: role.jobTitle } })) as Array<{ skillName: string; weight: number }>;
    const weightMap = new Map(weightRows.map((row: { skillName: string; weight: number }) => [String(row.skillName).toLowerCase(), Number(row.weight)]));

    const requiredSkills = (role.requiredSkills || []).filter((skill: string) => !skillNames.has(skill.toLowerCase()));
    const preferredSkills = (role.preferredSkills || []).filter((skill: string) => !skillNames.has(skill.toLowerCase()));

    const combined = [...requiredSkills, ...preferredSkills];
    const seen = new Set<string>();

    const items = combined
      .map((skillName) => {
        const key = skillName.toLowerCase();
        if (seen.has(key)) return null;
        seen.add(key);
        return {
          skillName,
          weight: weightMap.get(key) ?? 1,
          required: requiredSkills.includes(skillName),
          preferred: preferredSkills.includes(skillName),
        };
      })
      .filter(Boolean) as SkillGapItem[];

    return items.sort((a, b) => b.weight - a.weight || a.skillName.localeCompare(b.skillName));
  },

  async getRoadmap(jobId: string): Promise<RoadmapResponse> {
    const role = await this.getRoleById(jobId);
    if (!role) {
      throw new Error('Role not found');
    }

    const roadmapTopics = role.roadmapTopics as Record<string, string[] | string> | null;
    const milestones: RoadmapMilestone[] = [
      { phase: 'beginner', title: 'Beginner', items: Array.isArray(roadmapTopics?.beginner) ? roadmapTopics.beginner : [] },
      { phase: 'intermediate', title: 'Intermediate', items: Array.isArray(roadmapTopics?.intermediate) ? roadmapTopics.intermediate : [] },
      { phase: 'advanced', title: 'Advanced', items: Array.isArray(roadmapTopics?.advanced) ? roadmapTopics.advanced : [] },
    ];

    return {
      title: role.jobTitle,
      description: role.description || 'Career roadmap from the knowledge graph',
      milestones,
      capstoneProject: typeof roadmapTopics?.capstoneProject === 'string' ? roadmapTopics.capstoneProject : undefined,
    };
  },

  async getSimilarRoles(jobId: string) {
    const role = await this.getRoleById(jobId);
    if (!role) return [];
    return role.similarRoles || [];
  },

  async getCareerProgression(careerCluster: string) {
    const ladder = await prismaAny.careerProgressionLadder.findFirst({ where: { careerCluster } });
    return ladder?.ladder || [];
  },

  async getWeeklyAssessmentTopics(jobId: string) {
    const role = await this.getRoleById(jobId);
    return role?.weeklyAssessmentTopics || [];
  },

  async getMentorContext(jobId: string) {
    const role = await this.getRoleById(jobId);
    if (!role) return null;

    return {
      jobTitle: role.jobTitle,
      description: role.description,
      requiredSkills: role.requiredSkills,
      roadmapTopics: role.roadmapTopics,
      careerReadinessFactors: role.careerReadinessFactors,
    };
  },

  async buildMentorReply(jobId: string, userProfile: Record<string, unknown>) {
    const context = await this.getMentorContext(jobId);
    if (!context) return { message: 'The requested role is not in the career catalog.' };

    const prompt = `You are an AI mentor. Use the provided career context only. Role context: ${JSON.stringify(context)}. User profile: ${JSON.stringify(userProfile)}. Respond with a concise coaching message that stays grounded in the role.`;
    const response = await callLLM({ systemPrompt: 'You are a helpful mentor', userPrompt: prompt, temperature: 0.4 });
    return parseLLMJson<{ message: string }>(response);
  },
};

import { prisma } from '@/lib/prisma';
import { callLLM, parseLLMJson } from '@/assessment/llmClient';
import { SKILLS_DISCOVERY_SYSTEM_PROMPT, buildSkillsDiscoveryUserPrompt } from '@/assessment/promptTemplates';

export interface ExploratoryAnswers {
  energizes: string[];
  drains: string[];
}

export interface SkillsQuadrants {
  realizedStrengths: string[];
  unrealizedStrengths: string[];
  learnedSkills: string[];
  weaknesses: string[];
}

export class SkillsDiscoveryService {
  public async processExploratoryAnswers(userId: string, answers: ExploratoryAnswers): Promise<SkillsQuadrants> {
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        skills: true,
        interests: true,
        experience: true,
        education: true,
      },
    });

    if (!userProfile) {
      throw new Error('User profile not found for skills discovery.');
    }

    const raw = await callLLM({
      systemPrompt: SKILLS_DISCOVERY_SYSTEM_PROMPT,
      userPrompt: buildSkillsDiscoveryUserPrompt({ userProfile, exploratoryAnswers: answers }),
      temperature: 0.7,
    });

    const skillsQuadrants = await parseLLMJson<SkillsQuadrants>(raw);

    const existingProfile = await prisma.aIMemoryProfile.findFirst({ where: { userId } });

    await prisma.aIMemoryProfile.upsert({
      where: { id: existingProfile?.id ?? '' },
      update: { profileData: { ...skillsQuadrants, lastUpdated: new Date().toISOString() } as any },
      create: { userId, profileData: { ...skillsQuadrants, lastUpdated: new Date().toISOString() } as any },
    });

    return skillsQuadrants;
  }
}

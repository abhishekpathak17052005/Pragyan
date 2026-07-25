import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

const prismaAny = prisma as any;

interface CareerRoleSeed {
  jobId: string;
  jobTitle: string;
  [key: string]: any;
}

interface SkillSeedMap {
  [skillName: string]: {
    parentSkill?: string;
    childSkills?: string[];
    difficulty?: string;
    prerequisites?: string[];
    importanceWeight?: number;
    relatedSkills?: string[];
  };
}

interface LadderSeedMap {
  [careerCluster: string]: string[];
}

interface WeightSeedMap {
  [jobTitle: string]: Record<string, number>;
}

interface SimilaritySeedMap {
  [jobTitle: string]: string[];
}

const seedDir = path.resolve(__dirname, '../seed/career-knowledge-graph');
const rolesPath = path.join(seedDir, 'career_knowledge_graph.json');
const skillsPath = path.join(seedDir, 'skill_graph.json');
const laddersPath = path.join(seedDir, 'career_progression_ladders.json');
const weightsPath = path.join(seedDir, 'skill_weight_matrix.json');
const similarityPath = path.join(seedDir, 'job_similarity_map.json');

async function main() {
  const [rolesRaw, skillsRaw, laddersRaw, weightsRaw, similarityRaw] = await Promise.all([
    fs.promises.readFile(rolesPath, 'utf8'),
    fs.promises.readFile(skillsPath, 'utf8'),
    fs.promises.readFile(laddersPath, 'utf8'),
    fs.promises.readFile(weightsPath, 'utf8'),
    fs.promises.readFile(similarityPath, 'utf8'),
  ]);

  const roles = JSON.parse(rolesRaw) as CareerRoleSeed[];
  const skills = JSON.parse(skillsRaw) as SkillSeedMap;
  const skillNames = new Set(Object.keys(skills));
  const ladders = JSON.parse(laddersRaw) as LadderSeedMap;
  const weights = JSON.parse(weightsRaw) as WeightSeedMap;
  const similarity = JSON.parse(similarityRaw) as SimilaritySeedMap;

  const warnings: string[] = [];

  const roleUpserts = await Promise.all(
    roles.map(async (role) => {
      const referencedSkills = [...(role.requiredSkills || []), ...(role.preferredSkills || []), ...(role.softSkills || [])].filter(Boolean);
      const unknownSkills = referencedSkills.filter((skill: string) => !skillNames.has(skill));
      if (unknownSkills.length > 0) {
        warnings.push(`${role.jobTitle} references missing skills: ${unknownSkills.join(', ')}`);
      }

      const payload = {
        jobId: role.jobId,
        jobTitle: role.jobTitle,
        industry: role.industry,
        domain: role.domain,
        careerCluster: role.careerCluster,
        specialization: role.specialization,
        experienceLevel: role.experienceLevel,
        educationLevel: role.educationLevel,
        careerStage: role.careerStage,
        description: role.description,
        requiredSkills: role.requiredSkills || [],
        preferredSkills: role.preferredSkills || [],
        softSkills: role.softSkills || [],
        tools: role.tools || [],
        technologies: role.technologies || [],
        programmingLanguages: role.programmingLanguages || [],
        certifications: role.certifications || [],
        projects: role.projects || [],
        roadmapTopics: role.roadmapTopics || null,
        weeklyAssessmentTopics: role.weeklyAssessmentTopics || [],
        interviewTopics: role.interviewTopics || [],
        careerReadinessFactors: role.careerReadinessFactors || [],
        futureDemand: role.futureDemand,
        salaryRange: role.salaryRange,
        remoteFriendly: Boolean(role.remoteFriendly),
        automationRisk: role.automationRisk,
        difficulty: role.difficulty,
        estimatedLearningMonths: role.estimatedLearningMonths,
        relatedRoles: role.relatedRoles || [],
        nextCareerRoles: role.nextCareerRoles || [],
        entryRoles: role.entryRoles || [],
        advancedRoles: role.advancedRoles || [],
        personalityTraits: role.personalityTraits || [],
        interestTags: role.interestTags || [],
        workStyle: role.workStyle,
        workEnvironment: role.workEnvironment,
        industryTags: role.industryTags || [],
        embeddingKeywords: role.embeddingKeywords || [],
        similarRoles: role.relatedRoles || [],
        sourceRecordCount: role._meta?.sourceRecordCount ?? null,
        confidence: typeof role._meta?.confidence === 'string' ? role._meta.confidence : null,
      };

      return prismaAny.careerRole.upsert({
        where: { jobId: role.jobId },
        update: payload,
        create: payload,
      });
    })
  );

  const skillUpserts = await Promise.all(
    Object.entries(skills).map(async ([skillName, payload]) => prismaAny.careerKnowledgeSkill.upsert({
      where: { skillName },
      update: {
        skillName,
        parentSkill: payload.parentSkill,
        childSkills: payload.childSkills || [],
        difficulty: payload.difficulty,
        prerequisites: payload.prerequisites || [],
        importanceWeight: payload.importanceWeight ?? null,
        relatedSkills: payload.relatedSkills || [],
      },
      create: {
        skillName,
        parentSkill: payload.parentSkill,
        childSkills: payload.childSkills || [],
        difficulty: payload.difficulty,
        prerequisites: payload.prerequisites || [],
        importanceWeight: payload.importanceWeight ?? null,
        relatedSkills: payload.relatedSkills || [],
      },
    }))
  );

  const ladderUpserts = await Promise.all(
    Object.entries(ladders).map(async ([careerCluster, ladder]) => prismaAny.careerProgressionLadder.upsert({
      where: { careerCluster },
      update: { ladder },
      create: { careerCluster, ladder },
    }))
  );

  const weightUpserts = await Promise.all(
    Object.entries(weights).map(async ([jobTitle, skillWeights]) => {
      const role = roles.find((entry) => entry.jobTitle === jobTitle);
      const jobId = role?.jobId;
      return Promise.all(
        Object.entries(skillWeights).map(async ([skillName, weight]) => prismaAny.careerSkillWeight.upsert({
          where: { jobTitle_skillName: { jobTitle, skillName } },
          update: { jobId: jobId ?? null, weight },
          create: { jobTitle, skillName, weight, jobId: jobId ?? null },
        }))
      );
    })
  );

  const similarityUpserts = await Promise.all(
    Object.entries(similarity).map(async ([jobTitle, similarRoles]) => {
      const role = roles.find((entry) => entry.jobTitle === jobTitle);
      if (!role) return null;
      return prismaAny.careerRole.update({
        where: { jobId: role.jobId },
        data: { similarRoles: similarRoles.slice(0, 10) },
      });
    })
  );

  const summary = {
    roles: roleUpserts.length,
    skills: skillUpserts.length,
    ladders: ladderUpserts.length,
    weights: weightUpserts.flat().length,
    similarityUpdates: similarityUpserts.filter(Boolean).length,
  };

  if (warnings.length > 0) {
    console.warn('[Career Graph Seed] Warnings');
    warnings.forEach((warning) => console.warn(`- ${warning}`));
  }

  console.log('[Career Graph Seed] Completed', summary);
}

main().catch((error) => {
  console.error('[Career Graph Seed] Failed', error);
  process.exit(1);
});

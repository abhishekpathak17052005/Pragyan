// src/services/itJobRoleService.ts

import { prisma } from '@/lib/prisma';

/**
 * Suggest roles based on user skills.
 * @param userSkills Array of skill strings the user possesses.
 * @param limit Maximum number of results to return (default 10).
 * @returns Array of role objects with matchScore and missingSkills.
 */
export async function suggestRoles(userSkills: string[], limit = 10) {
  // Fetch all roles with their requiredSkills and skillWeights
  const roles = await prisma.itJobRole.findMany({
    select: {
      jobId: true,
      jobTitle: true,
      careerCluster: true,
      requiredSkills: true,
      skillWeights: true,
    },
  });

  const results = [];
  for (const role of roles) {
    let totalWeight = 0;
    let matchedWeight = 0;
    const requiredSkills = role.requiredSkills;
    const skillWeights = role.skillWeights as Record<string, number> || {};

    // Calculate total possible weight (sum of weights for all required skills)
    for (const skill of requiredSkills) {
      totalWeight += skillWeights[skill] ?? 1; // default weight 1 if not specified
    }

    // Calculate matched weight (sum of weights for skills user has)
    for (const skill of userSkills) {
      if (requiredSkills.includes(skill)) {
        matchedWeight += skillWeights[skill] ?? 1;
      }
    }

    const matchScore = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;

    // Determine missing skills (those in requiredSkills not in userSkills)
    const missingSkills = requiredSkills.filter(skill => !userSkills.includes(skill));

    results.push({
      jobId: role.jobId,
      jobTitle: role.jobTitle,
      careerCluster: role.careerCluster,
      matchScore: parseFloat(matchScore.toFixed(2)),
      missingSkills: missingSkills.slice(0, 5), // top 5 missing skills
    });
  }

  // Sort by matchScore descending
  results.sort((a, b) => b.matchScore - a.matchScore);

  // Return top limit
  return results.slice(0, limit);
}

/**
 * Get related roles for a given jobId.
 * @param jobId The job ID of the role.
 * @returns Array of related role objects (jobId, jobTitle, similarity).
 */
export async function getRelatedRoles(jobId: string) {
  const role = await prisma.itJobRole.findUnique({
    where: { jobId },
    select: { relatedRoles: true },
  });

  return role?.relatedRoles ?? [];
}

/**
 * Get roles by career cluster, optionally filtered by seniority level.
 * @param cluster The career cluster to filter by.
 * @param filters Optional filters (e.g., seniorityLevel).
 * @returns Array of role objects.
 */
export async function getRolesByCluster(cluster: string, filters?: { seniorityLevel?: string }) {
  const where: any = { careerCluster: cluster };
  if (filters?.seniorityLevel) {
    where.seniorityLevel = filters.seniorityLevel;
  }

  return await prisma.itJobRole.findMany({
    where,
    select: {
      jobId: true,
      jobTitle: true,
      careerCluster: true,
      seniorityLevel: true,
      description: true,
      requiredSkills: true,
      skillCount: true,
      certifications: true,
      assessmentTopics: true,
    },
    orderBy: { jobTitle: 'asc' },
  });
}

/**
 * Search roles by text query on searchText and jobTitle.
 * @param query The search string.
 * @returns Array of matching role objects.
 */
export async function searchRoles(query: string) {
  return await prisma.itJobRole.findMany({
    where: {
      OR: [
        { searchText: { contains: query, mode: 'insensitive' } },
        { jobTitle: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      jobId: true,
      jobTitle: true,
      careerCluster: true,
      seniorityLevel: true,
      description: true,
      requiredSkills: true,
      skillCount: true,
      certifications: true,
      assessmentTopics: true,
    },
    orderBy: { jobTitle: 'asc' },
  });
}

/**
 * Get the list of job IDs that require a given skill.
 * @param skillName The skill to look up.
 * @returns Array of job IDs.
 */
export async function whoNeedsSkill(skillName: string) {
  const entry = await prisma.skillIndexEntry.findUnique({
    where: { skillName },
    select: { jobIds: true },
  });

  return entry?.jobIds ?? [];
}

/**
 * Get assessment topics for a given jobId.
 * @param jobId The job ID.
 * @returns Array of assessment topic strings.
 */
export async function getAssessmentTopics(jobId: string) {
  const role = await prisma.itJobRole.findUnique({
    where: { jobId },
    select: { assessmentTopics: true },
  });

  return role?.assessmentTopics ?? [];
}

/**
 * Calculate skill gap for a user against a specific role.
 * @param userSkills Array of skill strings the user possesses.
 * @param jobId The job ID of the target role.
 * @returns Object containing matched weight, missing weight, total weight, and missing skills sorted by weight descending.
 */
export async function getSkillGap(userSkills: string[], jobId: string) {
  const role = await prisma.itJobRole.findUnique({
    where: { jobId },
    select: {
      requiredSkills: true,
      skillWeights: true,
    },
  });

  if (!role) {
    throw new Error(`Role not found for jobId: ${jobId}`);
  }

  const requiredSkills = role.requiredSkills;
  const skillWeights = role.skillWeights as Record<string, number> || {};

  let totalWeight = 0;
  let matchedWeight = 0;
  const missingSkills: { skill: string; weight: number }[] = [];

  for (const skill of requiredSkills) {
    const weight = skillWeights[skill] ?? 1;
    totalWeight += weight;
    if (userSkills.includes(skill)) {
      matchedWeight += weight;
    } else {
      missingSkills.push({ skill, weight });
    }
  }

  // Sort missing skills by weight descending
  missingSkills.sort((a, b) => b.weight - a.weight);

  return {
    matchedWeight,
    missingWeight: totalWeight - matchedWeight,
    totalWeight,
    missingSkills: missingSkills.map(m => m.skill),
    matchPercentage: totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0,
  };
}

/**
 * Generate assessment questions for a given jobId and optional topic subset.
 * @param jobId The job ID.
 * @param topicSubset Optional array of topics to focus on; if undefined, use all assessmentTopics.
 * @returns Promise that resolves to an array of question objects (as generated by LLM).
 * @note This function calls the LLM via llmClient.ts and expects a JSON array of questions.
 */
export async function generateAssessmentQuestions(jobId: string, topicSubset?: string[]) {
  // Get the assessment topics for the role
  const topics = await getAssessmentTopics(jobId);
  const selectedTopics = topicSubset?.length ? topicSubset.filter(t => topics.includes(t)) : topics;

  if (selectedTopics.length === 0) {
    throw new Error('No valid topics provided for question generation.');
  }

  // Import the LLM client dynamically to avoid circular dependencies if any
  const { callLLM, parseLLMJson } = await import('@/assessment/llmClient');

  // Construct the prompt
  const prompt = `
    You are an expert assessment designer for IT job roles.
    Generate a set of multiple-choice questions to assess knowledge in the following topics:
    ${selectedTopics.map(t => `- ${t}`).join('\n')}

    For each topic, generate 2-3 questions. Each question should have:
    - "question": the question text
    - "options": an array of 4 strings (the answer choices)
    - "correctIndex": the index (0-3) of the correct answer in the options array
    - "topic": the topic this question belongs to

    Return a JSON array of question objects. Do not include any additional text or explanation.
    Ensure the JSON is valid and can be parsed directly.
  `;

  const response = await callLLM({
    systemPrompt: 'You are a helpful assistant that generates assessment questions.',
    userPrompt: prompt,
    temperature: 0.7,
  });

  const parsed = parseLLMJson(response);
  if (!Array.isArray(parsed)) {
    throw new Error('LLM did not return an array of questions.');
  }

  // Validate each question has the required fields and that the topic is in the allowed list
  const validQuestions = parsed.filter((q: any) => {
    if (
      typeof q.question === 'string' &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correctIndex === 'number' &&
      q.correctIndex >= 0 &&
      q.correctIndex < 4 &&
      typeof q.topic === 'string' &&
      selectedTopics.includes(q.topic)
    ) {
      return true;
    }
    return false;
  });

  return validQuestions;
}

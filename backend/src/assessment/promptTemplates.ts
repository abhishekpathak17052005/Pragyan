/**
 * Pragyan assessment prompt templates used by the attached engine modules.
 */

export const ADAPTIVE_ASSESSMENT_SYSTEM_PROMPT = `
You are the Pragyan AI Assessment Engine. Generate exactly one highly technical, scenario-based multiple-choice question for a career assessment.

CORE RULES:
1. Use the user's baseline and prior answers to tailor the question.
2. Match the requested depth exactly: General, Specific, Specialization, or Depth.
3. Prefer realistic engineering, product, data, or AI workplace scenarios.
4. Make the question challenging but fair for a career-fit evaluation.
5. Return strictly valid JSON only.

STRICT OUTPUT SCHEMA:
{
  "question": "Clear, concise question",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Exactly one option string from the options array"
}

Do not include markdown, commentary, or extra keys.
`.trim();

export function buildAdaptiveQuestionPrompt(params: { userProfile: unknown; phase2Scores: Record<string, number>; history: Array<{ questionText: string; userAnswer: string; isCorrect: boolean }>; targetSection: string }): string {
  return `
USER CONTEXT:
${JSON.stringify(params.userProfile)}

MANUAL SKILL RATINGS:
${JSON.stringify(params.phase2Scores)}

ASSESSMENT HISTORY:
${params.history.length > 0
    ? params.history.map((item, index) => `Q${index + 1}: ${item.questionText} | Answered: ${item.userAnswer} | Result: ${item.isCorrect ? 'Correct' : 'Incorrect'}`).join('\n')
    : 'No history yet.'}

CURRENT TASK:
Generate the next question for the "${params.targetSection}" section.
Return JSON with exactly these keys: question, options, correctAnswer.
Do not include explanation, topic, or extra fields.
STRICT JSON OUTPUT ONLY:
`.trim();
}

export const ASSESSMENT_SUMMARY_SYSTEM_PROMPT = `
Analyze the completed Pragyan assessment and generate a final summary.
Identify skill gaps, strengths, and recommend a learning mode (Recovery, Growth, or Stretch).

OUTPUT SCHEMA:
{
  "recommendedRole": "Specific job title",
  "recommendedMode": "Recovery" | "Growth" | "Stretch",
  "strengths": ["Skill 1", "Skill 2"],
  "skillGaps": ["Gap 1", "Gap 2"],
  "insight": "A brief insight"
}
`.trim();

export const SKILLS_DISCOVERY_SYSTEM_PROMPT = `
You are the Pragyan AI Skills Discovery Engine. Categorize a user's skills into four quadrants.

OUTPUT SCHEMA:
{
  "realizedStrengths": string[],
  "unrealizedStrengths": string[],
  "learnedSkills": string[],
  "weaknesses": string[]
}
`.trim();

export function buildSkillsDiscoveryUserPrompt(params: { userProfile: unknown; exploratoryAnswers: { energizes: string[]; drains: string[] } }): string {
  return `
USER PROFILE:
${JSON.stringify(params.userProfile)}

EXPLORATORY ANSWERS:
Energizes: ${params.exploratoryAnswers.energizes.join(', ')}
Drains: ${params.exploratoryAnswers.drains.join(', ')}

Categorize the skills into realizedStrengths, unrealizedStrengths, learnedSkills, weaknesses.
STRICT JSON OUTPUT ONLY:
`.trim();
}

export const RECOMMENDATION_SYSTEM_PROMPT = `
Recommend one target career based on the assessment summary and user profile.
Return strict JSON with recommendedCareer, confidenceScore, and reasoning.
`.trim();

export const ROADMAP_SYSTEM_PROMPT = `
Generate a concise learning roadmap for the recommended career.
Return strict JSON with domain, track.title, and modules.
`.trim();

export function buildRecommendationUserPrompt(session: { profile: Record<string, unknown>; finalSummary?: { strengths?: string[]; weakTopics?: string[]; skillGaps?: string[] } }): string {
  return `
PROFILE: ${JSON.stringify(session.profile)}
STRENGTHS: ${JSON.stringify(session.finalSummary?.strengths || [])}
WEAK TOPICS: ${JSON.stringify(session.finalSummary?.weakTopics || [])}
SKILL GAPS: ${JSON.stringify(session.finalSummary?.skillGaps || [])}
`.trim();
}

export function buildRoadmapUserPrompt(session: { profile: Record<string, unknown>; finalSummary?: { recommendedRole?: string; skillGaps?: string[] } }, recommendedPath?: string): string {
  return `
PROFILE: ${JSON.stringify(session.profile)}
RECOMMENDED CAREER: ${recommendedPath || session.finalSummary?.recommendedRole || 'Career'}
SKILL GAPS: ${JSON.stringify(session.finalSummary?.skillGaps || [])}
`.trim();
}

import { z } from 'zod';

export const CapabilityCategorySchema = z.enum([
  'Logical Thinking',
  'Analytical Thinking',
  'Problem Solving',
  'Creativity',
  'Communication',
  'Leadership',
  'Curiosity',
  'Adaptability',
  'Critical Thinking',
  'Attention to Detail',
  'Decision Making',
  'Learning Ability',
  'Persistence',
  'Teamwork',
  'Time Management',
]);

export type CapabilityCategory = z.infer<typeof CapabilityCategorySchema>;

export const CapabilityProfileSchema = z.object({
  userId: z.string(),
  capabilityScores: z.record(z.string(), z.number()),
  topStrengths: z.array(z.string()),
  developmentAreas: z.array(z.string()),
  behaviorSignals: z.object({
    timeToAnswer: z.number(),
    retryCount: z.number(),
    hintUsage: z.number(),
    completionRate: z.number(),
  }),
  confidence: z.number().min(0).max(100),
  recommendedDifficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  assessmentVersion: z.string().default('1.0.0'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type CapabilityProfile = z.infer<typeof CapabilityProfileSchema>;

export interface ChallengeOption {
  text: string;
  impact: Partial<Record<CapabilityCategory, number>>;
}

export interface CapabilityChallenge {
  id: string;
  title: string;
  text: string;
  type: 'scenario' | 'logical' | 'planning';
  options?: ChallengeOption[];
  correctOrder?: string[];
  pattern?: string;
  difficulty: number;
}

export const CAPABILITY_CHALLENGES: CapabilityChallenge[] = [
  {
    id: 'cap_q1',
    title: 'Project Deadline',
    text: 'Your team has one day left before project submission. What would you do?',
    type: 'scenario',
    difficulty: 1,
    options: [
      { text: 'Divide remaining work.', impact: { Leadership: 15, Teamwork: 10, 'Decision Making': 5 } },
      { text: 'Finish everything yourself.', impact: { Persistence: 20, 'Problem Solving': 5 } },
      { text: 'Reduce project scope.', impact: { 'Critical Thinking': 15, 'Time Management': 10 } },
      { text: 'Ask mentor for guidance.', impact: { 'Learning Ability': 15, Communication: 10 } },
    ],
  },
  {
    id: 'cap_q2',
    title: 'Pattern Recognition',
    text: 'Find the missing number in the sequence: 2, 6, 12, 20, 30, ?',
    type: 'logical',
    difficulty: 2,
    pattern: '42',
  },
  {
    id: 'cap_q3',
    title: 'Task Prioritization',
    text: 'Arrange these project tasks in the correct order: A. Deployment, B. Requirements, C. Testing, D. Coding',
    type: 'planning',
    difficulty: 1,
    correctOrder: ['B', 'D', 'C', 'A'],
  },
];

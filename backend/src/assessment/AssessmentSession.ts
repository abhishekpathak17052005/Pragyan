import { z } from 'zod';

/**
 * AssessmentSession schema for Pragyan AI Career Operating System.
 * Phase 2 scores are intentionally flexible so dynamic domains can be stored safely.
 */
export const AssessmentSessionSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  phase2Scores: z.record(z.string(), z.number().min(1).max(5)).default({}),
  currentQuestionNumber: z.number().int().min(1).max(15).default(1),
  currentSection: z.enum(['General', 'Specific', 'Specialization', 'Depth']).default('General'),
  history: z.array(z.object({
    questionText: z.string(),
    userAnswer: z.string(),
    isCorrect: z.boolean(),
    topic: z.string(),
    funnelLevel: z.string(),
  })).default([]),
  isCompleted: z.boolean().default(false),
  finalSummary: z.any().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type AssessmentSession = z.infer<typeof AssessmentSessionSchema>;

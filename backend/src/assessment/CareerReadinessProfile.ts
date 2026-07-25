import { z } from 'zod';

/**
 * Career readiness profile schema for Pragyan 2.0 Phase 5.
 * Captures the user's readiness mindset, interview confidence, habits, and support needs.
 */
export const CareerReadinessProfileSchema = z.object({
  readinessLevel: z.enum(['starting', 'developing', 'ready']).optional(),
  interviewConfidence: z.enum(['low', 'medium', 'high']).optional(),
  habits: z.array(z.string()).default([]),
  developmentGoals: z.string().min(1),
  supportPreferences: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export type CareerReadinessProfile = z.infer<typeof CareerReadinessProfileSchema>;

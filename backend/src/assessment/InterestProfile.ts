import { z } from 'zod';

/**
 * Interest profile schema for Pragyan 2.0 Phase 2.
 * Captures the user's broad career interests and preferences.
 */
export const InterestProfileSchema = z.object({
  primaryInterest: z.string().min(1),
  workStyle: z.string().min(1).optional(),
  collaborationPreference: z.string().min(1).optional(),
  learningStyle: z.string().min(1).optional(),
  growthGoal: z.string().min(1).optional(),
  categories: z.array(z.string()).default([]),
});

export type InterestProfile = z.infer<typeof InterestProfileSchema>;

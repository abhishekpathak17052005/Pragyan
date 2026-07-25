import { z } from 'zod';

/**
 * Technical profile schema for Pragyan 2.0 Phase 4.
 * Captures the user's current technical comfort and preferred growth areas.
 */
export const TechnicalProfileSchema = z.object({
  technicalLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  codingComfort: z.enum(['none', 'basic', 'moderate', 'strong']).optional(),
  problemSolving: z.enum(['low', 'medium', 'high']).optional(),
  tools: z.array(z.string()).default([]),
  domains: z.array(z.string()).default([]),
  preferredStack: z.array(z.string()).default([]),
  growthFocus: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
});

export type TechnicalProfile = z.infer<typeof TechnicalProfileSchema>;

import { z } from 'zod';

/**
 * Capability profile schema for Pragyan 2.0 Phase 3.
 * Captures the user's demonstrated strengths, growth areas, and answer history.
 */
export const CapabilityProfileSchema = z.object({
  summary: z.string().min(1).optional(),
  primaryFocus: z.string().min(1).optional(),
  capabilities: z.array(
    z.object({
      category: z.string().min(1),
      confidence: z.string().min(1).optional(),
      evidence: z.string().optional(),
    })
  ).default([]),
  strengths: z.array(z.string()).default([]),
  growthAreas: z.array(z.string()).default([]),
  responses: z.array(
    z.object({
      questionText: z.string().min(1),
      topic: z.string().min(1),
      funnelLevel: z.string().min(1),
      answer: z.string().min(1),
    })
  ).default([]),
});

export type CapabilityProfile = z.infer<typeof CapabilityProfileSchema>;

import { z } from 'zod';

/**
 * User schema for Pragyan AI Career Operating System.
 */
export const UserSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  fullName: z.string().min(1),
  age: z.number().int().min(15).max(100).optional(),
  phone: z.string().optional(),
  linkedin: z.string().url().or(z.literal('')).optional(),
  education: z.string().optional(),
  currentTitle: z.string().optional(),
  experience: z.string().optional(),
  skills: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  externalCourses: z.array(z.string()).optional().default([]),
  currentRoadmapId: z.string().optional(),
  recommendedPath: z.string().optional(),
  assignedMode: z.enum(['Recovery', 'Growth', 'Stretch']).optional(),
  isProfileComplete: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

import { z } from 'zod';
import { ResourceType } from '@prisma/client';

const resourceTypeSchema = z.nativeEnum(ResourceType);
const resourceCategorySchema = z.enum([
  'DOCUMENTATION',
  'VIDEO',
  'PRACTICE',
  'NOTES',
  'ARTICLE',
  'BOOK',
  'CHEATSHEET',
  'PROJECT',
  'MINI_PROJECT',
  'ASSIGNMENT',
  'INTERVIEW_QUESTION',
]);

export const createCareerSchema = z.object({
  name: z.string().min(3).max(200),
  slug: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000),
  totalWeeks: z.number().int().positive(),
});

export const createWeekSchema = z.object({
  careerId: z.string().min(1),
  weekNumber: z.number().int().positive(),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
});

export const createDaySchema = z.object({
  weekId: z.string().min(1),
  dayNumber: z.number().int().positive(),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
});

export const createTopicSchema = z.object({
  dayId: z.string().min(1),
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  difficulty: z.string().min(1).max(50),
  estimatedTime: z.string().min(1).max(50),
  order: z.number().int().nonnegative(),
  quizUrl: z.string().url().optional().or(z.literal('')),
  miniProjectUrl: z.string().url().optional().or(z.literal('')),
  progress: z.unknown().optional(),
});

export const createResourceSchema = z.object({
  topicId: z.string().min(1),
  type: resourceTypeSchema.optional(),
  resourceType: resourceCategorySchema.optional(),
  title: z.string().min(3).max(200),
  provider: z.string().min(2).max(120),
  url: z.string().url(),
  description: z.string().max(2000).optional(),
  thumbnail: z.string().url().optional().or(z.literal('')),
  estimatedDuration: z.string().max(100).optional(),
  duration: z.string().max(100).optional(),
  isFree: z.boolean().optional(),
  free: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
  verified: z.boolean().optional(),
  language: z.string().max(50).optional(),
  difficulty: z.string().max(50).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  order: z.number().int().nonnegative().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateResourceSchema = createResourceSchema.partial().extend({
  topicId: z.string().min(1).optional(),
});

export const listResourceSchema = z.object({
  topicId: z.string().min(1).optional(),
  type: resourceCategorySchema.optional(),
});

export const reorderResourcesSchema = z.object({
  topicId: z.string().min(1),
  orderedResourceIds: z.array(z.string().min(1)).min(1),
});

export const searchTopicsSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateCareerInput = z.infer<typeof createCareerSchema>;
export type CreateWeekInput = z.infer<typeof createWeekSchema>;
export type CreateDayInput = z.infer<typeof createDaySchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type SearchTopicsInput = z.infer<typeof searchTopicsSchema>;
export type ListResourceInput = z.infer<typeof listResourceSchema>;
export type ReorderResourcesInput = z.infer<typeof reorderResourcesSchema>;

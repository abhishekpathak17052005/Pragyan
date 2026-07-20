import { z } from 'zod';
import { ResourceType } from '@prisma/client';

const resourceTypeSchema = z.nativeEnum(ResourceType);
const resourceCategorySchema = z.enum([
  'DOCUMENTATION',
  'VIDEO',
  'PRACTICE',
  'ARTICLE',
  'BOOK',
  'CHEATSHEET',
  'PROJECT',
  'COURSE',
  'OTHER',
  'NOTES',
  'MINI_PROJECT',
  'ASSIGNMENT',
  'INTERVIEW_QUESTION',
  'CERTIFICATION',
  'REFERENCE',
]);

export const createCareerSchema = z.object({
  name: z.string().min(3).max(200),
  title: z.string().min(3).max(200).optional(),
  slug: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000),
  thumbnail: z.string().url().optional().or(z.literal('')),
  icon: z.string().min(1).max(100).optional(), // Icon for career role (robot, shield, chart, etc.)
  totalWeeks: z.number().int().positive().optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export const updateCareerSchema = createCareerSchema.partial();

export const generateCareerRoadmapSchema = z.object({
  careerGoal: z.string().trim().min(2).max(160),
  skillLevel: z.string().trim().min(2).max(80).optional(),
});

export const createModuleSchema = z.object({
  careerId: z.string().min(1),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  order: z.number().int().nonnegative().optional(),
});

export const updateModuleSchema = createModuleSchema.omit({ careerId: true }).partial();

export const createWeekSchema = z.object({
  moduleId: z.string().min(1).optional(),
  careerId: z.string().min(1).optional(),
  weekNumber: z.number().int().positive(),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
});

export const updateWeekSchema = createWeekSchema.omit({ moduleId: true, careerId: true }).partial().extend({
  weekNumber: z.number().int().positive().optional(),
});

export const createDaySchema = z.object({
  weekId: z.string().min(1),
  dayNumber: z.number().int().positive(),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  estimatedHours: z.number().nonnegative().optional(),
});

export const updateDaySchema = createDaySchema.omit({ weekId: true }).partial();

export const createTopicSchema = z.object({
  dayId: z.string().min(1),
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  objective: z.string().max(2000).optional(),
  difficulty: z.string().min(1).max(50).optional(),
  estimatedTime: z.string().min(1).max(50).optional(),
  order: z.number().int().nonnegative().optional(),
  quizUrl: z.string().url().optional().or(z.literal('')),
  miniProjectUrl: z.string().url().optional().or(z.literal('')),
  progress: z.unknown().optional(),
});

export const updateTopicSchema = createTopicSchema.omit({ dayId: true }).partial();

export const createResourceSchema = z.object({
  topicId: z.string().min(1),
  type: resourceTypeSchema.optional(),
  resourceType: resourceCategorySchema.optional(),
  title: z.string().min(3).max(200).optional(),
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
  displayOrder: z.number().int().nonnegative().optional(),
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

export const reorderItemsSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const searchTopicsSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateCareerInput = z.infer<typeof createCareerSchema>;
export type UpdateCareerInput = z.infer<typeof updateCareerSchema>;
export type GenerateCareerRoadmapInput = z.infer<typeof generateCareerRoadmapSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type CreateWeekInput = z.infer<typeof createWeekSchema>;
export type UpdateWeekInput = z.infer<typeof updateWeekSchema>;
export type CreateDayInput = z.infer<typeof createDaySchema>;
export type UpdateDayInput = z.infer<typeof updateDaySchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type SearchTopicsInput = z.infer<typeof searchTopicsSchema>;
export type ListResourceInput = z.infer<typeof listResourceSchema>;
export type ReorderResourcesInput = z.infer<typeof reorderResourcesSchema>;
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;

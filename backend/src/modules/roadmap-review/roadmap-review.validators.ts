import { z } from 'zod';

const previewTopicSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Industry Ready']),
  estimatedDuration: z.string().min(1),
  learningObjective: z.string().min(1),
  prerequisite: z.string().min(1),
  explanation: z.string().min(1).optional(),
  handsOnExercise: z.string().min(1).optional(),
  handsOnTask: z.string().min(1).optional(),
  miniExercise: z.string().min(1).optional(),
  expectedOutcome: z.string().min(1).optional(),
  resources: z.object({
    documentation: z.array(z.unknown()).default([]),
    video: z.array(z.unknown()).default([]),
    practice: z.array(z.unknown()).default([]),
    notes: z.array(z.unknown()).default([]),
    books: z.array(z.unknown()).default([]),
    projects: z.array(z.unknown()).default([]),
    interviewQuestions: z.array(z.unknown()).default([]),
  }).default({
    documentation: [],
    video: [],
    practice: [],
    notes: [],
    books: [],
    projects: [],
    interviewQuestions: [],
  }).optional(),
  practicalTask: z.string().min(1).optional(),
}).passthrough();

const previewDaySchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  dayNumber: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  topics: z.array(previewTopicSchema).min(1),
}).passthrough();

const previewWeekSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  weekNumber: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  days: z.array(previewDaySchema).min(1),
  weeklyRevision: z.string().min(1).optional(),
  weeklyQuiz: z.string().min(1).optional(),
  handsOnAssignment: z.string().min(1).optional(),
  miniProject: z.string().min(1).optional(),
}).passthrough();

const previewModuleSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  moduleNumber: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  weeks: z.array(previewWeekSchema).min(1),
  moduleAssessment: z.string().min(1).optional(),
  realWorldProject: z.string().min(1).optional(),
  interviewQuestions: z.array(z.string()).optional(),
  commonMistakes: z.array(z.string()).optional(),
  industryTips: z.array(z.string()).optional(),
}).passthrough();

export const roadmapReviewSchema = z.object({
  careerName: z.string().min(3).max(200),
  summary: z.string().min(1),
  templateKey: z.string().optional(),
  version: z.number().int().positive().optional(),
  generatedBy: z.string().optional(),
  generatedAt: z.string().optional(),
  approved: z.boolean().optional(),
  status: z.enum(['draft', 'approved']).optional(),
  modules: z.array(previewModuleSchema).min(1),
}).passthrough();

export const approveRoadmapSchema = roadmapReviewSchema;

export const updateModuleSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
}).passthrough();

export const updateWeekSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
}).passthrough();

export const updateDaySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
}).passthrough();

export const updateTopicSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Industry Ready']).optional(),
  estimatedDuration: z.string().min(1).optional(),
  learningObjective: z.string().min(1).optional(),
  prerequisite: z.string().min(1).optional(),
  explanation: z.string().min(1).optional(),
  handsOnExercise: z.string().min(1).optional(),
  handsOnTask: z.string().min(1).optional(),
  miniExercise: z.string().min(1).optional(),
  expectedOutcome: z.string().min(1).optional(),
  practicalTask: z.string().min(1).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
}).passthrough();

export type RoadmapReviewInput = z.infer<typeof roadmapReviewSchema>;
export type ApproveRoadmapInput = z.infer<typeof approveRoadmapSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type UpdateWeekInput = z.infer<typeof updateWeekSchema>;
export type UpdateDayInput = z.infer<typeof updateDaySchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;

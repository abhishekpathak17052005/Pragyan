import { z } from 'zod';

export const generateRoadmapRequestSchema = z.object({
  careerName: z.string().min(3).max(200),
});

const curriculumTopicSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  explanation: z.string().min(1),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Industry Ready']),
  estimatedDuration: z.string().min(1),
  learningObjective: z.string().min(1),
  prerequisite: z.string().min(1),
  handsOnExercise: z.string().min(1),
  handsOnTask: z.string().min(1),
  miniExercise: z.string().min(1),
  expectedOutcome: z.string().min(1),
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
  }),
  practicalTask: z.string().min(1).optional(),
});

const curriculumDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  topics: z.array(curriculumTopicSchema).min(3).max(6),
}).refine((data) => data.topics.length >= 3 && data.topics.length <= 6, {
  message: 'Each day must contain 3 to 6 topics.',
});

const curriculumWeekSchema = z.object({
  weekNumber: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  days: z.array(curriculumDaySchema).min(5).max(7),
  weeklyRevision: z.string().min(1),
  weeklyQuiz: z.string().min(1),
  handsOnAssignment: z.string().min(1),
  miniProject: z.string().min(1),
}).refine((data) => data.days.length >= 5 && data.days.length <= 7, {
  message: 'Each week must contain 5 to 7 days.',
});

const curriculumModuleSchema = z.object({
  moduleNumber: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  weeks: z.array(curriculumWeekSchema).min(3).max(5),
  moduleAssessment: z.string().min(1),
  realWorldProject: z.string().min(1),
  interviewQuestions: z.array(z.string().min(1)).min(3),
  commonMistakes: z.array(z.string().min(1)).min(3),
  industryTips: z.array(z.string().min(1)).min(3),
}).refine((data) => data.weeks.length >= 3 && data.weeks.length <= 5, {
  message: 'Each module must contain 3 to 5 weeks.',
});

export const generatedRoadmapSchema = z.object({
  careerName: z.string().min(1),
  summary: z.string().min(1),
  templateKey: z.string().min(1),
  version: z.number().int().positive().default(1),
  generatedBy: z.string().min(1).default('gemini'),
  generatedAt: z.string().min(1),
  approved: z.boolean().default(false),
  status: z.enum(['draft', 'approved']).default('draft'),
  modules: z.array(curriculumModuleSchema).min(5).max(8),
}).refine((data) => {
  const totalWeeks = data.modules.reduce((acc, module) => acc + module.weeks.length, 0);
  return totalWeeks >= 20 && totalWeeks <= 35;
}, {
  message: 'Roadmap must contain 20 to 35 total weeks.',
});

export type GenerateRoadmapRequestInput = z.infer<typeof generateRoadmapRequestSchema>;
export type GeneratedRoadmapOutput = z.infer<typeof generatedRoadmapSchema>;

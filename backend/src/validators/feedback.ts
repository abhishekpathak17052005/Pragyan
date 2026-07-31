// src/validators/feedback.ts

import { z } from 'zod';

export const FEEDBACK_CATEGORIES = [
  'General Feedback',
  'Bug Report',
  'Feature Request',
  'Assessment Feedback',
  'Career Recommendation Issue',
  'Roadmap Feedback',
  'AI Counselor Feedback',
  'Performance Issue',
  'UI / UX Issue',
  'Other',
] as const;

export const FEEDBACK_PRIORITIES = ['Low', 'Medium', 'High'] as const;

export const FEEDBACK_STATUSES = [
  'Open',
  'Under Review',
  'In Progress',
  'Resolved',
  'Closed',
] as const;

export const createFeedbackSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid category' }),
  }),

  rating: z
    .number({ required_error: 'Rating is required' })
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),

  title: z
    .string({ required_error: 'Title is required' })
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title must be at most 120 characters')
    .trim(),

  description: z
    .string({ required_error: 'Description is required' })
    .min(20, 'Please provide at least 20 characters')
    .max(2000, 'Description must be at most 2000 characters')
    .trim(),

  priority: z.enum(FEEDBACK_PRIORITIES).default('Medium'),

  screenshotUrl: z.string().url('Invalid image URL').optional().nullable(),

  allowContact: z.boolean().default(false),

  anonymous: z.boolean().default(false),
});

export const updateStatusSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES, {
    errorMap: () => ({ message: 'Please provide a valid status' }),
  }),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

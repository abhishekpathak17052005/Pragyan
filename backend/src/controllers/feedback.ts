// src/controllers/feedback.ts

import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendSuccess, sendError } from '@/utils/response';
import { feedbackService } from '@/services/feedback';
import { createFeedbackSchema, updateStatusSchema } from '@/validators/feedback';

// ── User endpoints ─────────────────────────────────────────────────────────────

/**
 * POST /api/feedback
 * Submit new feedback. Auth required in production.
 */
export const createFeedback = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');

  const parsed = createFeedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return sendError(res, 400, firstError?.message ?? 'Validation failed');
  }

  const created = await feedbackService.createFeedback(userId, parsed.data);
  return sendSuccess(res, created, 201, 'Feedback submitted successfully');
});

/**
 * GET /api/feedback/me
 * List all feedback submitted by the authenticated user.
 */
export const listUserFeedback = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');

  const items = await feedbackService.listForUser(userId);
  return sendSuccess(res, items, 200, 'Feedback fetched');
});

/**
 * GET /api/feedback/:id
 * Get a single feedback item (must belong to the requesting user, or admin).
 */
export const getFeedbackById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');

  const item = await feedbackService.getById(req.params.id);
  if (!item) return sendError(res, 404, 'Feedback not found');

  const isAdmin = (req.user as any)?.role === 'ADMIN';
  if (!isAdmin && item.userId !== userId) return sendError(res, 403, 'Forbidden');

  return sendSuccess(res, item, 200, 'Feedback fetched');
});

/**
 * DELETE /api/feedback/:id
 * Delete a feedback item (must belong to the requesting user).
 */
export const deleteFeedback = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');

  const item = await feedbackService.getById(req.params.id);
  if (!item) return sendError(res, 404, 'Feedback not found');
  if (item.userId !== userId) return sendError(res, 403, 'Forbidden');

  await feedbackService.deleteFeedback(req.params.id);
  return sendSuccess(res, null, 200, 'Feedback deleted');
});

// ── Admin endpoints ────────────────────────────────────────────────────────────

/**
 * GET /api/feedback/admin/all
 * List all feedback with filters and pagination (admin only).
 */
export const listAllFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { category, status, priority, rating, search, page, limit } = req.query;

  const result = await feedbackService.listAll({
    category: category as string | undefined,
    status:   status   as string | undefined,
    priority: priority as string | undefined,
    rating:   rating   ? Number(rating)  : undefined,
    search:   search   as string | undefined,
    page:     page     ? Number(page)    : 1,
    limit:    limit    ? Number(limit)   : 20,
  });

  return sendSuccess(res, result, 200, 'All feedback fetched');
});

/**
 * PATCH /api/feedback/admin/:id/status
 * Update the status of a feedback item (admin only).
 */
export const updateFeedbackStatus = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return sendError(res, 400, firstError?.message ?? 'Validation failed');
  }

  const item = await feedbackService.getById(req.params.id);
  if (!item) return sendError(res, 404, 'Feedback not found');

  const updated = await feedbackService.updateStatus(req.params.id, parsed.data.status);
  return sendSuccess(res, updated, 200, 'Status updated');
});

/**
 * GET /api/feedback/admin/stats
 * Aggregate analytics: counts by status/category/priority, average rating (admin only).
 */
export const getFeedbackStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await feedbackService.getStats();
  return sendSuccess(res, stats, 200, 'Feedback statistics');
});

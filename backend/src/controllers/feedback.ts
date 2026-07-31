// src/controllers/feedback.ts

import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendSuccess, sendError } from '@/utils/response';
import { feedbackService } from '@/services/feedback';
import { createFeedbackSchema, updateFeedbackAdminSchema } from '@/validators/feedback';
import { sendFeedbackSubmissionAdminEmail, sendFeedbackSubmissionUserEmail } from '@/services/emailService';

// ── User endpoints ─────────────────────────────────────────────────────────────

/**
 * POST /api/feedback
 * Submit new feedback. Auth required.
 * Flow: validate → save to DB → fire admin email → fire user confirmation email
 *       → update DB with email status → return { feedback, emailSent }
 */
export const createFeedback = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');

  const parsed = createFeedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return sendError(res, 400, firstError?.message ?? 'Validation failed');
  }

  // ── 1. Save to database first — do NOT send email before this succeeds ──────
  let created: Awaited<ReturnType<typeof feedbackService.createFeedback>>;
  try {
    created = await feedbackService.createFeedback(userId, parsed.data);
    console.info(`[Feedback] ✓ Saved feedback ${created.id} for user ${userId}`);
  } catch (dbError) {
    console.error('[Feedback] ✗ Database save failed:', dbError);
    return sendError(res, 500, 'Unable to save feedback. Please try again.');
  }

  // ── 2. Fire admin notification and user confirmation email in parallel ───────
  const [adminResult, userResult] = await Promise.allSettled([
    sendFeedbackSubmissionAdminEmail(created, req.user),
    sendFeedbackSubmissionUserEmail(created, req.user),
  ]);

  // Unwrap results (both functions return { sent, error? })
  const adminEmailResult = adminResult.status === 'fulfilled'
    ? adminResult.value
    : { sent: false, error: adminResult.reason?.message ?? 'Unknown error' };

  const userEmailResult = userResult.status === 'fulfilled'
    ? userResult.value
    : { sent: false, error: userResult.reason?.message ?? 'Unknown error' };

  // Log outcomes
  if (!adminEmailResult.sent) {
    console.warn(`[Feedback] ✗ Admin notification failed for ${created.id}:`, adminEmailResult.error);
  }
  if (!userEmailResult.sent) {
    console.warn(`[Feedback] ✗ User confirmation failed for ${created.id}:`, userEmailResult.error);
  }

  // ── 3. Persist email status to DB (non-blocking — don't fail the request) ───
  if (userEmailResult.sent) {
    feedbackService
      .updateConfirmationEmailStatus(created.id, true)
      .catch((e: Error) =>
        console.error(`[Feedback] Failed to update confirmationEmailSent for ${created.id}:`, e.message),
      );
  }

  // ── 4. Return response including email send status ────────────────────────────
  const message = userEmailResult.sent
    ? 'Feedback submitted successfully. A confirmation email has been sent to your registered email address.'
    : 'Feedback submitted successfully. We could not send the confirmation email at this time, but your feedback has been received.';

  return sendSuccess(
    res,
    {
      ...created,
      emailSent:  userEmailResult.sent,
      emailError: userEmailResult.sent ? undefined : userEmailResult.error,
    },
    201,
    message,
  );
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

/**
 * POST /api/feedback/:id/read-reply
 * Mark an admin reply as read by the authenticated user.
 */
export const markReplyRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');

  const updated = await feedbackService.markReplyRead(req.params.id, userId);
  if (!updated) return sendError(res, 404, 'Feedback not found or access denied');

  return sendSuccess(res, updated, 200, 'Reply marked as read');
});

/**
 * GET /api/feedback/unread-count
 * Returns number of feedback items with an unread admin reply.
 */
export const getUnreadReplyCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');

  const count = await feedbackService.countUnreadReplies(userId);
  return sendSuccess(res, { count }, 200, 'Unread reply count');
});

export const deleteFeedbackAdmin = asyncHandler(async (req: Request, res: Response) => {
  const item = await feedbackService.getById(req.params.id);
  if (!item) return sendError(res, 404, 'Feedback not found');

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
  const parsed = updateFeedbackAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return sendError(res, 400, firstError?.message ?? 'Validation failed');
  }

  const item = await feedbackService.getById(req.params.id);
  if (!item) return sendError(res, 404, 'Feedback not found');

  const updated = await feedbackService.updateFeedback(req.params.id, {
    status: parsed.data.status,
    adminReply: parsed.data.adminReply,
    adminNotes: parsed.data.adminNotes,
  });

  // Fire in-app notification if a new reply was added
  if (parsed.data.adminReply && item.adminReply !== parsed.data.adminReply) {
    void import('@/services/notification').then(({ notificationService }) =>
      notificationService.notifyFeedbackReply(item.userId, item.title, item.id).catch(() => undefined)
    );
  }

  return sendSuccess(res, updated, 200, 'Feedback updated');
});

/**
 * GET /api/feedback/admin/stats
 * Aggregate analytics: counts by status/category/priority, average rating (admin only).
 */
export const getFeedbackStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await feedbackService.getStats();
  return sendSuccess(res, stats, 200, 'Feedback statistics');
});

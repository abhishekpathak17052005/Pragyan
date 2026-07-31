// src/routes/feedback.ts

import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { rateLimiter } from '@/middleware/rateLimiter';
import * as feedbackController from '@/controllers/feedback';

const router = Router();

// ── Authenticated user routes ──────────────────────────────────────────────────

// POST   /api/feedback          — submit new feedback
// GET    /api/feedback/me       — list my own feedback
// GET    /api/feedback/:id      — get one feedback item (own or admin)
// DELETE /api/feedback/:id      — delete own feedback

router.post('/', authenticate, rateLimiter, feedbackController.createFeedback);

router.get('/me',             authenticate, feedbackController.listUserFeedback);
router.get('/unread-count',   authenticate, feedbackController.getUnreadReplyCount);
router.get('/:id',            authenticate, feedbackController.getFeedbackById);
router.post('/:id/read-reply', authenticate, feedbackController.markReplyRead);
router.delete('/:id',         authenticate, feedbackController.deleteFeedback);

// Admin alias routes for /api/admin/feedback
router.get('/admin/feedback', authenticate, authorize('ADMIN'), feedbackController.listAllFeedback);
router.get('/admin/feedback/:id', authenticate, authorize('ADMIN'), feedbackController.getFeedbackById);
router.patch('/admin/feedback/:id', authenticate, authorize('ADMIN'), feedbackController.updateFeedbackStatus);
router.delete('/admin/feedback/:id', authenticate, authorize('ADMIN'), feedbackController.deleteFeedbackAdmin);

// ── Admin-only routes ──────────────────────────────────────────────────────────
// Mounted under /api/feedback/admin/...

router.get(
  '/admin/all',
  authenticate,
  authorize('ADMIN'),
  feedbackController.listAllFeedback,
);

router.get(
  '/admin/stats',
  authenticate,
  authorize('ADMIN'),
  feedbackController.getFeedbackStats,
);

router.patch(
  '/admin/:id/status',
  authenticate,
  authorize('ADMIN'),
  feedbackController.updateFeedbackStatus,
);

export default router;

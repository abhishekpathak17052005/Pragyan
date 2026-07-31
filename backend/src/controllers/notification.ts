// src/controllers/notification.ts

import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendSuccess, sendError } from '@/utils/response';
import { notificationService } from '@/services/notification';

/** GET /api/notifications — list notifications for the current user */
export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');
  const limit = req.query.limit ? Number(req.query.limit) : 30;
  const items = await notificationService.listForUser(userId, limit);
  return sendSuccess(res, items, 200, 'Notifications fetched');
});

/** GET /api/notifications/unread-count */
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');
  const count = await notificationService.countUnread(userId);
  return sendSuccess(res, { count }, 200, 'Unread count');
});

/** POST /api/notifications/:id/read */
export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');
  await notificationService.markRead(req.params.id, userId);
  return sendSuccess(res, null, 200, 'Marked as read');
});

/** POST /api/notifications/mark-all-read */
export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');
  await notificationService.markAllRead(userId);
  return sendSuccess(res, null, 200, 'All notifications marked as read');
});

/** DELETE /api/notifications/:id */
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');
  await notificationService.deleteNotification(req.params.id, userId);
  return sendSuccess(res, null, 200, 'Notification deleted');
});

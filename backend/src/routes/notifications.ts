// src/routes/notifications.ts

import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import * as notifController from '@/controllers/notification';

const router = Router();

router.get('/',                authenticate, notifController.listNotifications);
router.get('/unread-count',    authenticate, notifController.getUnreadCount);
router.post('/mark-all-read',  authenticate, notifController.markAllRead);
router.post('/:id/read',       authenticate, notifController.markRead);
router.delete('/:id',          authenticate, notifController.deleteNotification);

export default router;

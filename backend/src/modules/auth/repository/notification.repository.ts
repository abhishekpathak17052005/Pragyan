/**
 * Notification Repository
 * Handles notification delivery and tracking
 */

import { NotificationType, NotificationChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface CreateNotificationData {
  userId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  metadata?: Record<string, any>;
}

export class NotificationRepository {
  /**
   * Create notification
   */
  async create(data: CreateNotificationData) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        type: data.type,
        title: data.title,
        message: data.message,
        channels: data.channels,
        metadata: data.metadata,
      },
    });
  }

  /**
   * Find by user ID (with pagination)
   */
  async findByUserId(userId: string, skip: number = 0, take: number = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  }

  /**
   * Find unread notifications
   */
  async findUnread(userId: string) {
    return prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Mark as read
   */
  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all as read for user
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(notificationId: string, status: {
    sentViaEmail?: boolean;
    sentViaPush?: boolean;
    sentViaSMS?: boolean;
  }) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: status,
    });
  }

  /**
   * Delete notification
   */
  async delete(notificationId: string) {
    return prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Delete old notifications (cleanup)
   */
  async deleteOlderThan(days: number) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        read: true,
      },
    });
  }
}

export const notificationRepository = new NotificationRepository();

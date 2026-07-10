import { prisma } from '@/lib/prisma';
import { XP_RULES, type XpEventType } from '@/config/xp';

export interface XpAwardEvent {
  userId: string;
  eventType: XpEventType;
  resourceId?: string;
  topicId?: string;
  dayId?: string;
  weekId?: string;
  moduleId?: string;
  careerRoadmapId?: string;
}

export class XpService {
  /**
   * Award XP to a user for an event
   * This is called by progress service when milestones are achieved
   */
  async awardXp(event: XpAwardEvent): Promise<number> {
    const xpAmount = XP_RULES[event.eventType];

    // Award XP to user
    const updatedUser = await prisma.user.update({
      where: { id: event.userId },
      data: {
        xp: {
          increment: xpAmount,
        },
      },
      select: { id: true, xp: true },
    });

    console.log(
      `[XP] Awarded ${xpAmount} XP to user ${event.userId} for ${event.eventType} (new total: ${updatedUser.xp})`
    );

    return xpAmount;
  }

  /**
   * Get user's current XP
   */
  async getUserXp(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true },
    });
    return user?.xp ?? 0;
  }

  /**
   * Reset user's XP (for testing or admin purposes)
   */
  async resetUserXp(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { xp: 0 },
    });
  }
}

export const xpService = new XpService();

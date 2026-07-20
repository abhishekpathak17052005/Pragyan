/**
 * Invitation Repository
 * Handles invitation lifecycle for recruiters and placement officers
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateInvitationData {
  email: string;
  role: "RECRUITER" | "PLACEMENT_OFFICER";
  organizationId: string;
  invitedByUserId: string;
  token: string;
  expiresAt: Date;
}

export class InvitationRepository {
  /**
   * Create invitation
   */
  async create(data: CreateInvitationData) {
    return prisma.invitation.create({
      data: {
        email: data.email,
        role: data.role,
        organizationId: data.organizationId,
        invitedByUserId: data.invitedByUserId,
        token: data.token,
        expiresAt: data.expiresAt,
        status: "PENDING",
      },
    });
  }

  /**
   * Find by token
   */
  async findByToken(token: string) {
    return prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: true,
        invitedByUser: true,
      },
    });
  }

  /**
   * Find by email and organization
   */
  async findByEmailAndOrg(email: string, organizationId: string) {
    return prisma.invitation.findMany({
      where: {
        email,
        organizationId,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find pending invitations for email
   */
  async findPendingByEmail(email: string) {
    return prisma.invitation.findMany({
      where: {
        email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Accept invitation
   */
  async accept(invitationId: string, userId: string) {
    return prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedByUserId: userId,
      },
    });
  }

  /**
   * Reject invitation
   */
  async reject(invitationId: string) {
    return prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: "REJECTED",
      },
    });
  }

  /**
   * Check if invitation is valid (not expired, pending)
   */
  async isValid(token: string): Promise<boolean> {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) return false;
    if (invitation.status !== "PENDING") return false;
    if (invitation.expiresAt < new Date()) return false;

    return true;
  }

  /**
   * Clean up expired invitations
   */
  async deleteExpired() {
    return prisma.invitation.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        status: "PENDING",
      },
    });
  }
}

export const invitationRepository = new InvitationRepository();

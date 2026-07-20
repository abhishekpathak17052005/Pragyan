/**
 * Organization Repository
 * Handles organization data access
 */

import { PrismaClient, OrganizationType } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateOrganizationData {
  name: string;
  type: OrganizationType;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  logo?: string;
  description?: string;
}

export class OrganizationRepository {
  /**
   * Find organization by ID
   */
  async findById(id: string) {
    return prisma.organization.findUnique({
      where: { id },
    });
  }

  /**
   * Find organization by name
   */
  async findByName(name: string) {
    return prisma.organization.findUnique({
      where: { name },
    });
  }

  /**
   * Create organization
   */
  async create(data: CreateOrganizationData) {
    return prisma.organization.create({
      data,
    });
  }

  /**
   * Update organization
   */
  async update(id: string, data: Partial<CreateOrganizationData>) {
    return prisma.organization.update({
      where: { id },
      data,
    });
  }

  /**
   * Find all organizations by type
   */
  async findByType(type: OrganizationType, skip: number = 0, take: number = 50) {
    return prisma.organization.findMany({
      where: {
        type,
        isActive: true,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find verified organizations
   */
  async findVerified(skip: number = 0, take: number = 50) {
    return prisma.organization.findMany({
      where: {
        verified: true,
        isActive: true,
      },
      skip,
      take,
      orderBy: { name: "asc" },
    });
  }

  /**
   * Check if organization exists
   */
  async exists(id: string): Promise<boolean> {
    const org = await prisma.organization.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!org;
  }

  /**
   * Verify organization
   */
  async verify(id: string) {
    return prisma.organization.update({
      where: { id },
      data: { verified: true },
    });
  }

  /**
   * Deactivate organization
   */
  async deactivate(id: string) {
    return prisma.organization.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Activate organization
   */
  async activate(id: string) {
    return prisma.organization.update({
      where: { id },
      data: { isActive: true },
    });
  }
}

export const organizationRepository = new OrganizationRepository();

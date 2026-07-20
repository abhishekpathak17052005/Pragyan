import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, NotFoundError } from '@/utils/errors';
import { prisma } from '@/lib/prisma';
import type { JwtPayload } from '@/types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verify company ownership for recruiter
 * Checks if user is a recruiter for the given company
 */
export async function verifyCompanyOwnership(companyId: string, userId: string) {
  // Admin can access any company
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role === 'ADMIN') return true;

  // Check if user is a recruiter for this company
  const recruiter = await prisma.recruiter.findFirst({
    where: {
      userId,
      companyId,
    },
  });

  if (!recruiter) {
    throw new ForbiddenError('Not authorized to manage this company');
  }

  return true;
}

/**
 * Verify job ownership for company
 * Checks if job belongs to company
 */
export async function verifyJobOwnership(jobId: string, companyId: string) {
  const job = await prisma.recruiterJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError('Job not found');
  }

  if (job.companyId !== companyId) {
    throw new ForbiddenError('Not authorized to manage this job');
  }

  return job;
}

/**
 * Verify application ownership for company
 * Checks if application is for company's job
 */
export async function verifyApplicationOwnership(
  applicationId: string,
  companyId: string
) {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });

  if (!application) {
    throw new NotFoundError('Application not found');
  }

  // JobApplication has jobId field, not job.companyId
  const job = await prisma.recruiterJob.findUnique({
    where: { id: application.jobId },
  });

  if (!job || job.companyId !== companyId) {
    throw new ForbiddenError('Not authorized to manage this application');
  }

  return application;
}

/**
 * Verify hiring drive ownership for company
 */
export async function verifyHiringDriveOwnership(driveId: string, companyId: string) {
  const drive = await prisma.hiringDrive.findUnique({
    where: { id: driveId },
  });

  if (!drive) {
    throw new NotFoundError('Hiring drive not found');
  }

  if (drive.companyId !== companyId) {
    throw new ForbiddenError('Not authorized to manage this hiring drive');
  }

  return drive;
}

/**
 * Express middleware to verify company ownership from params
 */
export const requireCompanyOwnership = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { companyId } = req.params;
    if (!companyId) {
      throw new ForbiddenError('Company ID required');
    }

    await verifyCompanyOwnership(companyId, req.user.id);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware to verify job ownership
 */
export const requireJobOwnership = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { id: jobId } = req.params;
    const { companyId } = req.body || req.params;

    if (!jobId) {
      throw new ForbiddenError('Job ID required');
    }

    if (!companyId) {
      throw new ForbiddenError('Company ID required');
    }

    await verifyJobOwnership(jobId, companyId);
    next();
  } catch (error) {
    next(error);
  }
};

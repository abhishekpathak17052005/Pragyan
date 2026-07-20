import { prisma } from '@/lib/prisma';
import {
  CreateCompanyInput,
  UpdateCompanyInput,
  CreateRecruiterInput,
  UpdateRecruiterInput,
  CreateJobInput,
  UpdateJobInput,
  ApplyJobInput,
  CreateHiringDriveInput,
  UpdateHiringDriveInput,
} from '@/types/recruitment';
import { NotFoundError, ConflictError } from '@/utils/errors';

// ============ COMPANY SERVICE ============

export const companyService = {
  async createCompany(input: CreateCompanyInput) {
    return prisma.company.create({
      data: input,
    });
  },

  async getAllCompanies(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.company.count(),
    ]);

    return {
      data: companies,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getCompanyById(id: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        hiringDrives: true,
      },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    return company;
  },

  async updateCompany(id: string, input: UpdateCompanyInput) {
    await this.getCompanyById(id);

    return prisma.company.update({
      where: { id },
      data: input,
    });
  },

  async deleteCompany(id: string) {
    await this.getCompanyById(id);

    await prisma.company.delete({
      where: { id },
    });

    return { id };
  },
};

// ============ RECRUITER SERVICE ============

export const recruiterService = {
  async createRecruiter(input: CreateRecruiterInput) {
    // Verify company exists
    await companyService.getCompanyById(input.companyId);

    // Note: userId must be provided from auth context
    // This is a placeholder - actual implementation should link to user
    return prisma.recruiter.create({
      data: {
        ...input,
        userId: input.companyId, // Temporary - should be from auth context
      },
    });
  },

  async getRecruitersByCompany(companyId: string, page: number = 1, limit: number = 10) {
    await companyService.getCompanyById(companyId);

    const skip = (page - 1) * limit;

    const [recruiters, total] = await Promise.all([
      prisma.recruiter.findMany({
        where: { companyId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.recruiter.count({ where: { companyId } }),
    ]);

    return {
      data: recruiters,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getRecruiterById(id: string) {
    const recruiter = await prisma.recruiter.findUnique({
      where: { id },
    });

    if (!recruiter) {
      throw new NotFoundError('Recruiter not found');
    }

    return recruiter;
  },

  async updateRecruiter(id: string, input: UpdateRecruiterInput) {
    await this.getRecruiterById(id);

    return prisma.recruiter.update({
      where: { id },
      data: input,
    });
  },

  async deleteRecruiter(id: string) {
    await this.getRecruiterById(id);

    await prisma.recruiter.delete({
      where: { id },
    });

    return { id };
  },
};

// ============ JOB SERVICE ============

export const jobService = {
  async createJob(input: CreateJobInput) {
    // Verify company exists
    await companyService.getCompanyById(input.companyId);

    // Note: recruiterId should be from auth context
    return prisma.recruiterJob.create({
      data: {
        ...input,
        recruiterId: input.companyId, // Temporary - should be from auth context
      },
    });
  },

  async getAllJobs(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.recruiterJob.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.recruiterJob.count(),
    ]);

    return {
      data: jobs,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getJobsByCompany(companyId: string, page: number = 1, limit: number = 10) {
    await companyService.getCompanyById(companyId);

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.recruiterJob.findMany({
        where: { companyId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.recruiterJob.count({ where: { companyId } }),
    ]);

    return {
      data: jobs,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getJobById(id: string) {
    const job = await prisma.recruiterJob.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    return job;
  },

  async updateJob(id: string, input: UpdateJobInput) {
    await this.getJobById(id);

    return prisma.recruiterJob.update({
      where: { id },
      data: input,
    });
  },

  async publishJob(id: string, status: 'OPEN' | 'CLOSED') {
    await this.getJobById(id);

    return prisma.recruiterJob.update({
      where: { id },
      data: { status },
    });
  },

  async deleteJob(id: string) {
    await this.getJobById(id);

    await prisma.recruiterJob.delete({
      where: { id },
    });

    return { id };
  },

  async getOpenJobs(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.recruiterJob.findMany({
        where: { status: 'OPEN' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.recruiterJob.count({ where: { status: 'OPEN' } }),
    ]);

    return {
      data: jobs,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },
};

// ============ APPLICATION SERVICE ============

export const applicationService = {
  async applyJob(candidateId: string, input: ApplyJobInput) {
    // Verify job exists
    await jobService.getJobById(input.jobId);

    // Check if already applied
    const existing = await prisma.jobApplication.findFirst({
      where: {
        jobId: input.jobId,
        userId: candidateId,
      },
    });

    if (existing) {
      throw new ConflictError('You have already applied to this job');
    }

    return prisma.jobApplication.create({
      data: {
        jobId: input.jobId,
        userId: candidateId,
        status: 'APPLIED',
      },
    });
  },

  async withdrawApplication(candidateId: string, applicationId: string) {
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (application.userId !== candidateId) {
      throw new NotFoundError('Application not found');
    }

    await prisma.jobApplication.delete({
      where: { id: applicationId },
    });

    return { id: applicationId };
  },

  async getStudentApplications(studentId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where: { userId: studentId },
        skip,
        take: limit,
        orderBy: { appliedAt: 'desc' },
      }),
      prisma.jobApplication.count({ where: { userId: studentId } }),
    ]);

    return {
      data: applications,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getApplicationById(id: string) {
    const application = await prisma.jobApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    return application;
  },

  async getJobApplications(jobId: string, page: number = 1, limit: number = 10) {
    await jobService.getJobById(jobId);

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where: { jobId },
        skip,
        take: limit,
        orderBy: { appliedAt: 'desc' },
      }),
      prisma.jobApplication.count({ where: { jobId } }),
    ]);

    return {
      data: applications,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async updateApplicationStatus(applicationId: string, status: string) {
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    return prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status },
    });
  },
};

// ============ HIRING DRIVE SERVICE ============

export const hiringDriveService = {
  async createHiringDrive(input: CreateHiringDriveInput) {
    // Verify company exists
    await companyService.getCompanyById(input.companyId);

    return prisma.hiringDrive.create({
      data: input,
    });
  },

  async getHiringDrivesByCompany(companyId: string, page: number = 1, limit: number = 10) {
    await companyService.getCompanyById(companyId);

    const skip = (page - 1) * limit;

    const [drives, total] = await Promise.all([
      prisma.hiringDrive.findMany({
        where: { companyId },
        skip,
        take: limit,
        orderBy: { driveDate: 'asc' },
      }),
      prisma.hiringDrive.count({ where: { companyId } }),
    ]);

    return {
      data: drives,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getHiringDriveById(id: string) {
    const drive = await prisma.hiringDrive.findUnique({
      where: { id },
    });

    if (!drive) {
      throw new NotFoundError('Hiring drive not found');
    }

    return drive;
  },

  async updateHiringDrive(id: string, input: UpdateHiringDriveInput) {
    await this.getHiringDriveById(id);

    return prisma.hiringDrive.update({
      where: { id },
      data: input,
    });
  },

  async deleteHiringDrive(id: string) {
    await this.getHiringDriveById(id);

    await prisma.hiringDrive.delete({
      where: { id },
    });

    return { id };
  },

  async getUpcomingDrives(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const now = new Date();

    const [drives, total] = await Promise.all([
      prisma.hiringDrive.findMany({
        where: {
          driveDate: { gte: now },
        },
        skip,
        take: limit,
        orderBy: { driveDate: 'asc' },
      }),
      prisma.hiringDrive.count({
        where: {
          driveDate: { gte: now },
        },
      }),
    ]);

    return {
      data: drives,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },
};

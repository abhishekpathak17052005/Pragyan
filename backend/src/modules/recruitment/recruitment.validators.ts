import { z } from 'zod';
import { EmploymentType, WorkMode, ApplicationStatus } from '@prisma/client';

// ============ COMPANY VALIDATORS ============

export const CreateCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255),
  logo: z.string().url('Logo must be a valid URL').optional().nullable().transform(v => v ?? undefined),
  website: z.string().url('Website must be a valid URL').optional().nullable().transform(v => v ?? undefined),
  industry: z.string().max(100).optional().nullable().transform(v => v ?? undefined),
  size: z.string().max(50).optional().nullable().transform(v => v ?? undefined),
  description: z.string().max(2000).optional().nullable().transform(v => v ?? undefined),
  location: z.string().max(200).optional().nullable().transform(v => v ?? undefined),
  email: z.string().email('Invalid email address').optional().nullable().transform(v => v ?? undefined),
  phone: z.string().max(20).optional().nullable().transform(v => v ?? undefined),
});

export const UpdateCompanySchema = CreateCompanySchema.partial();

export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;

// ============ RECRUITER VALIDATORS ============

export const CreateRecruiterSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional().nullable().transform(v => v ?? undefined),
  designation: z.string().max(100).optional().nullable().transform(v => v ?? undefined),
});

export const UpdateRecruiterSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).optional().nullable().transform(v => v ?? undefined),
  designation: z.string().max(100).optional().nullable().transform(v => v ?? undefined),
});

export type CreateRecruiterInput = z.infer<typeof CreateRecruiterSchema>;
export type UpdateRecruiterInput = z.infer<typeof UpdateRecruiterSchema>;

// ============ JOB VALIDATORS ============

export const CreateJobSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  title: z.string().min(1, 'Job title is required').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  employmentType: z.nativeEnum(EmploymentType),
  experienceLevel: z.string().max(50).optional().nullable().transform(v => v ?? undefined),
  salaryMin: z.number().int().positive().optional().nullable().transform(v => v ?? undefined),
  salaryMax: z.number().int().positive().optional().nullable().transform(v => v ?? undefined),
  location: z.string().max(200).optional().nullable().transform(v => v ?? undefined),
  mode: z.nativeEnum(WorkMode).optional().nullable().transform(v => v ?? undefined),
  skillsRequired: z.array(z.string()).default([]),
  minimumCGPA: z.number().min(0).max(10).optional().nullable().transform(v => v ?? undefined),
  applicationDeadline: z.date().optional().nullable().transform(v => v ?? undefined),
});

export const UpdateJobSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(10).optional(),
  experienceLevel: z.string().max(50).optional().nullable().transform(v => v ?? undefined),
  salaryMin: z.number().int().positive().optional().nullable().transform(v => v ?? undefined),
  salaryMax: z.number().int().positive().optional().nullable().transform(v => v ?? undefined),
  location: z.string().max(200).optional().nullable().transform(v => v ?? undefined),
  mode: z.nativeEnum(WorkMode).optional().nullable().transform(v => v ?? undefined),
  skillsRequired: z.array(z.string()).optional(),
  minimumCGPA: z.number().min(0).max(10).optional().nullable().transform(v => v ?? undefined),
  applicationDeadline: z.date().optional().nullable().transform(v => v ?? undefined),
});

export const PublishJobSchema = z.object({
  status: z.enum(['OPEN', 'CLOSED']),
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
export type PublishJobInput = z.infer<typeof PublishJobSchema>;

// ============ JOB APPLICATION VALIDATORS ============

export const ApplyJobSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  resumeUrl: z.string().url('Resume URL must be valid').optional().nullable().transform(v => v ?? undefined),
  coverLetter: z.string().max(2000).optional().nullable().transform(v => v ?? undefined),
});

export const UpdateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
});

export type ApplyJobInput = z.infer<typeof ApplyJobSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof UpdateApplicationStatusSchema>;

// ============ HIRING DRIVE VALIDATORS ============

export const CreateHiringDriveSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional().nullable().transform(v => v ?? undefined),
  collegeId: z.string().optional().nullable().transform(v => v ?? undefined),
  driveDate: z.date(),
  venue: z.string().max(255).optional().nullable().transform(v => v ?? undefined),
  mode: z.nativeEnum(WorkMode).optional().nullable().transform(v => v ?? undefined),
  registrationDeadline: z.date().optional().nullable().transform(v => v ?? undefined),
});

export const UpdateHiringDriveSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable().transform(v => v ?? undefined),
  driveDate: z.date().optional(),
  venue: z.string().max(255).optional().nullable().transform(v => v ?? undefined),
  mode: z.nativeEnum(WorkMode).optional().nullable().transform(v => v ?? undefined),
  registrationDeadline: z.date().optional().nullable().transform(v => v ?? undefined),
});

export type CreateHiringDriveInput = z.infer<typeof CreateHiringDriveSchema>;
export type UpdateHiringDriveInput = z.infer<typeof UpdateHiringDriveSchema>;

// ============ QUERY VALIDATORS ============

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().lte(100).default(10),
  search: z.string().optional(),
  sort: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof PaginationSchema>;

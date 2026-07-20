import { EmploymentType, WorkMode, ApplicationStatus, JobStatus } from '@prisma/client';

// ============ COMPANY TYPES ============

export interface ICompany {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: string;
  description?: string;
  location?: string;
  email?: string;
  phone?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCompanyInput = Omit<ICompany, 'id' | 'verified' | 'createdAt' | 'updatedAt'>;
export type UpdateCompanyInput = Partial<CreateCompanyInput>;

// ============ RECRUITER TYPES ============

export interface IRecruiter {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateRecruiterInput = Omit<IRecruiter, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRecruiterInput = Partial<Omit<CreateRecruiterInput, 'companyId'>>;

// ============ JOB TYPES ============

export interface IRecruitmentJob {
  id: string;
  companyId: string;
  title: string;
  slug: string;
  description: string;
  employmentType: EmploymentType;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  location?: string;
  mode?: WorkMode;
  skillsRequired: string[];
  minimumCGPA?: number;
  status: JobStatus;
  applicationDeadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateJobInput = Omit<IRecruitmentJob, 'id' | 'slug' | 'status' | 'createdAt' | 'updatedAt'>;
export type UpdateJobInput = Partial<Omit<CreateJobInput, 'companyId'>>;

export interface PublishJobInput {
  status: 'OPEN' | 'CLOSED';
}

// ============ JOB APPLICATION TYPES ============

export interface IJobApplication {
  id: string;
  jobId: string;
  studentId: string;
  status: ApplicationStatus;
  resumeUrl?: string;
  coverLetter?: string;
  appliedAt: Date;
  updatedAt: Date;
  createdAt: Date;
}

export type ApplyJobInput = {
  jobId: string;
  resumeUrl?: string;
  coverLetter?: string;
};

export interface IJobApplicationResponse extends IJobApplication {
  job?: IRecruitmentJob;
  student?: {
    id: string;
    fullName: string;
    email: string;
    cgpa?: string;
    skills: string[];
  };
}

// ============ HIRING DRIVE TYPES ============

export interface IHiringDrive {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  collegeId?: string;
  driveDate: Date;
  venue?: string;
  mode?: WorkMode;
  registrationDeadline?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateHiringDriveInput = Omit<IHiringDrive, 'id' | 'status' | 'createdAt' | 'updatedAt'>;
export type UpdateHiringDriveInput = Partial<Omit<CreateHiringDriveInput, 'companyId'>>;

// ============ RESPONSE TYPES ============

export interface CompanyWithRelations extends ICompany {
  recruiters?: IRecruiter[];
  jobs?: IRecruitmentJob[];
  hiringDrives?: IHiringDrive[];
}

export interface JobWithApplications extends IRecruitmentJob {
  applications?: IJobApplication[];
  _count?: {
    applications: number;
  };
}

// ============ PAGINATION ============

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

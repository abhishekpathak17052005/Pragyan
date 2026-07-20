// ============ ENUMS ============

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  INTERNSHIP = 'INTERNSHIP',
  CONTRACT = 'CONTRACT',
}

export enum WorkMode {
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
  ONSITE = 'ONSITE',
}

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  SHORTLISTED = 'SHORTLISTED',
  ASSESSMENT = 'ASSESSMENT',
  INTERVIEW = 'INTERVIEW',
  HR = 'HR',
  OFFERED = 'OFFERED',
  REJECTED = 'REJECTED',
  JOINED = 'JOINED',
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

// ============ COMPANY ============

export interface Company {
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyInput {
  name: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: string;
  description?: string;
  location?: string;
  email?: string;
  phone?: string;
}

export interface UpdateCompanyInput extends Partial<CreateCompanyInput> {}

// ============ RECRUITER ============

export interface Recruiter {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecruiterInput {
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
}

export interface UpdateRecruiterInput {
  name?: string;
  phone?: string;
  designation?: string;
}

// ============ JOB ============

export interface RecruitmentJob {
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
  applicationDeadline?: string;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  _count?: {
    applications: number;
  };
}

export interface CreateJobInput {
  companyId: string;
  title: string;
  description: string;
  employmentType: EmploymentType;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  location?: string;
  mode?: WorkMode;
  skillsRequired?: string[];
  minimumCGPA?: number;
  applicationDeadline?: string;
}

export interface UpdateJobInput extends Partial<Omit<CreateJobInput, 'companyId'>> {}

export interface PublishJobInput {
  status: 'OPEN' | 'CLOSED';
}

// ============ JOB APPLICATION ============

export interface JobApplication {
  id: string;
  jobId: string;
  studentId: string;
  status: ApplicationStatus;
  resumeUrl?: string;
  coverLetter?: string;
  appliedAt: string;
  updatedAt: string;
  createdAt: string;
  job?: RecruitmentJob;
  student?: {
    id: string;
    fullName: string;
    email: string;
    cgpa?: string;
    skills: string[];
  };
}

export interface ApplyJobInput {
  jobId: string;
  resumeUrl?: string;
  coverLetter?: string;
}

export interface UpdateApplicationStatusInput {
  status: ApplicationStatus;
}

// ============ HIRING DRIVE ============

export interface HiringDrive {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  collegeId?: string;
  driveDate: string;
  venue?: string;
  mode?: WorkMode;
  registrationDeadline?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  company?: Company;
}

export interface CreateHiringDriveInput {
  companyId: string;
  title: string;
  description?: string;
  collegeId?: string;
  driveDate: string;
  venue?: string;
  mode?: WorkMode;
  registrationDeadline?: string;
}

export interface UpdateHiringDriveInput extends Partial<Omit<CreateHiringDriveInput, 'companyId'>> {}

// ============ PAGINATION ============

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============ API RESPONSE ============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

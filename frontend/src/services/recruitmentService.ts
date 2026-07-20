import { api } from './apiClient';
import type {
  Company,
  CreateCompanyInput,
  UpdateCompanyInput,
  Recruiter,
  CreateRecruiterInput,
  UpdateRecruiterInput,
  RecruitmentJob,
  CreateJobInput,
  UpdateJobInput,
  PublishJobInput,
  JobApplication,
  ApplyJobInput,
  UpdateApplicationStatusInput,
  HiringDrive,
  CreateHiringDriveInput,
  UpdateHiringDriveInput,
  PaginatedResponse,
  ApiResponse,
} from '@/types/recruitment';

export const recruitmentService = {
  // ============ COMPANY ENDPOINTS ============

  companies: {
    create(input: CreateCompanyInput) {
      return api.post<Company>('/recruitment/companies', input);
    },

    getAll(page: number = 1, limit: number = 10) {
      return api.get<PaginatedResponse<Company>>(
        `/recruitment/companies?page=${page}&limit=${limit}`
      );
    },

    getById(id: string) {
      return api.get<Company>(`/recruitment/companies/${id}`);
    },

    update(id: string, input: UpdateCompanyInput) {
      return api.put<Company>(`/recruitment/companies/${id}`, input);
    },

    delete(id: string) {
      return api.delete<{ id: string }>(`/recruitment/companies/${id}`);
    },

    verify(id: string) {
      return api.patch<Company>(`/recruitment/companies/${id}/verify`, {});
    },

    getDashboard(companyId: string) {
      return api.get(`/recruitment/companies/${companyId}/dashboard`);
    },

    getAnalytics(companyId: string) {
      return api.get(`/recruitment/companies/${companyId}/analytics`);
    },
  },

  // ============ RECRUITER ENDPOINTS ============

  recruiters: {
    create(input: CreateRecruiterInput) {
      return api.post<Recruiter>('/recruitment/recruiters', input);
    },

    getByCompany(companyId: string, page: number = 1, limit: number = 10) {
      return api.get<PaginatedResponse<Recruiter>>(
        `/recruitment/companies/${companyId}/recruiters?page=${page}&limit=${limit}`
      );
    },

    getById(id: string) {
      return api.get<Recruiter>(`/recruitment/recruiters/${id}`);
    },

    update(id: string, input: UpdateRecruiterInput) {
      return api.put<Recruiter>(`/recruitment/recruiters/${id}`, input);
    },

    delete(id: string) {
      return api.delete<{ id: string }>(`/recruitment/recruiters/${id}`);
    },
  },

  // ============ JOB ENDPOINTS ============

  jobs: {
    create(input: CreateJobInput) {
      return api.post<RecruitmentJob>('/recruitment/jobs', input);
    },

    getAll(page: number = 1, limit: number = 10) {
      return api.get<PaginatedResponse<RecruitmentJob>>(
        `/recruitment/jobs?page=${page}&limit=${limit}`
      );
    },

    getOpen(page: number = 1, limit: number = 10) {
      return api.get<PaginatedResponse<RecruitmentJob>>(
        `/recruitment/jobs/open?page=${page}&limit=${limit}`
      );
    },

    getByCompany(companyId: string, page: number = 1, limit: number = 10) {
      return api.get<PaginatedResponse<RecruitmentJob>>(
        `/recruitment/companies/${companyId}/jobs?page=${page}&limit=${limit}`
      );
    },

    getById(id: string) {
      return api.get<RecruitmentJob>(`/recruitment/jobs/${id}`);
    },

    update(id: string, input: UpdateJobInput) {
      return api.put<RecruitmentJob>(`/recruitment/jobs/${id}`, input);
    },

    publish(id: string, input: PublishJobInput) {
      return api.patch<RecruitmentJob>(`/recruitment/jobs/${id}/publish`, input);
    },

    delete(id: string) {
      return api.delete<{ id: string }>(`/recruitment/jobs/${id}`);
    },
  },

  // ============ APPLICATION ENDPOINTS ============

  applications: {
    apply(input: ApplyJobInput) {
      return api.post<JobApplication>('/recruitment/jobs/apply', input);
    },

    getStudentApplications(page: number = 1, limit: number = 10) {
      return api.get<PaginatedResponse<JobApplication>>(
        `/recruitment/applications?page=${page}&limit=${limit}`
      );
    },

    getCompanyApplications(companyId: string, page: number = 1, limit: number = 10) {
      return api.get<PaginatedResponse<JobApplication>>(
        `/recruitment/companies/${companyId}/applications?page=${page}&limit=${limit}`
      );
    },

    getJobApplications(jobId: string, page: number = 1, limit: number = 10) {
      return api.get<PaginatedResponse<JobApplication>>(
        `/recruitment/jobs/${jobId}/applications?page=${page}&limit=${limit}`
      );
    },

    withdraw(id: string) {
      return api.delete<{ id: string }>(`/recruitment/applications/${id}`);
    },

    updateStatus(id: string, input: UpdateApplicationStatusInput) {
      return api.patch<JobApplication>(`/recruitment/applications/${id}/status`, input);
    },
  },

  // ============ HIRING DRIVE ENDPOINTS ============

  hiringDrives: {
    create(input: CreateHiringDriveInput) {
      return api.post<HiringDrive>('/recruitment/hiring-drives', input);
    },

    getUpcoming(page: number = 1, limit: number = 10) {
      return api.get<PaginatedResponse<HiringDrive>>(
        `/recruitment/hiring-drives/upcoming?page=${page}&limit=${limit}`
      );
    },

    getByCompany(companyId: string, page: number = 1, limit: number = 10) {
      return api.get<PaginatedResponse<HiringDrive>>(
        `/recruitment/companies/${companyId}/hiring-drives?page=${page}&limit=${limit}`
      );
    },

    getById(id: string) {
      return api.get<HiringDrive>(`/recruitment/hiring-drives/${id}`);
    },

    update(id: string, input: UpdateHiringDriveInput) {
      return api.put<HiringDrive>(`/recruitment/hiring-drives/${id}`, input);
    },

    delete(id: string) {
      return api.delete<{ id: string }>(`/recruitment/hiring-drives/${id}`);
    },
  },
};

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recruitmentService } from '@/services/recruitmentService';
import type {
  Company,
  Recruiter,
  RecruitmentJob,
  JobApplication,
  HiringDrive,
  CreateCompanyInput,
  UpdateCompanyInput,
  CreateRecruiterInput,
  UpdateRecruiterInput,
  CreateJobInput,
  UpdateJobInput,
  PublishJobInput,
  ApplyJobInput,
  UpdateApplicationStatusInput,
  CreateHiringDriveInput,
  UpdateHiringDriveInput,
} from '@/types/recruitment';

// ============ COMPANY HOOKS ============

export function useCompanies(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['companies', page, limit],
    queryFn: () => recruitmentService.companies.getAll(page, limit),
  });
}

export function useCompanyById(id: string) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => recruitmentService.companies.getById(id),
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCompanyInput) => recruitmentService.companies.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useUpdateCompany(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCompanyInput) => recruitmentService.companies.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['company', id] });
      void queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recruitmentService.companies.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useVerifyCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recruitmentService.companies.verify(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

// ============ JOB HOOKS ============

export function useJobs(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['jobs', page, limit],
    queryFn: () => recruitmentService.jobs.getAll(page, limit),
  });
}

export function useOpenJobs(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['jobs-open', page, limit],
    queryFn: () => recruitmentService.jobs.getOpen(page, limit),
  });
}

export function useJobsByCompany(companyId: string, page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['company-jobs', companyId, page, limit],
    queryFn: () => recruitmentService.jobs.getByCompany(companyId, page, limit),
    enabled: !!companyId,
  });
}

export function useJobById(id: string) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => recruitmentService.jobs.getById(id),
    enabled: !!id,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateJobInput) => recruitmentService.jobs.create(input),
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['company-jobs', input.companyId] });
    },
  });
}

export function useUpdateJob(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateJobInput) => recruitmentService.jobs.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['job', id] });
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['company-jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['company-dashboard'] });
    },
  });
}

export function usePublishJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PublishJobInput }) =>
      recruitmentService.jobs.publish(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['jobs-open'] });
      void queryClient.invalidateQueries({ queryKey: ['company-jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['company-dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['company-analytics'] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recruitmentService.jobs.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['company-jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['company-dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['company-analytics'] });
    },
  });
}

// ============ APPLICATION HOOKS ============

export function useApplyJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ApplyJobInput) => recruitmentService.applications.apply(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
}

export function useStudentApplications(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['my-applications', page, limit],
    queryFn: () => recruitmentService.applications.getStudentApplications(page, limit),
  });
}

export function useJobApplications(jobId: string, page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['job-applications', jobId, page, limit],
    queryFn: () => recruitmentService.applications.getJobApplications(jobId, page, limit),
    enabled: !!jobId,
  });
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recruitmentService.applications.withdraw(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UpdateApplicationStatusInput }) =>
      recruitmentService.applications.updateStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      void queryClient.invalidateQueries({ queryKey: ['company-applications'] });
      void queryClient.invalidateQueries({ queryKey: ['company-dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['company-analytics'] });
    },
  });
}

// ============ HIRING DRIVE HOOKS ============

export function useUpcomingHiringDrives(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['hiring-drives-upcoming', page, limit],
    queryFn: () => recruitmentService.hiringDrives.getUpcoming(page, limit),
  });
}

export function useHiringDrivesByCompany(companyId: string, page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['company-hiring-drives', companyId, page, limit],
    queryFn: () => recruitmentService.hiringDrives.getByCompany(companyId, page, limit),
    enabled: !!companyId,
  });
}

export function useHiringDriveById(id: string) {
  return useQuery({
    queryKey: ['hiring-drive', id],
    queryFn: () => recruitmentService.hiringDrives.getById(id),
    enabled: !!id,
  });
}

export function useCreateHiringDrive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHiringDriveInput) => recruitmentService.hiringDrives.create(input),
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({ queryKey: ['hiring-drives-upcoming'] });
      void queryClient.invalidateQueries({ queryKey: ['company-hiring-drives', input.companyId] });
      void queryClient.invalidateQueries({ queryKey: ['company-dashboard', input.companyId] });
    },
  });
}

export function useUpdateHiringDrive(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateHiringDriveInput) =>
      recruitmentService.hiringDrives.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hiring-drive', id] });
      void queryClient.invalidateQueries({ queryKey: ['hiring-drives-upcoming'] });
      void queryClient.invalidateQueries({ queryKey: ['company-hiring-drives'] });
      void queryClient.invalidateQueries({ queryKey: ['company-dashboard'] });
    },
  });
}

export function useDeleteHiringDrive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recruitmentService.hiringDrives.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hiring-drives-upcoming'] });
      void queryClient.invalidateQueries({ queryKey: ['company-hiring-drives'] });
      void queryClient.invalidateQueries({ queryKey: ['company-dashboard'] });
    },
  });
}

// ============ DASHBOARD HOOKS ============

export function useCompanyDashboard(companyId: string) {
  return useQuery({
    queryKey: ['company-dashboard', companyId],
    queryFn: () => recruitmentService.companies.getDashboard(companyId),
    enabled: !!companyId,
  });
}

// ============ COMPANY APPLICATIONS HOOKS ============

export function useCompanyApplications(companyId: string, page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['company-applications', companyId, page, limit],
    queryFn: () => recruitmentService.applications.getCompanyApplications(companyId, page, limit),
    enabled: !!companyId,
  });
}

// ============ ANALYTICS HOOKS ============

export function useCompanyAnalytics(companyId: string) {
  return useQuery({
    queryKey: ['company-analytics', companyId],
    queryFn: () => recruitmentService.companies.getAnalytics(companyId),
    enabled: !!companyId,
  });
}

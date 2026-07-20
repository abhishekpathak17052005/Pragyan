import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendSuccess, sendPaginated, sendError } from '@/utils/response';
import {
  companyService,
  recruiterService,
  jobService,
  applicationService,
  hiringDriveService,
} from './recruitment.service';
import {
  verifyCompanyOwnership,
  verifyJobOwnership,
} from './recruitment.authorization';
import {
  CreateCompanySchema,
  UpdateCompanySchema,
  CreateRecruiterSchema,
  UpdateRecruiterSchema,
  CreateJobSchema,
  UpdateJobSchema,
  PublishJobSchema,
  ApplyJobSchema,
  UpdateApplicationStatusSchema,
  CreateHiringDriveSchema,
  UpdateHiringDriveSchema,
  PaginationSchema,
} from './recruitment.validators';

// ============ COMPANY CONTROLLERS ============

export const createCompany = asyncHandler(async (req: Request, res: Response) => {
  const parsed = CreateCompanySchema.parse(req.body);
  const company = await companyService.createCompany(parsed);
  return sendSuccess(res, company, 201, 'Company created successfully');
});

export const getAllCompanies = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = PaginationSchema.parse(req.query);
  const result = await companyService.getAllCompanies(page as number, limit as number);
  return sendPaginated(res, result.data, page as number, limit as number, result.meta.total);
});

export const getCompanyById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const company = await companyService.getCompanyById(id);
  return sendSuccess(res, company, 200, 'Company fetched successfully');
});

export const updateCompany = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  // Verify ownership (admin or company recruiter)
  if (req.user.role !== 'ADMIN') {
    await verifyCompanyOwnership(id, req.user.id);
  }

  const parsed = UpdateCompanySchema.parse(req.body);
  const company = await companyService.updateCompany(id, parsed);
  return sendSuccess(res, company, 200, 'Company updated successfully');
});

export const deleteCompany = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  // Verify ownership (admin only)
  if (req.user.role !== 'ADMIN') {
    return sendError(res, 403, 'Only admins can delete companies');
  }

  await companyService.deleteCompany(id);
  return sendSuccess(res, { id }, 200, 'Company deleted successfully');
});

// ============ RECRUITER CONTROLLERS ============

export const createRecruiter = asyncHandler(async (req: Request, res: Response) => {
  const parsed = CreateRecruiterSchema.parse(req.body);
  const recruiter = await recruiterService.createRecruiter(parsed);
  return sendSuccess(res, recruiter, 201, 'Recruiter created successfully');
});

export const getRecruitersByCompany = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const { page = 1, limit = 10 } = PaginationSchema.parse(req.query);
  const result = await recruiterService.getRecruitersByCompany(companyId, page as number, limit as number);
  return sendPaginated(res, result.data, page as number, limit as number, result.meta.total);
});

export const getRecruiterById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const recruiter = await recruiterService.getRecruiterById(id);
  return sendSuccess(res, recruiter, 200, 'Recruiter fetched successfully');
});

export const updateRecruiter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = UpdateRecruiterSchema.parse(req.body);
  const recruiter = await recruiterService.updateRecruiter(id, parsed);
  return sendSuccess(res, recruiter, 200, 'Recruiter updated successfully');
});

export const deleteRecruiter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await recruiterService.deleteRecruiter(id);
  return sendSuccess(res, { id }, 200, 'Recruiter deleted successfully');
});

// ============ JOB CONTROLLERS ============

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const parsed = CreateJobSchema.parse(req.body);
  const job = await jobService.createJob(parsed);
  return sendSuccess(res, job, 201, 'Job created successfully');
});

export const getAllJobs = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = PaginationSchema.parse(req.query);
  const result = await jobService.getAllJobs(page as number, limit as number);
  return sendPaginated(res, result.data, page as number, limit as number, result.meta.total);
});

export const getJobsByCompany = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = req.params;
  
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  // Company can only view their own jobs
  if (req.user.role !== 'ADMIN' && req.user.role !== 'RECRUITER') {
    return sendError(res, 403, 'Only admins and recruiters can view company jobs');
  }

  if (req.user.role === 'RECRUITER') {
    await verifyCompanyOwnership(companyId, req.user.id);
  }

  const { page = 1, limit = 10 } = PaginationSchema.parse(req.query);
  const result = await jobService.getJobsByCompany(companyId, page as number, limit as number);
  return sendPaginated(res, result.data, page as number, limit as number, result.meta.total);
});

export const getJobById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const job = await jobService.getJobById(id);
  return sendSuccess(res, job, 200, 'Job fetched successfully');
});

export const updateJob = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  // Get job to verify company ownership
  const job = await jobService.getJobById(id);
  
  if (req.user.role !== 'ADMIN' && job.companyId) {
    await verifyCompanyOwnership(job.companyId, req.user.id);
  }

  const parsed = UpdateJobSchema.parse(req.body);
  const updated = await jobService.updateJob(id, parsed);
  return sendSuccess(res, updated, 200, 'Job updated successfully');
});

export const publishJob = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  // Get job to verify company ownership
  const job = await jobService.getJobById(id);
  
  if (req.user.role !== 'ADMIN' && job.companyId) {
    await verifyCompanyOwnership(job.companyId, req.user.id);
  }

  const { status } = PublishJobSchema.parse(req.body);
  const updated = await jobService.publishJob(id, status);
  return sendSuccess(res, updated, 200, 'Job published successfully');
});

export const deleteJob = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  // Get job to verify company ownership
  const job = await jobService.getJobById(id);
  
  if (req.user.role !== 'ADMIN' && job.companyId) {
    await verifyCompanyOwnership(job.companyId, req.user.id);
  }

  await jobService.deleteJob(id);
  return sendSuccess(res, { id }, 200, 'Job deleted successfully');
});

export const getOpenJobs = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = PaginationSchema.parse(req.query);
  const result = await jobService.getOpenJobs(page as number, limit as number);
  return sendPaginated(res, result.data, page as number, limit as number, result.meta.total);
});

// ============ APPLICATION CONTROLLERS ============

export const applyJob = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const parsed = ApplyJobSchema.parse(req.body);
  const application = await applicationService.applyJob(req.user.id, parsed);
  return sendSuccess(res, application, 201, 'Job application submitted successfully');
});

export const withdrawApplication = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { id } = req.params;
  await applicationService.withdrawApplication(req.user.id, id);
  return sendSuccess(res, { id }, 200, 'Application withdrawn successfully');
});

export const getStudentApplications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { page = 1, limit = 10 } = PaginationSchema.parse(req.query);
  const result = await applicationService.getStudentApplications(req.user.id, page as number, limit as number);
  return sendPaginated(res, result.data, page as number, limit as number, result.meta.total);
});

export const getJobApplications = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  // Get job and verify company ownership
  const job = await jobService.getJobById(jobId);
  
  if (req.user.role !== 'ADMIN' && job.companyId) {
    await verifyCompanyOwnership(job.companyId, req.user.id);
  }

  const { page = 1, limit = 10 } = PaginationSchema.parse(req.query);
  const result = await applicationService.getJobApplications(jobId, page as number, limit as number);
  return sendPaginated(res, result.data, page as number, limit as number, result.meta.total);
});

export const updateApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  // Get application and verify company ownership
  const app = await applicationService.getApplicationById(id);
  
  if (req.user.role !== 'ADMIN') {
    // Note: app.jobId is used to verify job ownership
    await verifyJobOwnership(app.jobId, app.jobId);
  }

  const { status } = UpdateApplicationStatusSchema.parse(req.body);
  const application = await applicationService.updateApplicationStatus(id, status);
  return sendSuccess(res, application, 200, 'Application status updated successfully');
});

// ============ HIRING DRIVE CONTROLLERS ============

export const createHiringDrive = asyncHandler(async (req: Request, res: Response) => {
  const parsed = CreateHiringDriveSchema.parse(req.body);
  const drive = await hiringDriveService.createHiringDrive(parsed);
  return sendSuccess(res, drive, 201, 'Hiring drive created successfully');
});

export const getHiringDrivesByCompany = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = req.params;
  
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  // Company can only view their own drives
  if (req.user.role !== 'ADMIN') {
    await verifyCompanyOwnership(companyId, req.user.id);
  }

  const { page = 1, limit = 10 } = PaginationSchema.parse(req.query);
  const result = await hiringDriveService.getHiringDrivesByCompany(companyId, page as number, limit as number);
  return sendPaginated(res, result.data, page as number, limit as number, result.meta.total);
});

export const getHiringDriveById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const drive = await hiringDriveService.getHiringDriveById(id);
  return sendSuccess(res, drive, 200, 'Hiring drive fetched successfully');
});

export const updateHiringDrive = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  // Get drive and verify company ownership
  const drive = await hiringDriveService.getHiringDriveById(id);
  
  if (req.user.role !== 'ADMIN') {
    await verifyCompanyOwnership(drive.companyId, req.user.id);
  }

  const parsed = UpdateHiringDriveSchema.parse(req.body);
  const updated = await hiringDriveService.updateHiringDrive(id, parsed);
  return sendSuccess(res, updated, 200, 'Hiring drive updated successfully');
});

export const deleteHiringDrive = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  // Get drive and verify company ownership
  const drive = await hiringDriveService.getHiringDriveById(id);
  
  if (req.user.role !== 'ADMIN') {
    await verifyCompanyOwnership(drive.companyId, req.user.id);
  }

  await hiringDriveService.deleteHiringDrive(id);
  return sendSuccess(res, { id }, 200, 'Hiring drive deleted successfully');
});

export const getUpcomingDrives = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = PaginationSchema.parse(req.query);
  const result = await hiringDriveService.getUpcomingDrives(page as number, limit as number);
  return sendPaginated(res, result.data, page as number, limit as number, result.meta.total);
});

// ============ COMPANY DASHBOARD ============

export const getMyCompany = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const recruiter = await prisma.recruiter.findFirst({
    where: { userId: req.user.id },
  });

  if (!recruiter?.companyId) {
    return sendError(res, 404, 'No company found for this recruiter');
  }

  const company = await prisma.company.findUnique({
    where: { id: recruiter.companyId },
  });

  return sendSuccess(res, { ...company, recruiterId: recruiter.id }, 200, 'Company fetched');
});

export const getCompanyDashboard = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  // Find the recruiter record for this user to get their companyId
  const recruiter = await prisma.recruiter.findFirst({
    where: { userId: req.user.id },
  });

  if (!recruiter?.companyId) {
    return sendError(res, 404, 'No company found for this recruiter');
  }

  const companyId = recruiter.companyId;

  // Get all jobs for this company
  const allJobs = await prisma.recruiterJob.findMany({
    where: { companyId },
    select: { id: true, status: true, createdAt: true },
  });

  const activeJobs = allJobs.filter((j) => j.status === 'OPEN').length;

  // Get all applications for this company's jobs
  const jobIds = allJobs.map((j) => j.id);

  const allApplications = await prisma.jobApplication.findMany({
    where: { jobId: { in: jobIds } },
    select: { id: true, status: true, appliedAt: true, jobId: true },
    orderBy: { appliedAt: 'desc' },
  });

  const totalApplications = allApplications.length;

  // Count by status
  const statusCounts: Record<string, number> = {};
  for (const app of allApplications) {
    statusCounts[app.status] = (statusCounts[app.status] ?? 0) + 1;
  }

  // Interviews scheduled
  const interviews = await prisma.interviewSchedule.count({
    where: {
      recruiterId: recruiter.id,
      status: 'SCHEDULED',
    },
  });

  const hired = statusCounts['SELECTED'] ?? 0;

  // Application status breakdown for pie chart
  const applicationStats = [
    { name: 'Applied',    value: statusCounts['APPLIED']     ?? 0, color: '#3b82f6' },
    { name: 'Shortlisted',value: statusCounts['SHORTLISTED'] ?? 0, color: '#f59e0b' },
    { name: 'Interviewed',value: statusCounts['INTERVIEWED'] ?? 0, color: '#10b981' },
    { name: 'Rejected',   value: statusCounts['REJECTED']    ?? 0, color: '#ef4444' },
    { name: 'Selected',   value: statusCounts['SELECTED']    ?? 0, color: '#8b5cf6' },
  ].filter((s) => s.value > 0);

  // Monthly jobs posted — last 6 months
  const now = new Date();
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const buckets: Record<string, { posted: number; filled: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets[key] = { posted: 0, filled: 0 };
  }

  for (const job of allJobs) {
    const key = `${job.createdAt.getFullYear()}-${String(job.createdAt.getMonth() + 1).padStart(2, '0')}`;
    if (key in buckets) {
      buckets[key].posted++;
      if (job.status === 'FILLED') buckets[key].filled++;
    }
  }

  const jobsData = Object.entries(buckets).map(([key, val]) => {
    const [, month] = key.split('-');
    return { month: monthNames[parseInt(month, 10) - 1], ...val };
  });

  // Recent applications (last 5)
  const recentApplicationIds = allApplications.slice(0, 5).map((a) => a.jobId);
  const recentJobs = await prisma.recruiterJob.findMany({
    where: { id: { in: recentApplicationIds } },
    select: { id: true, title: true },
  });
  const jobTitleMap = Object.fromEntries(recentJobs.map((j) => [j.id, j.title]));

  const recentActivity = allApplications.slice(0, 5).map((app) => ({
    id: app.id,
    jobTitle: jobTitleMap[app.jobId] ?? 'Unknown Position',
    status: app.status,
    appliedAt: app.appliedAt.toISOString(),
  }));

  return sendSuccess(res, {
    activeJobs,
    totalApplications,
    interviewsScheduled: interviews,
    hired,
    jobsData,
    applicationStats,
    recentActivity,
  }, 200, 'Company dashboard fetched');
});

export const getCompanyAnalytics = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const recruiter = await prisma.recruiter.findFirst({ where: { userId: req.user.id } });
  if (!recruiter?.companyId) return sendError(res, 404, 'No company found for this recruiter');

  const companyId = recruiter.companyId;
  const now = new Date();
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // All jobs
  const allJobs = await prisma.recruiterJob.findMany({
    where: { companyId },
    select: { id: true, status: true, skills: true, createdAt: true },
  });
  const jobIds = allJobs.map((j) => j.id);

  // All applications with timing
  const allApplications = await prisma.jobApplication.findMany({
    where: { jobId: { in: jobIds } },
    select: { id: true, status: true, appliedAt: true, updatedAt: true, jobId: true },
  });

  const totalApplications = allApplications.length;
  const totalHired = allApplications.filter((a) => a.status === 'SELECTED').length;
  const conversionRate = totalApplications > 0
    ? parseFloat(((totalHired / totalApplications) * 100).toFixed(1))
    : 0;

  // Avg time to hire: appliedAt → updatedAt for SELECTED applications
  const hiredApps = allApplications.filter((a) => a.status === 'SELECTED');
  const avgTimeToHire = hiredApps.length > 0
    ? Math.round(
        hiredApps.reduce((sum, a) => {
          return sum + (a.updatedAt.getTime() - a.appliedAt.getTime());
        }, 0) / hiredApps.length / 86400000
      )
    : 0;

  // Monthly funnel — last 6 months
  const funnelBuckets: Record<string, { month: string; applications: number; interviews: number; offers: number; hired: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    funnelBuckets[key] = { month: monthNames[d.getMonth()], applications: 0, interviews: 0, offers: 0, hired: 0 };
  }

  for (const app of allApplications) {
    const key = `${app.appliedAt.getFullYear()}-${String(app.appliedAt.getMonth() + 1).padStart(2, '0')}`;
    if (!(key in funnelBuckets)) continue;
    funnelBuckets[key].applications++;
    if (['SHORTLISTED', 'SELECTED', 'ACCEPTED'].includes(app.status)) funnelBuckets[key].interviews++;
    if (['SELECTED', 'ACCEPTED'].includes(app.status)) funnelBuckets[key].offers++;
    if (app.status === 'SELECTED') funnelBuckets[key].hired++;
  }
  const funnelData = Object.values(funnelBuckets);

  // Department / skill-based breakdown (using skills array as proxy for "department")
  const deptMap: Record<string, { hired: number; openings: number }> = {};
  for (const job of allJobs) {
    const dept = job.skills[0] ?? 'General';
    if (!deptMap[dept]) deptMap[dept] = { hired: 0, openings: 0 };
    if (job.status === 'OPEN') deptMap[dept].openings++;
    const jobHired = allApplications.filter((a) => a.jobId === job.id && a.status === 'SELECTED').length;
    deptMap[dept].hired += jobHired;
  }
  const departmentData = Object.entries(deptMap)
    .map(([dept, v]) => ({ dept, ...v }))
    .slice(0, 6);

  // Previous month comparison
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevApps  = allApplications.filter((a) => a.appliedAt >= prevMonthStart && a.appliedAt < thisMonthStart).length;
  const thisApps  = allApplications.filter((a) => a.appliedAt >= thisMonthStart).length;
  const appChange = prevApps > 0 ? Math.round(((thisApps - prevApps) / prevApps) * 100) : 0;

  return sendSuccess(res, {
    totalApplications,
    conversionRate,
    avgTimeToHire,
    totalHired,
    appChange,
    funnelData,
    departmentData,
  }, 200, 'Analytics fetched');
});

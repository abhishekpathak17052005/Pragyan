import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendSuccess, sendPaginated, sendError } from '@/utils/response';
import { placementService } from './placement.service';
import { StudentFiltersSchema, ApplicationFiltersSchema, PaginationSchema } from './placement.validators';

// ============ DASHBOARD ============

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const dashboard = await placementService.getDashboard();
  return sendSuccess(res, dashboard, 200, 'Dashboard data fetched successfully');
});

// ============ STUDENTS ============

export const getStudents = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const parsed = StudentFiltersSchema.parse(req.query);
  const { page, limit, search, department, minCgpa } = parsed;

  const result = await placementService.getStudents(
    {
      search: search || undefined,
      department: department || undefined,
      minCgpa: minCgpa || undefined,
    },
    page as number,
    limit as number
  );

  return sendPaginated(
    res,
    result.data,
    page as number,
    limit as number,
    result.pagination.total
  );
});

export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { id } = req.params;
  const student = await placementService.getStudentById(id);
  return sendSuccess(res, student, 200, 'Student fetched successfully');
});

// ============ COMPANIES ============

export const getCompanies = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { page = 1, limit = 10 } = PaginationSchema.parse(req.query);
  const result = await placementService.getCompanies(page as number, limit as number);

  return sendPaginated(
    res,
    result.data,
    page as number,
    limit as number,
    result.pagination.total
  );
});

// ============ APPLICATIONS ============

export const getApplications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const parsed = ApplicationFiltersSchema.parse(req.query);
  const { page, limit, status, companyId, department, minCgpa } = parsed;

  const result = await placementService.getApplications(
    {
      status: status || undefined,
      companyId: companyId || undefined,
      department: department || undefined,
      minCgpa: minCgpa || undefined,
    },
    page as number,
    limit as number
  );

  return sendPaginated(
    res,
    result.data,
    page as number,
    limit as number,
    result.pagination.total
  );
});

// ============ ANALYTICS ============

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const analytics = await placementService.getAnalytics();
  return sendSuccess(res, analytics, 200, 'Analytics data fetched successfully');
});

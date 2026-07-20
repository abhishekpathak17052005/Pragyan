import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const StudentFiltersSchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  minCgpa: z.coerce.number().min(0).max(10).optional(),
  ...PaginationSchema.shape,
});

export const ApplicationFiltersSchema = z.object({
  status: z.enum(['APPLIED', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'OFFERED', 'REJECTED', 'JOINED']).optional(),
  companyId: z.string().optional(),
  department: z.string().optional(),
  minCgpa: z.coerce.number().min(0).max(10).optional(),
  ...PaginationSchema.shape,
});

export type StudentFilters = z.infer<typeof StudentFiltersSchema>;
export type ApplicationFilters = z.infer<typeof ApplicationFiltersSchema>;

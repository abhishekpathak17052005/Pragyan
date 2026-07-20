import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/apiClient';

// ============ DASHBOARD HOOKS ============

export function usePlacementDashboard() {
  return useQuery({
    queryKey: ['placement-dashboard'],
    queryFn: async () => {
      return api.get('/placement/dashboard');
    },
  });
}

// ============ STUDENTS HOOKS ============

export function usePlacementStudents(
  filters?: {
    search?: string;
    department?: string;
    minCgpa?: number;
  },
  page: number = 1,
  limit: number = 10
) {
  return useQuery({
    queryKey: ['placement-students', filters, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (filters?.search) params.append('search', filters.search);
      if (filters?.department) params.append('department', filters.department);
      if (filters?.minCgpa) params.append('minCgpa', String(filters.minCgpa));
      
      return api.paginated(`/placement/students?${params.toString()}`);
    },
  });
}

export function usePlacementStudentById(studentId: string) {
  return useQuery({
    queryKey: ['placement-student', studentId],
    queryFn: () => api.get(`/placement/students/${studentId}`),
    enabled: !!studentId,
  });
}

// ============ COMPANIES HOOKS ============

export function usePlacementCompanies(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['placement-companies', page, limit],
    queryFn: async () => {
      return api.paginated(`/placement/companies?page=${page}&limit=${limit}`);
    },
  });
}

// ============ APPLICATIONS HOOKS ============

export function usePlacementApplications(
  filters?: {
    companyId?: string;
    department?: string;
    status?: string;
    minCgpa?: number;
  },
  page: number = 1,
  limit: number = 10
) {
  return useQuery({
    queryKey: ['placement-applications', filters, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (filters?.companyId) params.append('companyId', filters.companyId);
      if (filters?.department) params.append('department', filters.department);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.minCgpa) params.append('minCgpa', String(filters.minCgpa));
      
      return api.paginated(`/placement/applications?${params.toString()}`);
    },
  });
}

// ============ ANALYTICS HOOKS ============

export function usePlacementAnalytics() {
  return useQuery({
    queryKey: ['placement-analytics'],
    queryFn: async () => {
      return api.get('/placement/analytics');
    },
  });
}

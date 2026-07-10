import { api } from '@/services/apiClient';
import type {
  CareerDay,
  CareerModule,
  CareerRoadmap,
  CareerRoadmapSummary,
  CareerResource,
  CareerTopic,
  CareerWeek,
  PaginatedResponse,
} from '@/types/api';

export type CareerTopicSearchResult = CareerTopic & {
  day?: {
    id: string;
    title: string;
    order?: number;
    dayNumber?: number;
    week?: {
      id: string;
      title: string;
      order?: number;
      weekNumber?: number;
      module?: {
        id: string;
        title: string;
        career?: { id: string; title?: string; name?: string; slug: string };
      };
    };
  };
};

export const careerRoadmapService = {
  listCareers() {
    return api.get<CareerRoadmapSummary[]>('/careers');
  },

  listAdminCareers() {
    return api.get<CareerRoadmap[]>('/admin/careers');
  },

  getCareer(slug: string) {
    return api.get<CareerRoadmap>(`/careers/${encodeURIComponent(slug)}`);
  },

  getCareerWithProgress(slug: string) {
    return api.get<CareerRoadmap>(`/progress/dashboard/roadmap/${encodeURIComponent(slug)}`);
  },

  generateCareerRoadmap(input: { careerGoal: string; skillLevel?: string }) {
    return api.post<CareerRoadmap>('/careers/generate', input);
  },

  getTopic(id: string) {
    return api.get<CareerTopic & { day?: CareerDayContext }>(`/topics/${encodeURIComponent(id)}`);
  },

  completeResource(resourceId: string) {
    return api.post('/progress/resource/complete', { resourceId });
  },

  getTopicProgress(topicId: string) {
    return api.get(`/progress/topic/${encodeURIComponent(topicId)}`);
  },

  getDayProgress(dayId: string) {
    return api.get(`/progress/day/${encodeURIComponent(dayId)}`);
  },

  getWeekProgress(weekId: string) {
    return api.get(`/progress/week/${encodeURIComponent(weekId)}`);
  },

  getCareerProgress(careerId: string) {
    return api.get(`/progress/career/${encodeURIComponent(careerId)}`);
  },

  getProgressSummary() {
    return api.get('/progress/summary');
  },

  getDashboard() {
    return api.get('/progress/dashboard');
  },

  createCareer(input: { name: string; title?: string; slug?: string; description: string; thumbnail?: string; status?: 'draft' | 'published'; totalWeeks?: number }) {
    return api.post<CareerRoadmapSummary>('/admin/career', input);
  },

  updateCareer(id: string, input: Partial<{ name: string; title: string; slug: string; description: string; thumbnail: string; status: 'draft' | 'published' }>) {
    return api.put<CareerRoadmapSummary>(`/admin/career/${encodeURIComponent(id)}`, input);
  },

  deleteCareer(id: string) {
    return api.delete<{ id: string }>(`/admin/career/${encodeURIComponent(id)}`);
  },

  publishCareer(id: string, published: boolean) {
    return api.patch<CareerRoadmapSummary>(`/admin/career/${encodeURIComponent(id)}/publish`, { published });
  },

  createModule(input: { careerId: string; title: string; description?: string; order?: number }) {
    return api.post<CareerModule>('/admin/module', input);
  },

  updateModule(id: string, input: Partial<{ title: string; description: string; order: number }>) {
    return api.put<CareerModule>(`/admin/module/${encodeURIComponent(id)}`, input);
  },

  deleteModule(id: string) {
    return api.delete<{ id: string }>(`/admin/module/${encodeURIComponent(id)}`);
  },

  createWeek(input: { moduleId: string; weekNumber: number; title: string; description?: string }) {
    return api.post<CareerWeek>('/admin/week', input);
  },

  updateWeek(id: string, input: Partial<{ weekNumber: number; title: string; description: string }>) {
    return api.put<CareerWeek>(`/admin/week/${encodeURIComponent(id)}`, input);
  },

  deleteWeek(id: string) {
    return api.delete<{ id: string }>(`/admin/week/${encodeURIComponent(id)}`);
  },

  createDay(input: { weekId: string; dayNumber: number; title: string; description?: string; estimatedHours?: number }) {
    return api.post<CareerDay>('/admin/day', input);
  },

  updateDay(id: string, input: Partial<{ dayNumber: number; title: string; description: string; estimatedHours: number }>) {
    return api.put<CareerDay>(`/admin/day/${encodeURIComponent(id)}`, input);
  },

  deleteDay(id: string) {
    return api.delete<{ id: string }>(`/admin/day/${encodeURIComponent(id)}`);
  },

  createTopic(input: {
    dayId: string;
    title: string;
    description?: string;
    objective?: string;
    difficulty?: string;
    estimatedTime?: string;
    order: number;
  }) {
    return api.post<CareerTopic>('/admin/topic', input);
  },

  updateTopic(id: string, input: Partial<{ title: string; description: string; objective: string; order: number }>) {
    return api.put<CareerTopic>(`/admin/topic/${encodeURIComponent(id)}`, input);
  },

  deleteTopic(id: string) {
    return api.delete<{ id: string }>(`/admin/topic/${encodeURIComponent(id)}`);
  },

  addResource(input: {
    topicId: string;
    type?: CareerResource['type'];
    resourceType?: CareerResource['type'];
    title: string;
    provider: string;
    url: string;
    isFree?: boolean;
    free?: boolean;
    verified?: boolean;
    language?: string;
    difficulty?: string;
    order?: number;
    displayOrder?: number;
  }) {
    return api.post<CareerResource>('/admin/resource', input);
  },

  updateResource(id: string, input: Partial<{
    topicId: string;
    type: CareerResource['type'];
    resourceType: CareerResource['type'];
    title: string;
    provider: string;
    url: string;
    isFree: boolean;
    free: boolean;
    verified: boolean;
    language: string;
    difficulty: string;
    order: number;
    displayOrder: number;
  }>) {
    return api.put<CareerResource>(`/admin/resource/${encodeURIComponent(id)}`, input);
  },

  deleteResource(id: string) {
    return api.delete<{ id: string }>(`/admin/resource/${encodeURIComponent(id)}`);
  },

  searchTopics(query: { q?: string; page?: number; limit?: number }) {
    const params = new URLSearchParams();
    if (query.q) params.set('q', query.q);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    return api.paginated<CareerTopicSearchResult>(`/admin/topics?${params.toString()}`);
  },

  listResources(topicId?: string, type?: CareerResource['type']) {
    const params = new URLSearchParams();
    if (topicId) params.set('topicId', topicId);
    if (type) params.set('type', type);
    return api.get<CareerResource[]>(`/admin/career-resources${params.toString() ? `?${params.toString()}` : ''}`);
  },

  reorderResources(topicId: string, orderedResourceIds: string[]) {
    return api.put<CareerResource[]>('/admin/resource/reorder', { topicId, orderedResourceIds });
  },

  reorderModules(orderedIds: string[]) {
    return api.put('/admin/modules/reorder', { orderedIds });
  },

  reorderWeeks(orderedIds: string[]) {
    return api.put('/admin/weeks/reorder', { orderedIds });
  },

  reorderDays(orderedIds: string[]) {
    return api.put('/admin/days/reorder', { orderedIds });
  },

  reorderTopics(orderedIds: string[]) {
    return api.put('/admin/topics/reorder', { orderedIds });
  },
};

type CareerDayContext = {
  id: string;
  title: string;
  order?: number;
  week?: {
    id: string;
    title: string;
    order?: number;
    module?: {
      id: string;
      title: string;
      career?: { id: string; title?: string; name?: string; slug: string };
    };
  };
};

import { api } from '@/services/apiClient';
import type {
  CareerRoadmap,
  CareerRoadmapSummary,
  CareerResource,
  CareerTopic,
  CareerWeek,
  PaginatedResponse,
} from '@/types/api';

export type CareerTopicSearchResult = CareerTopic & {
  day?: { id: string; title: string; dayNumber: number; week?: { id: string; title: string; weekNumber: number; career?: { id: string; name: string; slug: string } } };
};

export type GeneratedRoadmapResponse = {
  roadmap: GeneratedRoadmap;
  source: 'gemini' | 'fallback';
  model?: string;
  diagnostics?: {
    quality?: {
      score?: number;
      passed?: boolean;
      recommendation?: string;
      warnings?: string[];
    };
    prerequisiteGraphValid?: boolean;
    warnings?: string[];
    regenerated?: boolean;
    detectedDomain?: string;
    confidence?: number;
    matchedAliases?: string[];
  };
};

export const careerRoadmapService = {
  generateRoadmap(careerName: string) {
    return api.post<GeneratedRoadmapResponse>('/admin/generate-roadmap', { careerName }).then((res) => {
      const wrapper = res as unknown as GeneratedRoadmapResponse;
      return {
        roadmap: wrapper.roadmap ?? (res as unknown as GeneratedRoadmap),
        source: wrapper.source ?? 'fallback',
        model: wrapper.model,
        diagnostics: wrapper.diagnostics,
      } as GeneratedRoadmapResponse;
    });
  },

  approveRoadmap(input: GeneratedRoadmap) {
    return api.post<unknown>('/admin/approve-roadmap', input);
  },

  updateRoadmapModule(id: string, input: Partial<{ title: string; description: string; sortOrder: number }>) {
    return api.put(`/admin/module/${encodeURIComponent(id)}`, input);
  },

  updateRoadmapWeek(id: string, input: Partial<{ title: string; description: string; sortOrder: number }>) {
    return api.put(`/admin/week/${encodeURIComponent(id)}`, input);
  },

  updateRoadmapDay(id: string, input: Partial<{ title: string; description: string; sortOrder: number }>) {
    return api.put(`/admin/day/${encodeURIComponent(id)}`, input);
  },

  updateRoadmapTopic(id: string, input: Partial<{
    title: string;
    description: string;
    difficulty: string;
    estimatedDuration: string;
    learningObjective: string;
    prerequisite: string;
    practicalTask: string;
    sortOrder: number;
  }>) {
    return api.put(`/admin/topic/${encodeURIComponent(id)}`, input);
  },

  listCareers() {
    return api.get<CareerRoadmapSummary[]>('/careers');
  },

  getCareer(slug: string) {
    return api.get<CareerRoadmap>(`/careers/${encodeURIComponent(slug)}`);
  },

  getTopic(id: string) {
    return api.get<CareerTopic & { day?: CareerDayContext }>(`/topics/${encodeURIComponent(id)}`);
  },

  createCareer(input: { name: string; slug?: string; description: string; totalWeeks: number }) {
    return api.post<CareerRoadmapSummary>('/admin/career', input);
  },

  createWeek(input: { careerId: string; weekNumber: number; title: string; description?: string }) {
    return api.post<CareerWeek>('/admin/week', input);
  },

  createDay(input: { weekId: string; dayNumber: number; title: string; description?: string }) {
    return api.post<CareerDayContext>('/admin/day', input);
  },

  createTopic(input: {
    dayId: string;
    title: string;
    description?: string;
    difficulty: string;
    estimatedTime: string;
    order: number;
    quizUrl?: string;
    miniProjectUrl?: string;
    progress?: unknown;
  }) {
    return api.post<CareerTopic>('/admin/topic', input);
  },

  addResource(input: {
    topicId: string;
    type?: CareerResource['type'];
    resourceType?: CareerResource['type'];
    title: string;
    provider: string;
    url: string;
    description?: string;
    thumbnail?: string;
    estimatedDuration?: string;
    duration?: string;
    isFree?: boolean;
    free?: boolean;
    rating?: number;
    verified?: boolean;
    language?: string;
    difficulty?: string;
    tags?: string[];
    order?: number;
    verified?: boolean;
    metadata?: Record<string, unknown>;
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
    description: string;
    thumbnail: string;
    estimatedDuration: string;
    duration: string;
    isFree: boolean;
    free: boolean;
    rating: number;
    verified: boolean;
    language: string;
    difficulty: string;
    tags: string[];
    order: number;
    metadata: Record<string, unknown>;
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
};

type CareerDayContext = {
  id: string;
  title: string;
  dayNumber: number;
  week?: {
    id: string;
    title: string;
    weekNumber: number;
    career?: { id: string; name: string; slug: string };
  };
};

export type GeneratedRoadmap = {
  careerName: string;
  summary: string;
  templateKey?: string;
  version?: number;
  generatedBy?: string;
  generatedAt?: string;
  approved?: boolean;
  status?: 'draft' | 'approved';
  modules: Array<{
    id?: string;
    slug?: string;
    moduleNumber: number;
    title: string;
    description: string;
    moduleAssessment?: string;
    realWorldProject?: string;
    interviewQuestions?: string[];
    commonMistakes?: string[];
    industryTips?: string[];
    weeks: Array<{
      id?: string;
      slug?: string;
      weekNumber: number;
      title: string;
      description: string;
      weeklyRevision?: string;
      weeklyQuiz?: string;
      handsOnAssignment?: string;
      miniProject?: string;
      days: Array<{
        id?: string;
        slug?: string;
        dayNumber: number;
        title: string;
        description: string;
        topics: Array<{
          id?: string;
          slug?: string;
          title: string;
          description: string;
          explanation?: string;
          difficulty: string;
          estimatedDuration: string;
          learningObjective: string;
          prerequisite: string;
          handsOnExercise?: string;
          handsOnTask?: string;
          miniExercise?: string;
          expectedOutcome?: string;
          practicalTask: string;
          resources?: unknown[];
        }>;
      }>;
    }>;
  }>;
};

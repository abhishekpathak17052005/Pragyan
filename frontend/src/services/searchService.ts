import { api } from '@/services/apiClient';

export interface SearchResult {
  id: string;
  type: 'career' | 'roadmap' | 'resource';
  title: string;
  description: string;
  route: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}

export const searchService = {
  search(query: string) {
    return api.get<SearchResponse>(`/search?q=${encodeURIComponent(query)}`);
  },
};

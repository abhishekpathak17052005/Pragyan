import { api } from '@/services/apiClient';

export type IntegrationProvider = 'github' | 'linkedin' | 'google';

export interface IntegrationStatus {
  provider: IntegrationProvider;
  connected: boolean;
  accountName?: string;
  lastSyncedAt?: string;
  tokenExpired?: boolean;
  summary?: Record<string, unknown>;
}

export const integrationService = {
  getStatuses() {
    return api.get<IntegrationStatus[]>('/integrations/status');
  },
  connect(provider: IntegrationProvider) {
    return api.post<{ authorizationUrl: string }>(`/integrations/${provider}/connect`);
  },
  sync(provider: IntegrationProvider) {
    return api.post(`/integrations/${provider}/sync`);
  },
  disconnect(provider: IntegrationProvider) {
    return api.delete(`/integrations/${provider}`);
  },
};

import { apiClient } from './client';

export type TermsSection = {
  id: string;
  title: string;
  body: string;
};

export type TermsDocument = {
  id: string;
  version: string;
  effectiveDate?: string;
  sections: TermsSection[];
  updatedAt?: string;
};

export const termsApi = {
  current: () => apiClient.get<TermsDocument>('/terms/current').then((r) => r.data),
  accept: (termsVersion: string) =>
    apiClient.post<{ termsVersion: string; acceptedAt: string }>('/terms/accept', { termsVersion }).then((r) => r.data),
};

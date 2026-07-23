import { apiClient } from './client';
import { getApiBaseUrl } from '@/constants/config';
import { Contract } from '@/types';
import { storage, STORAGE_KEYS } from '@/utils/storage';

async function uploadContractFile(contractId: string, field: 'file', endpoint: string, uri: string, fileName: string, mimeType: string) {
  const token = await storage.get(STORAGE_KEYS.accessToken);
  const form = new FormData();
  form.append(field, { uri, name: fileName, type: mimeType } as unknown as Blob);

  const response = await fetch(`${getApiBaseUrl()}/contracts/${contractId}/${endpoint}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  const body = (await response.json().catch(() => ({}))) as Contract & { message?: string };
  if (!response.ok) {
    const err = new Error(body.message ?? `Request failed with status code ${response.status}`) as Error & {
      response?: { status: number; data: unknown };
    };
    err.response = { status: response.status, data: body };
    throw err;
  }
  return body;
}

export const contractsApi = {
  list: () => apiClient.get<Contract[]>('/contracts').then((r) => r.data),
  get: (id: string) => apiClient.get<Contract>(`/contracts/${id}`).then((r) => r.data),
  create: (payload: {
    professionalId: string;
    serviceIds: string[];
    scheduledDate: string;
    amount: number;
    currency?: string;
  }) => apiClient.post<Contract>('/contracts', payload).then((r) => r.data),
  sign: (id: string, role: string) =>
    apiClient.post<Contract>(`/contracts/${id}/sign`, null, { params: { role } }).then((r) => r.data),
  uploadDocument: (id: string, uri: string, fileName: string, mimeType: string) =>
    uploadContractFile(id, 'file', 'documents/upload', uri, fileName, mimeType),
  uploadSignedDocument: (id: string, uri: string, fileName: string, mimeType: string) =>
    uploadContractFile(id, 'file', 'documents/signed', uri, fileName, mimeType),
  generateDocument: (id: string, acceptDisclaimer: boolean) =>
    apiClient
      .post<Contract>(`/contracts/${id}/documents/generate`, { acceptDisclaimer })
      .then((r) => r.data),
  previewDocument: (id: string) =>
    apiClient.get<{ text: string }>(`/contracts/${id}/documents/preview`).then((r) => r.data.text),
  updateDocumentText: (id: string, documentText: string) =>
    apiClient.patch<Contract>(`/contracts/${id}/documents/text`, { documentText }).then((r) => r.data),
};

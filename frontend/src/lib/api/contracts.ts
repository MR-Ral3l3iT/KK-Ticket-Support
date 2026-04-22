import { api } from './client';
import { Contract } from '@/types/master.types';
import { PaginatedResponse } from '@/types/api.types';

export const contractsApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<Contract>>(`/api/admin/contracts${q}`);
  },
  get: (id: string) => api.get<Contract>(`/api/admin/contracts/${id}`),
  create: (data: Partial<Contract>) => api.post<Contract>('/api/admin/contracts', data),
  update: (id: string, data: Partial<Contract>) =>
    api.patch<Contract>(`/api/admin/contracts/${id}`, data),
  remove: (id: string) => api.delete(`/api/admin/contracts/${id}`),
};

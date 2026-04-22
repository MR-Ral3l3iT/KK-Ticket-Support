import { api } from './client';
import { CustomerSystem } from '@/types/master.types';
import { PaginatedResponse } from '@/types/api.types';

export const systemsApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<CustomerSystem>>(`/api/admin/systems${q}`);
  },
  get: (id: string) => api.get<CustomerSystem>(`/api/admin/systems/${id}`),
  create: (data: Partial<CustomerSystem>) => api.post<CustomerSystem>('/api/admin/systems', data),
  update: (id: string, data: Partial<CustomerSystem>) =>
    api.patch<CustomerSystem>(`/api/admin/systems/${id}`, data),
  remove: (id: string) => api.delete(`/api/admin/systems/${id}`),
};

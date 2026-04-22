import { api } from './client';
import { Category } from '@/types/master.types';
import { PaginatedResponse } from '@/types/api.types';

export const categoriesApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<Category>>(`/api/admin/categories${q}`);
  },
  get: (id: string) => api.get<Category>(`/api/admin/categories/${id}`),
  create: (data: Partial<Category>) => api.post<Category>('/api/admin/categories', data),
  update: (id: string, data: Partial<Category>) =>
    api.patch<Category>(`/api/admin/categories/${id}`, data),
  remove: (id: string) => api.delete(`/api/admin/categories/${id}`),
};

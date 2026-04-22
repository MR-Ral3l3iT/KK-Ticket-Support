import { api } from './client';
import { Customer } from '@/types/master.types';
import { PaginatedResponse } from '@/types/api.types';

export const customersApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<Customer>>(`/api/admin/customers${q}`);
  },
  get: (id: string) => api.get<Customer>(`/api/admin/customers/${id}`),
  create: (data: Partial<Customer>) => api.post<Customer>('/api/admin/customers', data),
  update: (id: string, data: Partial<Customer>) =>
    api.patch<Customer>(`/api/admin/customers/${id}`, data),
  remove: (id: string) => api.delete(`/api/admin/customers/${id}`),
};

import { api } from './client';
import { Team } from '@/types/master.types';
import { PaginatedResponse } from '@/types/api.types';

export const teamsApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<Team>>(`/api/admin/teams${q}`);
  },
  get: (id: string) => api.get<Team>(`/api/admin/teams/${id}`),
  create: (data: Partial<Team>) => api.post<Team>('/api/admin/teams', data),
  update: (id: string, data: Partial<Team>) =>
    api.patch<Team>(`/api/admin/teams/${id}`, data),
  remove: (id: string) => api.delete(`/api/admin/teams/${id}`),
};

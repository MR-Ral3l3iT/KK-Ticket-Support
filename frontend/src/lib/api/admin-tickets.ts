import { api } from './client';
import { Ticket } from '@/types/ticket.types';
import { PaginatedResponse } from '@/types/api.types';

export const adminTicketsApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<Ticket>>(`/api/admin/tickets${q}`);
  },
  get: (id: string) => api.get<Ticket>(`/api/admin/tickets/${id}`),
  update: (id: string, data: { title?: string; description?: string; priority?: string; categoryId?: string; scopeType?: string }) =>
    api.patch<Ticket>(`/api/admin/tickets/${id}`, data),
  assign: (id: string, data: { assigneeId?: string | null; teamId?: string | null }) =>
    api.patch<Ticket>(`/api/admin/tickets/${id}/assign`, data),
  transition: (id: string, status: string, reason?: string) =>
    api.patch<Ticket>(`/api/admin/tickets/${id}/status`, { status, reason }),
  getTimeline: (id: string) => api.get(`/api/admin/tickets/${id}/timeline`),
  addComment: (id: string, content: string, type: 'PUBLIC' | 'INTERNAL') =>
    api.post(`/api/admin/tickets/${id}/comments`, { content, type }),
};

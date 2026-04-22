import { api, apiUpload } from './client';
import { Ticket, CreateTicketDto } from '@/types/ticket.types';
import { PaginatedResponse } from '@/types/api.types';

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  url: string;
  createdAt: string;
  ticketId: string;
  commentId: string | null;
  uploadedById: string;
}

export interface CustomerSystem {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface CustomerCategory {
  id: string;
  name: string;
  parentId?: string;
  parent?: { id: string; name: string };
}

export const customerPortalApi = {
  // Ref data
  getSystems: () => api.get<CustomerSystem[]>('/api/customer/systems'),
  getCategories: (systemId: string) =>
    api.get<CustomerCategory[]>(`/api/customer/systems/${systemId}/categories`),

  // Tickets
  getTickets: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<Ticket>>(`/api/tickets${q}`);
  },
  getTicket: (id: string) => api.get<Ticket>(`/api/tickets/${id}`),
  createTicket: (data: CreateTicketDto) => api.post<Ticket>('/api/tickets', data),
  createFollowUp: (parentId: string, data: CreateTicketDto) =>
    api.post<Ticket>(`/api/tickets/${parentId}/follow-up`, data),
  getTimeline: (id: string) => api.get(`/api/tickets/${id}/timeline`),
  transition: (id: string, status: string, reason?: string) =>
    api.patch<Ticket>(`/api/tickets/${id}/status`, { status, reason }),

  // Comments
  addComment: (ticketId: string, content: string) =>
    api.post(`/api/tickets/${ticketId}/comments`, { content, type: 'PUBLIC' }),

  // Attachments
  getAttachments: (ticketId: string) =>
    api.get<Attachment[]>(`/api/tickets/${ticketId}/attachments`),
  uploadAttachments: (ticketId: string, files: File[], commentId?: string) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    const q = commentId ? `?commentId=${commentId}` : '';
    return apiUpload<Attachment[]>(`/api/tickets/${ticketId}/attachments${q}`, fd);
  },
  deleteAttachment: (id: string) => api.delete(`/api/attachments/${id}`),

  // Profile
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (data: { firstName: string; lastName: string; phone?: string }) =>
    api.patch('/api/auth/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/api/auth/me/password', { currentPassword, newPassword }),
};

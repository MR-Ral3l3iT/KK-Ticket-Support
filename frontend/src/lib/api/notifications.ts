import { api } from './client';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  event?: string;
  metadata?: {
    ticketId?: string;
    ticketNumber?: string;
    customerName?: string;
    systemName?: string;
  };
}

export interface UnreadNotificationsResponse {
  data: NotificationItem[];
  total: number;
}

export const notificationsApi = {
  unread: () => api.get<UnreadNotificationsResponse>('/api/notifications'),
  markRead: (id: string) => api.patch<void>(`/api/notifications/${id}/read`, {}),
  markAllRead: () => api.patch<void>('/api/notifications/read-all', {}),
};

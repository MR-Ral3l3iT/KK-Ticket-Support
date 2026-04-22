import { api } from './client';
import { UserListItem } from '@/types/master.types';
import { PaginatedResponse } from '@/types/api.types';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  customerId?: string;
  teamId?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  customerId?: string;
  teamId?: string;
}

export const usersApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<UserListItem>>(`/api/admin/users${q}`);
  },
  get: (id: string) => api.get<UserListItem>(`/api/admin/users/${id}`),
  create: (data: CreateUserDto) => api.post<UserListItem>('/api/admin/users', data),
  update: (id: string, data: UpdateUserDto) =>
    api.patch<UserListItem>(`/api/admin/users/${id}`, data),
  resetPassword: (id: string, password: string) =>
    api.patch(`/api/admin/users/${id}/password`, { password }),
  remove: (id: string) => api.delete(`/api/admin/users/${id}`),
};

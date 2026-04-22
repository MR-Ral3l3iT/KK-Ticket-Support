import { api } from './client';
import { DashboardKpi } from '@/types/master.types';

export const reportsApi = {
  dashboard: () => api.get<DashboardKpi>('/api/admin/dashboard'),
};

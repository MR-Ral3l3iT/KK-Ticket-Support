import { api, downloadFile } from './client';
import { DashboardKpi } from '@/types/master.types';

export interface DailyPoint { date: string; count: number }
export interface StatusPoint { status: string; count: number }
export interface PriorityPoint { priority: string; count: number }
export interface ChartData { daily: DailyPoint[]; byStatus: StatusPoint[]; byPriority: PriorityPoint[] }

export interface TicketReportItem {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  scopeType?: string;
  createdAt: string;
  resolvedAt?: string;
  closedAt?: string;
  customer?: { id: string; name: string };
  system?: { id: string; name: string };
  assignee?: { id: string; firstName: string; lastName: string };
  slaTracking?: { isFirstResponseBreached: boolean; isResolutionBreached: boolean } | null;
}

export interface TicketReportParams {
  customerId?: string;
  systemId?: string;
  status?: string;
  priority?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export const reportsApi = {
  dashboard: () => api.get<DashboardKpi>('/api/admin/dashboard'),
  chartData: (customerId?: string) => {
    const q = customerId ? `?customerId=${customerId}` : '';
    return api.get<ChartData>(`/api/admin/dashboard/chart-data${q}`);
  },
  tickets: (params: TicketReportParams = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') q.set(k, String(v)); });
    return api.get<{ data: TicketReportItem[]; total: number; page: number; totalPages: number }>(`/api/reports/tickets?${q}`);
  },
  exportCsv: (params: TicketReportParams = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') q.set(k, String(v)); });
    const filename = `tickets_${new Date().toISOString().slice(0, 10)}.csv`;
    return downloadFile(`/api/reports/export/csv?${q}`, filename);
  },
};

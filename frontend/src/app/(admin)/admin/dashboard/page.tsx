'use client';

import { AlertTriangle, CheckCircle2, Clock, TrendingUp, Inbox, Timer, LayoutDashboard } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useApi } from '@/lib/hooks/useApi';
import { reportsApi } from '@/lib/api/reports';

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'เปิด', TRIAGED: 'ตรวจสอบ', IN_PROGRESS: 'ดำเนินการ',
  WAITING_CUSTOMER: 'รอลูกค้า', WAITING_INTERNAL: 'รอภายใน',
  RESOLVED: 'แก้ไขแล้ว', CLOSED: 'ปิด', REOPENED: 'เปิดใหม่', CANCELLED: 'ยกเลิก',
};
const STATUS_COLOR: Record<string, string> = {
  OPEN: '#3b82f6', TRIAGED: '#8b5cf6', IN_PROGRESS: '#f59e0b',
  WAITING_CUSTOMER: '#f97316', WAITING_INTERNAL: '#6b7280',
  RESOLVED: '#22c55e', CLOSED: '#94a3b8', REOPENED: '#ef4444', CANCELLED: '#cbd5e1',
};
const PRIORITY_COLOR: Record<string, string> = {
  LOW: '#94a3b8', MEDIUM: '#3b82f6', HIGH: '#f97316', CRITICAL: '#ef4444',
};
const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'ต่ำ', MEDIUM: 'กลาง', HIGH: 'สูง', CRITICAL: 'วิกฤต',
};

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function KpiCard({ label, value, icon, color }: KpiCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </Card>
  );
}

function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function AdminDashboardPage() {
  const { data, loading } = useApi(() => reportsApi.dashboard());
  const { data: charts, loading: chartsLoading } = useApi(() => reportsApi.chartData());

  return (
    <>
      <AdminHeader title="Dashboard" />
      <main className="pt-20 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary-600" />
            ภาพรวมระบบ
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">ข้อมูลสรุป ณ วันนี้</p>
        </div>

        {loading || !data ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <KpiCard label="Ticket เปิดอยู่" value={data.openTickets}
              icon={<Inbox className="h-6 w-6 text-blue-600" />} color="bg-blue-50" />
            <KpiCard label="กำลังดำเนินการ" value={data.inProgressTickets}
              icon={<Clock className="h-6 w-6 text-amber-600" />} color="bg-amber-50" />
            <KpiCard label="แก้ไขแล้ววันนี้" value={data.resolvedToday}
              icon={<CheckCircle2 className="h-6 w-6 text-green-600" />} color="bg-green-50" />
            <KpiCard label="SLA เกินกำหนด" value={data.slaBreached}
              icon={<AlertTriangle className="h-6 w-6 text-red-600" />} color="bg-red-50" />
            <KpiCard label="เวลาแก้ไขเฉลี่ย"
              value={`${Number(data.avgResolutionHours ?? 0).toFixed(1)} ชม.`}
              icon={<Timer className="h-6 w-6 text-purple-600" />} color="bg-purple-50" />
            <KpiCard label="Ticket เดือนนี้" value={data.totalThisMonth}
              icon={<TrendingUp className="h-6 w-6 text-secondary-600" />} color="bg-secondary-50" />
          </div>
        )}

        {chartsLoading || !charts ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <CardHeader><CardTitle>Ticket ใหม่รายวัน (30 วัน)</CardTitle></CardHeader>
              <div className="h-56 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.daily} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: '#9ca3af' }} interval={4} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                    <Tooltip
                      formatter={(v: number) => [v, 'Ticket']}
                      labelFormatter={(l: string) => new Date(l).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>แบ่งตาม Priority</CardTitle></CardHeader>
              <div className="h-56 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts.byPriority.map((d) => ({ ...d, label: PRIORITY_LABEL[d.priority] ?? d.priority }))}
                    margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [v, 'Ticket']} contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {charts.byPriority.map((entry) => (
                        <Cell key={entry.priority} fill={PRIORITY_COLOR[entry.priority] ?? '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="xl:col-span-3">
              <CardHeader><CardTitle>แบ่งตามสถานะ</CardTitle></CardHeader>
              <div className="h-52 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts.byStatus.map((d) => ({ ...d, label: STATUS_LABEL[d.status] ?? d.status }))}
                    margin={{ top: 4, right: 16, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [v, 'Ticket']} contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {charts.byStatus.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLOR[entry.status] ?? '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}

'use client';

import { AlertTriangle, CheckCircle2, Clock, TrendingUp, Inbox, Timer, LayoutDashboard } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useApi } from '@/lib/hooks/useApi';
import { reportsApi } from '@/lib/api/reports';

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

export default function AdminDashboardPage() {
  const { data, loading } = useApi(() => reportsApi.dashboard());

  return (
    <>
      <AdminHeader title="Dashboard" />
      <main className="pt-20 p-6">
        <div className="mb-6">
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
            <KpiCard
              label="Ticket เปิดอยู่"
              value={data.openTickets}
              icon={<Inbox className="h-6 w-6 text-blue-600" />}
              color="bg-blue-50"
            />
            <KpiCard
              label="กำลังดำเนินการ"
              value={data.inProgressTickets}
              icon={<Clock className="h-6 w-6 text-amber-600" />}
              color="bg-amber-50"
            />
            <KpiCard
              label="แก้ไขแล้ววันนี้"
              value={data.resolvedToday}
              icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
              color="bg-green-50"
            />
            <KpiCard
              label="SLA เกินกำหนด"
              value={data.slaBreached}
              icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
              color="bg-red-50"
            />
            <KpiCard
              label="เวลาแก้ไขเฉลี่ย"
              value={`${Number(data.avgResolutionHours ?? 0).toFixed(1)} ชม.`}
              icon={<Timer className="h-6 w-6 text-purple-600" />}
              color="bg-purple-50"
            />
            <KpiCard
              label="Ticket เดือนนี้"
              value={data.totalThisMonth}
              icon={<TrendingUp className="h-6 w-6 text-secondary-600" />}
              color="bg-secondary-50"
            />
          </div>
        )}
      </main>
    </>
  );
}

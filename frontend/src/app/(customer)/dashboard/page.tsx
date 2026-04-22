'use client';

import Link from 'next/link';
import { Plus, Ticket, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useApi } from '@/lib/hooks/useApi';
import { useAuthContext } from '@/lib/context/AuthContext';
import { customerPortalApi } from '@/lib/api/customer-portal';
import { formatDateTime, timeAgo } from '@/lib/utils/date';
import { TicketStatus, TicketPriority } from '@/types/ticket.types';

const STATUS_BADGE: Record<TicketStatus, { variant: BadgeVariant; label: string }> = {
  OPEN: { variant: 'info', label: 'เปิด' },
  TRIAGED: { variant: 'secondary', label: 'ตรวจสอบแล้ว' },
  IN_PROGRESS: { variant: 'primary', label: 'กำลังดำเนินการ' },
  WAITING_CUSTOMER: { variant: 'warning', label: 'รอข้อมูลจากคุณ' },
  WAITING_INTERNAL: { variant: 'warning', label: 'รอภายใน' },
  RESOLVED: { variant: 'success', label: 'แก้ไขแล้ว' },
  CLOSED: { variant: 'default', label: 'ปิดแล้ว' },
  REOPENED: { variant: 'danger', label: 'เปิดใหม่' },
  CANCELLED: { variant: 'default', label: 'ยกเลิก' },
};

const PRIORITY_BADGE: Record<TicketPriority, BadgeVariant> = {
  LOW: 'default', MEDIUM: 'info', HIGH: 'warning', CRITICAL: 'danger',
};

const PRIORITY_BADGE_CLASS: Record<TicketPriority, string> = {
  LOW: 'bg-orange-50 text-orange-700',
  MEDIUM: 'bg-orange-100 text-orange-800',
  HIGH: 'bg-orange-200 text-orange-900',
  CRITICAL: 'bg-red-100 text-red-700',
};

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </Card>
  );
}

export default function CustomerDashboardPage() {
  const { user } = useAuthContext();
  const { data, loading } = useApi(
    () => customerPortalApi.getTickets({ limit: '5', page: '1' }),
    [],
  );

  const tickets = data?.data ?? [];
  const open = tickets.filter((t) => ['OPEN', 'TRIAGED', 'IN_PROGRESS', 'REOPENED'].includes(t.status)).length;
  const waiting = tickets.filter((t) => t.status === 'WAITING_CUSTOMER').length;
  const resolved = tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            สวัสดี, {user?.firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">ติดตามสถานะ Ticket ของคุณได้ที่นี่</p>
        </div>
        <Link href="/tickets/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>สร้าง Ticket ใหม่</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Ticket ที่เปิดอยู่" value={open} icon={<Ticket className="h-5 w-5 text-blue-600" />} color="bg-blue-50" />
        <StatCard label="รอข้อมูลจากคุณ" value={waiting} icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} color="bg-amber-50" />
        <StatCard label="แก้ไขแล้ว" value={resolved} icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} color="bg-green-50" />
      </div>

      {/* Recent Tickets */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Ticket ล่าสุด</h2>
          <Link href="/tickets" className="text-sm text-primary hover:underline font-medium">ดูทั้งหมด →</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : !tickets.length ? (
          <EmptyState
            icon={<Ticket className="h-7 w-7" />}
            title="ยังไม่มี Ticket"
            description="กด 'สร้าง Ticket ใหม่' เพื่อแจ้งปัญหาหรือขอความช่วยเหลือ"
            action={
              <Link href="/tickets/new">
                <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>สร้าง Ticket ใหม่</Button>
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {tickets.map((t) => {
              const sb = STATUS_BADGE[t.status];
              return (
                <Link
                  key={t.id}
                  href={`/tickets/${t.id}`}
                  className="flex items-start justify-between gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-primary font-semibold">{t.ticketNumber}</span>
                      <Badge variant={sb.variant} dot size="sm">{sb.label}</Badge>
                      <Badge variant={PRIORITY_BADGE[t.priority]} className={PRIORITY_BADGE_CLASS[t.priority]} size="sm">
                        {t.priority}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(t.updatedAt)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

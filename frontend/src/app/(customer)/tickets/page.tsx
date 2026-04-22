'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Ticket, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useApi } from '@/lib/hooks/useApi';
import { customerPortalApi } from '@/lib/api/customer-portal';
import { TicketStatus, TicketPriority } from '@/types/ticket.types';
import { timeAgo } from '@/lib/utils/date';

const STATUS_OPTIONS = [
  { value: '', label: 'ทุกสถานะ' },
  { value: 'OPEN', label: 'เปิด' },
  { value: 'TRIAGED', label: 'ตรวจสอบแล้ว' },
  { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ' },
  { value: 'WAITING_CUSTOMER', label: 'รอข้อมูลจากคุณ' },
  { value: 'RESOLVED', label: 'แก้ไขแล้ว' },
  { value: 'CLOSED', label: 'ปิดแล้ว' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'ทุก Priority' },
  { value: 'LOW', label: 'LOW' },
  { value: 'MEDIUM', label: 'MEDIUM' },
  { value: 'HIGH', label: 'HIGH' },
  { value: 'CRITICAL', label: 'CRITICAL' },
];

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

export default function CustomerTicketsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [applied, setApplied] = useState({ search: '', status: '', priority: '' });

  const { data, loading } = useApi(
    () => customerPortalApi.getTickets({
      page: String(page),
      limit: '10',
      ...(applied.search && { search: applied.search }),
      ...(applied.status && { status: applied.status }),
      ...(applied.priority && { priority: applied.priority }),
    }),
    [applied, page],
  );

  function applyFilters() { setApplied({ search, status, priority }); setPage(1); }
  function clearFilters() {
    setSearch(''); setStatus(''); setPriority('');
    setApplied({ search: '', status: '', priority: '' });
    setPage(1);
  }

  const hasFilter = applied.search || applied.status || applied.priority;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Tickets ของฉัน
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">รายการ Ticket ทั้งหมดที่คุณสร้าง</p>
        </div>
        <Link href="/tickets/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>สร้าง Ticket ใหม่</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            fullWidth={false}
            className="w-64"
            placeholder="ค้นหาหมายเลข / ชื่อ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Select fullWidth={false} className="w-48" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
          <Select fullWidth={false} className="w-40" options={PRIORITY_OPTIONS} value={priority} onChange={(e) => setPriority(e.target.value)} />
          <Button variant="outline" onClick={applyFilters}>กรอง</Button>
          {hasFilter && <Button variant="ghost" onClick={clearFilters}>ล้าง</Button>}
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !data?.data.length ? (
        <EmptyState
          icon={<Ticket className="h-7 w-7" />}
          title="ไม่พบ Ticket"
          description={hasFilter ? 'ลองเปลี่ยนตัวกรองการค้นหา' : "กด 'สร้าง Ticket ใหม่' เพื่อแจ้งปัญหา"}
          action={
            !hasFilter ? (
              <Link href="/tickets/new">
                <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>สร้าง Ticket ใหม่</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {data.data.map((t) => {
              const sb = STATUS_BADGE[t.status];
              return (
                <Link
                  key={t.id}
                  href={`/tickets/${t.id}`}
                  className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-semibold text-primary">{t.ticketNumber}</span>
                      <Badge variant={sb.variant} dot size="sm">{sb.label}</Badge>
                      <Badge variant={PRIORITY_BADGE[t.priority]} className={PRIORITY_BADGE_CLASS[t.priority]} size="sm">
                        {t.priority}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      อัปเดต {timeAgo(t.updatedAt)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
          {data.totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100">
              <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} showTotal total={data.total} />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

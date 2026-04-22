'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, SlidersHorizontal, ListChecks } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { useApi } from '@/lib/hooks/useApi';
import { adminTicketsApi } from '@/lib/api/admin-tickets';
import { TicketStatus, TicketPriority } from '@/types/ticket.types';

const STATUS_OPTIONS = [
  { value: '', label: 'ทุกสถานะ' },
  { value: 'OPEN', label: 'เปิด' },
  { value: 'TRIAGED', label: 'ตรวจสอบแล้ว' },
  { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ' },
  { value: 'WAITING_CUSTOMER', label: 'รอลูกค้า' },
  { value: 'WAITING_INTERNAL', label: 'รอภายใน' },
  { value: 'RESOLVED', label: 'แก้ไขแล้ว' },
  { value: 'CLOSED', label: 'ปิดแล้ว' },
  { value: 'CANCELLED', label: 'ยกเลิก' },
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
  WAITING_CUSTOMER: { variant: 'warning', label: 'รอลูกค้า' },
  WAITING_INTERNAL: { variant: 'warning', label: 'รอภายใน' },
  RESOLVED: { variant: 'success', label: 'แก้ไขแล้ว' },
  CLOSED: { variant: 'default', label: 'ปิดแล้ว' },
  REOPENED: { variant: 'danger', label: 'เปิดใหม่' },
  CANCELLED: { variant: 'default', label: 'ยกเลิก' },
};

const PRIORITY_BADGE: Record<TicketPriority, { variant: BadgeVariant; label: string }> = {
  LOW: { variant: 'default', label: 'LOW' },
  MEDIUM: { variant: 'info', label: 'MEDIUM' },
  HIGH: { variant: 'warning', label: 'HIGH' },
  CRITICAL: { variant: 'danger', label: 'CRITICAL' },
};

const PRIORITY_BADGE_CLASS: Record<TicketPriority, string> = {
  LOW: 'bg-orange-50 text-orange-700',
  MEDIUM: 'bg-orange-100 text-orange-800',
  HIGH: 'bg-orange-200 text-orange-900',
  CRITICAL: 'bg-red-100 text-red-700',
};

export default function AdminTicketsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [applied, setApplied] = useState({ search: '', status: '', priority: '' });

  const { data, loading } = useApi(
    () => adminTicketsApi.list({
      search: applied.search,
      ...(applied.status && { status: applied.status }),
      ...(applied.priority && { priority: applied.priority }),
      page: String(page),
      limit: '20',
    }),
    [applied, page],
  );

  function applyFilters() { setApplied({ search, status, priority }); setPage(1); }
  function clearFilters() { setSearch(''); setStatus(''); setPriority(''); setApplied({ search: '', status: '', priority: '' }); setPage(1); }

  return (
    <>
      <AdminHeader title="Tickets" />
      <main className="pt-20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary-600" />
              จัดการ Tickets
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Tickets ทั้งหมดในระบบ</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Input
            fullWidth={false}
            className="w-64"
            placeholder="ค้นหาหมายเลข / ชื่อ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Select fullWidth={false} className="w-44" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
          <Select fullWidth={false} className="w-40" options={PRIORITY_OPTIONS} value={priority} onChange={(e) => setPriority(e.target.value)} />
          <Button variant="outline" leftIcon={<SlidersHorizontal className="h-4 w-4" />} onClick={applyFilters}>กรอง</Button>
          {(applied.search || applied.status || applied.priority) && (
            <Button variant="ghost" onClick={clearFilters}>ล้าง</Button>
          )}
        </div>

        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          : !data?.data.length ? <EmptyState title="ไม่พบ Ticket" description="ลองเปลี่ยนตัวกรองการค้นหา" />
          : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableTh>หมายเลข</TableTh><TableTh>หัวข้อ</TableTh><TableTh>ลูกค้า</TableTh>
                    <TableTh>สถานะ</TableTh><TableTh>Priority</TableTh>
                    <TableTh>ผู้รับผิดชอบ</TableTh><TableTh>วันที่สร้าง</TableTh><TableTh></TableTh>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.map((t) => {
                    const sb = STATUS_BADGE[t.status];
                    const pb = PRIORITY_BADGE[t.priority];
                    return (
                      <TableRow key={t.id}>
                        <TableTd>
                          <span className="font-mono text-xs font-semibold text-primary">{t.ticketNumber}</span>
                        </TableTd>
                        <TableTd className="max-w-xs">
                          <Link href={`/admin/tickets/${t.id}`} className="font-medium text-gray-900 hover:text-primary transition-colors line-clamp-1">
                            {t.title}
                          </Link>
                        </TableTd>
                        <TableTd className="text-gray-500 text-sm">{(t as any).customer?.name ?? '-'}</TableTd>
                        <TableTd><Badge variant={sb.variant} dot>{sb.label}</Badge></TableTd>
                        <TableTd>
                          <Badge variant={pb.variant} className={PRIORITY_BADGE_CLASS[t.priority]}>
                            {pb.label}
                          </Badge>
                        </TableTd>
                        <TableTd>
                          {(t as any).assignee ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar name={`${(t as any).assignee.firstName} ${(t as any).assignee.lastName}`} size="xs" />
                              <span className="text-sm text-gray-600">{(t as any).assignee.firstName}</span>
                            </div>
                          ) : <span className="text-sm text-gray-400">-</span>}
                        </TableTd>
                        <TableTd className="text-gray-500 text-sm">{new Date(t.createdAt).toLocaleDateString('th-TH')}</TableTd>
                        <TableTd>
                          <Link href={`/admin/tickets/${t.id}`} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors inline-flex">
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </TableTd>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4"><Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} showTotal total={data.total} /></div>
            </>
          )}
      </main>
    </>
  );
}

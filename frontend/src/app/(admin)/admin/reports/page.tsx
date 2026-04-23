'use client';

import { useState } from 'react';
import { Download, FileBarChart2, Search, X } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { useApi } from '@/lib/hooks/useApi';
import { reportsApi, TicketReportParams } from '@/lib/api/reports';
import { useToast } from '@/components/ui/Toast';

const STATUS_OPTIONS = [
  { value: '', label: 'ทุกสถานะ' },
  { value: 'OPEN', label: 'เปิด' },
  { value: 'TRIAGED', label: 'ตรวจสอบแล้ว' },
  { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ' },
  { value: 'WAITING_CUSTOMER', label: 'รอลูกค้า' },
  { value: 'WAITING_INTERNAL', label: 'รอภายใน' },
  { value: 'RESOLVED', label: 'แก้ไขแล้ว' },
  { value: 'CLOSED', label: 'ปิด' },
  { value: 'REOPENED', label: 'เปิดใหม่' },
  { value: 'CANCELLED', label: 'ยกเลิก' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'ทุก Priority' },
  { value: 'LOW', label: 'ต่ำ' },
  { value: 'MEDIUM', label: 'ปานกลาง' },
  { value: 'HIGH', label: 'สูง' },
  { value: 'CRITICAL', label: 'วิกฤต' },
];

const STATUS_BADGE: Record<string, { variant: BadgeVariant; label: string }> = {
  OPEN: { variant: 'info', label: 'เปิด' },
  TRIAGED: { variant: 'secondary', label: 'ตรวจสอบ' },
  IN_PROGRESS: { variant: 'primary', label: 'ดำเนินการ' },
  WAITING_CUSTOMER: { variant: 'warning', label: 'รอลูกค้า' },
  WAITING_INTERNAL: { variant: 'warning', label: 'รอภายใน' },
  RESOLVED: { variant: 'success', label: 'แก้ไขแล้ว' },
  CLOSED: { variant: 'default', label: 'ปิด' },
  REOPENED: { variant: 'danger', label: 'เปิดใหม่' },
  CANCELLED: { variant: 'default', label: 'ยกเลิก' },
};

const PRIORITY_BADGE: Record<string, { variant: BadgeVariant; label: string }> = {
  LOW: { variant: 'default', label: 'ต่ำ' },
  MEDIUM: { variant: 'info', label: 'กลาง' },
  HIGH: { variant: 'warning', label: 'สูง' },
  CRITICAL: { variant: 'danger', label: 'วิกฤต' },
};

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<TicketReportParams>({ page: 1, limit: 20 });
  const [draft, setDraft] = useState({ status: '', priority: '', fromDate: '', toDate: '' });
  const [exporting, setExporting] = useState(false);

  const { data, loading } = useApi(
    () => reportsApi.tickets(filters),
    [JSON.stringify(filters)],
  );

  function applyFilters() {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      status: draft.status || undefined,
      priority: draft.priority || undefined,
      fromDate: draft.fromDate || undefined,
      toDate: draft.toDate || undefined,
    }));
  }

  function clearFilters() {
    setDraft({ status: '', priority: '', fromDate: '', toDate: '' });
    setFilters({ page: 1, limit: 20 });
  }

  async function handleExport() {
    setExporting(true);
    try {
      await reportsApi.exportCsv(filters);
      toast.success('ดาวน์โหลด CSV สำเร็จ');
    } catch {
      toast.error('ไม่สามารถ Export ได้');
    } finally {
      setExporting(false);
    }
  }

  const hasFilter = !!(draft.status || draft.priority || draft.fromDate || draft.toDate);

  return (
    <>
      <AdminHeader title="รายงาน" />
      <main className="pt-20 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileBarChart2 className="h-5 w-5 text-primary-600" />
              รายงาน Ticket
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">กรองและ Export รายงาน</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleExport}
            loading={exporting}
          >
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select
              label="สถานะ"
              options={STATUS_OPTIONS}
              value={draft.status}
              onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}
            />
            <Select
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={draft.priority}
              onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value }))}
            />
            <Input
              label="วันที่เริ่มต้น"
              type="date"
              value={draft.fromDate}
              onChange={(e) => setDraft((p) => ({ ...p, fromDate: e.target.value }))}
            />
            <Input
              label="วันที่สิ้นสุด"
              type="date"
              value={draft.toDate}
              onChange={(e) => setDraft((p) => ({ ...p, toDate: e.target.value }))}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" leftIcon={<Search className="h-3.5 w-3.5" />} onClick={applyFilters}>
              ค้นหา
            </Button>
            {hasFilter && (
              <Button size="sm" variant="ghost" leftIcon={<X className="h-3.5 w-3.5" />} onClick={clearFilters}>
                ล้าง
              </Button>
            )}
          </div>
        </Card>

        {/* Table */}
        <Card>
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : !data?.data.length ? (
            <p className="text-center py-16 text-sm text-gray-400">ไม่พบข้อมูล</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                      <th className="px-4 py-3 font-medium">Ticket No</th>
                      <th className="px-4 py-3 font-medium">หัวข้อ</th>
                      <th className="px-4 py-3 font-medium">ลูกค้า / ระบบ</th>
                      <th className="px-4 py-3 font-medium">สถานะ</th>
                      <th className="px-4 py-3 font-medium">Priority</th>
                      <th className="px-4 py-3 font-medium">SLA</th>
                      <th className="px-4 py-3 font-medium">ผู้รับผิดชอบ</th>
                      <th className="px-4 py-3 font-medium">วันที่สร้าง</th>
                      <th className="px-4 py-3 font-medium">แก้ไขแล้ว</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.data.map((t) => {
                      const slaBreached = t.slaTracking?.isFirstResponseBreached || t.slaTracking?.isResolutionBreached;
                      return (
                        <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-primary-700 whitespace-nowrap">
                            {t.ticketNumber}
                          </td>
                          <td className="px-4 py-3 max-w-[220px]">
                            <p className="truncate text-gray-800">{t.title}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            <p>{t.customer?.name ?? '-'}</p>
                            <p className="text-gray-400">{t.system?.name}</p>
                          </td>
                          <td className="px-4 py-3">
                            {STATUS_BADGE[t.status] ? (
                              <Badge variant={STATUS_BADGE[t.status].variant} size="sm">
                                {STATUS_BADGE[t.status].label}
                              </Badge>
                            ) : t.status}
                          </td>
                          <td className="px-4 py-3">
                            {PRIORITY_BADGE[t.priority] ? (
                              <Badge variant={PRIORITY_BADGE[t.priority].variant} size="sm">
                                {PRIORITY_BADGE[t.priority].label}
                              </Badge>
                            ) : t.priority}
                          </td>
                          <td className="px-4 py-3">
                            {!t.slaTracking ? (
                              <span className="text-xs text-gray-400">-</span>
                            ) : slaBreached ? (
                              <Badge variant="danger" size="sm">เกินกำหนด</Badge>
                            ) : (
                              <Badge variant="success" size="sm">ตามกำหนด</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                            {t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {new Date(t.createdAt).toLocaleDateString('th-TH')}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString('th-TH') : <span className="text-gray-400">-</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {data.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-100">
                  <Pagination
                    page={data.page}
                    totalPages={data.totalPages}
                    onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      </main>
    </>
  );
}

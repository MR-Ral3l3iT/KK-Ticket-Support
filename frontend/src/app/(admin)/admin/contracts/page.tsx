'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, FileText } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toggle } from '@/components/ui/Toggle';
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table';
import { useApi } from '@/lib/hooks/useApi';
import { contractsApi } from '@/lib/api/contracts';
import { customersApi } from '@/lib/api/customers';
import { systemsApi } from '@/lib/api/systems';
import { useToast } from '@/components/ui/Toast';
import { Contract } from '@/types/master.types';

interface ContractForm {
  name: string; customerId: string; systemId: string;
  startDate: string; endDate: string; isActive: boolean;
  frLow: string; frMedium: string; frHigh: string; frCritical: string;
  resLow: string; resMedium: string; resHigh: string; resCritical: string;
}
const emptyForm: ContractForm = {
  name: '', customerId: '', systemId: '', startDate: '', endDate: '', isActive: true,
  frLow: '480', frMedium: '240', frHigh: '60', frCritical: '30',
  resLow: '2880', resMedium: '1440', resHigh: '480', resCritical: '240',
};

function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('th-TH') : '-'; }

export default function AdminContractsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useApi(
    () => contractsApi.list({ search: query, page: String(page), limit: '20' }),
    [query, page],
  );
  const { data: customersData } = useApi(() => customersApi.list({ limit: '200' }), []);
  const { data: systemsData } = useApi(() => systemsApi.list({ limit: '200' }), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Contract | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ContractForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ContractForm, string>>>({});

  const customerOptions = (customersData?.data ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }));
  const systemOptions = (systemsData?.data ?? [])
    .filter((s) => !form.customerId || s.customerId === form.customerId)
    .map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }));

  function openForm(c: Contract | null) {
    setEditTarget(c);
    setForm(c ? {
      name: c.name, customerId: c.customerId, systemId: c.systemId,
      startDate: c.startDate.slice(0, 10), endDate: c.endDate.slice(0, 10),
      isActive: c.isActive,
      frLow: String(c.slaFirstResponseMinutes.LOW),
      frMedium: String(c.slaFirstResponseMinutes.MEDIUM),
      frHigh: String(c.slaFirstResponseMinutes.HIGH),
      frCritical: String(c.slaFirstResponseMinutes.CRITICAL),
      resLow: String(c.slaResolutionMinutes.LOW),
      resMedium: String(c.slaResolutionMinutes.MEDIUM),
      resHigh: String(c.slaResolutionMinutes.HIGH),
      resCritical: String(c.slaResolutionMinutes.CRITICAL),
    } : emptyForm);
    setErrors({});
    setFormOpen(true);
  }

  function setF(key: keyof ContractForm, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    if (key === 'customerId') setForm((f) => ({ ...f, systemId: '', [key]: val as string }));
  }

  function validate() {
    const e: Partial<Record<keyof ContractForm, string>> = {};
    if (!form.name) e.name = 'กรุณากรอกชื่อสัญญา';
    if (!form.customerId) e.customerId = 'กรุณาเลือกลูกค้า';
    if (!form.systemId) e.systemId = 'กรุณาเลือกระบบ';
    if (!form.startDate) e.startDate = 'กรุณาเลือกวันเริ่มต้น';
    if (!form.endDate) e.endDate = 'กรุณาเลือกวันสิ้นสุด';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name, customerId: form.customerId, systemId: form.systemId,
        startDate: form.startDate, endDate: form.endDate, isActive: form.isActive,
        slaFirstResponseMinutes: { LOW: +form.frLow, MEDIUM: +form.frMedium, HIGH: +form.frHigh, CRITICAL: +form.frCritical },
        slaResolutionMinutes: { LOW: +form.resLow, MEDIUM: +form.resMedium, HIGH: +form.resHigh, CRITICAL: +form.resCritical },
      };
      if (editTarget) { await contractsApi.update(editTarget.id, payload); toast.success('แก้ไขสัญญาสำเร็จ'); }
      else { await contractsApi.create(payload); toast.success('เพิ่มสัญญาสำเร็จ'); }
      setFormOpen(false); reload();
    } catch (e) { toast.error('บันทึกไม่สำเร็จ', e instanceof Error ? e.message : undefined); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await contractsApi.remove(deleteTarget.id); toast.success('ลบสัญญาสำเร็จ'); setDeleteTarget(null); reload(); }
    catch (e) { toast.error('ลบไม่สำเร็จ', e instanceof Error ? e.message : undefined); }
    finally { setDeleting(false); }
  }

  const SlaRow = ({ label, frKey, resKey }: { label: string; frKey: keyof ContractForm; resKey: keyof ContractForm }) => (
    <div className="grid grid-cols-3 gap-2 items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <Input placeholder="นาที" value={form[frKey] as string} onChange={(e) => setF(frKey, e.target.value)} hint="First Response (นาที)" />
      <Input placeholder="นาที" value={form[resKey] as string} onChange={(e) => setF(resKey, e.target.value)} hint="Resolution (นาที)" />
    </div>
  );

  return (
    <>
      <AdminHeader title="สัญญา MA" />
      <main className="pt-20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-600" />
              จัดการสัญญา MA
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">กำหนด SLA และขอบเขตการให้บริการ</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>เพิ่มสัญญา</Button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setQuery(search); setPage(1); }} className="flex gap-2 mb-4 max-w-md">
          <Input placeholder="ค้นหาชื่อสัญญา..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          <Button type="submit" variant="outline">ค้นหา</Button>
        </form>

        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          : !data?.data.length ? <EmptyState title="ยังไม่มีสัญญา" description="กด 'เพิ่มสัญญา' เพื่อเริ่มต้น" />
          : (
            <>
              <Table>
                <TableHead><TableRow><TableTh>ชื่อสัญญา</TableTh><TableTh>ลูกค้า</TableTh><TableTh>ระบบ</TableTh><TableTh>วันเริ่มต้น</TableTh><TableTh>วันสิ้นสุด</TableTh><TableTh>สถานะ</TableTh><TableTh></TableTh></TableRow></TableHead>
                <TableBody>
                  {data.data.map((c) => (
                    <TableRow key={c.id}>
                      <TableTd className="font-medium">{c.name}</TableTd>
                      <TableTd className="text-gray-500">{c.customer?.name ?? '-'}</TableTd>
                      <TableTd className="text-gray-500">{c.system?.name ?? '-'}</TableTd>
                      <TableTd className="text-gray-500">{formatDate(c.startDate)}</TableTd>
                      <TableTd className="text-gray-500">{formatDate(c.endDate)}</TableTd>
                      <TableTd><Badge variant={c.isActive ? 'success' : 'default'} dot>{c.isActive ? 'ใช้งาน' : 'หมดอายุ'}</Badge></TableTd>
                      <TableTd>
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openForm(c)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-danger-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </TableTd>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4"><Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} showTotal total={data.total} /></div>
            </>
          )}
      </main>

      {/* Form Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} size="xl" title={editTarget ? 'แก้ไขสัญญา' : 'เพิ่มสัญญาใหม่'}
        footer={<><Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>ยกเลิก</Button><Button loading={saving} onClick={handleSave}>บันทึก</Button></>}>
        <div className="flex flex-col gap-4">
          <Input label="ชื่อสัญญา" value={form.name} onChange={(e) => setF('name', e.target.value)} error={errors.name} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="ลูกค้า" options={customerOptions} value={form.customerId} onChange={(e) => setF('customerId', e.target.value)} placeholder="-- เลือกลูกค้า --" error={errors.customerId} required />
            <Select label="ระบบ" options={systemOptions} value={form.systemId} onChange={(e) => setF('systemId', e.target.value)} placeholder="-- เลือกระบบ --" error={errors.systemId} required disabled={!form.customerId} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="วันเริ่มต้น" type="date" value={form.startDate} onChange={(e) => setF('startDate', e.target.value)} error={errors.startDate} required />
            <Input label="วันสิ้นสุด" type="date" value={form.endDate} onChange={(e) => setF('endDate', e.target.value)} error={errors.endDate} required />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">SLA (นาที)</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <span className="text-xs text-gray-400">Priority</span>
              <span className="text-xs text-gray-400">First Response</span>
              <span className="text-xs text-gray-400">Resolution</span>
            </div>
            <div className="flex flex-col gap-2">
              <SlaRow label="LOW" frKey="frLow" resKey="resLow" />
              <SlaRow label="MEDIUM" frKey="frMedium" resKey="resMedium" />
              <SlaRow label="HIGH" frKey="frHigh" resKey="resHigh" />
              <SlaRow label="CRITICAL" frKey="frCritical" resKey="resCritical" />
            </div>
          </div>
          <Toggle checked={form.isActive} onChange={(v) => setF('isActive', v)} label="เปิดใช้งาน" />
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="ยืนยันการลบ" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)}>ยกเลิก</Button><Button variant="danger" loading={deleting} onClick={handleDelete}>ลบ</Button></>}>
        <p className="text-gray-600">ต้องการลบสัญญา <strong>{deleteTarget?.name}</strong> ใช่หรือไม่?</p>
      </Modal>
    </>
  );
}

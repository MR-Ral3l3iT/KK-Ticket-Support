'use client';

import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Tags } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table';
import { useApi } from '@/lib/hooks/useApi';
import { categoriesApi } from '@/lib/api/categories';
import { systemsApi } from '@/lib/api/systems';
import { useToast } from '@/components/ui/Toast';
import { Category } from '@/types/master.types';

interface CatForm { name: string; systemId: string; parentId: string; }
const emptyForm: CatForm = { name: '', systemId: '', parentId: '' };

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useApi(
    () => categoriesApi.list({ search: query, page: String(page), limit: '20' }),
    [query, page],
  );
  const { data: systemsData } = useApi(() => systemsApi.list({ limit: '200' }), []);
  const systemOptions = (systemsData?.data ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }));

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CatForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<CatForm>>({});

  const parentOptions = (data?.data ?? [])
    .filter((c) => c.systemId === form.systemId && (!editTarget || c.id !== editTarget.id))
    .map((c) => ({ value: c.id, label: c.name }));

  function openForm(c: Category | null) {
    setEditTarget(c);
    setForm(c ? { name: c.name, systemId: c.systemId, parentId: c.parentId ?? '' } : emptyForm);
    setErrors({});
    setFormOpen(true);
  }

  function setF(key: keyof CatForm, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSave() {
    const e: Partial<CatForm> = {};
    if (!form.name) e.name = 'กรุณากรอกชื่อหมวดหมู่';
    if (!form.systemId) e.systemId = 'กรุณาเลือกระบบ';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const payload = { name: form.name, systemId: form.systemId, parentId: form.parentId || undefined };
      if (editTarget) { await categoriesApi.update(editTarget.id, payload); toast.success('แก้ไขหมวดหมู่สำเร็จ'); }
      else { await categoriesApi.create(payload); toast.success('เพิ่มหมวดหมู่สำเร็จ'); }
      setFormOpen(false); reload();
    } catch (err) { toast.error('บันทึกไม่สำเร็จ', err instanceof Error ? err.message : undefined); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await categoriesApi.remove(deleteTarget.id); toast.success('ลบหมวดหมู่สำเร็จ'); setDeleteTarget(null); reload(); }
    catch (err) { toast.error('ลบไม่สำเร็จ', err instanceof Error ? err.message : undefined); }
    finally { setDeleting(false); }
  }

  return (
    <>
      <AdminHeader title="หมวดหมู่" />
      <main className="pt-20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Tags className="h-5 w-5 text-primary-600" />
              จัดการหมวดหมู่
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">หมวดหมู่ Ticket แยกตามระบบ</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>เพิ่มหมวดหมู่</Button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setQuery(search); setPage(1); }} className="flex gap-2 mb-4 max-w-md">
          <Input placeholder="ค้นหาชื่อหมวดหมู่..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          <Button type="submit" variant="outline">ค้นหา</Button>
        </form>

        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          : !data?.data.length ? <EmptyState title="ยังไม่มีหมวดหมู่" description="กด 'เพิ่มหมวดหมู่' เพื่อเริ่มต้น" />
          : (
            <>
              <Table>
                <TableHead><TableRow><TableTh>ชื่อหมวดหมู่</TableTh><TableTh>ระบบ</TableTh><TableTh>หมวดหมู่แม่</TableTh><TableTh>Tickets</TableTh><TableTh></TableTh></TableRow></TableHead>
                <TableBody>
                  {data.data.map((c) => (
                    <TableRow key={c.id}>
                      <TableTd className="font-medium">{c.parentId ? <span className="ml-4 text-gray-500">↳ {c.name}</span> : c.name}</TableTd>
                      <TableTd className="text-gray-500">{c.system?.name ?? '-'}</TableTd>
                      <TableTd className="text-gray-500">{c.parent?.name ?? '-'}</TableTd>
                      <TableTd className="text-gray-500">{c._count?.tickets ?? 0}</TableTd>
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} size="md" title={editTarget ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
        footer={<><Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>ยกเลิก</Button><Button loading={saving} onClick={handleSave}>บันทึก</Button></>}>
        <div className="flex flex-col gap-4">
          <Input label="ชื่อหมวดหมู่" value={form.name} onChange={(e) => setF('name', e.target.value)} error={errors.name} required />
          <Select label="ระบบ" options={systemOptions} value={form.systemId} onChange={(e) => setF('systemId', e.target.value)} placeholder="-- เลือกระบบ --" error={errors.systemId} required />
          <Select label="หมวดหมู่แม่ (ถ้ามี)" options={parentOptions} value={form.parentId} onChange={(e) => setF('parentId', e.target.value)} placeholder="-- ไม่มี (root) --" disabled={!form.systemId} />
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="ยืนยันการลบ" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)}>ยกเลิก</Button><Button variant="danger" loading={deleting} onClick={handleDelete}>ลบ</Button></>}>
        <p className="text-gray-600">ต้องการลบหมวดหมู่ <strong>{deleteTarget?.name}</strong> ใช่หรือไม่?</p>
      </Modal>
    </>
  );
}

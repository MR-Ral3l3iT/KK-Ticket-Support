'use client';

import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table';
import { useApi } from '@/lib/hooks/useApi';
import { teamsApi } from '@/lib/api/teams';
import { useToast } from '@/components/ui/Toast';
import { Team } from '@/types/master.types';

export default function AdminTeamsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useApi(
    () => teamsApi.list({ search: query, page: String(page), limit: '20' }),
    [query, page],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Team | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');

  function openForm(t: Team | null) {
    setEditTarget(t);
    setName(t?.name ?? '');
    setDescription(t?.description ?? '');
    setNameError('');
    setFormOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) { setNameError('กรุณากรอกชื่อทีม'); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), description: description || undefined };
      if (editTarget) { await teamsApi.update(editTarget.id, payload); toast.success('แก้ไขทีมสำเร็จ'); }
      else { await teamsApi.create(payload); toast.success('เพิ่มทีมสำเร็จ'); }
      setFormOpen(false); reload();
    } catch (e) { toast.error('บันทึกไม่สำเร็จ', e instanceof Error ? e.message : undefined); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await teamsApi.remove(deleteTarget.id); toast.success('ลบทีมสำเร็จ'); setDeleteTarget(null); reload(); }
    catch (e) { toast.error('ลบไม่สำเร็จ', e instanceof Error ? e.message : undefined); }
    finally { setDeleting(false); }
  }

  return (
    <>
      <AdminHeader title="ทีม" />
      <main className="pt-20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              จัดการทีม
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">ทีม Support ทั้งหมด</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>เพิ่มทีม</Button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setQuery(search); setPage(1); }} className="flex gap-2 mb-4 max-w-md">
          <Input placeholder="ค้นหาชื่อทีม..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          <Button type="submit" variant="outline">ค้นหา</Button>
        </form>

        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          : !data?.data.length ? <EmptyState title="ยังไม่มีทีม" description="กด 'เพิ่มทีม' เพื่อเริ่มต้น" />
          : (
            <>
              <Table>
                <TableHead><TableRow><TableTh>ชื่อทีม</TableTh><TableTh>รายละเอียด</TableTh><TableTh>สมาชิก</TableTh><TableTh></TableTh></TableRow></TableHead>
                <TableBody>
                  {data.data.map((t) => (
                    <TableRow key={t.id}>
                      <TableTd className="font-medium">{t.name}</TableTd>
                      <TableTd className="text-gray-500">{t.description ?? '-'}</TableTd>
                      <TableTd className="text-gray-500">{t._count?.members ?? 0} คน</TableTd>
                      <TableTd>
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openForm(t)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteTarget(t)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-danger-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} size="sm" title={editTarget ? 'แก้ไขทีม' : 'เพิ่มทีมใหม่'}
        footer={<><Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>ยกเลิก</Button><Button loading={saving} onClick={handleSave}>บันทึก</Button></>}>
        <div className="flex flex-col gap-4">
          <Input label="ชื่อทีม" value={name} onChange={(e) => { setName(e.target.value); setNameError(''); }} error={nameError} required />
          <Textarea label="รายละเอียด" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="ยืนยันการลบ" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)}>ยกเลิก</Button><Button variant="danger" loading={deleting} onClick={handleDelete}>ลบ</Button></>}>
        <p className="text-gray-600">ต้องการลบทีม <strong>{deleteTarget?.name}</strong> ใช่หรือไม่?</p>
      </Modal>
    </>
  );
}

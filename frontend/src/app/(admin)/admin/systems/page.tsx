'use client';

import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Server } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table';
import { useApi } from '@/lib/hooks/useApi';
import { systemsApi } from '@/lib/api/systems';
import { useToast } from '@/components/ui/Toast';
import { CustomerSystem } from '@/types/master.types';
import { SystemFormModal } from './SystemFormModal';

export default function AdminSystemsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useApi(
    () => systemsApi.list({ search: query, page: String(page), limit: '20' }),
    [query, page],
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomerSystem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerSystem | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setQuery(search); setPage(1); }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await systemsApi.remove(deleteTarget.id);
      toast.success('ลบระบบสำเร็จ');
      setDeleteTarget(null); reload();
    } catch (e) { toast.error('ลบไม่สำเร็จ', e instanceof Error ? e.message : undefined); }
    finally { setDeleting(false); }
  }

  return (
    <>
      <AdminHeader title="ระบบ" />
      <main className="pt-20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Server className="h-5 w-5 text-primary-600" />
              จัดการระบบ
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">ระบบทั้งหมดของลูกค้า</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditTarget(null); setFormOpen(true); }}>
            เพิ่มระบบ
          </Button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4 max-w-md">
          <Input placeholder="ค้นหาชื่อ / รหัสระบบ..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          <Button type="submit" variant="outline">ค้นหา</Button>
        </form>

        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          : !data?.data.length ? <EmptyState title="ยังไม่มีระบบ" description="กด 'เพิ่มระบบ' เพื่อเริ่มต้น" />
          : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableTh>รหัส</TableTh><TableTh>ชื่อระบบ</TableTh><TableTh>ลูกค้า</TableTh>
                    <TableTh>รายละเอียด</TableTh><TableTh>สถานะ</TableTh><TableTh></TableTh>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.map((s) => (
                    <TableRow key={s.id}>
                      <TableTd><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{s.code}</span></TableTd>
                      <TableTd className="font-medium">{s.name}</TableTd>
                      <TableTd className="text-gray-500">{s.customer?.name ?? '-'}</TableTd>
                      <TableTd className="text-gray-500 max-w-xs truncate">{s.description ?? '-'}</TableTd>
                      <TableTd><Badge variant={s.isActive ? 'success' : 'default'} dot>{s.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}</Badge></TableTd>
                      <TableTd>
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => { setEditTarget(s); setFormOpen(true); }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-danger-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
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

      <SystemFormModal open={formOpen} system={editTarget} onClose={() => setFormOpen(false)} onSuccess={() => { setFormOpen(false); reload(); }} />
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="ยืนยันการลบ" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)}>ยกเลิก</Button><Button variant="danger" loading={deleting} onClick={handleDelete}>ลบ</Button></>}>
        <p className="text-gray-600">ต้องการลบระบบ <strong>{deleteTarget?.name}</strong> ใช่หรือไม่?</p>
      </Modal>
    </>
  );
}

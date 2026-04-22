'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, ChevronRight, Users } from 'lucide-react';
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
import { customersApi } from '@/lib/api/customers';
import { useToast } from '@/components/ui/Toast';
import { Customer } from '@/types/master.types';
import { CustomerFormModal } from './CustomerFormModal';

export default function AdminCustomersPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');

  const { data, loading, reload } = useApi(
    () => customersApi.list({ search: query, page: String(page), limit: '20' }),
    [query, page],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openCreate() { setEditTarget(null); setFormOpen(true); }
  function openEdit(c: Customer) { setEditTarget(c); setFormOpen(true); }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await customersApi.remove(deleteTarget.id);
      toast.success('ลบลูกค้าสำเร็จ');
      setDeleteTarget(null);
      reload();
    } catch (e) {
      toast.error('ลบไม่สำเร็จ', e instanceof Error ? e.message : undefined);
    } finally {
      setDeleting(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search);
    setPage(1);
  }

  return (
    <>
      <AdminHeader title="ลูกค้า" />
      <main className="pt-20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              จัดการลูกค้า
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">ข้อมูลบริษัทลูกค้าทั้งหมด</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            เพิ่มลูกค้า
          </Button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4 max-w-md">
          <Input
            placeholder="ค้นหาชื่อ / รหัสลูกค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Button type="submit" variant="outline">ค้นหา</Button>
        </form>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : !data?.data.length ? (
          <EmptyState title="ยังไม่มีข้อมูลลูกค้า" description="กด 'เพิ่มลูกค้า' เพื่อเริ่มต้น" />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>รหัส</TableTh>
                  <TableTh>ชื่อลูกค้า</TableTh>
                  <TableTh>อีเมล</TableTh>
                  <TableTh>เบอร์โทร</TableTh>
                  <TableTh>สถานะ</TableTh>
                  <TableTh>ระบบ</TableTh>
                  <TableTh></TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.map((c) => (
                  <TableRow key={c.id}>
                    <TableTd>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{c.code}</span>
                    </TableTd>
                    <TableTd>
                      <Link href={`/admin/customers/${c.id}`} className="font-medium text-primary hover:underline">
                        {c.name}
                      </Link>
                    </TableTd>
                    <TableTd className="text-gray-500">{c.email ?? '-'}</TableTd>
                    <TableTd className="text-gray-500">{c.phone ?? '-'}</TableTd>
                    <TableTd>
                      <Badge variant={c.isActive ? 'success' : 'default'} dot>
                        {c.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </Badge>
                    </TableTd>
                    <TableTd className="text-gray-500">{c._count?.systems ?? '-'} ระบบ</TableTd>
                    <TableTd>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-danger-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <Link href={`/admin/customers/${c.id}`} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </TableTd>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} showTotal total={data.total} />
            </div>
          </>
        )}
      </main>

      {/* Create/Edit Modal */}
      <CustomerFormModal
        open={formOpen}
        customer={editTarget}
        onClose={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); reload(); }}
      />

      {/* Delete Confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="ยืนยันการลบ"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>ยกเลิก</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>ลบ</Button>
          </>
        }
      >
        <p className="text-gray-600">ต้องการลบลูกค้า <strong className="text-gray-900">{deleteTarget?.name}</strong> ใช่หรือไม่?</p>
        <p className="text-sm text-gray-400 mt-1">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
      </Modal>
    </>
  );
}

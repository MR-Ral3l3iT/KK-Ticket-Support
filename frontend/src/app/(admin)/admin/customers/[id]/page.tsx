'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table';
import { useApi } from '@/lib/hooks/useApi';
import { customersApi } from '@/lib/api/customers';
import { systemsApi } from '@/lib/api/systems';
import { useToast } from '@/components/ui/Toast';
import { CustomerSystem } from '@/types/master.types';
import { SystemFormModal } from '../../systems/SystemFormModal';

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const { data: customer, loading } = useApi(() => customersApi.get(params.id), [params.id]);
  const { data: systemsData, loading: systemsLoading, reload: reloadSystems } = useApi(
    () => systemsApi.list({ customerId: params.id, limit: '100' }),
    [params.id],
  );

  const [systemFormOpen, setSystemFormOpen] = useState(false);
  const [editSystem, setEditSystem] = useState<CustomerSystem | null>(null);
  const [deleteSystem, setDeleteSystem] = useState<CustomerSystem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteSystem() {
    if (!deleteSystem) return;
    setDeleting(true);
    try {
      await systemsApi.remove(deleteSystem.id);
      toast.success('ลบระบบสำเร็จ');
      setDeleteSystem(null);
      reloadSystems();
    } catch (e) {
      toast.error('ลบไม่สำเร็จ', e instanceof Error ? e.message : undefined);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <><AdminHeader title="รายละเอียดลูกค้า" /><div className="pt-20 p-6"><Spinner /></div></>;
  if (!customer) return null;

  return (
    <>
      <AdminHeader title="รายละเอียดลูกค้า" />
      <main className="pt-20 p-6 max-w-5xl">
        <Link href="/admin/customers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4" /> กลับ
        </Link>

        {/* Customer Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{customer.code}</span>
                <Badge variant={customer.isActive ? 'success' : 'default'} dot>
                  {customer.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                </Badge>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary-600" />
                {customer.name}
              </h2>
            </div>
          </CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'อีเมล', value: customer.email },
              { label: 'เบอร์โทร', value: customer.phone },
              { label: 'เลขผู้เสียภาษี', value: customer.taxId },
              { label: 'ที่อยู่', value: customer.address },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-gray-400 text-xs mb-0.5">{f.label}</p>
                <p className="text-gray-700">{f.value ?? '-'}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Systems */}
        <Card>
          <CardHeader>
            <CardTitle>ระบบทั้งหมด ({systemsData?.total ?? 0})</CardTitle>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditSystem(null); setSystemFormOpen(true); }}>
              เพิ่มระบบ
            </Button>
          </CardHeader>

          {systemsLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : !systemsData?.data.length ? (
            <EmptyState title="ยังไม่มีระบบ" description="กด 'เพิ่มระบบ' เพื่อเพิ่มระบบให้ลูกค้านี้" />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>รหัส</TableTh>
                  <TableTh>ชื่อระบบ</TableTh>
                  <TableTh>รายละเอียด</TableTh>
                  <TableTh>สถานะ</TableTh>
                  <TableTh></TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {systemsData.data.map((s) => (
                  <TableRow key={s.id}>
                    <TableTd><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{s.code}</span></TableTd>
                    <TableTd className="font-medium">{s.name}</TableTd>
                    <TableTd className="text-gray-500 max-w-xs truncate">{s.description ?? '-'}</TableTd>
                    <TableTd>
                      <Badge variant={s.isActive ? 'success' : 'default'} dot>
                        {s.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </Badge>
                    </TableTd>
                    <TableTd>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => { setEditSystem(s); setSystemFormOpen(true); }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteSystem(s)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-danger-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableTd>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </main>

      <SystemFormModal
        open={systemFormOpen}
        system={editSystem}
        defaultCustomerId={params.id}
        onClose={() => setSystemFormOpen(false)}
        onSuccess={() => { setSystemFormOpen(false); reloadSystems(); }}
      />

      <Modal
        open={!!deleteSystem} onClose={() => setDeleteSystem(null)} title="ยืนยันการลบระบบ" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteSystem(null)}>ยกเลิก</Button>
            <Button variant="danger" loading={deleting} onClick={handleDeleteSystem}>ลบ</Button>
          </>
        }
      >
        <p className="text-gray-600">ต้องการลบระบบ <strong>{deleteSystem?.name}</strong> ใช่หรือไม่?</p>
      </Modal>
    </>
  );
}

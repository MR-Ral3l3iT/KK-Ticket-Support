'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, KeyRound, UserCog } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { Avatar } from '@/components/ui/Avatar';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table';
import { useApi } from '@/lib/hooks/useApi';
import { usersApi, CreateUserDto, UpdateUserDto } from '@/lib/api/users';
import { customersApi } from '@/lib/api/customers';
import { teamsApi } from '@/lib/api/teams';
import { useToast } from '@/components/ui/Toast';
import { UserListItem } from '@/types/master.types';

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'SUPPORT_ADMIN', label: 'Support Admin' },
  { value: 'SUPPORT_AGENT', label: 'Support Agent' },
  { value: 'CUSTOMER_ADMIN', label: 'Customer Admin' },
  { value: 'CUSTOMER_USER', label: 'Customer User' },
];

const ROLE_BADGE: Record<string, { variant: 'primary' | 'secondary' | 'info' | 'warning' | 'default'; label: string }> = {
  SUPER_ADMIN: { variant: 'primary', label: 'Super Admin' },
  SUPPORT_ADMIN: { variant: 'secondary', label: 'Support Admin' },
  SUPPORT_AGENT: { variant: 'info', label: 'Support Agent' },
  CUSTOMER_ADMIN: { variant: 'warning', label: 'Customer Admin' },
  CUSTOMER_USER: { variant: 'default', label: 'Customer User' },
};

interface UserForm {
  email: string; password: string; firstName: string; lastName: string;
  phone: string; role: string; customerId: string; teamId: string; isActive: boolean;
}
const emptyForm: UserForm = { email: '', password: '', firstName: '', lastName: '', phone: '', role: 'SUPPORT_AGENT', customerId: '', teamId: '', isActive: true };

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useApi(() => usersApi.list({ search: query, page: String(page), limit: '20' }), [query, page]);
  const { data: customersData } = useApi(() => customersApi.list({ limit: '200' }), []);
  const { data: teamsData } = useApi(() => teamsApi.list({ limit: '200' }), []);

  const customerOptions = (customersData?.data ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }));
  const teamOptions = (teamsData?.data ?? []).map((t) => ({ value: t.id, label: t.name }));

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [pwTarget, setPwTarget] = useState<UserListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<UserForm>>({});
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const isCustomerRole = ['CUSTOMER_ADMIN', 'CUSTOMER_USER'].includes(form.role);
  const isSupportRole = ['SUPPORT_AGENT'].includes(form.role);

  function openForm(u: UserListItem | null) {
    setEditTarget(u);
    setForm(u ? { email: u.email, password: '', firstName: u.firstName, lastName: u.lastName, phone: u.phone ?? '', role: u.role, customerId: u.customerId ?? '', teamId: u.teamId ?? '', isActive: u.isActive } : emptyForm);
    setErrors({});
    setFormOpen(true);
  }

  function setF(key: keyof UserForm, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSave() {
    const e: Partial<UserForm> = {};
    if (!form.email) e.email = 'กรุณากรอกอีเมล';
    if (!editTarget && !form.password) e.password = 'กรุณากรอกรหัสผ่าน';
    if (!form.firstName) e.firstName = 'กรุณากรอกชื่อ';
    if (!form.lastName) e.lastName = 'กรุณากรอกนามสกุล';
    if (!form.role) e.role = 'กรุณาเลือก Role';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      if (editTarget) {
        const payload: UpdateUserDto = { firstName: form.firstName, lastName: form.lastName, phone: form.phone || undefined, role: form.role, isActive: form.isActive, customerId: isCustomerRole ? form.customerId || undefined : undefined, teamId: isSupportRole ? form.teamId || undefined : undefined };
        await usersApi.update(editTarget.id, payload);
        toast.success('แก้ไขผู้ใช้งานสำเร็จ');
      } else {
        const payload: CreateUserDto = { email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName, phone: form.phone || undefined, role: form.role, customerId: isCustomerRole ? form.customerId || undefined : undefined, teamId: isSupportRole ? form.teamId || undefined : undefined };
        await usersApi.create(payload);
        toast.success('เพิ่มผู้ใช้งานสำเร็จ');
      }
      setFormOpen(false); reload();
    } catch (err) { toast.error('บันทึกไม่สำเร็จ', err instanceof Error ? err.message : undefined); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await usersApi.remove(deleteTarget.id); toast.success('ลบผู้ใช้งานสำเร็จ'); setDeleteTarget(null); reload(); }
    catch (err) { toast.error('ลบไม่สำเร็จ', err instanceof Error ? err.message : undefined); }
    finally { setDeleting(false); }
  }

  async function handleResetPassword() {
    if (!pwTarget || !newPassword) return;
    setPwSaving(true);
    try { await usersApi.resetPassword(pwTarget.id, newPassword); toast.success('รีเซ็ตรหัสผ่านสำเร็จ'); setPwTarget(null); setNewPassword(''); }
    catch (err) { toast.error('รีเซ็ตไม่สำเร็จ', err instanceof Error ? err.message : undefined); }
    finally { setPwSaving(false); }
  }

  return (
    <>
      <AdminHeader title="ผู้ใช้งาน" />
      <main className="pt-20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary-600" />
              จัดการผู้ใช้งาน
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">ผู้ใช้งานทั้งหมดในระบบ</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>เพิ่มผู้ใช้งาน</Button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setQuery(search); setPage(1); }} className="flex gap-2 mb-4 max-w-md">
          <Input placeholder="ค้นหาชื่อ / อีเมล..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          <Button type="submit" variant="outline">ค้นหา</Button>
        </form>

        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          : !data?.data.length ? <EmptyState title="ยังไม่มีผู้ใช้งาน" description="กด 'เพิ่มผู้ใช้งาน' เพื่อเริ่มต้น" />
          : (
            <>
              <Table>
                <TableHead><TableRow><TableTh>ผู้ใช้งาน</TableTh><TableTh>Role</TableTh><TableTh>ลูกค้า / ทีม</TableTh><TableTh>สถานะ</TableTh><TableTh></TableTh></TableRow></TableHead>
                <TableBody>
                  {data.data.map((u) => {
                    const rb = ROLE_BADGE[u.role] ?? { variant: 'default' as const, label: u.role };
                    return (
                      <TableRow key={u.id}>
                        <TableTd>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" />
                            <div>
                              <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                          </div>
                        </TableTd>
                        <TableTd><Badge variant={rb.variant}>{rb.label}</Badge></TableTd>
                        <TableTd className="text-gray-500 text-sm">{u.customer?.name ?? u.team?.name ?? '-'}</TableTd>
                        <TableTd><Badge variant={u.isActive ? 'success' : 'default'} dot>{u.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}</Badge></TableTd>
                        <TableTd>
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => setPwTarget(u)} title="รีเซ็ตรหัสผ่าน" className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><KeyRound className="h-4 w-4" /></button>
                            <button onClick={() => openForm(u)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-danger-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                          </div>
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

      {/* User Form Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} size="lg" title={editTarget ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
        footer={<><Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>ยกเลิก</Button><Button loading={saving} onClick={handleSave}>บันทึก</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="ชื่อ" value={form.firstName} onChange={(e) => setF('firstName', e.target.value)} error={errors.firstName} required />
          <Input label="นามสกุล" value={form.lastName} onChange={(e) => setF('lastName', e.target.value)} error={errors.lastName} required />
          <Input label="อีเมล" type="email" value={form.email} onChange={(e) => setF('email', e.target.value)} error={errors.email} required disabled={!!editTarget} />
          <Input label="เบอร์โทร" value={form.phone} onChange={(e) => setF('phone', e.target.value)} />
          {!editTarget && <Input label="รหัสผ่าน" type="password" value={form.password} onChange={(e) => setF('password', e.target.value)} error={errors.password} required />}
          <Select label="Role" options={ROLE_OPTIONS} value={form.role} onChange={(e) => setF('role', e.target.value)} error={errors.role} required />
          {isCustomerRole && <Select label="ลูกค้า" options={customerOptions} value={form.customerId} onChange={(e) => setF('customerId', e.target.value)} placeholder="-- เลือกลูกค้า --" />}
          {isSupportRole && <Select label="ทีม" options={teamOptions} value={form.teamId} onChange={(e) => setF('teamId', e.target.value)} placeholder="-- เลือกทีม --" />}
          {editTarget && (
            <div className="col-span-2">
              <Toggle checked={form.isActive} onChange={(v) => setF('isActive', v)} label="เปิดใช้งาน" />
            </div>
          )}
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={!!pwTarget} onClose={() => { setPwTarget(null); setNewPassword(''); }} size="sm" title="รีเซ็ตรหัสผ่าน"
        footer={<><Button variant="ghost" onClick={() => { setPwTarget(null); setNewPassword(''); }}>ยกเลิก</Button><Button loading={pwSaving} onClick={handleResetPassword} disabled={!newPassword}>ยืนยัน</Button></>}>
        <p className="text-sm text-gray-600 mb-4">รีเซ็ตรหัสผ่านของ <strong>{pwTarget?.firstName} {pwTarget?.lastName}</strong></p>
        <Input label="รหัสผ่านใหม่" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="ยืนยันการลบ" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)}>ยกเลิก</Button><Button variant="danger" loading={deleting} onClick={handleDelete}>ลบ</Button></>}>
        <p className="text-gray-600">ต้องการลบผู้ใช้งาน <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong> ใช่หรือไม่?</p>
      </Modal>
    </>
  );
}

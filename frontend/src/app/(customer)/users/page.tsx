'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Pencil, Users, KeyRound, Trash2 } from 'lucide-react';
import { useAuthContext } from '@/lib/context/AuthContext';
import { useApi } from '@/lib/hooks/useApi';
import { usersApi, CreateUserDto, UpdateUserDto } from '@/lib/api/users';
import { useToast } from '@/components/ui/Toast';
import { UserListItem } from '@/types/master.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Toggle } from '@/components/ui/Toggle';
import { Avatar } from '@/components/ui/Avatar';
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table';

interface UserForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
}

const emptyForm: UserForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  isActive: true,
};

export default function CustomerUsersPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading, reload } = useApi(
    () => usersApi.list({ search: query, page: String(page), limit: '20', role: 'CUSTOMER_USER' }),
    [query, page],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [pwTarget, setPwTarget] = useState<UserListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<UserForm>>({});

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'CUSTOMER_ADMIN') router.replace('/dashboard');
  }, [user, router]);

  function openForm(target: UserListItem | null) {
    setEditTarget(target);
    setForm(target ? {
      email: target.email,
      password: '',
      firstName: target.firstName,
      lastName: target.lastName,
      phone: target.phone ?? '',
      isActive: target.isActive,
    } : emptyForm);
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
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      if (editTarget) {
        const payload: UpdateUserDto = {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
          role: 'CUSTOMER_USER',
          isActive: form.isActive,
        };
        await usersApi.update(editTarget.id, payload);
        toast.success('แก้ไขผู้ใช้งานสำเร็จ');
      } else {
        const payload: CreateUserDto = {
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
          role: 'CUSTOMER_USER',
        };
        await usersApi.create(payload);
        toast.success('เพิ่มผู้ใช้งานสำเร็จ');
      }
      setFormOpen(false);
      reload();
    } catch (err) {
      toast.error('บันทึกไม่สำเร็จ', err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.remove(deleteTarget.id);
      toast.success('ลบผู้ใช้งานสำเร็จ');
      setDeleteTarget(null);
      reload();
    } catch (err) {
      toast.error('ลบไม่สำเร็จ', err instanceof Error ? err.message : undefined);
    } finally {
      setDeleting(false);
    }
  }

  async function handleResetPassword() {
    if (!pwTarget || !newPassword) return;
    setPwSaving(true);
    try {
      await usersApi.resetPassword(pwTarget.id, newPassword);
      toast.success('รีเซ็ตรหัสผ่านสำเร็จ');
      setPwTarget(null);
      setNewPassword('');
    } catch (err) {
      toast.error('รีเซ็ตไม่สำเร็จ', err instanceof Error ? err.message : undefined);
    } finally {
      setPwSaving(false);
    }
  }

  if (user?.role !== 'CUSTOMER_ADMIN') return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            จัดการผู้ใช้งาน
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">เพิ่มและแก้ไขผู้ใช้งานในบริษัทของคุณ</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>
          เพิ่มผู้ใช้งาน
        </Button>
      </div>

      <Card>
        <form
          onSubmit={(e) => { e.preventDefault(); setQuery(search); setPage(1); }}
          className="flex gap-2 max-w-md"
        >
          <Input
            placeholder="ค้นหาชื่อ / อีเมล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Button type="submit" variant="outline">ค้นหา</Button>
        </form>
      </Card>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !data?.data.length ? (
        <EmptyState title="ยังไม่มีผู้ใช้งาน" description="กด 'เพิ่มผู้ใช้งาน' เพื่อเริ่มต้น" />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>ผู้ใช้งาน</TableTh>
                <TableTh>อีเมล</TableTh>
                <TableTh>สถานะ</TableTh>
                <TableTh></TableTh>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.data.map((u) => (
                <TableRow key={u.id}>
                  <TableTd>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" />
                      <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                    </div>
                  </TableTd>
                  <TableTd className="text-gray-500 text-sm">{u.email}</TableTd>
                  <TableTd>
                    <Badge variant={u.isActive ? 'success' : 'default'} dot>{u.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}</Badge>
                  </TableTd>
                  <TableTd>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setPwTarget(u)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        title="รีเซ็ตรหัสผ่าน"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openForm(u)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        title="แก้ไข"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-danger-600 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableTd>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100">
              <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} showTotal total={data.total} />
            </div>
          )}
        </Card>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="md"
        title={editTarget ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>ยกเลิก</Button>
            <Button loading={saving} onClick={handleSave}>บันทึก</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="ชื่อ" value={form.firstName} onChange={(e) => setF('firstName', e.target.value)} error={errors.firstName} required />
          <Input label="นามสกุล" value={form.lastName} onChange={(e) => setF('lastName', e.target.value)} error={errors.lastName} required />
          <Input
            label="อีเมล"
            type="email"
            value={form.email}
            onChange={(e) => setF('email', e.target.value)}
            error={errors.email}
            required
            disabled={!!editTarget}
          />
          <Input label="เบอร์โทร" value={form.phone} onChange={(e) => setF('phone', e.target.value)} />
          {!editTarget && (
            <Input
              label="รหัสผ่าน"
              type="password"
              value={form.password}
              onChange={(e) => setF('password', e.target.value)}
              error={errors.password}
              required
            />
          )}
          {editTarget && (
            <div className="col-span-2">
              <Toggle checked={form.isActive} onChange={(v) => setF('isActive', v)} label="เปิดใช้งาน" />
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!pwTarget}
        onClose={() => { setPwTarget(null); setNewPassword(''); }}
        size="sm"
        title="รีเซ็ตรหัสผ่าน"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setPwTarget(null); setNewPassword(''); }}>ยกเลิก</Button>
            <Button loading={pwSaving} onClick={handleResetPassword} disabled={!newPassword}>ยืนยัน</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          รีเซ็ตรหัสผ่านของ <strong>{pwTarget?.firstName} {pwTarget?.lastName}</strong>
        </p>
        <Input label="รหัสผ่านใหม่" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
      </Modal>

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
        <p className="text-gray-600">
          ต้องการลบผู้ใช้งาน <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong> ใช่หรือไม่?
        </p>
      </Modal>
    </div>
  );
}

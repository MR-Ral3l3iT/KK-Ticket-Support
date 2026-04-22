'use client';

import { useState, useEffect } from 'react';
import { User, Lock, Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Divider } from '@/components/ui/Divider';
import { useToast } from '@/components/ui/Toast';
import { useAuthContext } from '@/lib/context/AuthContext';
import { customerPortalApi } from '@/lib/api/customer-portal';

export default function CustomerProfilePage() {
  const { user } = useAuthContext();
  const { toast } = useToast();

  // Profile form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setPhone((user as any).phone ?? '');
    }
  }, [user]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'กรุณาระบุชื่อ';
    if (!lastName.trim()) errs.lastName = 'กรุณาระบุนามสกุล';
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setProfileErrors({});
    setProfileLoading(true);
    try {
      await customerPortalApi.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() || undefined });
      toast.success('บันทึกข้อมูลสำเร็จ');
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = 'กรุณาระบุรหัสผ่านปัจจุบัน';
    if (!newPassword || newPassword.length < 8) errs.newPassword = 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    if (Object.keys(errs).length) { setPasswordErrors(errs); return; }
    setPasswordErrors({});
    setPasswordLoading(true);
    try {
      await customerPortalApi.changePassword(currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
    } catch {
      toast.error('รหัสผ่านปัจจุบันไม่ถูกต้อง');
    } finally {
      setPasswordLoading(false);
    }
  }

  const fullName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          โปรไฟล์
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">จัดการข้อมูลส่วนตัวและความปลอดภัย</p>
      </div>

      {/* Profile info */}
      <Card>
        <div className="flex items-center gap-4 mb-5">
          <Avatar name={fullName} size="lg" />
          <div>
            <p className="font-semibold text-gray-900">{fullName}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">{(user as any)?.role}</p>
          </div>
        </div>
        <Divider className="mb-5" />

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                ชื่อ <span className="text-danger-500">*</span>
              </label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={profileErrors.firstName}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                นามสกุล <span className="text-danger-500">*</span>
              </label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={profileErrors.lastName}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมล</label>
            <Input value={user?.email ?? ''} disabled />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์</label>
            <Input
              type="tel"
              placeholder="0812345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" loading={profileLoading} leftIcon={<Save className="h-4 w-4" />}>
              บันทึกข้อมูล
            </Button>
          </div>
        </form>
      </Card>

      {/* Change password */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-gray-500" />
          เปลี่ยนรหัสผ่าน
        </h2>

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสผ่านปัจจุบัน</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={passwordErrors.currentPassword}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสผ่านใหม่</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={passwordErrors.newPassword}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={passwordErrors.confirmPassword}
              autoComplete="new-password"
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" variant="outline" loading={passwordLoading} leftIcon={<Lock className="h-4 w-4" />}>
              เปลี่ยนรหัสผ่าน
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

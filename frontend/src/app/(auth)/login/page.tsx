'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Ticket } from 'lucide-react';
import { useAuthContext } from '@/lib/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthContext();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email) e.email = 'กรุณากรอกอีเมล';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (!password) e.password = 'กรุณากรอกรหัสผ่าน';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      let user;
      try {
        user = await login(email.trim(), password);
      } catch (firstErr) {
        // Common copy/paste issue for demo accounts: accidental leading/trailing spaces.
        if (password !== password.trim()) {
          user = await login(email.trim(), password.trim());
        } else {
          throw firstErr;
        }
      }
      const isAdmin = ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'SUPPORT_AGENT'].includes(user.role);
      const target = isAdmin ? '/admin/dashboard' : '/dashboard';
      // Use full-page navigation to avoid occasional client-router no-op after login.
      window.location.assign(target);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ';
      toast.error('เข้าสู่ระบบไม่สำเร็จ', msg === 'Login failed' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/20 backdrop-blur mb-4">
          <Ticket className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Ticket Support MA</h1>
        <p className="text-primary-200 mt-1 text-sm">ระบบจัดการ Ticket สำหรับงาน Maintenance</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-modal p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">เข้าสู่ระบบ</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="อีเมล"
            type="email"
            placeholder="example@company.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
            error={errors.email}
            required
            autoComplete="email"
            autoFocus
          />

          <Input
            label="รหัสผ่าน"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
            error={errors.password}
            required
            autoComplete="current-password"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="pointer-events-auto text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <Button type="submit" loading={loading} fullWidth className="mt-2">
            เข้าสู่ระบบ
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-primary-300 mt-6">
        © {new Date().getFullYear()} Korrakang Works · Ticket Support MA
      </p>
    </div>
  );
}

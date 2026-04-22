'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/context/AuthContext';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { SpinnerPage } from '@/components/ui/Spinner';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'SUPPORT_AGENT'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (!ADMIN_ROLES.includes(user.role)) router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return <SpinnerPage />;
  if (!user || !ADMIN_ROLES.includes(user.role)) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="pl-60">
        {children}
      </div>
    </div>
  );
}

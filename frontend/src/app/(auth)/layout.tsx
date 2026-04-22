'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/context/AuthContext';
import { SpinnerPage } from '@/components/ui/Spinner';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const isAdmin = ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'SUPPORT_AGENT'].includes(user.role);
      router.replace(isAdmin ? '/admin/dashboard' : '/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return <SpinnerPage />;
  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-800 to-secondary-600 flex items-center justify-center p-4">
      {children}
    </div>
  );
}

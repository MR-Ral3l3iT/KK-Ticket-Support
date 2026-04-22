'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/context/AuthContext';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { SpinnerPage } from '@/components/ui/Spinner';

const CUSTOMER_ROLES = ['CUSTOMER_ADMIN', 'CUSTOMER_USER'];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (!CUSTOMER_ROLES.includes(user.role)) router.replace('/admin/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return <SpinnerPage />;
  if (!user || !CUSTOMER_ROLES.includes(user.role)) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader />
      <div className="pt-16">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}

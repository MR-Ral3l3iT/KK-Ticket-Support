'use client';

import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { BarChart3, FileBarChart2 } from 'lucide-react';

export default function AdminReportsPage() {
  return (
    <>
      <AdminHeader title="รายงาน" />
      <main className="pt-20 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FileBarChart2 className="h-5 w-5 text-primary-600" />
            รายงาน
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">สรุปผลการดำเนินงานและ SLA</p>
        </div>
        <Card>
          <EmptyState
            icon={<BarChart3 className="h-7 w-7" />}
            title="รายงานอยู่ระหว่างพัฒนา"
            description="ฟีเจอร์ Chart และ Export จะพร้อมใช้งานใน Sprint ถัดไป"
          />
        </Card>
      </main>
    </>
  );
}

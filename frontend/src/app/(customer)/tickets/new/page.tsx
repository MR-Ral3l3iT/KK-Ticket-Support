'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Divider } from '@/components/ui/Divider';
import { FileUploader } from '@/components/tickets/FileUploader';
import { useApi } from '@/lib/hooks/useApi';
import { useToast } from '@/components/ui/Toast';
import { customerPortalApi, CustomerSystem, CustomerCategory } from '@/lib/api/customer-portal';

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'LOW — ปัญหาทั่วไป ไม่กระทบการใช้งาน' },
  { value: 'MEDIUM', label: 'MEDIUM — มีผลกระทบบ้าง แต่ยังใช้งานได้' },
  { value: 'HIGH', label: 'HIGH — กระทบการใช้งานหลัก' },
  { value: 'CRITICAL', label: 'CRITICAL — ระบบหยุดทำงาน / งดใช้บริการ' },
];

export default function NewTicketPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [systemId, setSystemId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: systems, loading: systemsLoading } = useApi(() => customerPortalApi.getSystems(), []);
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    if (!systemId) { setCategories([]); setCategoryId(''); return; }
    setCategoriesLoading(true);
    customerPortalApi.getCategories(systemId)
      .then((res) => { setCategories(res); setCategoryId(''); })
      .finally(() => setCategoriesLoading(false));
  }, [systemId]);

  const systemOptions = [
    { value: '', label: 'เลือกระบบ...' },
    ...(systems ?? []).map((s: CustomerSystem) => ({ value: s.id, label: s.name })),
  ];

  const categoryOptions = [
    { value: '', label: categoriesLoading ? 'กำลังโหลด...' : 'เลือกหมวดหมู่ (ไม่บังคับ)' },
    ...categories.map((c) => ({
      value: c.id,
      label: c.parent ? `${c.parent.name} › ${c.name}` : c.name,
    })),
  ];

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'กรุณาระบุหัวข้อ Ticket';
    if (!description.trim()) e.description = 'กรุณาระบุรายละเอียด';
    if (!systemId) e.systemId = 'กรุณาเลือกระบบ';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const ticket = await customerPortalApi.createTicket({
        title: title.trim(),
        description: description.trim(),
        systemId,
        ...(categoryId && { categoryId }),
        priority: priority as any,
      });

      // Upload attachments after ticket is created
      if (pendingFiles.length > 0) {
        try {
          await customerPortalApi.uploadAttachments(ticket.id, pendingFiles);
        } catch {
          toast.warning('สร้าง Ticket สำเร็จ แต่อัปโหลดไฟล์แนบบางส่วนไม่สำเร็จ');
          router.push(`/tickets/${ticket.id}`);
          return;
        }
      }

      toast.success('สร้าง Ticket สำเร็จ');
      router.push(`/tickets/${ticket.id}`);
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/tickets" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">สร้าง Ticket ใหม่</h1>
          <p className="text-sm text-gray-500 mt-0.5">แจ้งปัญหาหรือขอความช่วยเหลือจากทีมสนับสนุน</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* System */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ระบบที่เกี่ยวข้อง <span className="text-danger-500">*</span>
            </label>
            <Select
              options={systemOptions}
              value={systemId}
              onChange={(e) => setSystemId(e.target.value)}
              disabled={systemsLoading}
            />
            {errors.systemId && <p className="mt-1 text-xs text-danger-600">{errors.systemId}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">หมวดหมู่</label>
            <Select
              options={categoryOptions}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!systemId || categoriesLoading}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ระดับความสำคัญ <span className="text-danger-500">*</span>
            </label>
            <Select
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              หัวข้อปัญหา <span className="text-danger-500">*</span>
            </label>
            <Input
              placeholder="อธิบายปัญหาสั้นๆ เช่น 'ไม่สามารถเข้าสู่ระบบได้'"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              รายละเอียด <span className="text-danger-500">*</span>
            </label>
            <Textarea
              rows={6}
              placeholder="อธิบายรายละเอียดปัญหา ขั้นตอนที่ทำให้เกิดปัญหา ข้อความ error ที่พบ ฯลฯ"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors.description}
            />
          </div>

          {/* Attachments */}
          <div>
            <Divider className="mb-4" />
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ไฟล์แนบ <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
            </label>
            <FileUploader
              onFilesSelected={(files) => setPendingFiles((prev) => [...prev, ...files])}
              disabled={submitting}
            />
            {pendingFiles.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                เลือกแล้ว {pendingFiles.length} ไฟล์ — จะอัปโหลดหลังจากสร้าง Ticket สำเร็จ
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Link href="/tickets">
              <Button type="button" variant="outline">ยกเลิก</Button>
            </Link>
            <Button type="submit" loading={submitting} leftIcon={<Send className="h-4 w-4" />}>
              ส่ง Ticket
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

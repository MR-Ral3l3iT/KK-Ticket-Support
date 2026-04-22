'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { customersApi } from '@/lib/api/customers';
import { useToast } from '@/components/ui/Toast';
import { Customer } from '@/types/master.types';

interface Props {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  name: string; code: string; taxId: string;
  email: string; phone: string; address: string; isActive: boolean;
}

const empty: FormState = { name: '', code: '', taxId: '', email: '', phone: '', address: '', isActive: true };

export function CustomerFormModal({ open, customer, onClose, onSuccess }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(customer ? {
        name: customer.name, code: customer.code, taxId: customer.taxId ?? '',
        email: customer.email ?? '', phone: customer.phone ?? '',
        address: customer.address ?? '', isActive: customer.isActive,
      } : empty);
      setErrors({});
    }
  }, [open, customer]);

  function set(key: keyof FormState, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = 'กรุณากรอกชื่อลูกค้า';
    if (!form.code.trim()) e.code = 'กรุณากรอกรหัสลูกค้า';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), code: form.code.trim().toUpperCase(),
        taxId: form.taxId || undefined, email: form.email || undefined,
        phone: form.phone || undefined, address: form.address || undefined,
        isActive: form.isActive,
      };
      if (customer) {
        await customersApi.update(customer.id, payload);
        toast.success('แก้ไขข้อมูลลูกค้าสำเร็จ');
      } else {
        await customersApi.create(payload);
        toast.success('เพิ่มลูกค้าสำเร็จ');
      }
      onSuccess();
    } catch (e) {
      toast.error('บันทึกไม่สำเร็จ', e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open} onClose={onClose} size="lg"
      title={customer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button loading={saving} onClick={handleSave}>บันทึก</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Input label="ชื่อลูกค้า" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} required />
        <Input label="รหัสลูกค้า" value={form.code} onChange={(e) => set('code', e.target.value)} error={errors.code} required hint="ตัวอักษรพิมพ์ใหญ่ เช่น CUST001" />
        <Input label="เลขผู้เสียภาษี" value={form.taxId} onChange={(e) => set('taxId', e.target.value)} />
        <Input label="อีเมล" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        <Input label="เบอร์โทรศัพท์" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <Input label="ที่อยู่" value={form.address} onChange={(e) => set('address', e.target.value)} />
        <div className="col-span-2">
          <Toggle
            checked={form.isActive}
            onChange={(v) => set('isActive', v)}
            label="เปิดใช้งาน"
            description="ปิดเพื่อระงับการเข้าถึงของลูกค้ารายนี้ชั่วคราว"
          />
        </div>
      </div>
    </Modal>
  );
}

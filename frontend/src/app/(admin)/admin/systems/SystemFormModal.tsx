'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { systemsApi } from '@/lib/api/systems';
import { customersApi } from '@/lib/api/customers';
import { useToast } from '@/components/ui/Toast';
import { CustomerSystem } from '@/types/master.types';
import { useApi } from '@/lib/hooks/useApi';

interface Props {
  open: boolean;
  system: CustomerSystem | null;
  defaultCustomerId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  name: string; code: string; description: string; customerId: string; isActive: boolean;
}

const empty = (customerId = ''): FormState => ({ name: '', code: '', description: '', customerId, isActive: true });

export function SystemFormModal({ open, system, defaultCustomerId = '', onClose, onSuccess }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(empty(defaultCustomerId));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  const { data: customersData } = useApi(() => customersApi.list({ limit: '200' }), []);
  const customerOptions = (customersData?.data ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }));

  useEffect(() => {
    if (open) {
      setForm(system ? {
        name: system.name, code: system.code, description: system.description ?? '',
        customerId: system.customerId, isActive: system.isActive,
      } : empty(defaultCustomerId));
      setErrors({});
    }
  }, [open, system, defaultCustomerId]);

  function set(key: keyof FormState, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = 'กรุณากรอกชื่อระบบ';
    if (!form.code.trim()) e.code = 'กรุณากรอกรหัสระบบ';
    if (!form.customerId) e.customerId = 'กรุณาเลือกลูกค้า';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), code: form.code.trim().toUpperCase(),
        description: form.description || undefined,
        customerId: form.customerId, isActive: form.isActive,
      };
      if (system) {
        await systemsApi.update(system.id, payload);
        toast.success('แก้ไขข้อมูลระบบสำเร็จ');
      } else {
        await systemsApi.create(payload);
        toast.success('เพิ่มระบบสำเร็จ');
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
      open={open} onClose={onClose} size="md"
      title={system ? 'แก้ไขข้อมูลระบบ' : 'เพิ่มระบบใหม่'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button loading={saving} onClick={handleSave}>บันทึก</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="ลูกค้า"
          options={customerOptions}
          value={form.customerId}
          onChange={(e) => set('customerId', e.target.value)}
          placeholder="-- เลือกลูกค้า --"
          error={errors.customerId}
          required
          disabled={!!defaultCustomerId && !system}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="ชื่อระบบ" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} required />
          <Input label="รหัสระบบ" value={form.code} onChange={(e) => set('code', e.target.value)} error={errors.code} required hint="เช่น SYS001" />
        </div>
        <Textarea label="รายละเอียด" value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} />
        <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="เปิดใช้งาน" />
      </div>
    </Modal>
  );
}

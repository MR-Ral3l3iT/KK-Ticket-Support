'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Send, UserCheck, ArrowRightLeft, Ticket, Paperclip } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { Divider } from '@/components/ui/Divider';
import { Toggle } from '@/components/ui/Toggle';
import { SlaCountdown } from '@/components/ui/SlaCountdown';
import { FileUploader } from '@/components/tickets/FileUploader';
import { useApi } from '@/lib/hooks/useApi';
import { adminTicketsApi } from '@/lib/api/admin-tickets';
import { Attachment } from '@/lib/api/customer-portal';
import { usersApi } from '@/lib/api/users';
import { useToast } from '@/components/ui/Toast';
import { TicketStatus, TicketPriority } from '@/types/ticket.types';

const TRANSITION_OPTIONS: Record<TicketStatus, { value: string; label: string }[]> = {
  OPEN:            [{ value: 'TRIAGED', label: 'ตรวจสอบแล้ว (Triage)' }, { value: 'IN_PROGRESS', label: 'เริ่มดำเนินการ' }, { value: 'CANCELLED', label: 'ยกเลิก' }],
  TRIAGED:         [{ value: 'IN_PROGRESS', label: 'เริ่มดำเนินการ' }, { value: 'WAITING_CUSTOMER', label: 'รอข้อมูลจากลูกค้า' }, { value: 'CANCELLED', label: 'ยกเลิก' }],
  IN_PROGRESS:     [{ value: 'WAITING_CUSTOMER', label: 'รอข้อมูลจากลูกค้า' }, { value: 'WAITING_INTERNAL', label: 'รอภายใน' }, { value: 'RESOLVED', label: 'แก้ไขแล้ว' }],
  WAITING_CUSTOMER:[{ value: 'IN_PROGRESS', label: 'กลับไปดำเนินการ' }, { value: 'RESOLVED', label: 'แก้ไขแล้ว' }],
  WAITING_INTERNAL:[{ value: 'IN_PROGRESS', label: 'กลับไปดำเนินการ' }],
  RESOLVED:        [{ value: 'CLOSED', label: 'ปิด Ticket' }, { value: 'REOPENED', label: 'เปิดใหม่' }],
  CLOSED:          [{ value: 'REOPENED', label: 'เปิดใหม่' }],
  REOPENED:        [{ value: 'IN_PROGRESS', label: 'เริ่มดำเนินการ' }],
  CANCELLED:       [],
};

const STATUS_BADGE: Record<TicketStatus, { variant: BadgeVariant; label: string }> = {
  OPEN: { variant: 'info', label: 'เปิด' }, TRIAGED: { variant: 'secondary', label: 'ตรวจสอบแล้ว' },
  IN_PROGRESS: { variant: 'primary', label: 'กำลังดำเนินการ' }, WAITING_CUSTOMER: { variant: 'warning', label: 'รอลูกค้า' },
  WAITING_INTERNAL: { variant: 'warning', label: 'รอภายใน' }, RESOLVED: { variant: 'success', label: 'แก้ไขแล้ว' },
  CLOSED: { variant: 'default', label: 'ปิดแล้ว' }, REOPENED: { variant: 'danger', label: 'เปิดใหม่' },
  CANCELLED: { variant: 'default', label: 'ยกเลิก' },
};

const PRIORITY_BADGE: Record<TicketPriority, { variant: BadgeVariant }> = {
  LOW: { variant: 'default' }, MEDIUM: { variant: 'info' }, HIGH: { variant: 'warning' }, CRITICAL: { variant: 'danger' },
};

const PRIORITY_BADGE_CLASS: Record<TicketPriority, string> = {
  LOW: 'bg-orange-50 text-orange-700',
  MEDIUM: 'bg-orange-100 text-orange-800',
  HIGH: 'bg-orange-200 text-orange-900',
  CRITICAL: 'bg-red-100 text-red-700',
};

export default function AdminTicketDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const { data: ticket, loading, reload } = useApi(() => adminTicketsApi.get(params.id), [params.id]);
  const { data: timeline, reload: reloadTimeline } = useApi(() => adminTicketsApi.getTimeline(params.id), [params.id]);
  const { data: attachments, reload: reloadAttachments } = useApi(
    () => adminTicketsApi.getAttachments(params.id),
    [params.id],
  );
  const { data: agentsData } = useApi(() => usersApi.list({ role: 'SUPPORT_AGENT', limit: '100' }), []);

  const agentOptions = [{ value: '', label: '-- ไม่ assign --' }, ...(agentsData?.data ?? []).map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))];

  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [sendingComment, setSendingComment] = useState(false);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [assigning, setAssigning] = useState(false);

  async function handleSendComment() {
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      const comment = await adminTicketsApi.addComment(
        params.id,
        commentText.trim(),
        isInternal ? 'INTERNAL' : 'PUBLIC',
      );
      if (commentFiles.length > 0) {
        await adminTicketsApi.uploadAttachments(params.id, commentFiles, (comment as any).id);
        setCommentFiles([]);
        reloadAttachments();
      }
      setCommentText('');
      reloadTimeline();
      toast.success('เพิ่มความคิดเห็นสำเร็จ');
    } catch (e) { toast.error('ไม่สามารถส่งความคิดเห็นได้'); }
    finally { setSendingComment(false); }
  }

  async function handleChangeStatus() {
    if (!selectedStatus) return;
    setChangingStatus(true);
    try {
      await adminTicketsApi.transition(params.id, selectedStatus, statusReason || undefined);
      toast.success('เปลี่ยนสถานะสำเร็จ');
      setStatusModalOpen(false); setStatusReason('');
      reload(); reloadTimeline();
    } catch (e) { toast.error('เปลี่ยนสถานะไม่สำเร็จ', e instanceof Error ? e.message : undefined); }
    finally { setChangingStatus(false); }
  }

  async function handleAssign() {
    setAssigning(true);
    try {
      await adminTicketsApi.assign(params.id, { assigneeId: selectedAssignee || null });
      toast.success('Assign สำเร็จ');
      setAssignModalOpen(false);
      reload();
    } catch (e) { toast.error('Assign ไม่สำเร็จ'); }
    finally { setAssigning(false); }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    try {
      await adminTicketsApi.deleteAttachment(attachmentId);
      reloadAttachments();
      toast.success('ลบไฟล์แนบสำเร็จ');
    } catch {
      toast.error('ลบไฟล์แนบไม่สำเร็จ');
    }
  }

  function handleCommentFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    setCommentFiles((prev) => [...prev, ...selected]);
    e.target.value = '';
  }

  function removeCommentFile(index: number) {
    setCommentFiles((prev) => prev.filter((_, i) => i !== index));
  }

  if (loading) return <><AdminHeader title="Ticket Detail" /><div className="pt-20 p-6 flex justify-center"><Spinner size="lg" /></div></>;
  if (!ticket) return null;

  const t = ticket as any;
  const sb = STATUS_BADGE[ticket.status];
  const pb = PRIORITY_BADGE[ticket.priority];
  const transitions = TRANSITION_OPTIONS[ticket.status] ?? [];
  const attachmentsByCommentId = ((attachments as Attachment[]) ?? []).reduce(
    (acc, att) => {
      if (!att.commentId) return acc;
      if (!acc[att.commentId]) acc[att.commentId] = [];
      acc[att.commentId].push(att);
      return acc;
    },
    {} as Record<string, Attachment[]>,
  );

  return (
    <>
      <AdminHeader title="Ticket Detail" />
      <main className="pt-20 p-6 max-w-6xl">
        <Link href="/admin/tickets" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4" /> กลับ
        </Link>

        <div className="grid grid-cols-3 gap-6">
          {/* Main content */}
          <div className="col-span-2 flex flex-col gap-6">
            {/* Ticket info */}
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-semibold text-primary">{ticket.ticketNumber}</span>
                    <Badge variant={sb.variant} dot>{sb.label}</Badge>
                    <Badge variant={pb.variant} className={PRIORITY_BADGE_CLASS[ticket.priority]}>{ticket.priority}</Badge>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-primary-600" />
                    {ticket.title}
                  </h2>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  ไฟล์แนบ
                </CardTitle>
              </CardHeader>
              <FileUploader
                ticketId={params.id}
                existingAttachments={(attachments as Attachment[]) ?? []}
                canDeleteExisting
                onDeleteExisting={handleDeleteAttachment}
                onUploaded={() => reloadAttachments()}
                uploadFn={adminTicketsApi.uploadAttachments}
              />
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
              <div className="flex flex-col gap-4">
                {((timeline as any[]) ?? []).map((item: any) => (
                  <div key={item.id} className="flex gap-3">
                    <Avatar name={item.actor ? `${item.actor.firstName} ${item.actor.lastName}` : item.author ? `${item.author.firstName} ${item.author.lastName}` : 'System'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-gray-800">
                          {item.actor ? `${item.actor.firstName} ${item.actor.lastName}` : item.author ? `${item.author.firstName} ${item.author.lastName}` : 'ระบบ'}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString('th-TH')}</span>
                        {item.timelineType === 'comment' && item.type === 'INTERNAL' && <Badge variant="warning" size="sm">Internal</Badge>}
                      </div>
                      {item.timelineType === 'comment' ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.content}</p>
                          {attachmentsByCommentId[item.id]?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {attachmentsByCommentId[item.id].map((att) => (
                                <a
                                  key={att.id}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-primary hover:bg-primary-50"
                                >
                                  <Paperclip className="h-3.5 w-3.5" />
                                  <span className="max-w-52 truncate">{att.fileName}</span>
                                </a>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">{item.action}{item.fromValue && ` (${item.fromValue} → ${item.toValue ?? '—'})`}</p>
                      )}
                    </div>
                  </div>
                ))}
                {!((timeline as any[]) ?? []).length && <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีกิจกรรม</p>}
              </div>

              <Divider className="my-4" />

              {/* Add comment */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">เพิ่มความคิดเห็น</p>
                  <Toggle checked={isInternal} onChange={setIsInternal} label="Internal Note" size="sm" />
                </div>
                <Textarea placeholder={isInternal ? 'บันทึกภายใน (ลูกค้าไม่เห็น)...' : 'ตอบกลับลูกค้า...'} value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3} />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                      <Paperclip className="h-3.5 w-3.5" />
                      แนบไฟล์กับข้อความนี้
                      <input type="file" multiple className="hidden" onChange={handleCommentFilesSelected} />
                    </label>
                    {isInternal && (
                      <span className="text-xs text-amber-600">ไฟล์ใน Internal Note ลูกค้าไม่ควรเข้าถึง</span>
                    )}
                  </div>
                  {commentFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {commentFiles.map((f, idx) => (
                        <button
                          key={`${f.name}-${idx}`}
                          type="button"
                          onClick={() => removeCommentFile(idx)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          <span className="max-w-52 truncate">{f.name}</span>
                          <span className="text-gray-400">x</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button size="sm" leftIcon={<Send className="h-4 w-4" />} loading={sendingComment} onClick={handleSendComment} disabled={!commentText.trim()}>
                    {isInternal ? 'บันทึก Internal' : 'ส่ง'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Actions */}
            <Card>
              <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
              <div className="flex flex-col gap-2">
                {transitions.length > 0 && (
                  <Button variant="outline" size="sm" fullWidth leftIcon={<ArrowRightLeft className="h-4 w-4" />}
                    onClick={() => { setSelectedStatus(transitions[0]?.value ?? ''); setStatusModalOpen(true); }}>
                    เปลี่ยนสถานะ
                  </Button>
                )}
                <Button variant="outline" size="sm" fullWidth leftIcon={<UserCheck className="h-4 w-4" />}
                  onClick={() => { setSelectedAssignee(ticket.assigneeId ?? ''); setAssignModalOpen(true); }}>
                  Assign
                </Button>
              </div>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader><CardTitle>รายละเอียด</CardTitle></CardHeader>
              <div className="flex flex-col gap-3 text-sm">
                {[
                  { label: 'ลูกค้า', value: t.customer?.name ?? '-' },
                  { label: 'ระบบ', value: t.system?.name ?? '-' },
                  { label: 'หมวดหมู่', value: t.category?.name ?? '-' },
                  { label: 'ผู้รับผิดชอบ', value: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : '-' },
                  { label: 'ทีม', value: t.team?.name ?? '-' },
                  { label: 'สร้างโดย', value: t.createdBy ? `${t.createdBy.firstName} ${t.createdBy.lastName}` : '-' },
                  { label: 'วันที่สร้าง', value: new Date(ticket.createdAt).toLocaleDateString('th-TH') },
                ].map((f) => (
                  <div key={f.label} className="flex justify-between gap-2">
                    <span className="text-gray-400 flex-shrink-0">{f.label}</span>
                    <span className="text-gray-700 text-right">{f.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* SLA */}
            {t.slaTracking && (
              <Card>
                <CardHeader><CardTitle>SLA</CardTitle></CardHeader>
                <div className="flex flex-col divide-y divide-gray-100">
                  <SlaCountdown
                    label="First Response"
                    dueAt={t.slaTracking.firstResponseDue}
                    completedAt={t.slaTracking.firstResponseAt}
                    isBreached={t.slaTracking.isFirstResponseBreached}
                    isPaused={!!t.slaTracking.pausedAt}
                  />
                  <SlaCountdown
                    label="Resolution"
                    dueAt={t.slaTracking.resolutionDue}
                    completedAt={t.slaTracking.resolutionAt}
                    isBreached={t.slaTracking.isResolutionBreached}
                    isPaused={!!t.slaTracking.pausedAt}
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Status Modal */}
      <Modal open={statusModalOpen} onClose={() => setStatusModalOpen(false)} title="เปลี่ยนสถานะ" size="sm"
        footer={<><Button variant="ghost" onClick={() => setStatusModalOpen(false)}>ยกเลิก</Button><Button loading={changingStatus} onClick={handleChangeStatus} disabled={!selectedStatus}>ยืนยัน</Button></>}>
        <div className="flex flex-col gap-4">
          <Select label="สถานะใหม่" options={transitions} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} />
          <Textarea label="หมายเหตุ (ถ้ามี)" value={statusReason} onChange={(e) => setStatusReason(e.target.value)} rows={2} />
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign Ticket" size="sm"
        footer={<><Button variant="ghost" onClick={() => setAssignModalOpen(false)}>ยกเลิก</Button><Button loading={assigning} onClick={handleAssign}>บันทึก</Button></>}>
        <Select label="ผู้รับผิดชอบ" options={agentOptions} value={selectedAssignee} onChange={(e) => setSelectedAssignee(e.target.value)} />
      </Modal>
    </>
  );
}

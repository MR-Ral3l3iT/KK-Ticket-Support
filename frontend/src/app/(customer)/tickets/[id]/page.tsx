'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Clock, MessageSquare, RefreshCw, CheckCircle2,
  User, Tag, Monitor, AlertTriangle, Paperclip,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Divider } from '@/components/ui/Divider';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import { FileUploader } from '@/components/tickets/FileUploader';
import { useApi } from '@/lib/hooks/useApi';
import { useToast } from '@/components/ui/Toast';
import { customerPortalApi, Attachment } from '@/lib/api/customer-portal';
import { TicketStatus, TicketPriority } from '@/types/ticket.types';
import { formatDateTime } from '@/lib/utils/date';

const STATUS_BADGE: Record<TicketStatus, { variant: BadgeVariant; label: string }> = {
  OPEN: { variant: 'info', label: 'เปิด' },
  TRIAGED: { variant: 'secondary', label: 'ตรวจสอบแล้ว' },
  IN_PROGRESS: { variant: 'primary', label: 'กำลังดำเนินการ' },
  WAITING_CUSTOMER: { variant: 'warning', label: 'รอข้อมูลจากคุณ' },
  WAITING_INTERNAL: { variant: 'warning', label: 'รอภายใน' },
  RESOLVED: { variant: 'success', label: 'แก้ไขแล้ว' },
  CLOSED: { variant: 'default', label: 'ปิดแล้ว' },
  REOPENED: { variant: 'danger', label: 'เปิดใหม่' },
  CANCELLED: { variant: 'default', label: 'ยกเลิก' },
};

const PRIORITY_BADGE: Record<TicketPriority, BadgeVariant> = {
  LOW: 'default', MEDIUM: 'info', HIGH: 'warning', CRITICAL: 'danger',
};

const PRIORITY_BADGE_CLASS: Record<TicketPriority, string> = {
  LOW: 'bg-orange-50 text-orange-700',
  MEDIUM: 'bg-orange-100 text-orange-800',
  HIGH: 'bg-orange-200 text-orange-900',
  CRITICAL: 'bg-red-100 text-red-700',
};

const STATUS_LABEL_TH: Record<string, string> = {
  OPEN: 'เปิด',
  TRIAGED: 'ตรวจสอบแล้ว',
  IN_PROGRESS: 'กำลังดำเนินการ',
  WAITING_CUSTOMER: 'รอข้อมูลจากคุณ',
  WAITING_INTERNAL: 'รอภายใน',
  RESOLVED: 'แก้ไขแล้ว',
  CLOSED: 'ปิดแล้ว',
  REOPENED: 'เปิดใหม่',
  CANCELLED: 'ยกเลิก',
};

const PRIORITY_LABEL_TH: Record<string, string> = {
  LOW: 'ต่ำ',
  MEDIUM: 'ปานกลาง',
  HIGH: 'สูง',
  CRITICAL: 'วิกฤต',
};

function toStatusLabel(v?: string) {
  if (!v) return '-';
  return STATUS_LABEL_TH[v] ?? v;
}

function toPriorityLabel(v?: string) {
  if (!v) return '-';
  return PRIORITY_LABEL_TH[v] ?? v;
}

function TimelineItem({ event }: { event: any }) {
  const isComment = event.timelineType === 'comment';
  const isStatus = event.timelineType === 'audit' && event.action === 'STATUS_CHANGED';
  const name = event.author
    ? `${event.author.firstName} ${event.author.lastName}`
    : event.actor
      ? `${event.actor.firstName} ${event.actor.lastName}`
    : 'ระบบ';

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <Avatar name={isComment ? name : '?'} size="sm" />
        <div className="w-px flex-1 bg-gray-100 mt-1" />
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-800">{name}</span>
          <span className="text-xs text-gray-400">{formatDateTime(event.createdAt)}</span>
        </div>
        {isComment ? (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap">
            {event.content}
          </div>
        ) : isStatus ? (
          <p className="text-sm text-gray-500">
            เปลี่ยนสถานะจาก <span className="font-medium text-gray-700">{toStatusLabel(event.fromValue)}</span>
            {' '}เป็น{' '}
            <span className="font-medium text-gray-700">{toStatusLabel(event.toValue)}</span>
            {(event.metadata as any)?.reason && ` — ${(event.metadata as any).reason}`}
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            {event.action === 'TICKET_CREATED' && 'สร้าง Ticket'}
            {event.action === 'PRIORITY_CHANGED' && `เปลี่ยนระดับความสำคัญจาก ${toPriorityLabel(event.fromValue)} เป็น ${toPriorityLabel(event.toValue)}`}
            {event.action === 'ASSIGNEE_CHANGED' && 'เปลี่ยนผู้รับผิดชอบ'}
            {event.action === 'TEAM_CHANGED' && 'เปลี่ยนทีมผู้รับผิดชอบ'}
            {event.action === 'ATTACHMENT_ADDED' && 'เพิ่มไฟล์แนบ'}
            {event.action === 'TICKET_REOPENED' && 'เปิด Ticket ใหม่อีกครั้ง'}
            {event.action === 'TICKET_CLOSED' && 'ปิด Ticket'}
            {event.action === 'SLA_BREACHED' && 'เกินเวลาตาม SLA'}
            {!['TICKET_CREATED', 'PRIORITY_CHANGED', 'ASSIGNEE_CHANGED', 'TEAM_CHANGED', 'ATTACHMENT_ADDED', 'TICKET_REOPENED', 'TICKET_CLOSED', 'SLA_BREACHED'].includes(event.action) &&
              (event.action ?? 'กิจกรรมระบบ')}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CustomerTicketDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { toast } = useToast();

  const { data: ticket, loading: ticketLoading, reload: reloadTicket } = useApi(
    () => customerPortalApi.getTicket(id), [id],
  );
  const { data: timeline, loading: timelineLoading, reload: reloadTimeline } = useApi(
    () => customerPortalApi.getTimeline(id), [id],
  );
  const { data: attachments, reload: reloadAttachments } = useApi(
    () => customerPortalApi.getAttachments(id), [id],
  );

  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      await customerPortalApi.addComment(id, comment.trim());
      setComment('');
      reloadTimeline();
      toast.success('ส่งข้อความสำเร็จ');
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleTransition(status: string) {
    setTransitioning(true);
    try {
      await customerPortalApi.transition(id, status);
      reloadTicket();
      reloadTimeline();
      toast.success('อัปเดตสถานะสำเร็จ');
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setTransitioning(false);
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    try {
      await customerPortalApi.deleteAttachment(attachmentId);
      reloadAttachments();
      toast.success('ลบไฟล์แนบสำเร็จ');
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    }
  }

  if (ticketLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }
  if (!ticket) {
    return (
      <div className="text-center py-20 text-gray-500">
        ไม่พบ Ticket <Link href="/tickets" className="text-primary hover:underline">กลับไปรายการ</Link>
      </div>
    );
  }

  const sb = STATUS_BADGE[ticket.status];
  const canReopen = ['RESOLVED', 'CLOSED'].includes(ticket.status);
  const canClose = ticket.status === 'RESOLVED';
  const isClosed = ['CLOSED', 'CANCELLED'].includes(ticket.status);
  const timelineEvents = ((timeline as any[]) ?? []).filter((ev) => {
    if (ev.timelineType === 'comment') return ev.type === 'PUBLIC';
    if (ev.timelineType === 'audit') return ev.action !== 'COMMENT_ADDED';
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Back + header */}
      <div className="flex items-start gap-3">
        <Link href="/tickets" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors mt-0.5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono text-sm font-bold text-primary">{ticket.ticketNumber}</span>
            <Badge variant={sb.variant} dot>{sb.label}</Badge>
            <Badge variant={PRIORITY_BADGE[ticket.priority]} className={PRIORITY_BADGE_CLASS[ticket.priority]}>
              {ticket.priority}
            </Badge>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{ticket.title}</h1>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            สร้างเมื่อ {formatDateTime(ticket.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Description */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">รายละเอียดปัญหา</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </Card>

          {/* Attachments */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              ไฟล์แนบ
              {attachments && attachments.length > 0 && (
                <span className="ml-1 text-xs font-normal text-gray-400">({attachments.length} ไฟล์)</span>
              )}
            </h2>
            <FileUploader
              ticketId={id}
              existingAttachments={attachments ?? []}
              onDeleteExisting={!isClosed ? handleDeleteAttachment : undefined}
              canDeleteExisting={!isClosed}
              onUploaded={() => reloadAttachments()}
              uploadFn={customerPortalApi.uploadAttachments}
              disabled={isClosed}
            />
          </Card>

          {/* Timeline */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              การติดตาม
            </h2>
            {timelineLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : !timelineEvents.length ? (
              <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีกิจกรรม</p>
            ) : (
              <div>
                {timelineEvents.map((ev: any) => (
                  <TimelineItem key={ev.id} event={ev} />
                ))}
              </div>
            )}

            {/* Add comment */}
            {!isClosed && (
              <>
                <Divider className="my-4" />
                <form onSubmit={handleAddComment}>
                  <Textarea
                    rows={3}
                    placeholder="พิมพ์ข้อความหรือข้อมูลเพิ่มเติม..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      type="submit"
                      size="sm"
                      loading={submittingComment}
                      disabled={!comment.trim()}
                      leftIcon={<MessageSquare className="h-4 w-4" />}
                    >
                      ส่งข้อความ
                    </Button>
                  </div>
                </form>
              </>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Actions */}
          {(canClose || canReopen) && (
            <Card>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">การดำเนินการ</h2>
              <div className="flex flex-col gap-2">
                {canClose && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={transitioning}
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                    onClick={() => handleTransition('CLOSED')}
                  >
                    ยืนยันว่าแก้ไขแล้ว (ปิด Ticket)
                  </Button>
                )}
                {canReopen && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={transitioning}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    onClick={() => handleTransition('REOPENED')}
                  >
                    เปิด Ticket ใหม่อีกครั้ง
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Details */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">รายละเอียด</h2>
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Monitor className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-gray-400">ระบบ</dt>
                  <dd className="text-gray-700">{(ticket as any).system?.name ?? ticket.systemId}</dd>
                </div>
              </div>
              {(ticket as any).category && (
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-gray-400">หมวดหมู่</dt>
                    <dd className="text-gray-700">{(ticket as any).category?.name}</dd>
                  </div>
                </div>
              )}
              {(ticket as any).assignee && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-gray-400">ผู้ดูแล</dt>
                    <dd className="text-gray-700">
                      {(ticket as any).assignee.firstName} {(ticket as any).assignee.lastName}
                    </dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-gray-400">Priority</dt>
                  <dd>
                    <Badge variant={PRIORITY_BADGE[ticket.priority]} className={PRIORITY_BADGE_CLASS[ticket.priority]} size="sm">
                      {ticket.priority}
                    </Badge>
                  </dd>
                </div>
              </div>
              {ticket.resolvedAt && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-gray-400">แก้ไขเมื่อ</dt>
                    <dd className="text-gray-700">{formatDateTime(ticket.resolvedAt)}</dd>
                  </div>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

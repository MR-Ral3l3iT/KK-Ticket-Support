import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TicketStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SlaService } from '../sla/sla.service';
import {
  ALLOWED_TRANSITIONS,
  CUSTOMER_ALLOWED_TRANSITIONS,
  SLA_PAUSE_STATUSES,
} from '../../common/constants/ticket-transitions.constant';

@Injectable()
export class TicketsTransitionService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
    private slaService: SlaService,
    private notificationsService: NotificationsService,
  ) {}

  async changeStatus(
    ticketId: string,
    newStatus: TicketStatus,
    actorId: string,
    actorRole: UserRole,
    reason?: string,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, deletedAt: null },
      select: {
        id: true,
        status: true,
        createdById: true,
        customer: { select: { name: true } },
        system: { select: { name: true } },
      },
    });
    if (!ticket) throw new NotFoundException('ไม่พบ Ticket');

    // Validate transition is allowed at all
    const allowed = ALLOWED_TRANSITIONS[ticket.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `ไม่สามารถเปลี่ยนสถานะจาก ${ticket.status} เป็น ${newStatus} ได้`,
      );
    }

    // Validate role-based transition restriction for customer
    if (actorRole === UserRole.CUSTOMER_ADMIN || actorRole === UserRole.CUSTOMER_USER) {
      const customerAllowed = CUSTOMER_ALLOWED_TRANSITIONS[ticket.status] ?? [];
      if (!customerAllowed.includes(newStatus)) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์เปลี่ยนเป็นสถานะนี้');
      }
    }

    const updateData: Prisma.TicketUpdateInput = { status: newStatus };
    if (newStatus === TicketStatus.RESOLVED) updateData.resolvedAt = new Date();
    if (newStatus === TicketStatus.CLOSED) updateData.closedAt = new Date();

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      select: { id: true, ticketNumber: true, title: true, status: true, customerId: true, assigneeId: true },
    });

    // SLA clock management
    const wasPaused = SLA_PAUSE_STATUSES.includes(ticket.status);
    const willPause = SLA_PAUSE_STATUSES.includes(newStatus);

    if (willPause && !wasPaused) await this.slaService.pauseClock(ticketId);
    if (!willPause && wasPaused) await this.slaService.resumeClock(ticketId);

    if (newStatus === TicketStatus.RESOLVED) {
      await this.slaService.recordResolution(ticketId);
    }

    // Audit log
    await this.auditLogsService.create({
      ticketId,
      actorId,
      action: 'STATUS_CHANGED',
      fromValue: ticket.status,
      toValue: newStatus,
      metadata: reason ? { reason } : undefined,
    });

    // Notify relevant users
    const notifyIds: string[] = [];
    if (updated.assigneeId && updated.assigneeId !== actorId) notifyIds.push(updated.assigneeId);

    // Notify customer if support changed status, notify support if customer changed status
    if (
      actorRole === UserRole.CUSTOMER_ADMIN ||
      actorRole === UserRole.CUSTOMER_USER
    ) {
      // Notify support admins
      const admins = await this.prisma.user.findMany({
        where: { role: { in: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN] }, isActive: true, deletedAt: null },
        select: { id: true },
      });
      notifyIds.push(...admins.map((u) => u.id));
    } else {
      // Notify ticket creator (customer)
      if (ticket.createdById !== actorId) notifyIds.push(ticket.createdById);
    }

    if (notifyIds.length) {
      await this.notificationsService.emit('ticket.status_changed', {
        userIds: [...new Set(notifyIds)],
        title: `สถานะ Ticket เปลี่ยนแปลง: ${updated.ticketNumber}`,
        body: `${ticket.status} → ${newStatus}`,
        metadata: {
          ticketId,
          ticketNumber: updated.ticketNumber,
          customerName: ticket.customer?.name,
          systemName: ticket.system?.name,
        },
      });
    }

    return updated;
  }
}

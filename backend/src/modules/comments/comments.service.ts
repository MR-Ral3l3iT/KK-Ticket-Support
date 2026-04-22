import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommentType, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SlaService } from '../sla/sla.service';
import { CreateCommentDto } from './dto/create-comment.dto';

const COMMENT_SELECT = {
  id: true,
  content: true,
  type: true,
  createdAt: true,
  updatedAt: true,
  ticketId: true,
  authorId: true,
  author: { select: { id: true, firstName: true, lastName: true, role: true } },
  _count: { select: { attachments: true } },
} as const;

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
    private slaService: SlaService,
    private notificationsService: NotificationsService,
  ) {}

  async findByTicket(ticketId: string, includeInternal: boolean) {
    return this.prisma.comment.findMany({
      where: {
        ticketId,
        deletedAt: null,
        ...(!includeInternal && { type: CommentType.PUBLIC }),
      },
      select: COMMENT_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(
    ticketId: string,
    dto: CreateCommentDto,
    actorId: string,
    actorRole: UserRole,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, deletedAt: null },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        createdById: true,
        assigneeId: true,
        firstResponseAt: true,
        customer: { select: { name: true } },
        system: { select: { name: true } },
      },
    });
    if (!ticket) throw new NotFoundException('ไม่พบ Ticket');

    // Customers can only create PUBLIC comments
    const isCustomer = actorRole === UserRole.CUSTOMER_ADMIN || actorRole === UserRole.CUSTOMER_USER;
    if (isCustomer && dto.type === CommentType.INTERNAL) {
      throw new ForbiddenException('ลูกค้าสามารถเพิ่มเฉพาะ Comment แบบ PUBLIC เท่านั้น');
    }

    const type = dto.type ?? CommentType.PUBLIC;

    const comment = await this.prisma.comment.create({
      data: { ticketId, authorId: actorId, content: dto.content, type },
      select: COMMENT_SELECT,
    });

    // Record first response if support replies with PUBLIC comment
    if (!isCustomer && type === CommentType.PUBLIC && !ticket.firstResponseAt) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { firstResponseAt: new Date() },
      });
      await this.slaService.recordFirstResponse(ticketId);
    }

    await this.auditLogsService.create({
      ticketId,
      actorId,
      action: 'COMMENT_ADDED',
      metadata: { type, preview: dto.content.slice(0, 100) },
    });

    // Notify the other party for PUBLIC comments
    if (type === CommentType.PUBLIC) {
      const notifyIds: string[] = [];
      if (isCustomer) {
        // Notify assignee + admin
        if (ticket.assigneeId) notifyIds.push(ticket.assigneeId);
        const admins = await this.prisma.user.findMany({
          where: { role: { in: ['SUPER_ADMIN', 'SUPPORT_ADMIN'] }, isActive: true, deletedAt: null },
          select: { id: true },
        });
        notifyIds.push(...admins.map((u) => u.id));
      } else {
        // Notify ticket creator (customer)
        if (ticket.createdById !== actorId) notifyIds.push(ticket.createdById);
      }

      if (notifyIds.length) {
        await this.notificationsService.emit('comment.added', {
          userIds: [...new Set(notifyIds.filter((id) => id !== actorId))],
          title: `Comment ใหม่: ${ticket.ticketNumber}`,
          body: dto.content.slice(0, 100),
          metadata: {
            ticketId,
            ticketNumber: ticket.ticketNumber,
            customerName: ticket.customer?.name,
            systemName: ticket.system?.name,
          },
        });
      }
    }

    return comment;
  }

  async remove(id: string, actorId: string, actorRole: UserRole) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.deletedAt) throw new NotFoundException('ไม่พบ Comment');

    const isAdmin = actorRole === UserRole.SUPER_ADMIN || actorRole === UserRole.SUPPORT_ADMIN;
    if (!isAdmin && comment.authorId !== actorId) {
      throw new ForbiddenException('ไม่มีสิทธิ์ลบ Comment นี้');
    }

    await this.prisma.comment.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

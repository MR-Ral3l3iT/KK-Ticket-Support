import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SlaService } from '../sla/sla.service';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketFilterDto } from './dto/ticket-filter.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

const TICKET_SELECT = {
  id: true,
  ticketNumber: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  scopeType: true,
  followUpFromId: true,
  firstResponseAt: true,
  resolvedAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  customerId: true,
  systemId: true,
  categoryId: true,
  createdById: true,
  assigneeId: true,
  teamId: true,
  customer: { select: { id: true, name: true, code: true } },
  system: { select: { id: true, name: true, code: true } },
  category: { select: { id: true, name: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
  team: { select: { id: true, name: true } },
  slaTracking: {
    select: {
      firstResponseDue: true,
      resolutionDue: true,
      isFirstResponseBreached: true,
      isResolutionBreached: true,
      pausedAt: true,
      totalPausedMinutes: true,
    },
  },
  _count: { select: { comments: true, attachments: true } },
} as const;

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
    private slaService: SlaService,
    private notificationsService: NotificationsService,
  ) {}

  // ─── Customer Portal ─────────────────────────────────────────

  async findMine(actorId: string, customerId: string, filter: TicketFilterDto) {
    const { status, priority, search, page = 1, limit = 20 } = filter;

    const where: Prisma.TicketWhereInput = {
      deletedAt: null,
      customerId,
      createdById: actorId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { ticketNumber: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    return this.paginate(where, page, limit);
  }

  async findOneAsCustomer(id: string, actorId: string, customerId: string, role: UserRole) {
    const ticket = await this.findOne(id);

    const isOwner = ticket.createdById === actorId;
    const isCustomerAdmin = role === UserRole.CUSTOMER_ADMIN && ticket.customerId === customerId;

    if (!isOwner && !isCustomerAdmin) throw new ForbiddenException('ไม่มีสิทธิ์เข้าถึง Ticket นี้');
    return ticket;
  }

  async create(dto: CreateTicketDto, actorId: string, customerId: string) {
    // Verify system belongs to customer
    const system = await this.prisma.customerSystem.findFirst({
      where: { id: dto.systemId, customerId, deletedAt: null, isActive: true },
    });
    if (!system) throw new NotFoundException('ไม่พบระบบนี้ในบัญชีของคุณ');

    // Verify category belongs to system (if provided)
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, systemId: dto.systemId, deletedAt: null },
      });
      if (!category) throw new NotFoundException('ไม่พบหมวดหมู่นี้ในระบบที่เลือก');
    }

    const ticketNumber = await this.generateTicketNumber();

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'MEDIUM',
        customerId,
        systemId: dto.systemId,
        categoryId: dto.categoryId,
        createdById: actorId,
      },
      select: TICKET_SELECT,
    });

    // Initialize SLA if active contract exists
    const contract = await this.prisma.contract.findFirst({
      where: { customerId, systemId: dto.systemId, isActive: true, deletedAt: null },
    });
    if (contract) {
      await this.slaService.initializeSla(ticket.id, contract.id, ticket.priority);
    }

    await this.auditLogsService.create({
      ticketId: ticket.id,
      actorId,
      action: 'TICKET_CREATED',
    });

    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'SUPPORT_ADMIN'] }, isActive: true, deletedAt: null },
      select: { id: true },
    });

    await this.notificationsService.emit('ticket.created', {
      userIds: admins.map((u) => u.id),
      title: `Ticket ใหม่: ${ticket.ticketNumber}`,
      body: ticket.title,
      metadata: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        customerName: ticket.customer?.name,
        systemName: ticket.system?.name,
      },
    });

    return ticket;
  }

  async createFollowUp(followUpFromId: string, dto: CreateTicketDto, actorId: string, customerId: string) {
    const source = await this.findOne(followUpFromId);
    if (source.customerId !== customerId) throw new ForbiddenException('ไม่มีสิทธิ์เข้าถึง Ticket นี้');

    const ticketNumber = await this.generateTicketNumber();

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? source.priority,
        customerId,
        systemId: source.systemId,
        categoryId: source.categoryId,
        createdById: actorId,
        followUpFromId,
      },
      select: TICKET_SELECT,
    });

    await this.auditLogsService.create({
      ticketId: ticket.id,
      actorId,
      action: 'TICKET_CREATED',
      metadata: { followUpFromId, followUpFromNumber: source.ticketNumber },
    });

    return ticket;
  }

  async getTimeline(id: string) {
    const [auditLogs, comments] = await Promise.all([
      this.auditLogsService.findByTicket(id),
      this.prisma.comment.findMany({
        where: { ticketId: id, deletedAt: null },
        select: {
          id: true,
          content: true,
          type: true,
          createdAt: true,
          author: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return [
      ...auditLogs.map((l) => ({ ...l, timelineType: 'audit' as const })),
      ...comments.map((c) => ({ ...c, timelineType: 'comment' as const })),
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getTimelineAsCustomer(
    id: string,
    actorId: string,
    customerId: string,
    role: UserRole,
  ) {
    await this.findOneAsCustomer(id, actorId, customerId, role);
    const timeline = await this.getTimeline(id);

    return timeline.filter((item) => {
      if (item.timelineType === 'comment') {
        return item.type === 'PUBLIC';
      }
      if (item.timelineType === 'audit') {
        return !['COMMENT_ADDED', 'ASSIGNEE_CHANGED', 'TEAM_CHANGED'].includes(item.action);
      }
      return true;
    });
  }

  // ─── Admin ────────────────────────────────────────────────────

  async findAll(
    filter: TicketFilterDto,
    actorRole: UserRole,
    actorId: string,
    actorCustomerId?: string,
    actorTeamId?: string,
  ) {
    const { status, priority, customerId, systemId, assigneeId, search, page = 1, limit = 20 } = filter;

    const where: Prisma.TicketWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(systemId && { systemId }),
      ...(assigneeId && { assigneeId }),
      ...(search && {
        OR: [
          { ticketNumber: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    if (actorRole === UserRole.CUSTOMER_ADMIN || actorRole === UserRole.CUSTOMER_USER) {
      where.customerId = actorCustomerId;
      if (actorRole === UserRole.CUSTOMER_USER) where.createdById = actorId;
    } else if (actorRole === UserRole.SUPPORT_AGENT) {
      where.OR = [{ assigneeId: actorId }, ...(actorTeamId ? [{ teamId: actorTeamId }] : [])];
    } else {
      if (customerId) where.customerId = customerId;
    }

    return this.paginate(where, page, limit);
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, deletedAt: null },
      select: TICKET_SELECT,
    });
    if (!ticket) throw new NotFoundException('ไม่พบ Ticket');
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto, actorId: string) {
    const ticket = await this.findOne(id);

    if (dto.priority && dto.priority !== ticket.priority) {
      await this.auditLogsService.create({
        ticketId: id,
        actorId,
        action: 'PRIORITY_CHANGED',
        fromValue: ticket.priority,
        toValue: dto.priority,
      });
    }

    return this.prisma.ticket.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.scopeType !== undefined && { scopeType: dto.scopeType }),
      },
      select: TICKET_SELECT,
    });
  }

  async assign(id: string, dto: AssignTicketDto, actorId: string) {
    const ticket = await this.findOne(id);
    const data: Prisma.TicketUncheckedUpdateInput = {};

    if (dto.assigneeId !== undefined) {
      data.assigneeId = dto.assigneeId;
      if (dto.assigneeId !== ticket.assigneeId) {
        await this.auditLogsService.create({
          ticketId: id,
          actorId,
          action: 'ASSIGNEE_CHANGED',
          fromValue: ticket.assigneeId ?? undefined,
          toValue: dto.assigneeId ?? undefined,
        });
      }
    }

    if (dto.teamId !== undefined) {
      data.teamId = dto.teamId;
      if (dto.teamId !== ticket.teamId) {
        await this.auditLogsService.create({
          ticketId: id,
          actorId,
          action: 'TEAM_CHANGED',
          fromValue: ticket.teamId ?? undefined,
          toValue: dto.teamId ?? undefined,
        });
      }
    }

    const updated = await this.prisma.ticket.update({ where: { id }, data, select: TICKET_SELECT });

    if (dto.assigneeId) {
      await this.notificationsService.emit('ticket.assigned', {
        userIds: [dto.assigneeId],
        title: `Ticket ถูก Assign ให้คุณ: ${ticket.ticketNumber}`,
        body: ticket.title,
        metadata: {
          ticketId: id,
          ticketNumber: ticket.ticketNumber,
          customerName: ticket.customer?.name,
          systemName: ticket.system?.name,
        },
      });
    }

    return updated;
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private async paginate(where: Prisma.TicketWhereInput, page: number, limit: number) {
    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        select: TICKET_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ticket.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TKT-${year}-`;

    const last = await this.prisma.ticket.findFirst({
      where: { ticketNumber: { startsWith: prefix } },
      orderBy: { ticketNumber: 'desc' },
      select: { ticketNumber: true },
    });

    const seq = last ? parseInt(last.ticketNumber.slice(-5), 10) + 1 : 1;
    return `${prefix}${String(seq).padStart(5, '0')}`;
  }
}

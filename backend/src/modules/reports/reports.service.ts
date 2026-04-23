import { Injectable } from '@nestjs/common';
import { TicketStatus, TicketPriority } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(customerId?: string) {
    const where = { deletedAt: null as null, ...(customerId ? { customerId } : {}) };
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      openTickets,
      inProgressTickets,
      slaBreached,
      resolvedToday,
      totalThisMonth,
      resolvedForAverage,
    ] = await Promise.all([
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.OPEN } }),
      this.prisma.ticket.count({
        where: { ...where, status: { in: [TicketStatus.TRIAGED, TicketStatus.IN_PROGRESS] } },
      }),
      this.prisma.slaTracking.count({
        where: {
          OR: [{ isFirstResponseBreached: true }, { isResolutionBreached: true }],
          ticket: { deletedAt: null, ...(customerId ? { customerId } : {}) },
        },
      }),
      this.prisma.ticket.count({
        where: {
          ...where,
          status: TicketStatus.RESOLVED,
          resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.ticket.count({
        where: {
          ...where,
          createdAt: { gte: monthStart },
        },
      }),
      this.prisma.ticket.findMany({
        where: {
          ...where,
          resolvedAt: { not: null },
        },
        select: { createdAt: true, resolvedAt: true },
      }),
    ]);

    const avgResolutionHours =
      resolvedForAverage.length > 0
        ? resolvedForAverage.reduce((sum, row) => {
            const resolvedAt = row.resolvedAt ?? row.createdAt;
            return sum + (resolvedAt.getTime() - row.createdAt.getTime()) / (1000 * 60 * 60);
          }, 0) / resolvedForAverage.length
        : 0;

    return {
      openTickets,
      inProgressTickets,
      resolvedToday,
      slaBreached,
      avgResolutionHours,
      totalThisMonth,
    };
  }

  async getTicketReport(params: {
    customerId?: string;
    systemId?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { customerId, systemId, status, priority, fromDate, toDate, page = 1, limit = 50 } = params;

    const where = {
      deletedAt: null as null,
      ...(customerId && { customerId }),
      ...(systemId && { systemId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate && { gte: new Date(fromDate) }),
              // end of selected day (23:59:59.999) to include the full toDate day
              ...(toDate && { lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)) }),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          status: true,
          priority: true,
          scopeType: true,
          createdAt: true,
          resolvedAt: true,
          closedAt: true,
          customer: { select: { id: true, name: true } },
          system: { select: { id: true, name: true } },
          assignee: { select: { id: true, firstName: true, lastName: true } },
          slaTracking: { select: { isFirstResponseBreached: true, isResolutionBreached: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getSlaBreachReport(params: { customerId?: string; page?: number; limit?: number }) {
    const { customerId, page = 1, limit = 20 } = params;

    const where = {
      OR: [{ isFirstResponseBreached: true }, { isResolutionBreached: true }],
      ticket: {
        deletedAt: null as null,
        ...(customerId ? { customerId } : {}),
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.slaTracking.findMany({
        where,
        select: {
          isFirstResponseBreached: true,
          isResolutionBreached: true,
          firstResponseDue: true,
          firstResponseAt: true,
          resolutionDue: true,
          resolutionAt: true,
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              title: true,
              status: true,
              priority: true,
              createdAt: true,
              customer: { select: { id: true, name: true } },
              assignee: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { ticket: { createdAt: 'desc' } },
      }),
      this.prisma.slaTracking.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getChartData(customerId?: string) {
    const base = { deletedAt: null as null, ...(customerId ? { customerId } : {}) };

    // Group by Bangkok date (UTC+7) regardless of server timezone
    const BKK_MS = 7 * 60 * 60 * 1000;
    const toBkkDate = (d: Date) => new Date(d.getTime() + BKK_MS).toISOString().slice(0, 10);

    // "from" = Bangkok midnight 29 days ago, expressed in UTC
    const fromBkk = new Date(Date.now() + BKK_MS);
    fromBkk.setUTCDate(fromBkk.getUTCDate() - 29);
    fromBkk.setUTCHours(0, 0, 0, 0);
    const from = new Date(fromBkk.getTime() - BKK_MS);

    const [dailyRaw, byStatus, byPriority] = await Promise.all([
      this.prisma.ticket.findMany({
        where: { ...base, createdAt: { gte: from } },
        select: { createdAt: true },
      }),
      this.prisma.ticket.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
      this.prisma.ticket.groupBy({ by: ['priority'], where: base, _count: { _all: true } }),
    ]);

    const dayMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(fromBkk);
      d.setUTCDate(d.getUTCDate() + i);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const t of dailyRaw) {
      const key = toBkkDate(t.createdAt);
      if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }

    return {
      daily: Array.from(dayMap.entries()).map(([date, count]) => ({ date, count })),
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
      byPriority: byPriority.map((r) => ({ priority: r.priority, count: r._count._all })),
    };
  }

  async exportTicketsCsv(params: {
    customerId?: string;
    systemId?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    fromDate?: string;
    toDate?: string;
  }): Promise<string> {
    const { customerId, systemId, status, priority, fromDate, toDate } = params;
    const where = {
      deletedAt: null as null,
      ...(customerId && { customerId }),
      ...(systemId && { systemId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(fromDate || toDate
        ? { createdAt: { ...(fromDate && { gte: new Date(fromDate) }), ...(toDate && { lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)) }) } }
        : {}),
    };

    const rows = await this.prisma.ticket.findMany({
      where,
      select: {
        ticketNumber: true,
        title: true,
        status: true,
        priority: true,
        scopeType: true,
        createdAt: true,
        resolvedAt: true,
        closedAt: true,
        customer: { select: { name: true } },
        system: { select: { name: true } },
        assignee: { select: { firstName: true, lastName: true } },
        slaTracking: { select: { isFirstResponseBreached: true, isResolutionBreached: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const escape = (v: string | null | undefined) => {
      if (v == null) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const headers = [
      'Ticket No', 'Title', 'Status', 'Priority', 'Scope', 'Customer', 'System',
      'Assignee', 'Created At', 'Resolved At', 'Closed At',
      'First Response SLA', 'Resolution SLA',
    ];

    const lines = [
      headers.join(','),
      ...rows.map((r) =>
        [
          escape(r.ticketNumber),
          escape(r.title),
          escape(r.status),
          escape(r.priority),
          escape(r.scopeType),
          escape(r.customer?.name),
          escape(r.system?.name),
          escape(r.assignee ? `${r.assignee.firstName} ${r.assignee.lastName}` : null),
          escape(r.createdAt.toISOString()),
          escape(r.resolvedAt?.toISOString()),
          escape(r.closedAt?.toISOString()),
          escape(r.slaTracking?.isFirstResponseBreached ? 'Breached' : r.slaTracking ? 'OK' : '-'),
          escape(r.slaTracking?.isResolutionBreached ? 'Breached' : r.slaTracking ? 'OK' : '-'),
        ].join(','),
      ),
    ];

    return lines.join('\n');
  }
}

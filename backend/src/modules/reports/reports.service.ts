import { Injectable } from '@nestjs/common';
import { TicketStatus, TicketPriority, UserRole } from '@prisma/client';
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
              ...(toDate && { lte: new Date(toDate) }),
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
}

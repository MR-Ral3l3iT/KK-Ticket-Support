import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface EmitPayload {
  userIds: string[];
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async emit(event: string, payload: EmitPayload) {
    if (!payload.userIds.length) return;

    await this.prisma.notification.createMany({
      data: payload.userIds.map((userId) => ({
        userId,
        title: payload.title,
        body: payload.body,
        channel: NotificationChannel.IN_APP,
        event,
        metadata: payload.metadata as any,
        sentAt: new Date(),
      })),
    });

    // TODO Phase 2: send EMAIL / LINE via BullMQ queue
  }

  async getUnread(userId: string) {
    const [rawData, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    const missingContextTicketIds = [
      ...new Set(
        rawData
          .map((n) => {
            const meta = (n.metadata ?? {}) as Record<string, unknown>;
            const ticketId = typeof meta.ticketId === 'string' ? meta.ticketId : undefined;
            const hasContext = typeof meta.customerName === 'string' || typeof meta.systemName === 'string';
            return ticketId && !hasContext ? ticketId : undefined;
          })
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const ticketMap = new Map<string, { customerName?: string; systemName?: string }>();
    if (missingContextTicketIds.length) {
      const tickets = await this.prisma.ticket.findMany({
        where: { id: { in: missingContextTicketIds } },
        select: {
          id: true,
          customer: { select: { name: true } },
          system: { select: { name: true } },
        },
      });
      tickets.forEach((t) => {
        ticketMap.set(t.id, {
          customerName: t.customer?.name,
          systemName: t.system?.name,
        });
      });
    }

    const data = rawData.map((n) => {
      const meta = (n.metadata ?? {}) as Record<string, unknown>;
      const ticketId = typeof meta.ticketId === 'string' ? meta.ticketId : undefined;
      if (!ticketId) return n;

      const fallback = ticketMap.get(ticketId);
      if (!fallback) return n;

      return {
        ...n,
        metadata: {
          ...meta,
          customerName:
            typeof meta.customerName === 'string' ? meta.customerName : fallback.customerName,
          systemName:
            typeof meta.systemName === 'string' ? meta.systemName : fallback.systemName,
        },
      };
    });

    return { data, total };
  }

  async markRead(notificationId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}

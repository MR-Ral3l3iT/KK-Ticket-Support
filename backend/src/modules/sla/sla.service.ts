import { Injectable } from '@nestjs/common';
import { TicketPriority } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SlaService {
  constructor(private prisma: PrismaService) {}

  async initializeSla(ticketId: string, contractId: string, priority: TicketPriority) {
    const policy = await this.prisma.slaPolicy.findUnique({
      where: { contractId_priority: { contractId, priority } },
    });
    if (!policy || !policy.isActive) return;

    const now = new Date();
    await this.prisma.slaTracking.create({
      data: {
        ticketId,
        firstResponseDue: this.addMinutes(now, policy.firstResponseMinutes),
        resolutionDue: this.addMinutes(now, policy.resolutionMinutes),
      },
    });
  }

  async pauseClock(ticketId: string) {
    const tracking = await this.prisma.slaTracking.findUnique({ where: { ticketId } });
    if (!tracking || tracking.pausedAt) return;

    await this.prisma.slaTracking.update({
      where: { ticketId },
      data: { pausedAt: new Date() },
    });
  }

  async resumeClock(ticketId: string) {
    const tracking = await this.prisma.slaTracking.findUnique({ where: { ticketId } });
    if (!tracking || !tracking.pausedAt) return;

    const pausedMinutes = Math.ceil((Date.now() - tracking.pausedAt.getTime()) / 60000);

    await this.prisma.slaTracking.update({
      where: { ticketId },
      data: {
        pausedAt: null,
        totalPausedMinutes: { increment: pausedMinutes },
      },
    });
  }

  async recordFirstResponse(ticketId: string) {
    const tracking = await this.prisma.slaTracking.findUnique({ where: { ticketId } });
    if (!tracking || tracking.firstResponseAt) return;

    const now = new Date();
    await this.prisma.slaTracking.update({
      where: { ticketId },
      data: {
        firstResponseAt: now,
        isFirstResponseBreached: tracking.firstResponseDue
          ? now > tracking.firstResponseDue
          : false,
      },
    });
  }

  async recordResolution(ticketId: string) {
    const tracking = await this.prisma.slaTracking.findUnique({ where: { ticketId } });
    if (!tracking || tracking.resolutionAt) return;

    const now = new Date();
    await this.prisma.slaTracking.update({
      where: { ticketId },
      data: {
        resolutionAt: now,
        isResolutionBreached: tracking.resolutionDue ? now > tracking.resolutionDue : false,
      },
    });
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60_000);
  }
}

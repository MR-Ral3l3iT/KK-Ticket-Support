import { Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateAuditLogDto {
  ticketId: string;
  actorId?: string;
  action: AuditAction;
  fromValue?: string;
  toValue?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        ticketId: dto.ticketId,
        actorId: dto.actorId,
        action: dto.action,
        fromValue: dto.fromValue,
        toValue: dto.toValue,
        metadata: dto.metadata as any,
      },
    });
  }

  async findByTicket(ticketId: string) {
    return this.prisma.auditLog.findMany({
      where: { ticketId },
      select: {
        id: true,
        action: true,
        fromValue: true,
        toValue: true,
        metadata: true,
        createdAt: true,
        actor: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}

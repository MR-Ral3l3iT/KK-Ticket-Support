import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommentType, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { StorageService } from './storage.service';

const ATTACHMENT_SELECT = {
  id: true,
  fileName: true,
  fileSize: true,
  mimeType: true,
  storageKey: true,
  createdAt: true,
  ticketId: true,
  commentId: true,
  uploadedById: true,
} as const;

@Injectable()
export class AttachmentsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private auditLogsService: AuditLogsService,
  ) {}

  async upload(
    ticketId: string,
    files: Express.Multer.File[],
    actorId: string,
    commentId?: string,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, deletedAt: null },
      select: {
        id: true,
        ticketNumber: true,
        customer: { select: { code: true } },
      },
    });
    if (!ticket) throw new NotFoundException('ไม่พบ Ticket');

    this.storageService.validateFiles(files);

    const ctx = {
      customerCode: ticket.customer.code,
      ticketNumber: ticket.ticketNumber,
    };

    const results = [];
    for (const file of files) {
      const { storageKey, mimeType, fileSize } = await this.storageService.upload(file, ctx);

      const attachment = await this.prisma.attachment.create({
        data: {
          ticketId,
          commentId: commentId ?? null,
          uploadedById: actorId,
          fileName: file.originalname,
          fileSize,
          mimeType,
          storageKey,
        },
        select: ATTACHMENT_SELECT,
      });

      await this.auditLogsService.create({
        ticketId,
        actorId,
        action: 'ATTACHMENT_ADDED',
        metadata: { fileName: file.originalname, fileSize },
      });

      results.push(attachment);
    }

    return results;
  }

  async getPresignedUrl(id: string, actorId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      select: { ...ATTACHMENT_SELECT },
    });
    if (!attachment || (attachment as any).deletedAt) throw new NotFoundException('ไม่พบไฟล์แนบ');

    const url = await this.storageService.getUrl(attachment.storageKey);
    return { url, fileName: attachment.fileName, mimeType: attachment.mimeType };
  }

  async findByTicket(ticketId: string, actorRole: UserRole) {
    const isCustomer =
      actorRole === UserRole.CUSTOMER_ADMIN || actorRole === UserRole.CUSTOMER_USER;

    const attachments = await this.prisma.attachment.findMany({
      where: {
        ticketId,
        deletedAt: null,
        ...(isCustomer
          ? {
              OR: [{ commentId: null }, { comment: { type: CommentType.PUBLIC } }],
            }
          : {}),
      },
      select: ATTACHMENT_SELECT,
      orderBy: { createdAt: 'asc' },
    });

    // Enrich with download URLs
    return Promise.all(
      attachments.map(async (a) => ({
        ...a,
        url: await this.storageService.getUrl(a.storageKey),
      })),
    );
  }

  async remove(id: string, actorId: string, actorRole: UserRole) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment || (attachment as any).deletedAt) throw new NotFoundException('ไม่พบไฟล์แนบ');

    const isAdmin = actorRole === UserRole.SUPER_ADMIN || actorRole === UserRole.SUPPORT_ADMIN;
    if (!isAdmin && attachment.uploadedById !== actorId) {
      throw new ForbiddenException('ไม่มีสิทธิ์ลบไฟล์นี้');
    }

    await this.prisma.attachment.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.storageService.delete(attachment.storageKey);
  }
}

import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { StorageService } from './storage.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService, StorageService],
  exports: [AttachmentsService, StorageService],
})
export class AttachmentsModule {}

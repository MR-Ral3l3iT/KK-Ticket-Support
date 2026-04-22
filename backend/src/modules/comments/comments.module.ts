import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CommentsAdminController } from './comments-admin.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { SlaModule } from '../sla/sla.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditLogsModule, SlaModule, NotificationsModule],
  controllers: [CommentsController, CommentsAdminController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}

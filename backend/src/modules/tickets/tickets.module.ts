import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsTransitionService } from './tickets-transition.service';
import { TicketsController } from './tickets.controller';
import { TicketsAdminController } from './tickets-admin.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { SlaModule } from '../sla/sla.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditLogsModule, SlaModule, NotificationsModule],
  controllers: [TicketsController, TicketsAdminController],
  providers: [TicketsService, TicketsTransitionService],
  exports: [TicketsService],
})
export class TicketsModule {}

import { Controller, Get, Patch, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('การแจ้งเตือน (Notifications)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'ดูการแจ้งเตือนที่ยังไม่ได้อ่าน (สูงสุด 20 รายการ)' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลการแจ้งเตือนสำเร็จ' })
  getUnread(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getUnread(user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ทำเครื่องหมายการแจ้งเตือนว่าอ่านแล้ว' })
  @ApiParam({ name: 'id', description: 'รหัส Notification' })
  @ApiResponse({ status: 204, description: 'อัปเดตสถานะสำเร็จ' })
  markRead(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.markRead(id, user.id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้ว' })
  @ApiResponse({ status: 204, description: 'อัปเดตสถานะสำเร็จ' })
  markAllRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllRead(user.id);
  }
}

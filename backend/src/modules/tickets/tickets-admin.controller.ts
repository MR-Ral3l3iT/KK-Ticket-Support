import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { TicketsService } from './tickets.service';
import { TicketsTransitionService } from './tickets-transition.service';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { TicketFilterDto } from './dto/ticket-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SUPPORT_ROLES } from '../../common/constants/roles.constant';

@ApiTags('Ticket (Admin/Support Console)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SUPPORT_ROLES)
@Controller('admin/tickets')
export class TicketsAdminController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly transitionService: TicketsTransitionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'ดู Ticket ทั้งหมด', description: 'SUPPORT_AGENT เห็นเฉพาะ Ticket ที่ Assign ให้ตนหรือทีม, Admin เห็นทั้งหมด' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูล Ticket สำเร็จ' })
  findAll(
    @Query() filter: TicketFilterDto,
    @CurrentUser() user: { id: string; role: UserRole; customerId?: string; teamId?: string },
  ) {
    return this.ticketsService.findAll(filter, user.role, user.id, user.customerId, user.teamId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูรายละเอียด Ticket (รวม Internal Note)' })
  @ApiParam({ name: 'id', description: 'รหัส Ticket' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูล Ticket สำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบ Ticket' })
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไข Ticket', description: 'อัปเดต priority, category, scope, title, description' })
  @ApiParam({ name: 'id', description: 'รหัส Ticket' })
  @ApiResponse({ status: 200, description: 'แก้ไข Ticket สำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบ Ticket' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.ticketsService.update(id, dto, user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'เปลี่ยนสถานะ Ticket', description: 'Support สามารถเปลี่ยนสถานะได้ตาม Transition Matrix ทั้งหมด' })
  @ApiParam({ name: 'id', description: 'รหัส Ticket' })
  @ApiResponse({ status: 200, description: 'เปลี่ยนสถานะสำเร็จ' })
  @ApiResponse({ status: 400, description: 'ไม่สามารถเปลี่ยนสถานะนี้ได้' })
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.transitionService.changeStatus(id, dto.status, user.id, user.role, dto.reason);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign Ticket ให้ Agent หรือ Team' })
  @ApiParam({ name: 'id', description: 'รหัส Ticket' })
  @ApiResponse({ status: 200, description: 'Assign Ticket สำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบ Ticket' })
  assign(
    @Param('id') id: string,
    @Body() dto: AssignTicketDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.ticketsService.assign(id, dto, user.id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'ดู Timeline ของ Ticket (รวม Internal Note)' })
  @ApiParam({ name: 'id', description: 'รหัส Ticket' })
  getTimeline(@Param('id') id: string) {
    return this.ticketsService.getTimeline(id);
  }
}

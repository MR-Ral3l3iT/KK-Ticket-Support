import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TicketStatus, TicketPriority, UserRole } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ADMIN_ROLES, SUPPORT_ROLES } from '../../common/constants/roles.constant';

class TicketReportFilterDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  systemId?: string;

  @ApiPropertyOptional({ enum: TicketStatus })
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @ApiPropertyOptional({ description: 'วันเริ่มต้น ISO 8601' })
  @IsString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'วันสิ้นสุด ISO 8601' })
  @IsString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 50;
}

@ApiTags('รายงาน (Reports)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('admin/dashboard')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'ดู Dashboard ภาพรวมระบบ', description: 'สรุป KPI: จำนวน Ticket, สถานะ, Priority, SLA breach' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูล Dashboard สำเร็จ' })
  getDashboard(@CurrentUser() _user: { role: UserRole; customerId?: string }) {
    return this.reportsService.getDashboard();
  }

  @Get('admin/customers/:id/dashboard')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'ดู Dashboard ของลูกค้าที่เลือก' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูล Dashboard สำเร็จ' })
  getCustomerDashboard(@Param('id') customerId: string) {
    return this.reportsService.getDashboard(customerId);
  }

  @Get('reports/tickets')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'รายงาน Ticket', description: 'กรองตามช่วงวันที่ สถานะ Priority ลูกค้า หรือระบบ' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลรายงานสำเร็จ' })
  getTicketReport(@Query() filter: TicketReportFilterDto) {
    return this.reportsService.getTicketReport(filter);
  }

  @Get('reports/sla-breach')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'รายงาน Ticket ที่ SLA เกินกำหนด' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลรายงาน SLA Breach สำเร็จ' })
  getSlaBreachReport(
    @Query('customerId') customerId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getSlaBreachReport({ customerId, page, limit });
  }

  @Get('admin/dashboard/chart-data')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'ข้อมูล Chart สำหรับ Dashboard' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูล Chart สำเร็จ' })
  getChartData(@Query('customerId') customerId?: string) {
    return this.reportsService.getChartData(customerId);
  }

  @Get('reports/export/csv')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'Export รายงาน Ticket เป็น CSV' })
  @ApiResponse({ status: 200, description: 'ไฟล์ CSV' })
  async exportCsv(
    @Query() filter: TicketReportFilterDto,
    @Res() res: Response,
  ) {
    const csv = await this.reportsService.exportTicketsCsv(filter);
    const filename = `tickets_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('﻿' + csv);
  }
}

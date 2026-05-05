import {
  Controller,
  Get,
  Post,
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
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { TicketFilterDto } from './dto/ticket-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CUSTOMER_ROLES } from '../../common/constants/roles.constant';

@ApiTags('Ticket (Customer Portal)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...CUSTOMER_ROLES)
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly transitionService: TicketsTransitionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'ดู Ticket ของฉันทั้งหมด', description: 'CUSTOMER_ADMIN เห็น Ticket ทุกใบของบริษัท, CUSTOMER_USER เห็นเฉพาะของตัวเอง' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูล Ticket สำเร็จ' })
  findMine(
    @Query() filter: TicketFilterDto,
    @CurrentUser() user: { id: string; role: UserRole; customerId: string },
  ) {
    return this.ticketsService.findMine(user.id, user.customerId, filter);
  }

  @Post()
  @ApiOperation({ summary: 'สร้าง Ticket ใหม่', description: 'ระบุ systemId ที่เป็นของบริษัทตัวเอง พร้อม categoryId ถ้ามี' })
  @ApiResponse({ status: 201, description: 'สร้าง Ticket สำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบระบบหรือหมวดหมู่ที่เลือก' })
  create(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: { id: string; customerId: string },
  ) {
    return this.ticketsService.create(dto, user.id, user.customerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูรายละเอียด Ticket' })
  @ApiParam({ name: 'id', description: 'รหัส Ticket' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูล Ticket สำเร็จ' })
  @ApiResponse({ status: 403, description: 'ไม่มีสิทธิ์เข้าถึง Ticket นี้' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole; customerId: string },
  ) {
    return this.ticketsService.findOneAsCustomer(id, user.id, user.customerId, user.role);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'เปลี่ยนสถานะ Ticket', description: 'ลูกค้าสามารถเปลี่ยนได้เฉพาะ: RESOLVED→CLOSED/REOPENED, WAITING_CUSTOMER→IN_PROGRESS' })
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

  @Post(':id/follow-up')
  @ApiOperation({ summary: 'สร้าง Follow-up Ticket จาก Ticket ที่ปิดแล้ว', description: 'ใช้เมื่อปัญหาเดิมกลับมาอีกหลังจาก CLOSED' })
  @ApiParam({ name: 'id', description: 'รหัส Ticket ต้นทาง' })
  @ApiResponse({ status: 201, description: 'สร้าง Follow-up Ticket สำเร็จ' })
  createFollowUp(
    @Param('id') id: string,
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: { id: string; customerId: string },
  ) {
    return this.ticketsService.createFollowUp(id, dto, user.id, user.customerId);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'ดู Timeline ของ Ticket', description: 'แสดงประวัติการเปลี่ยนสถานะ + Comment (PUBLIC เท่านั้น) เรียงตามเวลา' })
  @ApiParam({ name: 'id', description: 'รหัส Ticket' })
  @ApiResponse({ status: 200, description: 'ดึง Timeline สำเร็จ' })
  getTimeline(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole; customerId: string },
  ) {
    return this.ticketsService.getTimelineAsCustomer(id, user.id, user.customerId, user.role);
  }
}

import { Controller, Get, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SUPPORT_ROLES } from '../../common/constants/roles.constant';

@ApiTags('Comment (Admin/Support Console)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SUPPORT_ROLES)
@Controller('admin/tickets/:ticketId/comments')
export class CommentsAdminController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: 'ดู Comment ทั้งหมดรวม Internal Note' })
  @ApiParam({ name: 'ticketId', description: 'รหัส Ticket' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูล Comment สำเร็จ' })
  findAll(@Param('ticketId') ticketId: string) {
    return this.commentsService.findByTicket(ticketId, true);
  }

  @Post()
  @ApiOperation({ summary: 'เพิ่ม Comment (PUBLIC หรือ INTERNAL)', description: 'INTERNAL = Internal Note ที่ลูกค้าไม่เห็น' })
  @ApiParam({ name: 'ticketId', description: 'รหัส Ticket' })
  @ApiResponse({ status: 201, description: 'เพิ่ม Comment สำเร็จ' })
  create(
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.commentsService.create(ticketId, dto, user.id, user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ลบ Comment (Soft Delete)', description: 'Admin ลบได้ทุก Comment, Agent ลบได้เฉพาะของตัวเอง' })
  @ApiParam({ name: 'ticketId', description: 'รหัส Ticket' })
  @ApiParam({ name: 'id', description: 'รหัส Comment' })
  @ApiResponse({ status: 204, description: 'ลบ Comment สำเร็จ' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.commentsService.remove(id, user.id, user.role);
  }
}

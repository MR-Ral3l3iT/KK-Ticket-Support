import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CUSTOMER_ROLES } from '../../common/constants/roles.constant';

@ApiTags('Comment (Customer Portal)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...CUSTOMER_ROLES)
@Controller('tickets/:ticketId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: 'ดู Comment ของ Ticket (เฉพาะ PUBLIC)' })
  @ApiParam({ name: 'ticketId', description: 'รหัส Ticket' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูล Comment สำเร็จ' })
  findAll(@Param('ticketId') ticketId: string) {
    return this.commentsService.findByTicket(ticketId, false);
  }

  @Post()
  @ApiOperation({ summary: 'เพิ่ม Comment (PUBLIC เท่านั้น)', description: 'ลูกค้าสามารถเพิ่มได้เฉพาะ PUBLIC comment' })
  @ApiParam({ name: 'ticketId', description: 'รหัส Ticket' })
  @ApiResponse({ status: 201, description: 'เพิ่ม Comment สำเร็จ' })
  create(
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.commentsService.create(ticketId, dto, user.id, user.role);
  }
}

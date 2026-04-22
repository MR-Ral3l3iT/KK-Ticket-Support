import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { memoryStorage } from 'multer';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const MAX_FILES = 10;
const multerOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
};

@ApiTags('ไฟล์แนบ (Attachments)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('tickets/:ticketId/attachments')
  @UseInterceptors(FilesInterceptor('files', MAX_FILES, multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'ไฟล์ที่ต้องการแนบ (สูงสุด 10 ไฟล์, ไฟล์ละไม่เกิน 10 MB, รวมไม่เกิน 30 MB)',
        },
        commentId: { type: 'string', description: 'รหัส Comment (ไม่บังคับ)' },
      },
      required: ['files'],
    },
  })
  @ApiParam({ name: 'ticketId', description: 'รหัส Ticket' })
  @ApiQuery({ name: 'commentId', required: false })
  @ApiOperation({
    summary: 'อัปโหลดไฟล์แนบ (หลายไฟล์)',
    description: 'รองรับ: pdf, jpg, png, gif, webp, xlsx, docx, txt — รูปภาพจะถูก convert เป็น WebP อัตโนมัติ',
  })
  @ApiResponse({ status: 201, description: 'อัปโหลดไฟล์สำเร็จ' })
  upload(
    @Param('ticketId') ticketId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: { id: string },
    @Query('commentId') commentId?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('ไม่พบไฟล์ที่อัปโหลด');
    }
    return this.attachmentsService.upload(ticketId, files, user.id, commentId);
  }

  @Get('attachments/:id/url')
  @ApiOperation({ summary: 'รับ URL สำหรับดาวน์โหลดไฟล์' })
  @ApiParam({ name: 'id', description: 'รหัสไฟล์แนบ' })
  @ApiResponse({ status: 200 })
  getUrl(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.attachmentsService.getPresignedUrl(id, user.id);
  }

  @Get('tickets/:ticketId/attachments')
  @ApiOperation({ summary: 'ดูรายการไฟล์แนบของ Ticket (พร้อม URL)' })
  @ApiParam({ name: 'ticketId', description: 'รหัส Ticket' })
  @ApiResponse({ status: 200 })
  findByTicket(@Param('ticketId') ticketId: string) {
    return this.attachmentsService.findByTicket(ticketId);
  }

  @Delete('attachments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ลบไฟล์แนบ', description: 'Admin ลบได้ทุกไฟล์, User ลบได้เฉพาะที่ตัวเองอัปโหลด' })
  @ApiParam({ name: 'id', description: 'รหัสไฟล์แนบ' })
  @ApiResponse({ status: 204 })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.attachmentsService.remove(id, user.id, user.role);
  }
}

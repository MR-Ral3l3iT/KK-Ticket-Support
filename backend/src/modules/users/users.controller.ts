import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ADMIN_ROLES } from '../../common/constants/roles.constant';

@ApiTags('ผู้ใช้งาน (Users)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(...ADMIN_ROLES, UserRole.CUSTOMER_ADMIN)
  @ApiOperation({ summary: 'ดูรายการผู้ใช้งานทั้งหมด', description: 'CUSTOMER_ADMIN เห็นเฉพาะ User ของบริษัทตัวเอง' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลรายการผู้ใช้สำเร็จ' })
  findAll(
    @Query() filter: UserFilterDto,
    @CurrentUser() user: { role: UserRole; customerId?: string },
  ) {
    return this.usersService.findAll(filter, user.role, user.customerId);
  }

  @Get(':id')
  @Roles(...ADMIN_ROLES, UserRole.CUSTOMER_ADMIN)
  @ApiOperation({ summary: 'ดูข้อมูลผู้ใช้ตาม ID' })
  @ApiParam({ name: 'id', description: 'รหัส User' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลผู้ใช้สำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลผู้ใช้' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { role: UserRole; customerId?: string },
  ) {
    return this.usersService.findOne(id, user.role, user.customerId);
  }

  @Post()
  @Roles(...ADMIN_ROLES, UserRole.CUSTOMER_ADMIN)
  @ApiOperation({ summary: 'สร้างผู้ใช้ใหม่', description: 'CUSTOMER_* roles ต้องระบุ customerId, SUPPORT_AGENT ต้องระบุ teamId' })
  @ApiResponse({ status: 201, description: 'สร้างผู้ใช้สำเร็จ' })
  @ApiResponse({ status: 409, description: 'อีเมลนี้ถูกใช้งานแล้ว' })
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: { role: UserRole; customerId?: string },
  ) {
    return this.usersService.create(dto, user.role, user.customerId);
  }

  @Patch(':id')
  @Roles(...ADMIN_ROLES, UserRole.CUSTOMER_ADMIN)
  @ApiOperation({ summary: 'แก้ไขข้อมูลผู้ใช้' })
  @ApiParam({ name: 'id', description: 'รหัส User' })
  @ApiResponse({ status: 200, description: 'แก้ไขข้อมูลผู้ใช้สำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลผู้ใช้' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: { role: UserRole; customerId?: string },
  ) {
    return this.usersService.update(id, dto, user.role, user.customerId);
  }

  @Patch(':id/password')
  @Roles(...ADMIN_ROLES, UserRole.CUSTOMER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'รีเซ็ตรหัสผ่านผู้ใช้' })
  @ApiParam({ name: 'id', description: 'รหัส User' })
  @ApiResponse({ status: 204, description: 'รีเซ็ตรหัสผ่านสำเร็จ' })
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetUserPasswordDto,
    @CurrentUser() user: { role: UserRole; customerId?: string },
  ) {
    return this.usersService.resetPassword(id, dto.password, user.role, user.customerId);
  }

  @Delete(':id')
  @Roles(...ADMIN_ROLES, UserRole.CUSTOMER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ลบผู้ใช้ (Soft Delete)', description: 'ไม่ลบข้อมูลจริง — ตั้ง deletedAt และปิดสถานะ' })
  @ApiParam({ name: 'id', description: 'รหัส User' })
  @ApiResponse({ status: 204, description: 'ลบผู้ใช้สำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลผู้ใช้' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { role: UserRole; customerId?: string },
  ) {
    return this.usersService.remove(id, user.role, user.customerId);
  }
}

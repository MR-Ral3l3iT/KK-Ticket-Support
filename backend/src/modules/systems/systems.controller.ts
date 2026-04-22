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
import { SystemsService } from './systems.service';
import { CreateSystemDto } from './dto/create-system.dto';
import { UpdateSystemDto } from './dto/update-system.dto';
import { SystemFilterDto } from './dto/system-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ADMIN_ROLES, SUPPORT_ROLES } from '../../common/constants/roles.constant';

@ApiTags('ระบบ (Customer Systems)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/systems')
export class SystemsController {
  constructor(private readonly systemsService: SystemsService) {}

  @Get()
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'ดูรายการระบบทั้งหมด', description: 'กรองตาม customerId สถานะ หรือค้นหาจากชื่อ/รหัสระบบ' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลรายการระบบสำเร็จ' })
  findAll(@Query() filter: SystemFilterDto) {
    return this.systemsService.findAll(filter);
  }

  @Get(':id')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'ดูข้อมูลระบบตาม ID' })
  @ApiParam({ name: 'id', description: 'รหัส CustomerSystem' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลระบบสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลระบบ' })
  findOne(@Param('id') id: string) {
    return this.systemsService.findOne(id);
  }

  @Post()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'เพิ่มระบบใหม่ให้ลูกค้า', description: 'รหัสระบบ (code) ต้อง unique ภายในลูกค้าเดียวกัน' })
  @ApiResponse({ status: 201, description: 'เพิ่มระบบสำเร็จ' })
  @ApiResponse({ status: 409, description: 'รหัสระบบนี้ถูกใช้งานแล้วภายในลูกค้าเดียวกัน' })
  create(@Body() dto: CreateSystemDto) {
    return this.systemsService.create(dto);
  }

  @Patch(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'แก้ไขข้อมูลระบบ' })
  @ApiParam({ name: 'id', description: 'รหัส CustomerSystem' })
  @ApiResponse({ status: 200, description: 'แก้ไขข้อมูลระบบสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลระบบ' })
  @ApiResponse({ status: 409, description: 'รหัสระบบนี้ถูกใช้งานแล้วภายในลูกค้าเดียวกัน' })
  update(@Param('id') id: string, @Body() dto: UpdateSystemDto) {
    return this.systemsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...ADMIN_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ลบระบบ (Soft Delete)', description: 'ไม่ลบข้อมูลจริง — ตั้ง deletedAt และปิดสถานะ' })
  @ApiParam({ name: 'id', description: 'รหัส CustomerSystem' })
  @ApiResponse({ status: 204, description: 'ลบระบบสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลระบบ' })
  remove(@Param('id') id: string) {
    return this.systemsService.remove(id);
  }
}

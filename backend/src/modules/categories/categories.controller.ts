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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryFilterDto } from './dto/category-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ADMIN_ROLES, SUPPORT_ROLES } from '../../common/constants/roles.constant';

@ApiTags('หมวดหมู่ Ticket (Categories)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({
    summary: 'ดูรายการหมวดหมู่ทั้งหมด',
    description: 'กรองตาม systemId, parentId (ใส่ "root" เพื่อดูเฉพาะหมวดหมู่หลัก) หรือค้นหาจากชื่อ',
  })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลรายการหมวดหมู่สำเร็จ' })
  findAll(@Query() filter: CategoryFilterDto) {
    return this.categoriesService.findAll(filter);
  }

  @Get(':id')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'ดูข้อมูลหมวดหมู่ตาม ID', description: 'แสดงรายละเอียดพร้อม Sub-category ที่อยู่ภายใต้' })
  @ApiParam({ name: 'id', description: 'รหัส Category' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลหมวดหมู่สำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลหมวดหมู่' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({
    summary: 'เพิ่มหมวดหมู่ใหม่',
    description: 'ระบุ parentId เพื่อสร้าง Sub-category ชื่อหมวดหมู่ต้องไม่ซ้ำภายในระดับเดียวกัน',
  })
  @ApiResponse({ status: 201, description: 'เพิ่มหมวดหมู่สำเร็จ' })
  @ApiResponse({ status: 409, description: 'ชื่อหมวดหมู่นี้มีอยู่แล้วภายในระดับเดียวกัน' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'แก้ไขข้อมูลหมวดหมู่' })
  @ApiParam({ name: 'id', description: 'รหัส Category' })
  @ApiResponse({ status: 200, description: 'แก้ไขข้อมูลหมวดหมู่สำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลหมวดหมู่' })
  @ApiResponse({ status: 409, description: 'ชื่อหมวดหมู่นี้มีอยู่แล้วภายในระดับเดียวกัน' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...ADMIN_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ลบหมวดหมู่ (Soft Delete)', description: 'ไม่ลบข้อมูลจริง — ตั้ง deletedAt และปิดสถานะ' })
  @ApiParam({ name: 'id', description: 'รหัส Category' })
  @ApiResponse({ status: 204, description: 'ลบหมวดหมู่สำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลหมวดหมู่' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}

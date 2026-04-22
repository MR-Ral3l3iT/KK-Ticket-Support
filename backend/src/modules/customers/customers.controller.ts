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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerFilterDto } from './dto/customer-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ADMIN_ROLES, SUPPORT_ROLES } from '../../common/constants/roles.constant';

@ApiTags('ลูกค้า (Customers)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'ดูรายการลูกค้าทั้งหมด', description: 'รองรับการค้นหา กรองตามสถานะ และ pagination' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลรายการลูกค้าสำเร็จ' })
  findAll(@Query() filter: CustomerFilterDto) {
    return this.customersService.findAll(filter);
  }

  @Get(':id')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'ดูข้อมูลลูกค้าตาม ID', description: 'แสดงรายละเอียดลูกค้าพร้อมรายการระบบที่สังกัด' })
  @ApiParam({ name: 'id', description: 'รหัส Customer' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลลูกค้าสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลลูกค้า' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'เพิ่มลูกค้าใหม่' })
  @ApiResponse({ status: 201, description: 'เพิ่มลูกค้าสำเร็จ' })
  @ApiResponse({ status: 409, description: 'รหัสลูกค้านี้ถูกใช้งานแล้ว' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'แก้ไขข้อมูลลูกค้า' })
  @ApiParam({ name: 'id', description: 'รหัส Customer' })
  @ApiResponse({ status: 200, description: 'แก้ไขข้อมูลลูกค้าสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลลูกค้า' })
  @ApiResponse({ status: 409, description: 'รหัสลูกค้านี้ถูกใช้งานแล้ว' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...ADMIN_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ลบลูกค้า (Soft Delete)', description: 'ไม่ลบข้อมูลจริง — ตั้ง deletedAt และปิดสถานะ' })
  @ApiParam({ name: 'id', description: 'รหัส Customer' })
  @ApiResponse({ status: 204, description: 'ลบลูกค้าสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลลูกค้า' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}

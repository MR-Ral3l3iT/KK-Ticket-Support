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
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ContractFilterDto } from './dto/contract-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ADMIN_ROLES, SUPPORT_ROLES } from '../../common/constants/roles.constant';

@ApiTags('สัญญา MA (Contracts)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'ดูรายการสัญญา MA ทั้งหมด', description: 'กรองตาม customerId, systemId สถานะ หรือค้นหาจากเลขที่/ชื่อสัญญา' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลรายการสัญญาสำเร็จ' })
  findAll(@Query() filter: ContractFilterDto) {
    return this.contractsService.findAll(filter);
  }

  @Get(':id')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'ดูข้อมูลสัญญาตาม ID', description: 'แสดงรายละเอียดสัญญาพร้อม SLA Policy ที่ใช้งานอยู่' })
  @ApiParam({ name: 'id', description: 'รหัส Contract' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลสัญญาสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลสัญญา' })
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Post()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'สร้างสัญญา MA ใหม่', description: 'วันสิ้นสุดต้องอยู่หลังวันเริ่มต้น เลขที่สัญญาต้องไม่ซ้ำกัน' })
  @ApiResponse({ status: 201, description: 'สร้างสัญญาสำเร็จ' })
  @ApiResponse({ status: 400, description: 'ช่วงวันที่สัญญาไม่ถูกต้อง' })
  @ApiResponse({ status: 409, description: 'เลขที่สัญญานี้ถูกใช้งานแล้ว' })
  create(@Body() dto: CreateContractDto) {
    return this.contractsService.create(dto);
  }

  @Patch(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'แก้ไขข้อมูลสัญญา' })
  @ApiParam({ name: 'id', description: 'รหัส Contract' })
  @ApiResponse({ status: 200, description: 'แก้ไขข้อมูลสัญญาสำเร็จ' })
  @ApiResponse({ status: 400, description: 'ช่วงวันที่สัญญาไม่ถูกต้อง' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลสัญญา' })
  @ApiResponse({ status: 409, description: 'เลขที่สัญญานี้ถูกใช้งานแล้ว' })
  update(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.contractsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...ADMIN_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ลบสัญญา (Soft Delete)', description: 'ไม่ลบข้อมูลจริง — ตั้ง deletedAt และปิดสถานะ' })
  @ApiParam({ name: 'id', description: 'รหัส Contract' })
  @ApiResponse({ status: 204, description: 'ลบสัญญาสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลสัญญา' })
  remove(@Param('id') id: string) {
    return this.contractsService.remove(id);
  }
}

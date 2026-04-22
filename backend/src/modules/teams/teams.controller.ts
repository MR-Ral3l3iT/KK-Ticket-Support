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
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamFilterDto } from './dto/team-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ADMIN_ROLES, SUPPORT_ROLES } from '../../common/constants/roles.constant';

@ApiTags('ทีม Support (Teams)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'ดูรายการทีม Support ทั้งหมด' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลรายการทีมสำเร็จ' })
  findAll(@Query() filter: TeamFilterDto) {
    return this.teamsService.findAll(filter);
  }

  @Get(':id')
  @Roles(...SUPPORT_ROLES)
  @ApiOperation({ summary: 'ดูข้อมูลทีมตาม ID', description: 'แสดงรายละเอียดทีมพร้อมรายชื่อสมาชิก' })
  @ApiParam({ name: 'id', description: 'รหัส Team' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลทีมสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลทีม' })
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Post()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'สร้างทีม Support ใหม่' })
  @ApiResponse({ status: 201, description: 'สร้างทีมสำเร็จ' })
  @ApiResponse({ status: 409, description: 'ชื่อทีมนี้มีอยู่แล้ว' })
  create(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto);
  }

  @Patch(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'แก้ไขข้อมูลทีม' })
  @ApiParam({ name: 'id', description: 'รหัส Team' })
  @ApiResponse({ status: 200, description: 'แก้ไขข้อมูลทีมสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลทีม' })
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...ADMIN_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ลบทีม (Soft Delete)' })
  @ApiParam({ name: 'id', description: 'รหัส Team' })
  @ApiResponse({ status: 204, description: 'ลบทีมสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบข้อมูลทีม' })
  remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }
}

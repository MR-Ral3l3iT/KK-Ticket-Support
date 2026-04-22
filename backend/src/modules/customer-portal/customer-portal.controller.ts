import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CUSTOMER_ROLES } from '../../common/constants/roles.constant';
import { CustomerPortalService } from './customer-portal.service';

@ApiTags('Customer Portal — ข้อมูลอ้างอิง')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...CUSTOMER_ROLES)
@Controller('customer')
export class CustomerPortalController {
  constructor(private readonly customerPortalService: CustomerPortalService) {}

  @Get('systems')
  @ApiOperation({ summary: 'ดูรายการระบบของบริษัทตัวเอง', description: 'ใช้สำหรับเลือกระบบตอนสร้าง Ticket' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลระบบสำเร็จ' })
  getMySystems(@CurrentUser() user: { customerId: string }) {
    return this.customerPortalService.getSystemsByCustomer(user.customerId);
  }

  @Get('systems/:systemId/categories')
  @ApiOperation({ summary: 'ดูหมวดหมู่ของระบบที่เลือก', description: 'ใช้สำหรับเลือก Category ตอนสร้าง Ticket' })
  @ApiParam({ name: 'systemId', description: 'รหัสระบบ (CustomerSystem)' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลหมวดหมู่สำเร็จ' })
  @ApiResponse({ status: 403, description: 'ระบบนี้ไม่ได้อยู่ในบัญชีของคุณ' })
  getSystemCategories(
    @Param('systemId') systemId: string,
    @CurrentUser() user: { customerId: string },
  ) {
    return this.customerPortalService.getCategoriesBySystem(systemId, user.customerId);
  }
}

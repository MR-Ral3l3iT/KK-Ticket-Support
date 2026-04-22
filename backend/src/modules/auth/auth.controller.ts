import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('การยืนยันตัวตน (Auth)')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'เข้าสู่ระบบ', description: 'รับ accessToken และ refreshToken สำหรับใช้งาน API' })
  @ApiResponse({ status: 200, description: 'เข้าสู่ระบบสำเร็จ — คืน accessToken และ refreshToken' })
  @ApiResponse({ status: 401, description: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ต่ออายุ Access Token', description: 'ใช้ refreshToken เพื่อรับ accessToken ใหม่' })
  @ApiResponse({ status: 200, description: 'ต่ออายุ token สำเร็จ' })
  @ApiResponse({ status: 401, description: 'refreshToken ไม่ถูกต้องหรือหมดอายุ' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ออกจากระบบ', description: 'ยกเลิก (revoke) refreshToken ที่ใช้งานอยู่' })
  @ApiResponse({ status: 204, description: 'ออกจากระบบสำเร็จ' })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูข้อมูลผู้ใช้ปัจจุบัน', description: 'ดึงข้อมูล Profile ของ User ที่ Login อยู่' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลผู้ใช้สำเร็จ' })
  @ApiResponse({ status: 401, description: 'ไม่ได้รับสิทธิ์หรือ token หมดอายุ' })
  getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }
}

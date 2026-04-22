import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSystemDto {
  @ApiProperty({ description: 'รหัสลูกค้าที่ระบบนี้สังกัดอยู่' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ description: 'ชื่อระบบ เช่น Booking System, HR System' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'รหัสระบบ เช่น SYS-BK-001 (ต้อง unique ภายในลูกค้าเดียวกัน)' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'คำอธิบายระบบ' })
  @IsString()
  @IsOptional()
  description?: string;
}

import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ description: 'ชื่อบริษัทลูกค้า' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'รหัสลูกค้า เช่น CUST-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'อีเมลติดต่อ' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'เบอร์โทรศัพท์' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'ที่อยู่' })
  @IsString()
  @IsOptional()
  address?: string;
}

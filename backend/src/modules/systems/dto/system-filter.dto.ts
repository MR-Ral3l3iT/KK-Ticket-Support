import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SystemFilterDto {
  @ApiPropertyOptional({ description: 'กรองตามรหัสลูกค้า' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: 'ค้นหาจากชื่อระบบหรือรหัสระบบ' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'กรองตามสถานะการใช้งาน' })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 1, description: 'หน้าที่ต้องการ' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, description: 'จำนวนรายการต่อหน้า' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}

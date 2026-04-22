import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ContractFilterDto {
  @ApiPropertyOptional({ description: 'กรองตามรหัสลูกค้า' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: 'กรองตามรหัสระบบ' })
  @IsString()
  @IsOptional()
  systemId?: string;

  @ApiPropertyOptional({ description: 'ค้นหาจากเลขที่สัญญาหรือชื่อสัญญา' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'กรองตามสถานะสัญญา' })
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

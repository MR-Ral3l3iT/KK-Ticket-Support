import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryFilterDto {
  @ApiPropertyOptional({ description: 'กรองตามรหัสระบบ' })
  @IsString()
  @IsOptional()
  systemId?: string;

  @ApiPropertyOptional({ description: 'กรองตามรหัสหมวดหมู่หลัก — ใส่ "root" เพื่อดูเฉพาะหมวดหมู่หลัก' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: 'ค้นหาจากชื่อหมวดหมู่' })
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

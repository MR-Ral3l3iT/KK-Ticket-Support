import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'รหัสระบบ (CustomerSystem) ที่หมวดหมู่นี้สังกัดอยู่' })
  @IsString()
  @IsNotEmpty()
  systemId: string;

  @ApiProperty({ description: 'ชื่อหมวดหมู่ เช่น Bug, Change Request' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'คำอธิบายหมวดหมู่' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'รหัสหมวดหมู่หลัก (กรณีเป็น Sub-category) — null หมายถึงหมวดหมู่หลัก' })
  @IsString()
  @IsOptional()
  parentId?: string;
}

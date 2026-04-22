import { OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(OmitType(CreateCategoryDto, ['systemId'] as const)) {
  @ApiPropertyOptional({ description: 'สถานะการใช้งาน (true = เปิดใช้งาน)' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

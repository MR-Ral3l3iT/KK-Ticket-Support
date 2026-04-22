import { OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateSystemDto } from './create-system.dto';

export class UpdateSystemDto extends PartialType(OmitType(CreateSystemDto, ['customerId'] as const)) {
  @ApiPropertyOptional({ description: 'สถานะการใช้งาน (true = เปิดใช้งาน)' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

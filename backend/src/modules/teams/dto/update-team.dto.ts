import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTeamDto } from './create-team.dto';

export class UpdateTeamDto extends PartialType(CreateTeamDto) {
  @ApiPropertyOptional({ description: 'สถานะการใช้งาน (true = เปิดใช้งาน)' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

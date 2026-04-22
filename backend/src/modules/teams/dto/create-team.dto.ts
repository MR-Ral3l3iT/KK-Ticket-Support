import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ description: 'ชื่อทีม Support เช่น Frontend Team, Backend Team' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'คำอธิบายทีม' })
  @IsString()
  @IsOptional()
  description?: string;
}

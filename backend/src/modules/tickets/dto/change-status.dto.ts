import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TicketStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangeStatusDto {
  @ApiProperty({ enum: TicketStatus })
  @IsEnum(TicketStatus)
  @IsNotEmpty()
  status: TicketStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignTicketDto {
  @ApiPropertyOptional({ description: 'รหัส Support Agent — ส่ง null เพื่อยกเลิกการ Assign', nullable: true })
  @IsString()
  @IsOptional()
  assigneeId?: string | null;

  @ApiPropertyOptional({ description: 'รหัสทีม — ส่ง null เพื่อยกเลิกการ Assign ทีม', nullable: true })
  @IsString()
  @IsOptional()
  teamId?: string | null;
}

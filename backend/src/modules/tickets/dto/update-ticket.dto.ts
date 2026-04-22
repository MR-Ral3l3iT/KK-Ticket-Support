import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ScopeType, TicketPriority } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTicketDto {
  @ApiPropertyOptional({ description: 'หัวข้อปัญหา', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'รายละเอียดปัญหา', maxLength: 5000 })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: TicketPriority, description: 'ระดับความสำคัญ' })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @ApiPropertyOptional({ description: 'รหัสหมวดหมู่' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ScopeType, description: 'ขอบเขตงาน — IN_SCOPE อยู่ใน MA, OUT_SCOPE งานนอก' })
  @IsEnum(ScopeType)
  @IsOptional()
  scopeType?: ScopeType;
}

import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContractDto {
  @ApiProperty({ description: 'รหัสลูกค้าที่สัญญานี้สังกัดอยู่' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ description: 'รหัสระบบ (CustomerSystem) ที่สัญญาครอบคลุม' })
  @IsString()
  @IsNotEmpty()
  systemId: string;

  @ApiProperty({ description: 'เลขที่สัญญา (ต้อง unique)' })
  @IsString()
  @IsNotEmpty()
  contractNumber: string;

  @ApiProperty({ description: 'ชื่อสัญญา' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'วันเริ่มต้นสัญญา (ISO 8601 เช่น 2026-01-01)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'วันสิ้นสุดสัญญา (ISO 8601 เช่น 2026-12-31)' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'รหัสสัญญาเดิม กรณีต่ออายุสัญญา' })
  @IsString()
  @IsOptional()
  renewedFromId?: string;
}

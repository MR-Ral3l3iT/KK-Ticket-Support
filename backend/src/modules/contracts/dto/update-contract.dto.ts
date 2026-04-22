import { OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateContractDto } from './create-contract.dto';

export class UpdateContractDto extends PartialType(
  OmitType(CreateContractDto, ['customerId', 'systemId'] as const),
) {
  @ApiPropertyOptional({ description: 'สถานะสัญญา (true = ยังมีผลบังคับใช้)' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

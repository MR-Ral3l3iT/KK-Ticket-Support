import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CommentType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'เนื้อหา Comment', maxLength: 10000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;

  @ApiPropertyOptional({
    enum: CommentType,
    default: CommentType.PUBLIC,
    description: 'PUBLIC — ลูกค้าเห็นได้ | INTERNAL — เห็นเฉพาะทีม Support (ลูกค้าใช้ได้เฉพาะ PUBLIC)',
  })
  @IsEnum(CommentType)
  @IsOptional()
  type?: CommentType;
}

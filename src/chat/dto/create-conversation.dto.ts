import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    description: 'Child ID',
    example: 1,
  })
  @IsNotEmpty()
  childId: number;

  @ApiProperty({
    description: 'Conversation title',
    example: 'جلسة تحليل حرف السين',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Conversation status',
    enum: ['active', 'closed', 'archived'],
    example: 'active',
    default: 'active',
  })
  @IsEnum(['active', 'closed', 'archived'])
  @IsOptional()
  status?: string;
}

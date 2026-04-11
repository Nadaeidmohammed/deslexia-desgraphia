import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class CreateConversationDto {
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
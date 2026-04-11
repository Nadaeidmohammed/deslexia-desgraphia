import { IsOptional, IsInt, IsEnum, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum MessageSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryMessageDto extends PaginationDto { 
  @ApiPropertyOptional({ description: 'Filter by conversation ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  conversationId?: number;

  @ApiPropertyOptional({ description: 'Filter by sender ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  senderId?: number;

  @ApiPropertyOptional({
    description: 'Filter by message type',
    enum: ['text', 'image', 'file'],
  })
  @IsOptional()
  @IsEnum(['text', 'image', 'file'])
  type?: string;

  @ApiPropertyOptional({ description: 'Filter by read status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isRead?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: MessageSortBy,
    default: MessageSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(MessageSortBy)
  sortBy?: MessageSortBy = MessageSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;
}
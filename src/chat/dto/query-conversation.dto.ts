import { IsOptional, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum ConversationSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryConversationDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by conversation status',
    enum: ['active', 'closed', 'archived'],
  })
  @IsOptional()
  @IsEnum(['active', 'closed', 'archived'])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  childId?: number;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ConversationSortBy,
    default: ConversationSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ConversationSortBy)
  sortBy?: ConversationSortBy = ConversationSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateExerciseDto } from './create-exercises.dto';

export class UpdateExerciseDto extends PartialType(CreateExerciseDto) {
  // الـ PartialType جعل كل حقول الـ Create (title, type, content, level) اختيارية تلقائياً.

  @ApiPropertyOptional({ description: 'URL for the exercise image' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'URL for the correct pronunciation audio' })
  @IsOptional()
  @IsString()
  audioUrl?: string;
}
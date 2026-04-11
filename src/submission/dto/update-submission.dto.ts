import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateSubmissionDto } from './create-submission.dto';

export class UpdateSubmissionDto extends PartialType(CreateSubmissionDto) {
  // الحقول اللي ممكن نحتاج نحدثها يدوياً أو عن طريق الـ AI
  
  @ApiPropertyOptional({ description: 'Manual score override or AI update' })
  @IsOptional()
  @IsNumber()
  score?: number;

  @ApiPropertyOptional({ description: 'Updated feedback from AI or Specialist' })
  @IsOptional()
  @IsString()
  aiFeedback?: string;
}
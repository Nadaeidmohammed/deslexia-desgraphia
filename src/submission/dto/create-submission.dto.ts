import { IsNotEmpty, IsNumber, IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  exerciseId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  childId: number;

  @ApiProperty({ example: 'https://cloud.com/audio/rec1.mp3' })
  @IsUrl()
  @IsNotEmpty()
  fileUrl: string;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsString()
  aiFeedback?: string;
}
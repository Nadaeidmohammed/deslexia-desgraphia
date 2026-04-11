import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExerciseDto {
  @ApiProperty({ example: 'نطق حرف السين' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: ['speech', 'handwriting', 'reading'] })
  @IsEnum(['speech', 'handwriting', 'reading'])
  type: string;

  @ApiProperty({ example: 'سَمكة' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  level?: string;
}
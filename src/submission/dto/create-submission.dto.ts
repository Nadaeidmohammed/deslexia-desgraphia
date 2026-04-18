import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsObject,
} from 'class-validator';

export enum ExerciseType {
  READING = 'reading',
  WRITING = 'writing',
  LISTENING = 'listening',
}

export enum SubmissionStatus {
  PASS = 'pass',
  FAIL = 'fail',
}

export class CreateSubmissionDto {
  @ApiProperty({
    example: 1,
    description: 'Child ID',
  })
  @IsInt()
  childId: number;

  @ApiProperty({
    example: 'level1',
    description: 'Current child level',
  })
  @IsString()
  level: string;

  @ApiProperty({
    example: 101,
    description: 'Exercise ID from Flutter',
  })
  @IsInt()
  exerciseId: number;

  @ApiProperty({
    enum: ExerciseType,
    example: 'reading',
    description: 'Exercise type: reading / writing / listening',
  })
  @IsEnum(ExerciseType)
  exerciseType: ExerciseType;

  @ApiProperty({
    enum: SubmissionStatus,
    example: 'pass',
    description: 'Submission result',
  })
  @IsEnum(SubmissionStatus)
  status: SubmissionStatus;

  @ApiProperty({
    example: 2,
    required: false,
    description: 'Number of attempts',
  })
  @IsInt()
  @IsOptional()
  attemptsCount?: number;

  @ApiProperty({
    example: 90,
    required: false,
    description: 'Duration in seconds',
  })
  @IsInt()
  @IsOptional()
  duration?: number;

  @ApiProperty({
    example: 10,
    required: false,
    description: 'Total questions/items',
  })
  @IsInt()
  @IsOptional()
  totalItems?: number;

  @ApiProperty({
    example: ['س'],
    required: false,
    description: 'Mistakes letters',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  mistakes?: string[];

  @ApiProperty({
    example: {
      lessonTitle: 'حرف السين',
    },
    required: false,
    description: 'Extra data',
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}

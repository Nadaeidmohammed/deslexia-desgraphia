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
  @IsInt()
  childId: number;

  @IsString()
  level: string;

  @IsInt()
  exerciseId: number;

  @IsEnum(ExerciseType)
  exerciseType: ExerciseType;

  @IsEnum(SubmissionStatus)
  status: SubmissionStatus;

  @IsInt()
  @IsOptional()
  attemptsCount?: number;

  @IsInt()
  @IsOptional()
  duration?: number;

  @IsInt()
  @IsOptional()
  totalItems?: number;

  @IsArray()
  @IsOptional()
  mistakes?: string[];

  @IsObject()
  @IsOptional()
  metadata?: any;
}

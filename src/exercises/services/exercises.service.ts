import { Injectable, NotFoundException } from '@nestjs/common';
import { Exercise } from '../entities/exercises.entity';
import { ExerciseProvider } from '../providers/exercises.provider';
import { UpdateExerciseDto } from '../dto';
@Injectable()
export class ExercisesService {
  constructor(private readonly exerciseProvider: ExerciseProvider) {}

  async findAll(type?: string): Promise<Exercise[]> {
    return this.exerciseProvider.findAll(type);
  }

  async findOne(id: number): Promise<Exercise> {
    const exercise = await this.exerciseProvider.findOne(id);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    return exercise;
  }

  async findByLevel(level: string): Promise<Exercise[]> {
    return this.exerciseProvider.findAll(undefined, level);
  }

  async update(id: number, dto: UpdateExerciseDto): Promise<Exercise> {
    const exercise = await this.exerciseProvider.findOne(id);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    return exercise.update(dto);
  }

  async remove(id: number): Promise<void> {
    const exercise = await this.exerciseProvider.findOne(id);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    await exercise.destroy();
  }
}
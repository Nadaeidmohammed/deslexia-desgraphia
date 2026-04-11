import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Exercise } from '../entities/exercises.entity';

@Injectable()
export class ExerciseProvider {
  constructor(@InjectModel(Exercise) private exerciseModel: typeof Exercise) {}

  async findAll(type?: string, level?: string): Promise<Exercise[]> {
    const whereClause: any = {};
    if (type) whereClause.type = type;
    if (level) whereClause.level = level;
    
    return this.exerciseModel.findAll({ where: whereClause });
  }

  async findOne(id: number): Promise<Exercise> {
    return this.exerciseModel.findByPk(id);
  }
  async remove(id: number): Promise<number> {
    return this.exerciseModel.destroy({ where: { id } });
  }
}

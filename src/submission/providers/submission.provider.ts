import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Submission } from '../entities/submission.entity';
import { CreateSubmissionDto } from '../dto/create-submission.dto';

@Injectable()
export class SubmissionProvider {
  constructor(@InjectModel(Submission) private submissionModel: typeof Submission) {}

  async create(dto: CreateSubmissionDto): Promise<Submission> {
    return this.submissionModel.create(dto as any);
  }

  async findByChild(childId: number): Promise<Submission[]> {
    return this.submissionModel.findAll({
      where: { childId },
      include: ['exercise'], 
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: number): Promise<Submission> {
    return this.submissionModel.findByPk(id, { include: ['child', 'exercise'] });
  }
}
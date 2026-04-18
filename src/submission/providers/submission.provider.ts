import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Submission } from '../entities/submission.entity';
import { Child } from '../../child/entities/child.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class SubmissionProvider {
  constructor(
    @InjectModel(Submission)
    private readonly submissionModel: typeof Submission,
  ) { }

  async create(dto: any) {
    return this.submissionModel.create(dto);
  }

  async findAll() {
    return this.submissionModel.findAll();
  }

  async findByChild(childId: number) {
    return this.submissionModel.findAll({
      where: { childId },
    });
  }

  async update(id: number, dto: any) {
    const submission = await this.submissionModel.findByPk(id);

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return submission.update(dto);
  }

  async delete(id: number) {
    const submission = await this.submissionModel.findByPk(id);

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    await submission.destroy();
    return { message: 'Deleted successfully' };
  }
  async findByChildWithChild(childId: number) {
    return this.submissionModel.findAll({
      where: { childId },
      include: [
        {
          model: Child,
          attributes: ['id', 'name', 'avatar', 'parentId', 'birthDate'],
          include: [
            {
              model: User,
              as: 'parent',
              attributes: ['id', 'email'],
            },
          ],
        },
      ],
      order: [['createdAt', 'ASC']],
    });
  }
}

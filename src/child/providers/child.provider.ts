import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Child } from '../entities/child.entity';
import { CreateChildDto } from '../dto/create-child.dto';
import { UpdateChildDto } from '../dto';

@Injectable()
export class ChildProvider {
  constructor(
    @InjectModel(Child)
    private readonly childModel: typeof Child,
  ) {}

  async create(parentId: number, dto: CreateChildDto): Promise<Child> {
    return this.childModel.create({
      ...dto,
      birthDate: new Date(dto.birthDate),
      parentId,
    });
  }

  async findAllByParent(parentId: number): Promise<Child[]> {
    return this.childModel.findAll({
      where: { parentId },
      order: [['id', 'DESC']],
    });
  }

  async findOne(id: number, parentId: number): Promise<Child | null> {
    return this.childModel.findOne({
      where: { id, parentId },
    });
  }

  async update(
    id: number,
    parentId: number,
    dto: UpdateChildDto,
  ): Promise<Child | null> {
    const child = await this.findOne(id, parentId);
    if (!child) return null;

    return child.update({
      ...dto,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : child.birthDate,
    });
  }

  async remove(id: number, parentId: number): Promise<number> {
    return this.childModel.destroy({
      where: { id, parentId },
    });
  }
}

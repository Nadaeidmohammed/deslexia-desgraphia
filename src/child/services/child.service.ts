import { Injectable, NotFoundException } from '@nestjs/common';
import { ChildProvider } from '../providers/child.provider';
import { CreateChildDto } from '../dto/create-child.dto';
import { UpdateChildDto } from '../dto';

@Injectable()
export class ChildrenService {
  constructor(private readonly childProvider: ChildProvider) {}

  // Create
  async create(userId: number, dto: CreateChildDto) {
    const child = await this.childProvider.create(userId, dto);

    return {
      message: 'Child created successfully',
      data: child,
    };
  }

  // Get all children
  async findAllByParent(parentId: number) {
    return this.childProvider.findAllByParent(parentId);
  }

  // Update
  async update(id: number, parentId: number, dto: UpdateChildDto) {
    const updated = await this.childProvider.update(id, parentId, dto);

    if (!updated) {
      throw new NotFoundException(
        'Child not found or you are not allowed to access it',
      );
    }

    return {
      message: 'Child updated successfully',
      data: updated,
    };
  }

  // Delete
  async delete(id: number, parentId: number) {
    const deleted = await this.childProvider.remove(id, parentId);

    if (!deleted) {
      throw new NotFoundException(
        'Child not found or you are not allowed to delete it',
      );
    }

    return {
      message: 'Child deleted successfully',
    };
  }
}

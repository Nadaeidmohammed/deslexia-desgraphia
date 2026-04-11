import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Op } from 'sequelize';

@Injectable()
export class UserProvider {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.userModel.create(createUserDto);
  }

  async findAll(queryDto: any = {}) {
    const { page = 1, limit = 10, search, role, isActive } = queryDto;
    const offset = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    const { count, rows } = await this.userModel.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number): Promise<User> {
    return this.userModel.findByPk(id);
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ where: { email } });
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<[number, User[]]> {
    return this.userModel.update(updateUserDto, {
      where: { id },
      returning: true,
    });
  }

  async remove(id: number): Promise<number> {
    return this.userModel.destroy({ where: { id } });
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.userModel.update({ updatedAt: new Date() }, { where: { id } });
  }

  async verifyEmail(id: number): Promise<User> {
    const user = await this.findOne(id);
    return user;
  }

  async count(): Promise<number> {
    return this.userModel.count();
  }

  async countByRole(role: string): Promise<number> {
    return this.userModel.count({ where: { role } });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.userModel.findAll({ where: { isActive: true } });
  }
}

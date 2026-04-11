import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../users/entities/user.entity';
import { RegisterDto } from '../dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthProvider {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async createUser(registerDto: RegisterDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    return this.userModel.create({
      ...registerDto,
      password: hashedPassword,
      isActive: true,
    });
  }

  async findUserByEmail(email: string): Promise<User> {
    return this.userModel.findOne({
      where: { email },
      attributes: [
        'id',
        'email',
        'password',
        'role',
        'isActive',
        'isEmailVerified',
      ],
    });
  }

  async findUserForReset(email: string): Promise<User> {
    return this.userModel.findOne({
      where: { email },
      attributes: [
        'id',
        'email',
        'resetPasswordOtp',
        'resetPasswordExpires',
        'otpAttempts',
      ],
    });
  }

  async findUserForVerification(email: string): Promise<User> {
    return this.userModel.findOne({
      where: { email },
      attributes: [
        'id',
        'email',
        'verificationCode',
        'verificationExpires',
        'otpAttempts',
        'isEmailVerified',
      ],
    });
  }

  async findUserById(id: number): Promise<User> {
    return this.userModel.findByPk(id, {
      attributes: [
        'id',
        'email',
        'avatar',
        'role',
        'isActive',
        'resetPasswordOtp',
        'resetPasswordExpires',
        'otpAttempts',
      ],
    });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async updateLastLogin(userId: number): Promise<void> {
    // Future implementation
    console.log(userId);
  }

  async updatePassword(
    userId: number,
    newPassword: string,
    oldPassword?: string, // not required
  ): Promise<void> {
    const user = await this.userModel.findByPk(userId);

    if (!user) {
      throw new NotFoundException(`User Not Found`);
    }

    // we need to check if the old password is correct
    if (oldPassword) {
      const isOldPasswordValid = await bcrypt.compare(
        oldPassword,
        user.password,
      );
      if (!isOldPasswordValid) {
        throw new UnauthorizedException('Old password is incorrect');
      }
    }

    user.password = await bcrypt.hash(newPassword, 10);

    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;

    await user.save();
  }

  async saveResetToken(
    userId: number,
    otp: string,
    expires: Date,
  ): Promise<void> {
    await this.userModel.update(
      { resetPasswordOtp: otp, resetPasswordExpires: expires, otpAttempts: 0 },
      { where: { id: userId } },
    );
  }

  async saveVerificationToken(
    userId: number,
    code: string,
    expires: Date,
  ): Promise<void> {
    await this.userModel.update(
      { verificationCode: code, verificationExpires: expires, otpAttempts: 0 },
      { where: { id: userId } },
    );
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({
      where: { email },
      attributes: ['id'],
    });
    return !!user;
  }

  async deactivateUser(userId: number): Promise<void> {
    await this.userModel.update({ isActive: false }, { where: { id: userId } });
  }

  async activateUser(userId: number): Promise<void> {
    await this.userModel.update({ isActive: true }, { where: { id: userId } });
  }

  async updateProfile(
    userId: number,
    profileData: Partial<User>,
  ): Promise<void> {
    const allowedFields = ['avatar'];
    const updateData = Object.keys(profileData)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = profileData[key];
        return obj;
      }, {});
    await this.userModel.update(updateData, { where: { id: userId } });
  }

  async findUsersByRole(role: string): Promise<User[]> {
    return this.userModel.findAll({ where: { role, isActive: true } });
  }

  async countActiveUsers(): Promise<number> {
    return this.userModel.count({ where: { isActive: true } });
  }

  async findRecentUsers(limit: number = 10): Promise<User[]> {
    return this.userModel.findAll({
      where: { isActive: true },
      limit,
      order: [['createdAt', 'DESC']],
    });
  }

  async deleteAccount(userId: number, password: string): Promise<void> {
    const user = await this.userModel.findByPk(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new UnauthorizedException('Wrong password');
    }

    await this.userModel.destroy({
      where: { id: userId },
    });
  }
}

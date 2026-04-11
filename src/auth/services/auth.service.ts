import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider } from '../providers/auth.provider';
import { ChangePasswordDto, RegisterDto } from '../dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/forget-password.dto';
import { MailService } from '../../mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.authProvider.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new BadRequestException('Please verify your email first');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return user;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const emailExists = await this.authProvider.checkEmailExists(
      registerDto.email,
    );
    if (emailExists) throw new ConflictException('Email already exists');

    const user = await this.authProvider.createUser(registerDto);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);
    await this.authProvider.saveVerificationToken(user.id, otp, expires);

    try {
      this.mailService
        .sendVerificationEmail(user.email, otp)
        .catch((e) => console.error('Mail Error:', e));
    } catch (mailError) {
      console.log('User created but email failed');
    }

    return {
      message: 'User registered successfully. Please verify your email.',
      devOnlyOtp: otp,
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    await this.authProvider.updatePassword(
      userId,
      dto.newPassword,
      dto.oldPassword,
    );
    return { message: 'Password updated successfully' };
  }

  // 1. Forgot Password Flow
  async forgotPassword(dto: ForgotPasswordDto) {
    // 1. Check User
    const user = await this.authProvider.findUserByEmail(dto.email);
    if (!user)
      throw new NotFoundException('User with this email does not exist');

    // 2. Generate OTP (6-digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    //  3. Get Expiration from ENV (Default to 15 if not set)
    const expirationMinutes =
      this.configService.get<number>('OTP_EXPIRATION_MINUTES') || 15;

    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + Number(expirationMinutes));

    // 4. Save to DB (using Provider)
    await this.authProvider.saveResetToken(user.id, otp, expires);

    // 5. Send Email
    await this.mailService.sendPasswordResetEmail(user.email, otp);

    return {
      message: 'OTP sent to your email successfully',
      devOnlyOtp: otp,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.authProvider.findUserForReset(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.validateOtp(user, dto.otp);
    await this.authProvider.updatePassword(user.id, dto.newPassword);
    return {
      message: 'Password has been reset successfully. You can login now.',
    };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.authProvider.findUserForVerification(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.otpAttempts >= 5) {
      throw new BadRequestException('Too many incorrect OTP attempts');
    }
    if (!user.verificationCode) {
      throw new BadRequestException('No verification code found');
    }
    if (!user.verificationExpires || new Date() > user.verificationExpires) {
      throw new BadRequestException('Verification code expired');
    }
    if (user.verificationCode !== otp) {
      user.otpAttempts += 1;
      await user.save();
      throw new BadRequestException('Invalid verification code');
    }

    user.verificationCode = null;
    user.verificationExpires = null;
    user.otpAttempts = 0;
    user.isEmailVerified = true;
    await user.save();

    return {
      message: 'Email verified successfully',
    };
  }

  async validateOtp(user: any, otp: string) {
    if (user.otpAttempts >= 5) {
      throw new BadRequestException('Too many incorrect OTP attempts');
    }
    if (!user.resetPasswordOtp) {
      throw new BadRequestException('No OTP found');
    }
    if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
      throw new BadRequestException('OTP expired');
    }
    if (user.resetPasswordOtp !== otp) {
      user.otpAttempts += 1;
      await user.save();
      throw new BadRequestException('Invalid OTP');
    }
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    user.otpAttempts = 0;
    await user.save();
  }

  async deleteAccount(userId: number, password: string) {
    await this.authProvider.deleteAccount(userId, password);

    return {
      message: 'Account deleted permanently',
    };
  }
}

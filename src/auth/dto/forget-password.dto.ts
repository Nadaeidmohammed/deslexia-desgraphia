import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@gmail.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@gmail.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '1234',
    description: 'The 4-digit OTP sent to email',
  })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({ example: 'newStrongPass123', description: 'New password' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

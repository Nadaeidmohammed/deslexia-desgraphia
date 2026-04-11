import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: 'user@gmail.com',
    description: 'User email address',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '1234',
    description: 'OTP code sent to email',
    required: true,
  })
  @IsString()
  otp: string;
}

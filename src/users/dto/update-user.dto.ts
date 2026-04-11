import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'New password (will be hashed)',
    example: 'newpassword123',
  })
  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  password?: string;
}

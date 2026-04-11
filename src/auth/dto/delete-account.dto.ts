import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({
    example: '123456',
    description: 'User current password',
  })
  @IsString()
  password: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsIn, Matches } from 'class-validator';

export class CreateChildDto {
  @ApiProperty({ example: 'Omar' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '01/01/2020',
    description: 'Format: dd/MM/yyyy',
  })
  @IsString()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, {
    message: 'birthDate must be in format dd/MM/yyyy',
  })
  birthDate: string;

  @ApiProperty({
    example: 1,
    description: '0 = girl, 1 = boy',
  })
  @IsInt()
  @IsIn([0, 1])
  gender: number;

  @ApiProperty({
    example: 'assets/images/child/avatar1.jpg',
  })
  @IsString()
  avatar: string;

  @ApiProperty({
    example: 'level1',
  })
  @IsString()
  @IsIn(['level1', 'level2', 'level3', 'level4', 'level5', 'level6', 'level7'])
  level: string;
}

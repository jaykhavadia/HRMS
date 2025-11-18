import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SetupPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}

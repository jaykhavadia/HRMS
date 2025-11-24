import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class SetupPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string; // Token from email - uniquely identifies the user

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;
}

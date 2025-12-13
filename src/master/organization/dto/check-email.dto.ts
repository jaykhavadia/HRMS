import { IsEmail, IsNotEmpty } from 'class-validator';

export class CheckEmailDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class ResendOtpDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

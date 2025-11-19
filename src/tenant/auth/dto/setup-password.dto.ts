import { IsNotEmpty, IsString, MinLength, IsOptional, IsEmail } from 'class-validator';

export class SetupPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string; // Encoded token with tenant domain: "tenantDomain:token"

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEmail()
  email?: string; // Optional: if provided, will be verified against token
}

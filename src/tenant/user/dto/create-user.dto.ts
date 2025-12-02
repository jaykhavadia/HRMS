import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @IsOptional()
  @IsEnum(['employee']) // Only 'employee' allowed - admin role cannot be assigned
  role?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @IsNotEmpty()
  @IsBoolean()
  remote: boolean; // If true, location validation is skipped for check-in/check-out
}

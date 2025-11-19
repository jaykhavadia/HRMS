import {
  IsEmail,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  // Note: role cannot be updated - admin role is protected
}


import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class RegisterOrganizationDto {
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsNotEmpty()
  @IsString()
  companyLocation: string;

  @IsNotEmpty()
  @IsEmail()
  companyEmail: string;

  @IsNotEmpty()
  @IsString()
  displayName: string;

  @IsNotEmpty()
  @IsString()
  companyDomain: string;

  @IsOptional()
  @IsString()
  adminFirstName?: string;

  @IsOptional()
  @IsString()
  adminLastName?: string;

  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @IsOptional()
  officeLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    radius?: number;
  };
}

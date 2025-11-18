import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckInDto {
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  address?: string;
}

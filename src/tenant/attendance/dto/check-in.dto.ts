import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckInDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { message: 'latitude must be a number' })
  latitude: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { message: 'longitude must be a number' })
  longitude: number;

  @IsOptional()
  @IsString()
  address?: string;
}

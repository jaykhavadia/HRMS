import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  Matches,
  ArrayMinSize,
  Min,
  Max,
} from 'class-validator';

export class UpdateCompanyProfileDto {
  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'workStartTime must be in HH:mm format (24-hour)',
  })
  workStartTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'workEndTime must be in HH:mm format (24-hour)',
  })
  workEndTime?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weeklyOffDays?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @IsOptional()
  @IsString()
  officeAddress?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  radius?: number;
}


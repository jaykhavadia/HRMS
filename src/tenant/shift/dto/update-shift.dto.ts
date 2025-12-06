import {
  IsOptional,
  IsString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  Matches,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class UpdateShiftDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Start time must be in HH:mm format (24-hour)',
  })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'End time must be in HH:mm format (24-hour)',
  })
  endTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Late time must be in HH:mm format (24-hour)',
  })
  lateTime?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(7, { message: 'Days array must have exactly 7 elements' })
  @ArrayMaxSize(7, { message: 'Days array must have exactly 7 elements' })
  @IsNumber({}, { each: true })
  @Min(0, { each: true, message: 'Each day value must be 0 or 1' })
  @Max(1, { each: true, message: 'Each day value must be 0 or 1' })
  days?: number[];
}


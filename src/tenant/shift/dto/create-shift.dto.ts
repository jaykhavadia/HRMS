import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  Matches,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateShiftDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Start time must be in HH:mm format (24-hour)',
  })
  startTime: string; // Format: HH:mm (e.g., "09:00")

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'End time must be in HH:mm format (24-hour)',
  })
  endTime: string; // Format: HH:mm (e.g., "17:00")

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Late time must be in HH:mm format (24-hour)',
  })
  lateTime: string; // Format: HH:mm (e.g., "09:30")

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(7, { message: 'Days array must have exactly 7 elements' })
  @ArrayMaxSize(7, { message: 'Days array must have exactly 7 elements' })
  @IsNumber({}, { each: true })
  @Min(0, { each: true, message: 'Each day value must be 0 or 1' })
  @Max(1, { each: true, message: 'Each day value must be 0 or 1' })
  days: number[]; // [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]
  // 0 = off day, 1 = working day
}


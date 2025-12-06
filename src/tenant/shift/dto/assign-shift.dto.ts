import { IsNotEmpty, IsString } from 'class-validator';

export class AssignShiftDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  shiftId: string;
}


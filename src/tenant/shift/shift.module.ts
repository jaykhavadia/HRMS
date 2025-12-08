import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftController } from './shift.controller';
import { ShiftService } from './shift.service';
import { Shift, ShiftSchema } from './schemas/shift.schema';
import { User, UserSchema } from '../user/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Shift.name, schema: ShiftSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ShiftController],
  providers: [ShiftService],
  exports: [ShiftService], // Export for use in AttendanceService
})
export class ShiftModule {}

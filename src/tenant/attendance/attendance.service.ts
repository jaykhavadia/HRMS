import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';
import { FileUploadService } from '../../shared/file-upload/file-upload.service';
import { ConfigService } from '../../config/config.service';
import { AttendanceSchema } from './schemas/attendance.schema';
import { CheckInDto } from './dto/check-in.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private databaseService: DatabaseService,
    private fileUploadService: FileUploadService,
    private configService: ConfigService,
  ) {}

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Validate if location is within office radius
   */
  private validateLocation(
    latitude: number,
    longitude: number,
    officeLocation: any,
  ): boolean {
    if (
      !officeLocation ||
      !officeLocation.latitude ||
      !officeLocation.longitude
    ) {
      return false;
    }

    const distance = this.calculateDistance(
      latitude,
      longitude,
      officeLocation.latitude,
      officeLocation.longitude,
    );

    const radius =
      officeLocation.radius || this.configService.getOfficeLocationRadius();
    return distance <= radius;
  }

  async checkIn(
    userId: string,
    checkInDto: CheckInDto,
    selfieFile: Express.Multer.File,
    tenantId: string,
    tenantName: string,
    officeLocation: any,
  ): Promise<any> {
    // Validate location
    if (
      !this.validateLocation(
        checkInDto.latitude,
        checkInDto.longitude,
        officeLocation,
      )
    ) {
      throw new BadRequestException(
        'You are not within the office location radius',
      );
    }

    // Upload selfie
    const selfiePath = await this.fileUploadService.uploadSelfie(
      selfieFile,
      userId,
    );

    const AttendanceModel = await this.databaseService.getTenantModel(
      tenantId,
      tenantName,
      'Attendance',
      AttendanceSchema,
    );

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await AttendanceModel.findOne({
      userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingAttendance && existingAttendance.checkInTime) {
      throw new BadRequestException('You have already checked in today');
    }

    const attendance = existingAttendance
      ? existingAttendance
      : new AttendanceModel({
          userId,
          date: today,
        });

    attendance.checkInTime = new Date();
    attendance.checkInLocation = {
      latitude: checkInDto.latitude,
      longitude: checkInDto.longitude,
      address: checkInDto.address,
    };
    attendance.checkInSelfie = selfiePath;
    attendance.status = 'checked-in';

    await attendance.save();

    return {
      id: attendance._id.toString(),
      checkInTime: attendance.checkInTime,
      status: attendance.status,
      message: 'Checked in successfully',
    };
  }

  async checkOut(
    userId: string,
    checkInDto: CheckInDto,
    selfieFile: Express.Multer.File,
    tenantId: string,
    tenantName: string,
    officeLocation: any,
  ): Promise<any> {
    // Validate location
    if (
      !this.validateLocation(
        checkInDto.latitude,
        checkInDto.longitude,
        officeLocation,
      )
    ) {
      throw new BadRequestException(
        'You are not within the office location radius',
      );
    }

    // Upload selfie
    const selfiePath = await this.fileUploadService.uploadSelfie(
      selfieFile,
      userId,
    );

    const AttendanceModel = await this.databaseService.getTenantModel(
      tenantId,
      tenantName,
      'Attendance',
      AttendanceSchema,
    );

    // Find today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await AttendanceModel.findOne({
      userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!attendance || !attendance.checkInTime) {
      throw new BadRequestException('You must check in before checking out');
    }

    if (attendance.checkOutTime) {
      throw new BadRequestException('You have already checked out today');
    }

    attendance.checkOutTime = new Date();
    attendance.checkOutLocation = {
      latitude: checkInDto.latitude,
      longitude: checkInDto.longitude,
      address: checkInDto.address,
    };
    attendance.checkOutSelfie = selfiePath;
    attendance.status = 'checked-out';

    // Calculate total hours
    const totalMs =
      attendance.checkOutTime.getTime() - attendance.checkInTime.getTime();
    attendance.totalHours = totalMs / (1000 * 60 * 60); // Convert to hours

    await attendance.save();

    return {
      id: attendance._id.toString(),
      checkOutTime: attendance.checkOutTime,
      totalHours: attendance.totalHours,
      status: attendance.status,
      message: 'Checked out successfully',
    };
  }

  async getAttendanceRecords(
    userId: string | null,
    tenantId: string,
    tenantName: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const AttendanceModel = await this.databaseService.getTenantModel(
      tenantId,
      tenantName,
      'Attendance',
      AttendanceSchema,
    );

    const query: any = {};
    if (userId) {
      query.userId = userId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = startDate;
      }
      if (endDate) {
        query.date.$lte = endDate;
      }
    }

    const records = await AttendanceModel.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ date: -1, checkInTime: -1 })
      .lean();

    return records.map((record) => ({
      id: record._id.toString(),
      userId: record.userId,
      date: record.date,
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime,
      checkInLocation: record.checkInLocation,
      checkOutLocation: record.checkOutLocation,
      checkInSelfie: record.checkInSelfie,
      checkOutSelfie: record.checkOutSelfie,
      status: record.status,
      totalHours: record.totalHours,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }
}

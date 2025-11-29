import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance } from './schemas/attendance.schema';
import { Organization } from '../../master/organization/schemas/organization.schema';
import { FileUploadService } from '../../shared/file-upload/file-upload.service';
import { ConfigService } from '../../config/config.service';
import { CheckInDto } from './dto/check-in.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name)
    private attendanceModel: Model<Attendance>,
    @InjectModel(Organization.name)
    private organizationModel: Model<Organization>,
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
    officeLatitude: number,
    officeLongitude: number,
    radius: number,
  ): { isValid: boolean; distance?: number; radius?: number } {
    const distance = this.calculateDistance(
      latitude,
      longitude,
      officeLatitude,
      officeLongitude,
    );

    return {
      isValid: distance <= radius,
      distance: Math.round(distance),
      radius: radius,
    };
  }

  async checkIn(
    userId: string,
    checkInDto: CheckInDto,
    selfieFile: Express.Multer.File,
    organizationId: string,
  ): Promise<any> {
    // Get organization to get office location
    const organization = await this.organizationModel.findById(organizationId);
    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    // Validate location
    const locationValidation = this.validateLocation(
      checkInDto.latitude,
      checkInDto.longitude,
      organization.latitude,
      organization.longitude,
      organization.radius,
    );

    if (!locationValidation.isValid) {
      const distance = locationValidation.distance || 0;
      const radius = locationValidation.radius || 100;
      throw new BadRequestException(
        `You are not within the office location radius. Your distance: ${distance}m, Allowed radius: ${radius}m`,
      );
    }

    // Upload selfie
    const selfiePath = await this.fileUploadService.uploadSelfie(
      selfieFile,
      userId,
    );

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await this.attendanceModel.findOne({
      userId,
      organizationId,
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
      : new this.attendanceModel({
          userId,
          organizationId,
          date: today,
        });

    attendance.checkInTime = new Date();
    attendance.checkInLocation = {
      latitude: checkInDto.latitude,
      longitude: checkInDto.longitude,
      address: checkInDto.address || '',
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
    organizationId: string,
  ): Promise<any> {
    // Get organization to get office location
    const organization = await this.organizationModel.findById(organizationId);
    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    // Validate location
    const locationValidation = this.validateLocation(
      checkInDto.latitude,
      checkInDto.longitude,
      organization.latitude,
      organization.longitude,
      organization.radius,
    );

    if (!locationValidation.isValid) {
      const distance = locationValidation.distance || 0;
      const radius = locationValidation.radius || 100;
      throw new BadRequestException(
        `You are not within the office location radius. Your distance: ${distance}m, Allowed radius: ${radius}m`,
      );
    }

    // Upload selfie
    const selfiePath = await this.fileUploadService.uploadSelfie(
      selfieFile,
      userId,
    );

    // Find today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.attendanceModel.findOne({
      userId,
      organizationId,
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
      address: checkInDto.address || '',
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
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const query: any = { organizationId };
    
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

    const records = await this.attendanceModel
      .find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ date: -1, checkInTime: -1 })
      .lean();

    return records.map((record: any) => ({
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

  /**
   * Export attendance records to CSV format
   */
  async exportAttendanceRecords(
    userId: string | null,
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<string> {
    const records = await this.getAttendanceRecords(
      userId,
      organizationId,
      startDate,
      endDate,
    );

    // CSV header
    const headers = [
      'Date',
      'Employee Name',
      'Email',
      'Check-In Time',
      'Check-Out Time',
      'Total Hours',
      'Status',
      'Check-In Location',
      'Check-Out Location',
    ];

    // CSV rows
    const rows = records.map((record: any) => {
      const user = record.userId;
      const userName = user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
        : 'N/A';
      const userEmail = user?.email || 'N/A';

      return [
        record.date ? new Date(record.date).toLocaleDateString() : 'N/A',
        userName,
        userEmail,
        record.checkInTime
          ? new Date(record.checkInTime).toLocaleString()
          : 'N/A',
        record.checkOutTime
          ? new Date(record.checkOutTime).toLocaleString()
          : 'N/A',
        record.totalHours ? record.totalHours.toFixed(2) : 'N/A',
        record.status || 'N/A',
        record.checkInLocation
          ? `${record.checkInLocation.latitude}, ${record.checkInLocation.longitude}`
          : 'N/A',
        record.checkOutLocation
          ? `${record.checkOutLocation.latitude}, ${record.checkOutLocation.longitude}`
          : 'N/A',
      ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Get check-in locations for map visualization
   */
  async getCheckInLocationsForMap(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const query: any = {
      organizationId,
      checkInLocation: { $exists: true, $ne: null },
    };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = startDate;
      }
      if (endDate) {
        query.date.$lte = endDate;
      }
    }

    const records = await this.attendanceModel
      .find(query)
      .populate('userId', 'firstName lastName email employeeId')
      .sort({ checkInTime: -1 })
      .lean();

    return records.map((record: any) => ({
      id: record._id.toString(),
      userId: record.userId,
      date: record.date,
      checkInTime: record.checkInTime,
      location: {
        latitude: record.checkInLocation?.latitude,
        longitude: record.checkInLocation?.longitude,
        address: record.checkInLocation?.address,
      },
      status: record.status,
    }));
  }
}

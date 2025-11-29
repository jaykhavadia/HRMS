import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { Attendance } from '../attendance/schemas/attendance.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Attendance.name)
    private attendanceModel: Model<Attendance>,
  ) {}

  async getDashboardStats(organizationId: string): Promise<any> {
    // Get total users for this organization
    const totalUsers = await this.userModel.countDocuments({
      organizationId,
      status: 'active',
    });
    const totalAdmins = await this.userModel.countDocuments({
      organizationId,
      role: 'admin',
      status: 'active',
    });
    const totalEmployees = await this.userModel.countDocuments({
      organizationId,
      role: 'employee',
      status: 'active',
    });

    // Get today's attendance stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCheckedIn = await this.attendanceModel.countDocuments({
      organizationId,
      date: { $gte: today, $lt: tomorrow },
      checkInTime: { $exists: true },
    });

    const todayCheckedOut = await this.attendanceModel.countDocuments({
      organizationId,
      date: { $gte: today, $lt: tomorrow },
      checkOutTime: { $exists: true },
    });

    // Get this week's attendance
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

    const weekAttendance = await this.attendanceModel.countDocuments({
      organizationId,
      date: { $gte: weekStart, $lt: tomorrow },
    });

    // Get this month's attendance
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const monthAttendance = await this.attendanceModel.countDocuments({
      organizationId,
      date: { $gte: monthStart, $lt: tomorrow },
    });

    // Get average hours worked this month
    const monthRecords = await this.attendanceModel
      .find({
        organizationId,
        date: { $gte: monthStart, $lt: tomorrow },
        totalHours: { $exists: true },
      })
      .lean();

    const totalHours = monthRecords.reduce(
      (sum, record) => sum + (record.totalHours || 0),
      0,
    );
    const avgHours =
      monthRecords.length > 0 ? totalHours / monthRecords.length : 0;

    // Get recent attendance (last 10 records)
    const recentAttendance = await this.attendanceModel
      .find({ organizationId })
      .populate('userId', 'firstName lastName email employeeId')
      .sort({ checkInTime: -1 })
      .limit(10)
      .lean();

    // Get recent employee actions (check-ins and check-outs) - last 20 actions
    const recentActions = await this.attendanceModel
      .find({
        organizationId,
        $or: [{ checkInTime: { $exists: true } }, { checkOutTime: { $exists: true } }],
      })
      .populate('userId', 'firstName lastName email employeeId')
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    // Get check-in locations for map visualization (today's check-ins)
    const todayCheckIns = await this.attendanceModel
      .find({
        organizationId,
        date: { $gte: today, $lt: tomorrow },
        checkInLocation: { $exists: true, $ne: null },
      })
      .populate('userId', 'firstName lastName email employeeId')
      .sort({ checkInTime: -1 })
      .lean();

    return {
      users: {
        total: totalUsers,
        admins: totalAdmins,
        employees: totalEmployees,
      },
      attendance: {
        today: {
          checkedIn: todayCheckedIn,
          checkedOut: todayCheckedOut,
          pending: totalEmployees - todayCheckedIn,
        },
        week: weekAttendance,
        month: monthAttendance,
        averageHours: Math.round(avgHours * 100) / 100,
      },
      recentAttendance: recentAttendance.map((record: any) => ({
        id: record._id.toString(),
        userId: record.userId,
        date: record.date,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        status: record.status,
        totalHours: record.totalHours,
      })),
      recentEmployeeActions: recentActions.map((record: any) => ({
        id: record._id.toString(),
        userId: record.userId,
        date: record.date,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        action: record.checkOutTime ? 'check-out' : 'check-in',
        actionTime: record.checkOutTime || record.checkInTime,
        status: record.status,
        totalHours: record.totalHours,
        updatedAt: record.updatedAt,
      })),
      mapLocations: todayCheckIns.map((record: any) => ({
        id: record._id.toString(),
        userId: record.userId,
        checkInTime: record.checkInTime,
        location: {
          latitude: record.checkInLocation?.latitude,
          longitude: record.checkInLocation?.longitude,
          address: record.checkInLocation?.address,
        },
      })),
    };
  }
}

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';
import { UserService } from '../user/user.service';
import { AttendanceService } from '../attendance/attendance.service';
import { UserSchema } from '../user/schemas/user.schema';
import { AttendanceSchema } from '../attendance/schemas/attendance.schema';

@Injectable()
export class DashboardService {
  constructor(
    private databaseService: DatabaseService,
    private userService: UserService,
    private attendanceService: AttendanceService,
  ) {}

  async getDashboardStats(tenantId: string, tenantName: string): Promise<any> {
    const UserModel = await this.databaseService.getTenantModel(
      tenantId,
      tenantName,
      'User',
      UserSchema,
    );

    const AttendanceModel = await this.databaseService.getTenantModel(
      tenantId,
      tenantName,
      'Attendance',
      AttendanceSchema,
    );

    // Get total users
    const totalUsers = await UserModel.countDocuments({ status: 'active' });
    const totalAdmins = await UserModel.countDocuments({
      role: 'admin',
      status: 'active',
    });
    const totalEmployees = await UserModel.countDocuments({
      role: 'employee',
      status: 'active',
    });

    // Get today's attendance stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCheckedIn = await AttendanceModel.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      checkInTime: { $exists: true },
    });

    const todayCheckedOut = await AttendanceModel.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      checkOutTime: { $exists: true },
    });

    // Get this week's attendance
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

    const weekAttendance = await AttendanceModel.countDocuments({
      date: { $gte: weekStart, $lt: tomorrow },
    });

    // Get this month's attendance
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const monthAttendance = await AttendanceModel.countDocuments({
      date: { $gte: monthStart, $lt: tomorrow },
    });

    // Get average hours worked this month
    const monthRecords = await AttendanceModel.find({
      date: { $gte: monthStart, $lt: tomorrow },
      totalHours: { $exists: true },
    }).lean();

    const totalHours = monthRecords.reduce(
      (sum, record) => sum + (record.totalHours || 0),
      0,
    );
    const avgHours =
      monthRecords.length > 0 ? totalHours / monthRecords.length : 0;

    // Get recent attendance (last 10 records)
    const recentAttendance = await AttendanceModel.find({})
      .populate('userId', 'firstName lastName email')
      .sort({ checkInTime: -1 })
      .limit(10)
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
      recentAttendance: recentAttendance.map((record) => ({
        id: record._id.toString(),
        userId: record.userId,
        date: record.date,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        status: record.status,
        totalHours: record.totalHours,
      })),
    };
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user/current-user.decorator';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @UseInterceptors(FileInterceptor('selfie'))
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )
  async checkIn(
    @Body() checkInDto: CheckInDto,
    @UploadedFile() selfieFile: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.checkIn(
      user.id,
      checkInDto,
      selfieFile,
      user.organizationId,
    );
  }

  @Post('check-out')
  @UseInterceptors(FileInterceptor('selfie'))
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )
  async checkOut(
    @Body() checkInDto: CheckInDto,
    @UploadedFile() selfieFile: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.checkOut(
      user.id,
      checkInDto,
      selfieFile,
      user.organizationId,
    );
  }

  @Get()
  async getAttendanceRecords(
    @CurrentUser() user: any,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Admin can view all records or filter by userId
    // Employee can only view their own records
    const targetUserId =
      user.role === 'admin' && userId
        ? userId
        : user.role === 'employee'
          ? user.id
          : null;

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.attendanceService.getAttendanceRecords(
      targetUserId || user.id,
      user.organizationId,
      start,
      end,
    );
  }

  @Get('export')
  async exportAttendance(
    @CurrentUser() user: any,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const targetUserId =
      user.role === 'admin' && userId
        ? userId
        : user.role === 'employee'
          ? user.id
          : null;

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const csvContent = await this.attendanceService.exportAttendanceRecords(
      targetUserId || user.id,
      user.organizationId,
      start,
      end,
    );

    return {
      csv: csvContent,
      filename: `attendance_export_${new Date().toISOString().split('T')[0]}.csv`,
    };
  }

  @Get('map-locations')
  async getMapLocations(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.attendanceService.getCheckInLocationsForMap(
      user.organizationId,
      start,
      end,
    );
  }
}

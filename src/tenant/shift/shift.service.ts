import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Shift } from './schemas/shift.schema';
import { User } from '../user/schemas/user.schema';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { AssignShiftDto } from './dto/assign-shift.dto';
import { DEFAULT_SHIFT } from '../../common/constants/shift.constants';

@Injectable()
export class ShiftService {
  constructor(
    @InjectModel(Shift.name)
    private shiftModel: Model<Shift>,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  /**
   * Create a new shift for an organization
   * Maximum 10 shifts per organization
   */
  async createShift(
    createShiftDto: CreateShiftDto,
    organizationId: string,
  ): Promise<any> {
    // Check shift count for organization (max 10)
    const shiftCount = await this.shiftModel.countDocuments({
      organizationId,
    });

    if (shiftCount >= 10) {
      throw new BadRequestException(
        'Maximum 10 shifts allowed per organization',
      );
    }

    // Check if shift name already exists for this organization
    const existingShift = await this.shiftModel.findOne({
      organizationId,
      name: createShiftDto.name,
    });

    if (existingShift) {
      throw new ConflictException(
        'Shift with this name already exists for your organization',
      );
    }

    // Validate that lateTime is between startTime and endTime
    const startMinutes = this.timeToMinutes(createShiftDto.startTime);
    const lateMinutes = this.timeToMinutes(createShiftDto.lateTime);
    const endMinutes = this.timeToMinutes(createShiftDto.endTime);

    if (lateMinutes < startMinutes || lateMinutes > endMinutes) {
      throw new BadRequestException(
        'Late time must be between start time and end time',
      );
    }

    const shift = new this.shiftModel({
      ...createShiftDto,
      organizationId,
    });

    await shift.save();

    const shiftDoc = shift as any;

    return {
      id: shift._id.toString(),
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      lateTime: shift.lateTime,
      days: shift.days,
      organizationId: shift.organizationId.toString(),
      createdAt: shiftDoc.createdAt,
      updatedAt: shiftDoc.updatedAt,
    };
  }

  /**
   * Get all shifts for an organization (including default shift)
   */
  async getAllShifts(organizationId: string): Promise<any[]> {
    // Get organization-specific shifts
    const shifts = await this.shiftModel
      .find({ organizationId })
      .sort({ createdAt: -1 })
      .lean();

    // Format organization shifts
    const formattedShifts = shifts.map((shift: any) => ({
      id: shift._id.toString(),
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      lateTime: shift.lateTime,
      days: shift.days,
      organizationId: shift.organizationId.toString(),
      isDefault: false,
      createdAt: shift.createdAt,
      updatedAt: shift.updatedAt,
    }));

    // Add default shift at the beginning
    return [
      {
        id: 'default',
        name: DEFAULT_SHIFT.name,
        startTime: DEFAULT_SHIFT.startTime,
        endTime: DEFAULT_SHIFT.endTime,
        lateTime: DEFAULT_SHIFT.lateTime,
        days: DEFAULT_SHIFT.days,
        organizationId: organizationId, // Include organizationId in response
        isDefault: true,
        createdAt: null,
        updatedAt: null,
      },
      ...formattedShifts,
    ];
  }

  /**
   * Get shift by ID
   */
  async getShiftById(shiftId: string, organizationId: string): Promise<any> {
    // Check if it's the default shift
    if (shiftId === 'default') {
      return {
        id: 'default',
        name: DEFAULT_SHIFT.name,
        startTime: DEFAULT_SHIFT.startTime,
        endTime: DEFAULT_SHIFT.endTime,
        lateTime: DEFAULT_SHIFT.lateTime,
        days: DEFAULT_SHIFT.days,
        organizationId: organizationId,
        isDefault: true,
        createdAt: null,
        updatedAt: null,
      };
    }

    const shift = await this.shiftModel.findById(shiftId).lean();

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    // Verify shift belongs to organization
    if (shift.organizationId.toString() !== organizationId) {
      throw new ForbiddenException(
        'Shift does not belong to your organization',
      );
    }

    const shiftDoc = shift as any;

    return {
      id: shift._id.toString(),
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      lateTime: shift.lateTime,
      days: shift.days,
      organizationId: shift.organizationId.toString(),
      isDefault: false,
      createdAt: shiftDoc.createdAt,
      updatedAt: shiftDoc.updatedAt,
    };
  }

  /**
   * Update shift
   */
  async updateShift(
    shiftId: string,
    updateShiftDto: UpdateShiftDto,
    organizationId: string,
  ): Promise<any> {
    const shift = await this.shiftModel.findById(shiftId);

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    // Verify shift belongs to organization
    if (shift.organizationId.toString() !== organizationId) {
      throw new ForbiddenException(
        'Shift does not belong to your organization',
      );
    }

    // Check if name is being updated and if it conflicts
    if (updateShiftDto.name && updateShiftDto.name !== shift.name) {
      const existingShift = await this.shiftModel.findOne({
        organizationId,
        name: updateShiftDto.name,
        _id: { $ne: shiftId },
      });

      if (existingShift) {
        throw new ConflictException(
          'Shift with this name already exists for your organization',
        );
      }
    }

    // Validate times if provided
    const startTime = updateShiftDto.startTime || shift.startTime;
    const lateTime = updateShiftDto.lateTime || shift.lateTime;
    const endTime = updateShiftDto.endTime || shift.endTime;

    if (
      updateShiftDto.startTime ||
      updateShiftDto.lateTime ||
      updateShiftDto.endTime
    ) {
      const startMinutes = this.timeToMinutes(startTime);
      const lateMinutes = this.timeToMinutes(lateTime);
      const endMinutes = this.timeToMinutes(endTime);

      if (lateMinutes < startMinutes || lateMinutes > endMinutes) {
        throw new BadRequestException(
          'Late time must be between start time and end time',
        );
      }
    }

    // Update shift
    Object.assign(shift, updateShiftDto);
    await shift.save();

    const shiftDoc = shift as any;

    return {
      id: shift._id.toString(),
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      lateTime: shift.lateTime,
      days: shift.days,
      organizationId: shift.organizationId.toString(),
      isDefault: false,
      createdAt: shiftDoc.createdAt,
      updatedAt: shiftDoc.updatedAt,
    };
  }

  /**
   * Delete shift
   * Cannot delete if any users are assigned to it
   */
  async deleteShift(shiftId: string, organizationId: string): Promise<any> {
    const shift = await this.shiftModel.findById(shiftId);

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    // Verify shift belongs to organization
    if (shift.organizationId.toString() !== organizationId) {
      throw new ForbiddenException(
        'Shift does not belong to your organization',
      );
    }

    // Check if any users are assigned to this shift
    const usersWithShift = await this.userModel.countDocuments({
      organizationId,
      shiftId: shift._id.toString(),
    });

    if (usersWithShift > 0) {
      throw new BadRequestException(
        `Cannot delete shift. ${usersWithShift} user(s) are currently assigned to this shift. Please reassign them first.`,
      );
    }

    await this.shiftModel.deleteOne({ _id: shiftId });

    return { message: 'Shift deleted successfully' };
  }

  /**
   * Assign shift to user
   */
  async assignShiftToUser(
    assignShiftDto: AssignShiftDto,
    organizationId: string,
  ): Promise<any> {
    const { userId, shiftId } = assignShiftDto;

    // Find user
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify user belongs to organization
    if (user.organizationId.toString() !== organizationId) {
      throw new ForbiddenException('User does not belong to your organization');
    }

    // Prevent assigning default shift explicitly
    if (shiftId === 'default') {
      throw new BadRequestException(
        'Cannot assign default shift explicitly. Remove shift assignment to use default shift.',
      );
    }

    // Verify shift exists and belongs to organization
    const shift = await this.shiftModel.findById(shiftId);

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    if (shift.organizationId.toString() !== organizationId) {
      throw new ForbiddenException(
        'Shift does not belong to your organization',
      );
    }

    // Assign shift to user
    user.shiftId = shiftId;
    await user.save();

    return {
      message: 'Shift assigned to user successfully',
      userId: user._id.toString(),
      shiftId: shiftId,
    };
  }

  /**
   * Remove shift assignment from user (use default shift)
   */
  async removeShiftFromUser(
    userId: string,
    organizationId: string,
  ): Promise<any> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify user belongs to organization
    if (user.organizationId.toString() !== organizationId) {
      throw new ForbiddenException('User does not belong to your organization');
    }

    // Remove shift assignment (will use default shift)
    user.shiftId = undefined;
    await user.save();

    return {
      message: 'Shift assignment removed. User will use default shift.',
      userId: user._id.toString(),
    };
  }

  /**
   * Get user's shift (custom or default)
   */
  async getUserShift(userId: string, organizationId: string): Promise<any> {
    const user = await this.userModel.findById(userId).lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If user has a shift assigned, return it
    if (user.shiftId) {
      const shift = await this.shiftModel.findById(user.shiftId).lean();

      if (!shift) {
        // Shift was deleted, return default
        return {
          ...DEFAULT_SHIFT,
          id: 'default',
          organizationId: organizationId,
        };
      }

      return {
        id: shift._id.toString(),
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        lateTime: shift.lateTime,
        days: shift.days,
        organizationId: shift.organizationId.toString(),
        isDefault: false,
      };
    }

    // Return default shift
    return {
      ...DEFAULT_SHIFT,
      id: 'default',
      organizationId: organizationId,
    };
  }

  /**
   * Helper: Convert time string (HH:mm) to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

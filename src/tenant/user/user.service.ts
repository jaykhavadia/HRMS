import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { Shift } from '../shift/schemas/shift.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailService } from '../../shared/email/email.service';
import { ConfigService } from '../../config/config.service';
import { FileUploadService } from '../../shared/file-upload/file-upload.service';
import { DEFAULT_SHIFT } from '../../common/constants/shift.constants';
import { v4 as uuidv4 } from 'uuid';
import * as xlsx from 'xlsx';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Shift.name)
    private shiftModel: Model<Shift>,
    private emailService: EmailService,
    private configService: ConfigService,
    private fileUploadService: FileUploadService,
  ) {}

  /**
   * Generate unique employee ID for an organization
   * Format: EMP001, EMP002, etc.
   */
  private async generateEmployeeId(organizationId: string): Promise<string> {
    // Get the highest employee ID for this organization
    const lastUser = await this.userModel
      .findOne({ organizationId, employeeId: { $exists: true, $ne: null } })
      .sort({ employeeId: -1 })
      .lean();

    let nextNumber = 1;
    if (lastUser && (lastUser as any).employeeId) {
      const lastId = (lastUser as any).employeeId;
      const match = lastId.match(/EMP(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `EMP${String(nextNumber).padStart(3, '0')}`;
  }

  async createUser(
    createUserDto: CreateUserDto,
    organizationId: string,
  ): Promise<any> {
    // Prevent creating additional admin users - only one admin allowed per organization
    if (createUserDto.role === 'admin') {
      throw new BadRequestException(
        'Cannot create additional admin users. Only one admin is allowed per organization.',
      );
    }

    // Check if user already exists (unique email across all organizations)
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate password setup token
    const rawToken = uuidv4();
    const passwordSetupTokenExpiry = new Date();
    passwordSetupTokenExpiry.setHours(passwordSetupTokenExpiry.getHours() + 24);

    // Generate employee ID
    const employeeId = await this.generateEmployeeId(organizationId);

    // Force role to 'employee' - admin role is not allowed for new users
    const user = new this.userModel({
      ...createUserDto,
      role: 'employee', // Always set to employee - admin cannot be created
      status: createUserDto.status || 'active',
      organizationId,
      employeeId, // Auto-generated employee ID
      // password is optional - will be set via password setup
      passwordSetupToken: rawToken,
      passwordSetupTokenExpiry,
    });

    await user.save();

    // Send password setup email
    const frontendUrl = this.configService.getFrontendUrl();
    const setupUrl = `${frontendUrl}#/setup-password?token=${rawToken}&email=${createUserDto.email}`;

    await this.emailService.sendPasswordSetupEmail(
      createUserDto.email,
      createUserDto.firstName,
      setupUrl,
    );

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      employeeId: user.employeeId,
      remote: user.remote,
    };
  }

  async bulkUploadUsers(
    file: Express.Multer.File,
    organizationId: string,
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    if (!file) {
      throw new BadRequestException('Excel file is required');
    }

    // Parse Excel file
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      throw new BadRequestException('Excel file is empty');
    }

    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      try {
        // Map Excel columns to user fields
        // Handle remote field - can be boolean, string "true"/"false", or 1/0
        const remoteValue =
          row['Remote'] || row['remote'] || row['Is Remote'] || row['isRemote'];
        let remote = false;
        if (remoteValue !== undefined && remoteValue !== null) {
          if (typeof remoteValue === 'boolean') {
            remote = remoteValue;
          } else if (typeof remoteValue === 'string') {
            remote =
              remoteValue.toLowerCase() === 'true' ||
              remoteValue === '1' ||
              remoteValue === 'yes';
          } else if (typeof remoteValue === 'number') {
            remote = remoteValue === 1;
          }
        }

        const userData: CreateUserDto = {
          firstName: row['First Name'] || row['firstName'] || row['First Name'],
          lastName: row['Last Name'] || row['lastName'] || row['Last Name'],
          email: row['Email'] || row['email'],
          mobileNumber:
            row['Mobile Number'] || row['mobileNumber'] || row['Mobile'],
          role: row['Role'] || row['role'] || 'employee',
          status: row['Status'] || row['status'] || 'active',
          remote: remote, // Required field - default to false if not provided
        };

        // Validate required fields
        if (!userData.firstName || !userData.lastName || !userData.email) {
          throw new Error(
            'Missing required fields: firstName, lastName, email',
          );
        }

        // Prevent creating admin users in bulk upload - only one admin allowed
        if (userData.role === 'admin') {
          throw new Error(
            `Row ${i + 2}: Cannot create admin users. Only one admin is allowed per organization.`,
          );
        }

        // Check if user exists (unique email)
        const existingUser = await this.userModel.findOne({
          email: userData.email,
        });
        if (existingUser) {
          throw new Error('User with this email already exists');
        }

        // Generate password setup token
        const rawToken = uuidv4();
        const passwordSetupTokenExpiry = new Date();
        passwordSetupTokenExpiry.setHours(
          passwordSetupTokenExpiry.getHours() + 24,
        );

        // Generate employee ID
        const employeeId = await this.generateEmployeeId(organizationId);

        // Force role to 'employee' - admin role is not allowed
        const user = new this.userModel({
          ...userData,
          role: 'employee', // Always set to employee - admin cannot be created
          organizationId,
          employeeId, // Auto-generated employee ID
          // password is optional - will be set via password setup
          passwordSetupToken: rawToken,
          passwordSetupTokenExpiry,
        });

        await user.save();

        // Send password setup email
        const frontendUrl = this.configService.getFrontendUrl();
        const setupUrl = `${frontendUrl}#/setup-password?token=${rawToken}&email=${userData.email}`;

        await this.emailService.sendPasswordSetupEmail(
          userData.email,
          userData.firstName,
          setupUrl,
        );

        success++;
      } catch (error) {
        failed++;
        errors.push({
          row: i + 2, // +2 because Excel rows start at 1 and we have header
          email: row['Email'] || row['email'] || 'N/A',
          error: error.message,
        });
      }
    }

    return { success, failed, errors };
  }

  async getAllUsers(
    organizationId: string,
    userRole: string,
    userId: string,
  ): Promise<any[]> {
    const query: any = { organizationId };

    // Employees can only see their own profile
    if (userRole === 'employee') {
      query._id = userId;
    }

    const users = await this.userModel.find(query).select('-password').lean();

    // Fetch shifts for all users in parallel
    const usersWithShifts = await Promise.all(
      users.map(async (user: any) => {
        let shift: any = null;

        // If user has a shift assigned (not null/undefined), fetch it
        if (user.shiftId) {
          const shiftDoc = await this.shiftModel.findById(user.shiftId).lean();
          if (shiftDoc) {
            shift = {
              id: shiftDoc._id.toString(),
              name: shiftDoc.name,
              startTime: shiftDoc.startTime,
              endTime: shiftDoc.endTime,
              lateTime: shiftDoc.lateTime,
              days: shiftDoc.days,
              organizationId: shiftDoc.organizationId.toString(),
              isDefault: false,
            };
          }
        }

        // If shiftId is null/undefined, or shift was not found/deleted, use default shift
        if (!shift) {
          shift = {
            id: 'default',
            name: DEFAULT_SHIFT.name,
            startTime: DEFAULT_SHIFT.startTime,
            endTime: DEFAULT_SHIFT.endTime,
            lateTime: DEFAULT_SHIFT.lateTime,
            days: DEFAULT_SHIFT.days,
            organizationId: organizationId,
            isDefault: true,
          };
        }

        return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNumber: user.mobileNumber,
      role: user.role,
      status: user.status,
      employeeId: user.employeeId,
      remote: user.remote,
      shiftId: user.shiftId ? user.shiftId.toString() : null,
          shift: shift,
      organizationId: user.organizationId.toString(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
        };
      }),
    );

    return usersWithShifts;
  }

  async getUserById(
    userId: string,
    organizationId: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<any> {
    const user = await this.userModel.findById(userId).lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user belongs to same organization
    if (user.organizationId.toString() !== organizationId) {
      throw new ForbiddenException('User does not belong to your organization');
    }

    // Employees can only view their own profile
    if (
      currentUserRole === 'employee' &&
      user._id.toString() !== currentUserId
    ) {
      throw new ForbiddenException('You can only view your own profile');
    }

    // Fetch shift information
    let shift: any = null;
    
    // If user has a shift assigned (not null/undefined), fetch it
    if (user.shiftId) {
      const shiftDoc = await this.shiftModel.findById(user.shiftId).lean();
      if (shiftDoc) {
        shift = {
          id: shiftDoc._id.toString(),
          name: shiftDoc.name,
          startTime: shiftDoc.startTime,
          endTime: shiftDoc.endTime,
          lateTime: shiftDoc.lateTime,
          days: shiftDoc.days,
          organizationId: shiftDoc.organizationId.toString(),
          isDefault: false,
        };
      }
    }

    // If shiftId is null/undefined, or shift was not found/deleted, use default shift
    if (!shift) {
      shift = {
        id: 'default',
        name: DEFAULT_SHIFT.name,
        startTime: DEFAULT_SHIFT.startTime,
        endTime: DEFAULT_SHIFT.endTime,
        lateTime: DEFAULT_SHIFT.lateTime,
        days: DEFAULT_SHIFT.days,
        organizationId: organizationId,
        isDefault: true,
      };
    }

    const userAny = user as any;
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNumber: user.mobileNumber,
      role: user.role,
      status: user.status,
      employeeId: user.employeeId,
      remote: user.remote,
      shiftId: user.shiftId ? user.shiftId.toString() : null,
      shift: shift,
      organizationId: user.organizationId.toString(),
      createdAt: userAny.createdAt,
      updatedAt: userAny.updatedAt,
    };
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
    organizationId: string,
  ): Promise<any> {
    // Find user first to check if they exist and get their role
    const existingUser = await this.userModel.findById(userId);

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check if user belongs to same organization
    if (existingUser.organizationId.toString() !== organizationId) {
      throw new ForbiddenException('User does not belong to your organization');
    }

    // Prevent updating admin user
    if (existingUser.role === 'admin') {
      throw new ForbiddenException(
        'Admin user cannot be updated. Admin user is protected.',
      );
    }

    // Check if new email already exists (excluding current user)
    if (updateUserDto.email) {
      const emailExists = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: userId },
      });

      if (emailExists) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Prevent role from being updated (role is immutable)
    const updateData: any = { ...updateUserDto };
    delete updateData.role; // Remove role if somehow provided

    // Update user
    await this.userModel.updateOne({ _id: userId }, updateData);

    // Return updated user
    const updatedUser = await this.userModel
      .findById(userId)
      .select('-password')
      .lean();

    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }

    const userAny = updatedUser as any;
    return {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      mobileNumber: updatedUser.mobileNumber,
      role: updatedUser.role,
      status: updatedUser.status,
      employeeId: updatedUser.employeeId,
      remote: updatedUser.remote,
      shiftId: updatedUser.shiftId ? updatedUser.shiftId.toString() : null,
      organizationId: updatedUser.organizationId.toString(),
      createdAt: userAny.createdAt,
      updatedAt: userAny.updatedAt,
    };
  }

  async deleteUser(
    userId: string,
    organizationId: string,
  ): Promise<{ message: string }> {
    // Find user first to check if they exist and get their role
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user belongs to same organization
    if (user.organizationId.toString() !== organizationId) {
      throw new ForbiddenException('User does not belong to your organization');
    }

    // Prevent deleting admin user
    if (user.role === 'admin') {
      throw new ForbiddenException(
        'Admin user cannot be deleted. Admin user is protected.',
      );
    }

    // Prevent deleting active employees
    if (user.status === 'active') {
      throw new BadRequestException(
        'Active employees cannot be deleted. Please deactivate the employee first.',
      );
    }

    // Delete user
    await this.userModel.deleteOne({ _id: userId });

    return { message: 'User deleted successfully' };
  }
}

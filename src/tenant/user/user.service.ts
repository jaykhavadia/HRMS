import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';
import { EmailService } from '../../shared/email/email.service';
import { ConfigService } from '../../config/config.service';
import { FileUploadService } from '../../shared/file-upload/file-upload.service';
import { UserSchema } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { v4 as uuidv4 } from 'uuid';
import * as xlsx from 'xlsx';
import { encodeTokenWithTenant } from '../../common/utils/token.util';
import { validateEmailDomain } from '../../common/utils/email.util';

@Injectable()
export class UserService {
  constructor(
    private databaseService: DatabaseService,
    private emailService: EmailService,
    private configService: ConfigService,
    private fileUploadService: FileUploadService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
    tenantId: string,
    tenantName: string,
    tenantDomain: string,
  ): Promise<any> {
    // Validate user email domain matches tenant domain
    if (!validateEmailDomain(createUserDto.email, tenantDomain)) {
      throw new BadRequestException(
        `User email domain must match organization domain. Expected domain: ${tenantDomain}, but email domain is: ${createUserDto.email.split('@')[1] || 'invalid'}`,
      );
    }

    const UserModel = await this.databaseService.getTenantModel(
      tenantId,
      tenantName,
      'User',
      UserSchema,
    );

    // Prevent creating additional admin users - only one admin allowed per organization
    if (createUserDto.role === 'admin') {
      throw new BadRequestException(
        'Cannot create additional admin users. Only one admin is allowed per organization.',
      );
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      email: createUserDto.email,
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate password setup token
    const rawToken = uuidv4();
    const encodedToken = encodeTokenWithTenant(tenantDomain, rawToken);
    const passwordSetupTokenExpiry = new Date();
    passwordSetupTokenExpiry.setHours(passwordSetupTokenExpiry.getHours() + 24);

    // Force role to 'employee' - admin role is not allowed for new users
    const user = new UserModel({
      ...createUserDto,
      role: 'employee', // Always set to employee - admin cannot be created
      status: createUserDto.status || 'active',
      isPasswordSet: false,
      passwordSetupToken: rawToken, // Store raw token in DB
      passwordSetupTokenExpiry,
    });

    await user.save();

    // Send password setup email with encoded token
    const frontendUrl = this.configService.getFrontendUrl();
    const setupUrl = `${frontendUrl}#/setup-password?token=${encodedToken}`;

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
    };
  }

  async bulkUploadUsers(
    file: Express.Multer.File,
    tenantId: string,
    tenantName: string,
    tenantDomain: string,
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

    const UserModel = await this.databaseService.getTenantModel(
      tenantId,
      tenantName,
      'User',
      UserSchema,
    );

    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      try {
        // Map Excel columns to user fields
        const userData: CreateUserDto = {
          firstName: row['First Name'] || row['firstName'] || row['First Name'],
          lastName: row['Last Name'] || row['lastName'] || row['Last Name'],
          email: row['Email'] || row['email'],
          mobileNumber:
            row['Mobile Number'] || row['mobileNumber'] || row['Mobile'],
          role: row['Role'] || row['role'] || 'employee',
          status: row['Status'] || row['status'] || 'active',
        };

        // Validate required fields
        if (!userData.firstName || !userData.lastName || !userData.email) {
          throw new Error(
            'Missing required fields: firstName, lastName, email',
          );
        }

        // Validate user email domain matches tenant domain
        if (!validateEmailDomain(userData.email, tenantDomain)) {
          throw new Error(
            `User email domain must match organization domain. Row ${i + 2}: ${userData.email} does not match domain ${tenantDomain}`,
          );
        }

        // Prevent creating admin users in bulk upload - only one admin allowed
        if (userData.role === 'admin') {
          throw new Error(
            `Row ${i + 2}: Cannot create admin users. Only one admin is allowed per organization.`,
          );
        }

        // Check if user exists
        const existingUser = await UserModel.findOne({ email: userData.email });
        if (existingUser) {
          throw new Error('User with this email already exists');
        }

        // Generate password setup token
        const rawToken = uuidv4();
        const encodedToken = encodeTokenWithTenant(tenantDomain, rawToken);
        const passwordSetupTokenExpiry = new Date();
        passwordSetupTokenExpiry.setHours(
          passwordSetupTokenExpiry.getHours() + 24,
        );

        // Force role to 'employee' - admin role is not allowed
        const user = new UserModel({
          ...userData,
          role: 'employee', // Always set to employee - admin cannot be created
          isPasswordSet: false,
          passwordSetupToken: rawToken, // Store raw token in DB
          passwordSetupTokenExpiry,
        });

        await user.save();

        // Send password setup email with encoded token
        const frontendUrl = this.configService.getFrontendUrl();
        const setupUrl = `${frontendUrl}#/setup-password?token=${encodedToken}`;

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
    tenantId: string,
    tenantName: string,
  ): Promise<any[]> {
    const UserModel = await this.databaseService.getTenantModel(
      tenantId,
      tenantName,
      'User',
      UserSchema,
    );

    const users = await UserModel.find({})
      .select('-password -passwordSetupToken -passwordSetupTokenExpiry')
      .lean();

    return users.map((user) => ({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNumber: user.mobileNumber,
      role: user.role,
      status: user.status,
      isPasswordSet: user.isPasswordSet,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async getUserById(
    userId: string,
    tenantId: string,
    tenantName: string,
  ): Promise<any> {
    const UserModel = await this.databaseService.getTenantModel(
      tenantId,
      tenantName,
      'User',
      UserSchema,
    );

    const user = await UserModel.findById(userId)
      .select('-password -passwordSetupToken -passwordSetupTokenExpiry')
      .lean();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNumber: user.mobileNumber,
      role: user.role,
      status: user.status,
      isPasswordSet: user.isPasswordSet,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
    tenantId: string,
    tenantName: string,
    tenantDomain: string,
  ): Promise<any> {
    const UserModel = await this.databaseService.getTenantModel(
      tenantId,
      tenantName,
      'User',
      UserSchema,
    );

    // Find user first to check if they exist and get their role
    const existingUser = await UserModel.findById(userId);

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Prevent updating admin user
    if (existingUser.role === 'admin') {
      throw new ForbiddenException(
        'Admin user cannot be updated. Admin user is protected.',
      );
    }

    // Validate email domain if email is being updated
    if (updateUserDto.email) {
      if (!validateEmailDomain(updateUserDto.email, tenantDomain)) {
        throw new BadRequestException(
          `User email domain must match organization domain. Expected domain: ${tenantDomain}, but email domain is: ${updateUserDto.email.split('@')[1] || 'invalid'}`,
        );
      }

      // Check if new email already exists (excluding current user)
      const emailExists = await UserModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: userId },
      });

      if (emailExists) {
        throw new ConflictException(
          'User with this email already exists',
        );
      }
    }

    // Prevent role from being updated (role is immutable)
    const updateData: any = { ...updateUserDto };
    delete updateData.role; // Remove role if somehow provided

    // Update user
    await UserModel.updateOne({ _id: userId }, updateData);

    // Return updated user
    const updatedUser = await UserModel.findById(userId)
      .select('-password -passwordSetupToken -passwordSetupTokenExpiry')
      .lean();

    return {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      mobileNumber: updatedUser.mobileNumber,
      role: updatedUser.role,
      status: updatedUser.status,
      isPasswordSet: updatedUser.isPasswordSet,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  async deleteUser(
    userId: string,
    tenantId: string,
    tenantName: string,
  ): Promise<{ message: string }> {
    const UserModel = await this.databaseService.getTenantModel(
      tenantId,
      tenantName,
      'User',
      UserSchema,
    );

    // Find user first to check if they exist and get their role
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deleting admin user
    if (user.role === 'admin') {
      throw new ForbiddenException(
        'Admin user cannot be deleted. Admin user is protected.',
      );
    }

    // Delete user
    await UserModel.deleteOne({ _id: userId });

    return { message: 'User deleted successfully' };
  }
}

import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';
import { EmailService } from '../../shared/email/email.service';
import { ConfigService } from '../../config/config.service';
import { FileUploadService } from '../../shared/file-upload/file-upload.service';
import { UserSchema } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { v4 as uuidv4 } from 'uuid';
import * as xlsx from 'xlsx';

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
  ): Promise<any> {
    const UserModel = await this.databaseService.getTenantModel(
      tenantId,
      tenantName,
      'User',
      UserSchema,
    );

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      email: createUserDto.email,
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate password setup token
    const passwordSetupToken = uuidv4();
    const passwordSetupTokenExpiry = new Date();
    passwordSetupTokenExpiry.setHours(passwordSetupTokenExpiry.getHours() + 24);

    const user = new UserModel({
      ...createUserDto,
      role: createUserDto.role || 'employee',
      status: createUserDto.status || 'active',
      isPasswordSet: false,
      passwordSetupToken,
      passwordSetupTokenExpiry,
    });

    await user.save();

    // Send password setup email
    const frontendUrl = this.configService.getFrontendUrl();
    const setupUrl = `${frontendUrl}#/setup-password?token=${passwordSetupToken}`;

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

        // Check if user exists
        const existingUser = await UserModel.findOne({ email: userData.email });
        if (existingUser) {
          throw new Error('User with this email already exists');
        }

        // Generate password setup token
        const passwordSetupToken = uuidv4();
        const passwordSetupTokenExpiry = new Date();
        passwordSetupTokenExpiry.setHours(
          passwordSetupTokenExpiry.getHours() + 24,
        );

        const user = new UserModel({
          ...userData,
          isPasswordSet: false,
          passwordSetupToken,
          passwordSetupTokenExpiry,
        });

        await user.save();

        // Send password setup email
        const frontendUrl = this.configService.getFrontendUrl();
        const setupUrl = `${frontendUrl}#/setup-password?token=${passwordSetupToken}`;

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
    role?: string,
  ): Promise<any[]> {
    const UserModel = await this.databaseService.getTenantModel(
      tenantId,
      tenantName,
      'User',
      UserSchema,
    );

    const query: any = {};
    if (role) {
      query.role = role;
    }

    const users = await UserModel.find(query)
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
}

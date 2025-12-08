import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Organization } from './schemas/organization.schema';
import { TempRegistration } from './schemas/temp-registration.schema';
import { User } from '../../tenant/user/schemas/user.schema';
import { CheckEmailDto } from './dto/check-email.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { EmailService } from '../../shared/email/email.service';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<Organization>,
    @InjectModel(TempRegistration.name)
    private tempRegistrationModel: Model<TempRegistration>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    private emailService: EmailService,
  ) {}

  /**
   * Step 1: Check if email exists
   */
  async checkEmail(dto: CheckEmailDto): Promise<{ exists: boolean }> {
    // Check in User table
    const existingUser = await this.userModel.findOne({ email: dto.email });
    if (existingUser) {
      return { exists: true };
    }

    // Check in TempRegistration table
    const tempRegistration = await this.tempRegistrationModel.findOne({
      email: dto.email,
      isVerified: false,
    });
    if (tempRegistration) {
      return { exists: true };
    }

    return { exists: false };
  }

  /**
   * Step 2: Register organization (store in temp table and send OTP)
   */
  async register(
    dto: RegisterDto,
  ): Promise<{ message: string; email: string }> {
    // Validate password match
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if email already exists
    const emailCheck = await this.checkEmail({ email: dto.email });
    if (emailCheck.exists) {
      throw new ConflictException('Email already exists');
    }

    // Check if company name already exists
    const existingOrg = await this.organizationModel.findOne({
      companyName: dto.companyName,
    });
    if (existingOrg) {
      throw new ConflictException('Company name already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP expiry (15 minutes)
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);

    // Delete any existing temp registration for this email
    await this.tempRegistrationModel.deleteOne({ email: dto.email });

    // Create temp registration
    const tempRegistration = new this.tempRegistrationModel({
      email: dto.email,
      companyName: dto.companyName,
      fullName: dto.fullName,
      password: hashedPassword,
      longitude: dto.longitude,
      latitude: dto.latitude,
      radius: dto.radius,
      officeAddress: dto.officeAddress,
      otp,
      otpExpiry,
      isVerified: false,
      agreementAccepted: dto.agreementAccepted || false,
    });

    await tempRegistration.save();

    // Send OTP email
    await this.emailService.sendOtpEmail(dto.email, otp, dto.companyName);

    return {
      message:
        'Registration successful. Please check your email for OTP verification.',
      email: dto.email,
    };
  }

  /**
   * Step 3: Verify OTP and create organization + admin user
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<{ message: string }> {
    // Find temp registration
    const tempRegistration = await this.tempRegistrationModel.findOne({
      email: dto.email,
      isVerified: false,
    });

    if (!tempRegistration) {
      throw new NotFoundException('Registration not found or already verified');
    }

    // Check OTP expiry
    if (new Date() > tempRegistration.otpExpiry) {
      // Delete expired temp registration
      await this.tempRegistrationModel.deleteOne({ _id: tempRegistration._id });
      throw new BadRequestException('OTP has expired. Please register again.');
    }

    // Verify OTP
    if (tempRegistration.otp !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Split fullName into firstName and lastName
    const nameParts = tempRegistration.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Admin';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    try {
      // Create organization
      const organization = new this.organizationModel({
        companyName: tempRegistration.companyName,
        officeAddress: tempRegistration.officeAddress,
        latitude: tempRegistration.latitude,
        longitude: tempRegistration.longitude,
        radius: tempRegistration.radius,
        isActive: true,
      });

      const savedOrganization = await organization.save();

      // Create admin user (first user gets EMP001)
      const adminUser = new this.userModel({
        email: tempRegistration.email,
        password: tempRegistration.password, // Already hashed
        firstName,
        lastName,
        role: 'admin',
        status: 'active',
        organizationId: savedOrganization._id.toString(),
        employeeId: 'EMP001', // Admin is always the first employee
        remote: false, // Admin is not remote by default
      });

      await adminUser.save();

      // Mark temp registration as verified
      tempRegistration.isVerified = true;
      tempRegistration.verifiedAt = new Date();
      await tempRegistration.save();

      // Send welcome email
      await this.emailService.sendWelcomeEmail(
        tempRegistration.email,
        tempRegistration.companyName,
        tempRegistration.companyName,
      );

      return {
        message:
          'Registration verified successfully. Please login to continue.',
      };
    } catch (error) {
      // Rollback: delete organization if user creation fails
      if (error.code === 11000) {
        // Duplicate key error
        throw new ConflictException('Email or company name already exists');
      }
      throw new InternalServerErrorException(
        'Failed to complete registration: ' + error.message,
      );
    }
  }

  async findById(id: string): Promise<Organization | null> {
    return this.organizationModel.findById(id);
  }

  async findByCompanyName(companyName: string): Promise<Organization | null> {
    return this.organizationModel.findOne({ companyName, isActive: true });
  }

  /**
   * Get company profile by organization ID
   */
  async getCompanyProfile(organizationId: string): Promise<any> {
    const organization = await this.organizationModel
      .findById(organizationId)
      .lean();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return {
      id: organization._id.toString(),
      companyName: organization.companyName,
      officeAddress: organization.officeAddress,
      latitude: organization.latitude,
      longitude: organization.longitude,
      radius: organization.radius,
      workStartTime: organization.workStartTime || '09:00',
      workEndTime: organization.workEndTime || '18:00',
      weeklyOffDays: organization.weeklyOffDays || [],
      agreementAccepted: organization.agreementAccepted || false,
      agreementAcceptedAt: organization.agreementAcceptedAt,
      isActive: organization.isActive,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }

  /**
   * Update company profile (work hours, weekly off days, etc.)
   */
  async updateCompanyProfile(
    organizationId: string,
    updateData: {
      workStartTime?: string;
      workEndTime?: string;
      weeklyOffDays?: number[];
      officeAddress?: string;
      latitude?: number;
      longitude?: number;
      radius?: number;
    },
  ): Promise<any> {
    const organization = await this.organizationModel.findById(organizationId);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Update fields
    if (updateData.workStartTime !== undefined) {
      organization.workStartTime = updateData.workStartTime;
    }
    if (updateData.workEndTime !== undefined) {
      organization.workEndTime = updateData.workEndTime;
    }
    if (updateData.weeklyOffDays !== undefined) {
      organization.weeklyOffDays = updateData.weeklyOffDays;
    }
    if (updateData.officeAddress !== undefined) {
      organization.officeAddress = updateData.officeAddress;
    }
    if (updateData.latitude !== undefined) {
      organization.latitude = updateData.latitude;
    }
    if (updateData.longitude !== undefined) {
      organization.longitude = updateData.longitude;
    }
    if (updateData.radius !== undefined) {
      organization.radius = updateData.radius;
    }

    await organization.save();

    return this.getCompanyProfile(organizationId);
  }
}

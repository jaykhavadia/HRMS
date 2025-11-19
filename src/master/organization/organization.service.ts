import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from './schemas/organization.schema';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { DatabaseService } from '../../core/database/database.service';
import { EmailService } from '../../shared/email/email.service';
import { ConfigService } from '../../config/config.service';
import { Schema } from 'mongoose';
import { encodeTokenWithTenant } from '../../common/utils/token.util';
import {
  validateEmailDomain,
  extractTenantDomainFromEmail,
} from '../../common/utils/email.util';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<Organization>,
    private databaseService: DatabaseService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async registerOrganization(
    dto: RegisterOrganizationDto,
  ): Promise<Organization> {
    // Validate companyEmail domain matches companyDomain
    if (!validateEmailDomain(dto.companyEmail, dto.companyDomain)) {
      throw new BadRequestException(
        `Company email domain must match company domain. Expected domain: ${dto.companyDomain}, but got: ${extractTenantDomainFromEmail(dto.companyEmail)}`,
      );
    }

    // Validate adminEmail domain matches companyDomain (if provided)
    if (dto.adminEmail && !validateEmailDomain(dto.adminEmail, dto.companyDomain)) {
      throw new BadRequestException(
        `Admin email domain must match company domain. Expected domain: ${dto.companyDomain}, but got: ${extractTenantDomainFromEmail(dto.adminEmail)}`,
      );
    }

    // Check if domain or email already exists
    const existingOrg = await this.organizationModel.findOne({
      $or: [
        { companyDomain: dto.companyDomain },
        { companyEmail: dto.companyEmail },
      ],
    });

    if (existingOrg) {
      throw new ConflictException(
        'Organization with this domain or email already exists',
      );
    }

    // Generate unique clientId
    const clientId = uuidv4().substring(0, 8);
    const clientName = dto.companyName.replace(/[^a-zA-Z0-9]/g, '_');

    // Create organization in master DB
    const organization = new this.organizationModel({
      ...dto,
      clientId,
      clientName,
      isActive: true,
      officeLocation: dto.officeLocation || {
        latitude: 0,
        longitude: 0,
        address: dto.companyLocation,
        radius: this.configService.getOfficeLocationRadius(),
      },
    });

    try {
      await organization.save();

      // Create tenant database
      await this.databaseService.createTenantDatabase(clientId, clientName);

      // Create admin user in tenant database
      if (dto.adminEmail) {
        await this.createAdminUser(
          clientId,
          clientName,
          dto.companyDomain,
          dto.adminEmail,
          dto.adminFirstName || 'Admin',
          dto.adminLastName || 'User',
        );
      }

      // Send welcome email
      await this.emailService.sendWelcomeEmail(
        dto.companyEmail,
        dto.companyName,
        dto.displayName,
      );

      return organization;
    } catch (error) {
      // Rollback: delete organization if tenant creation fails
      await this.organizationModel.deleteOne({ _id: organization._id });
      throw new InternalServerErrorException(
        'Failed to create organization: ' + error.message,
      );
    }
  }

  private async createAdminUser(
    clientId: string,
    clientName: string,
    companyDomain: string,
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<void> {
    const UserSchema = new Schema(
      {
        email: { type: String, required: true, unique: true },
        password: { type: String },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        role: { type: String, enum: ['admin', 'employee'], default: 'admin' },
        status: {
          type: String,
          enum: ['active', 'inactive'],
          default: 'active',
        },
        mobileNumber: { type: String },
        isPasswordSet: { type: Boolean, default: false },
        passwordSetupToken: { type: String },
        passwordSetupTokenExpiry: { type: Date },
      },
      { timestamps: true },
    );

    const UserModel = await this.databaseService.getTenantModel(
      clientId,
      clientName,
      'User',
      UserSchema,
    );

    // Generate password setup token
    const rawToken = uuidv4();
    const passwordSetupToken = encodeTokenWithTenant(companyDomain, rawToken);
    const passwordSetupTokenExpiry = new Date();
    passwordSetupTokenExpiry.setHours(passwordSetupTokenExpiry.getHours() + 24);

    const adminUser = new UserModel({
      email,
      firstName,
      lastName,
      role: 'admin',
      status: 'active',
      isPasswordSet: false,
      passwordSetupToken: rawToken, // Store raw token in DB
      passwordSetupTokenExpiry,
    });

    await adminUser.save();

    // Send password setup email with encoded token
    const frontendUrl = this.configService.getFrontendUrl();
    const setupUrl = `${frontendUrl}#/setup-password?token=${passwordSetupToken}`;

    await this.emailService.sendPasswordSetupEmail(email, firstName, setupUrl);
  }

  async findById(id: string): Promise<Organization | null> {
    return this.organizationModel.findById(id);
  }

  async findByClientId(clientId: string): Promise<Organization | null> {
    return this.organizationModel.findOne({ clientId, isActive: true });
  }
}

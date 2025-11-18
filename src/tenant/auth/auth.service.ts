import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../../core/database/database.service';
import { Schema } from 'mongoose';
import { LoginDto } from './dto/login.dto';
import { SetupPasswordDto } from './dto/setup-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private databaseService: DatabaseService,
  ) {}

  async login(
    loginDto: LoginDto,
    tenantId: string,
    tenantName: string,
  ): Promise<{ accessToken: string; user: any }> {
    const UserSchema = new Schema(
      {
        email: String,
        password: String,
        firstName: String,
        lastName: String,
        role: String,
        status: String,
      },
      { strict: false },
    );

    const UserModel = await this.databaseService.getTenantModel(
      tenantId,
      tenantName,
      'User',
      UserSchema,
    );

    const user = await UserModel.findOne({ email: loginDto.email }).lean();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is inactive');
    }

    if (!user.password) {
      throw new BadRequestException(
        'Password not set. Please set your password first.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId,
      tenantName,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async setupPassword(
    setupPasswordDto: SetupPasswordDto,
    tenantId: string,
    tenantName: string,
  ): Promise<{ message: string }> {
    const UserSchema = new Schema(
      {
        email: String,
        password: String,
        passwordSetupToken: String,
        passwordSetupTokenExpiry: Date,
        isPasswordSet: Boolean,
      },
      { strict: false },
    );

    const UserModel = await this.databaseService.getTenantModel(
      tenantId,
      tenantName,
      'User',
      UserSchema,
    );

    const user = await UserModel.findOne({
      passwordSetupToken: setupPasswordDto.token,
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired token');
    }

    if (user.passwordSetupTokenExpiry < new Date()) {
      throw new BadRequestException('Token has expired');
    }

    if (user.isPasswordSet) {
      throw new BadRequestException('Password already set');
    }

    const hashedPassword = await bcrypt.hash(setupPasswordDto.password, 10);

    await UserModel.updateOne(
      { _id: user._id },
      {
        password: hashedPassword,
        isPasswordSet: true,
        passwordSetupToken: null,
        passwordSetupTokenExpiry: null,
      },
    );

    return { message: 'Password set successfully' };
  }
}

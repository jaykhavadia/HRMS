import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../user/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { SetupPasswordDto } from './dto/setup-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: any }> {
    const user = await this.userModel.findOne({ email: loginDto.email }).lean();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is inactive');
    }

    if (!user.password) {
      throw new BadRequestException('Password not set');
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
      organizationId: user.organizationId.toString(),
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
        organizationId: user.organizationId.toString(),
      },
    };
  }

  async setupPassword(
    setupPasswordDto: SetupPasswordDto,
  ): Promise<{ message: string }> {
    // Find user by token only - token uniquely identifies the user
    const user = await this.userModel.findOne({
      passwordSetupToken: setupPasswordDto.token,
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired token');
    }

    // Check token expiry
    if (
      user.passwordSetupTokenExpiry &&
      user.passwordSetupTokenExpiry < new Date()
    ) {
      throw new BadRequestException('Token has expired');
    }

    // Check if password already set
    if (user.password && user.password.length > 0) {
      throw new BadRequestException('Password already set');
    }

    // Hash and set password
    const hashedPassword = await bcrypt.hash(setupPasswordDto.password, 10);

    await this.userModel.updateOne(
      { _id: user._id },
      {
        password: hashedPassword,
        passwordSetupToken: null,
        passwordSetupTokenExpiry: null,
      },
    );

    return { message: 'Password set successfully' };
  }
}

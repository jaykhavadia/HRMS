import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '../../../../config/config.service';
import { DatabaseService } from '../../../../core/database/database.service';
import { Schema } from 'mongoose';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getJwtSecret(),
    });
  }

  async validate(payload: any) {
    const { userId, tenantId, tenantName, email } = payload;

    // Get user from tenant database
    const UserSchema = new Schema(
      {
        email: String,
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

    const user = await UserModel.findById(userId).lean();

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId,
      tenantName,
    };
  }
}

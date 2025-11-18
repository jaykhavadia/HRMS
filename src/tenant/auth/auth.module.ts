import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt/jwt';
import { ConfigService } from '../../config/config.service';
import { DatabaseModule } from '../../core/database/database.module';
import { TenantModule } from '../../core/tenant/tenant.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const expiration = configService.getJwtExpiration();
        return {
          secret: configService.getJwtSecret(),
          signOptions: {
            expiresIn: expiration,
          },
        } as any;
      },
      inject: [ConfigService],
    }),
    DatabaseModule,
    TenantModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

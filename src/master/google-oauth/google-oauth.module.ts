import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GoogleOAuthService } from './google-oauth.service';
import { GoogleOAuthCronService } from './google-oauth-cron.service';
import { GoogleOAuthController } from './google-oauth.controller';
import { GoogleOAuth, GoogleOAuthSchema } from './google-oauth.schema';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GoogleOAuth.name, schema: GoogleOAuthSchema },
    ]),
    CommonModule,
  ],
  controllers: [GoogleOAuthController],
  providers: [GoogleOAuthService, GoogleOAuthCronService],
  exports: [GoogleOAuthService],
})
export class GoogleOAuthModule {}

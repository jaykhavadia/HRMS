import { Module } from '@nestjs/common';
import { GoogleDriveService } from './google-drive.service';
import { ConfigModule } from '../../config/config.module';
import { GoogleOAuthModule } from '../../master/google-oauth/google-oauth.module';

@Module({
  imports: [ConfigModule, GoogleOAuthModule],
  providers: [GoogleDriveService],
  exports: [GoogleDriveService],
})
export class GoogleDriveModule {}



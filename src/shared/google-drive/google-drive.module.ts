import { Module } from '@nestjs/common';
import { GoogleDriveService } from './google-drive.service';
import { ConfigModule } from '../../config/config.module';

// Conditionally import GoogleOAuthModule if it exists
let GoogleOAuthModule: any = null;
try {
  GoogleOAuthModule = require('../../master/google-oauth/google-oauth.module').GoogleOAuthModule;
} catch (error) {
  // Module not available - that's okay, it's optional
}

@Module({
  imports: [
    ConfigModule,
    ...(GoogleOAuthModule ? [GoogleOAuthModule] : []),
  ],
  providers: [GoogleDriveService],
  exports: [GoogleDriveService],
})
export class GoogleDriveModule {}

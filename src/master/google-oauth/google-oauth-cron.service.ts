import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GoogleOAuthService } from './google-oauth.service';

@Injectable()
export class GoogleOAuthCronService implements OnModuleInit {
  private readonly logger = new Logger(GoogleOAuthCronService.name);

  constructor(private googleOAuthService: GoogleOAuthService) {}

  /**
   * Refresh OAuth tokens every 50 minutes (tokens expire in 1 hour)
   * Runs at: Every 50 minutes
   */
  @Cron('0 */50 * * * *') // Every 50 minutes
  async handleTokenRefresh() {
    this.logger.log('Starting scheduled OAuth token refresh...');

    try {
      const allCredentials = await this.googleOAuthService.getAllCredentials();

      for (const cred of allCredentials) {
        if (!cred.isActive) {
          continue;
        }

        try {
          await this.googleOAuthService.refreshAccessToken(cred.name);
          this.logger.log(`Successfully refreshed token for: ${cred.name}`);
        } catch (error: any) {
          this.logger.error(
            `Failed to refresh token for ${cred.name}: ${error.message}`,
          );
        }
      }

      this.logger.log('Scheduled OAuth token refresh completed');
    } catch (error: any) {
      this.logger.error(`Error in scheduled token refresh: ${error.message}`);
    }
  }

  /**
   * Refresh tokens on application startup
   */
  async onModuleInit() {
    this.logger.log('Refreshing OAuth tokens on startup...');
    try {
      await this.handleTokenRefresh();
    } catch (error: any) {
      this.logger.error(
        `Failed to refresh tokens on startup: ${error.message}`,
      );
    }
  }
}

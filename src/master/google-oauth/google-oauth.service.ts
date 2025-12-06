import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { google } from 'googleapis';
import { GoogleOAuth, GoogleOAuthDocument } from './google-oauth.schema';

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);

  constructor(
    @InjectModel(GoogleOAuth.name)
    private googleOAuthModel: Model<GoogleOAuthDocument>,
  ) {}

  /**
   * Get active OAuth credentials (defaults to 'default' if name not provided)
   */
  async getActiveCredentials(name: string = 'default'): Promise<GoogleOAuthDocument> {
    const credentials = await this.googleOAuthModel.findOne({
      name,
      isActive: true,
    });

    if (!credentials) {
      throw new NotFoundException(
        `No active Google OAuth credentials found with name: ${name}`,
      );
    }

    return credentials;
  }

  /**
   * Create or update OAuth credentials
   */
  async upsertCredentials(
    name: string,
    clientId: string,
    clientSecret: string,
    refreshToken: string,
  ): Promise<GoogleOAuthDocument> {
    const credentials = await this.googleOAuthModel.findOneAndUpdate(
      { name },
      {
        clientId,
        clientSecret,
        refreshToken,
        isActive: true,
        updatedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    this.logger.log(`OAuth credentials ${name} ${credentials.isNew ? 'created' : 'updated'}`);
    return credentials;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(name: string = 'default'): Promise<{
    accessToken: string;
    expiryDate: Date;
  }> {
    const credentials = await this.getActiveCredentials(name);

    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
    );

    oauth2Client.setCredentials({
      refresh_token: credentials.refreshToken,
    });

    try {
      const { credentials: newCredentials } = await oauth2Client.refreshAccessToken();

      if (!newCredentials.access_token) {
        throw new Error('Failed to get access token from refresh');
      }

      // Calculate expiry (usually 1 hour from now)
      const expiryDate = newCredentials.expiry_date
        ? new Date(newCredentials.expiry_date)
        : new Date(Date.now() + 3600 * 1000); // Default to 1 hour

      // Update in database
      await this.googleOAuthModel.updateOne(
        { name },
        {
          accessToken: newCredentials.access_token,
          accessTokenExpiry: expiryDate,
          updatedAt: new Date(),
        },
      );

      this.logger.log(`Access token refreshed for ${name}, expires at ${expiryDate.toISOString()}`);

      return {
        accessToken: newCredentials.access_token,
        expiryDate,
      };
    } catch (error: any) {
      this.logger.error(`Failed to refresh access token for ${name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(name: string = 'default'): Promise<string> {
    const credentials = await this.getActiveCredentials(name);

    // Check if we have a valid access token
    if (
      credentials.accessToken &&
      credentials.accessTokenExpiry &&
      credentials.accessTokenExpiry > new Date()
    ) {
      // Token is still valid
      return credentials.accessToken;
    }

    // Token expired or doesn't exist, refresh it
    const { accessToken } = await this.refreshAccessToken(name);
    return accessToken;
  }

  /**
   * Get OAuth2 client with valid access token
   */
  async getOAuth2Client(name: string = 'default') {
    const credentials = await this.getActiveCredentials(name);
    const accessToken = await this.getValidAccessToken(name);

    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: credentials.refreshToken,
    });

    return oauth2Client;
  }

  /**
   * Get all OAuth credentials
   */
  async getAllCredentials(): Promise<GoogleOAuthDocument[]> {
    return this.googleOAuthModel.find().exec();
  }

  /**
   * Deactivate credentials
   */
  async deactivateCredentials(name: string): Promise<void> {
    await this.googleOAuthModel.updateOne(
      { name },
      { isActive: false, updatedAt: new Date() },
    );
    this.logger.log(`OAuth credentials ${name} deactivated`);
  }
}





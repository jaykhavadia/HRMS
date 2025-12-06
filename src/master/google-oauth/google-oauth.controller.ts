import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GoogleOAuthService } from './google-oauth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles/roles.guard';
import { Roles } from '../../common/decorators/roles/roles.decorator';

class SetOAuthCredentialsDto {
  name?: string; // Optional, defaults to 'default'
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

@Controller('google-oauth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class GoogleOAuthController {
  constructor(private googleOAuthService: GoogleOAuthService) {}

  /**
   * Set or update OAuth2 credentials
   * POST /google-oauth/set-credentials
   */
  @Post('set-credentials')
  @HttpCode(HttpStatus.OK)
  async setCredentials(@Body() dto: SetOAuthCredentialsDto) {
    const name = dto.name || 'default';
    await this.googleOAuthService.upsertCredentials(
      name,
      dto.clientId,
      dto.clientSecret,
      dto.refreshToken,
    );
    return {
      message: 'OAuth2 credentials saved successfully',
      name,
    };
  }

  /**
   * Get all OAuth credentials (admin only)
   * GET /google-oauth/credentials
   */
  @Get('credentials')
  async getCredentials() {
    const credentials = await this.googleOAuthService.getAllCredentials();
    // Don't return sensitive data
    return credentials.map((cred) => ({
      name: cred.name,
      clientId: cred.clientId.substring(0, 20) + '...', // Partial for identification
      isActive: cred.isActive,
      accessTokenExpiry: cred.accessTokenExpiry,
      createdAt: cred.createdAt,
      updatedAt: cred.updatedAt,
    }));
  }

  /**
   * Manually refresh access token
   * POST /google-oauth/refresh-token
   */
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: { name?: string }) {
    const name = body.name || 'default';
    const result = await this.googleOAuthService.refreshAccessToken(name);
    return {
      message: 'Access token refreshed successfully',
      expiresAt: result.expiryDate,
    };
  }
}





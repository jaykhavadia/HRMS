import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private nestConfigService: NestConfigService) {}

  get(key: string): string {
    return this.nestConfigService.get<string>(key) || '';
  }

  getMasterDbUri(): string {
    return this.get('MASTER_DB_URI') || 'mongodb://localhost:27017/hrms-master';
  }

  getJwtSecret(): string {
    return this.get('JWT_SECRET') || 'your-secret-key';
  }

  getJwtExpiration(): string {
    return this.get('JWT_EXPIRATION') || '24h';
  }

  getMongoAtlasUri(): string {
    // Not used - we use local MongoDB for all databases
    return this.get('MONGO_ATLAS_URI') || '';
  }

  getEmailConfig() {
    return {
      host: this.get('EMAIL_HOST') || 'smtp.gmail.com',
      port: parseInt(this.get('EMAIL_PORT') || '587'),
      secure: this.get('EMAIL_SECURE') === 'true',
      auth: {
        user: this.get('EMAIL_USER'),
        pass: this.get('EMAIL_PASSWORD'),
      },
    };
  }

  getFrontendUrl(): string {
    return this.get('FRONTEND_URL') || 'http://localhost:3000';
  }

  getOfficeLocationRadius(): number {
    return parseFloat(this.get('OFFICE_LOCATION_RADIUS') || '100'); // meters
  }
}

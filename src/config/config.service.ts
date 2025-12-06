import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService implements OnModuleInit {
  private readonly logger = new Logger(ConfigService.name);

  constructor(private nestConfigService: NestConfigService) {}

  onModuleInit() {
    this.logger.log('=== ConfigService Initialized ===');
    this.logger.log(`DB_URI: ${this.get('DB_URI') ? this.maskUri(this.get('DB_URI')) : 'NOT SET - using default'}`);
    this.logger.log(`MASTER_DB_URI: ${this.get('MASTER_DB_URI') ? this.maskUri(this.get('MASTER_DB_URI')) : 'NOT SET'}`);
    this.logger.log(`JWT_SECRET: ${this.get('JWT_SECRET') ? '***SET***' : 'NOT SET - using default'}`);
    this.logger.log(`JWT_EXPIRATION: ${this.get('JWT_EXPIRATION') || 'NOT SET - using default (24h)'}`);
    this.logger.log(`EMAIL_HOST: ${this.get('EMAIL_HOST') || 'NOT SET - using default (smtp.gmail.com)'}`);
    this.logger.log(`EMAIL_USER: ${this.get('EMAIL_USER') || 'NOT SET'}`);
    this.logger.log(`FRONTEND_URL: ${this.get('FRONTEND_URL') || 'NOT SET - using default (http://localhost:3000)'}`);
    
    const masterDbUri = this.getMasterDbUri();
    this.logger.log(`Final Master DB URI: ${this.maskUri(masterDbUri)}`);
    
    // Warn about MongoDB Atlas connection requirements
    if (masterDbUri.includes('mongodb+srv://')) {
      this.logger.warn('⚠️  Using MongoDB Atlas (mongodb+srv://)');
      this.logger.warn('   This requires DNS SRV record resolution');
      this.logger.warn('   Ensure network connectivity and DNS access');
    }
  }

  private maskUri(uri: string): string {
    if (!uri) return 'empty';
    // Mask password in MongoDB URI
    return uri.replace(/:([^:@]+)@/, ':***@');
  }

  get(key: string): string {
    const value = this.nestConfigService.get<string>(key) || '';
    if (!value) {
      this.logger.debug(`Config key '${key}' not found, returning empty string`);
    }
    return value;
  }

  getMasterDbUri(): string {
    const dbUri = this.get('DB_URI') || this.get('MASTER_DB_URI') || 'mongodb://localhost:27017/hrms';
    if (!this.get('DB_URI') && !this.get('MASTER_DB_URI')) {
      this.logger.warn('⚠️  Neither DB_URI nor MASTER_DB_URI is set! Using default: mongodb://localhost:27017/hrms');
      this.logger.warn('⚠️  This will likely fail in production. Please set DB_URI or MASTER_DB_URI environment variable.');
    }
    return dbUri;
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

  getGoogleDriveConfig() {
    return {
      serviceAccountPath: this.get('GOOGLE_DRIVE_SERVICE_ACCOUNT_PATH'),
      serviceAccountEmail: this.get('GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL'),
      privateKey: this.get('GOOGLE_DRIVE_PRIVATE_KEY'),
      projectId: this.get('GOOGLE_DRIVE_PROJECT_ID'),
    };
  }
}

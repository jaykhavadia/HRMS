import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class GoogleDriveService implements OnModuleInit {
  private readonly logger = new Logger(GoogleDriveService.name);
  private drive: any;
  private readonly rootFolderName = 'HRMS';
  private auth: any;
  private useOAuth2: boolean = false;
  private isInitialized: boolean = false;

  constructor(
    private configService: ConfigService,
    @Optional() private googleOAuthService?: any, // Use 'any' to avoid import issues
  ) {
    // Don't initialize here - wait for OnModuleInit to ensure OAuth service is ready
  }

  async onModuleInit() {
    await this.initializeDrive();
  }

  private async initializeDrive() {
    try {
      this.logger.log('🔄 Initializing Google Drive service...');

      // Option 1: Try OAuth2 from database (highest priority)
      if (this.googleOAuthService) {
        try {
          const oauth2Client =
            await this.googleOAuthService.getOAuth2Client('default');
          this.auth = oauth2Client;
          this.drive = google.drive({ version: 'v3', auth: this.auth });
          this.useOAuth2 = true;
          this.isInitialized = true;
          this.logger.log(
            '✅ Google Drive initialized using OAuth2 from database',
          );
          return;
        } catch (error: any) {
          this.logger.warn(
            `⚠️  OAuth2 from database failed: ${error.message}, falling back to service account`,
          );
        }
      }

      // Option 2: Service Account JSON file path
      const serviceAccountPath = this.configService.get(
        'GOOGLE_DRIVE_SERVICE_ACCOUNT_PATH',
      );

      if (serviceAccountPath) {
        this.auth = new google.auth.GoogleAuth({
          keyFile: serviceAccountPath,
          scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file',
          ],
        });
        this.drive = google.drive({ version: 'v3', auth: this.auth });
        this.isInitialized = true;
        this.logger.log(
          '✅ Google Drive initialized using service account JSON file',
        );
        return;
      }

      // Option 3: Service Account credentials from env
      const serviceAccountEmail = this.configService.get(
        'GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL',
      );
      const privateKey = this.configService
        .get('GOOGLE_DRIVE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n');

      if (serviceAccountEmail && privateKey) {
        this.auth = new google.auth.JWT({
          email: serviceAccountEmail,
          key: privateKey,
          scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file',
          ],
        });
        this.drive = google.drive({ version: 'v3', auth: this.auth });
        this.isInitialized = true;
        this.logger.log(
          '✅ Google Drive initialized using service account from env',
        );
        return;
      }

      // No credentials found - log warning but don't throw error
      this.isInitialized = false;
      this.logger.warn(
        '⚠️  Google Drive service not initialized - credentials not configured',
      );
      this.logger.warn('   Google Drive features will be disabled');
      this.logger.warn('   To enable Google Drive, configure one of:');
      this.logger.warn(
        '   1. OAuth2 credentials in database (via GoogleOAuthModule)',
      );
      this.logger.warn(
        '   2. GOOGLE_DRIVE_SERVICE_ACCOUNT_PATH (path to JSON file)',
      );
      this.logger.warn(
        '   3. GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL + GOOGLE_DRIVE_PRIVATE_KEY',
      );
    } catch (error: any) {
      this.isInitialized = false;
      this.logger.error('❌ Failed to initialize Google Drive service');
      this.logger.error(`   Error: ${error.message}`);
      this.logger.warn('⚠️  Google Drive features will be disabled');
      // Don't throw - allow app to start without Google Drive
    }
  }

  /**
   * Check if Google Drive is initialized
   */
  private checkInitialized(): void {
    if (!this.isInitialized || !this.drive) {
      throw new InternalServerErrorException(
        'Google Drive service is not initialized. Please configure Google Drive credentials.',
      );
    }
  }

  /**
   * Refresh auth if using OAuth2 (called before operations to ensure valid token)
   */
  private async ensureValidAuth() {
    if (this.useOAuth2 && this.googleOAuthService) {
      try {
        const oauth2Client =
          await this.googleOAuthService.getOAuth2Client('default');
        this.auth = oauth2Client;
        this.drive = google.drive({ version: 'v3', auth: this.auth });
      } catch (error: any) {
        this.logger.error(`Failed to refresh OAuth2 token: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Get or create folder by name in parent folder
   */
  private async getOrCreateFolder(
    folderName: string,
    parentFolderId?: string,
  ): Promise<string> {
    this.checkInitialized();
    try {
      // Search for existing folder
      let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
      } else {
        query += ` and 'root' in parents`;
      }

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)',
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // Create folder if it doesn't exist
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentFolderId && { parents: [parentFolderId] }),
      };

      const folder = await this.drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
      });

      // Make folder publicly accessible
      await this.drive.permissions.create({
        fileId: folder.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return folder.data.id;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get or create folder: ${error.message}`,
      );
    }
  }

  /**
   * Get or create HRMS root folder
   */
  private async getOrCreateRootFolder(): Promise<string> {
    return this.getOrCreateFolder(this.rootFolderName);
  }

  /**
   * Upload file to Google Drive
   * Path structure: HRMS/{organizationName}/{currentDate}/{employeeName}/{filename}
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    organizationName: string,
    currentDate: string, // Format: YYYY-MM-DD
    employeeName: string,
  ): Promise<string> {
    this.checkInitialized();
    // Ensure we have a valid auth token (refresh if needed for OAuth2)
    await this.ensureValidAuth();

    try {
      // Get or create root folder
      const rootFolderId = await this.getOrCreateRootFolder();

      // Get or create organization folder
      const orgFolderId = await this.getOrCreateFolder(
        organizationName,
        rootFolderId,
      );

      // Get or create date folder
      const dateFolderId = await this.getOrCreateFolder(
        currentDate,
        orgFolderId,
      );

      // Get or create employee folder
      const employeeFolderId = await this.getOrCreateFolder(
        employeeName,
        dateFolderId,
      );

      // Upload file
      const fileMetadata = {
        name: fileName,
        parents: [employeeFolderId],
      };

      // Convert Buffer to Stream (Google Drive API requires a stream)
      const stream = Readable.from(fileBuffer);

      const media = {
        mimeType: mimeType,
        body: stream,
      };

      const file = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink',
      });

      // Make file publicly accessible
      await this.drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // Get public URL (webViewLink for viewing, webContentLink for direct download)
      // Use webContentLink for direct image access
      const fileDetails = await this.drive.files.get({
        fileId: file.data.id,
        fields: 'webViewLink, webContentLink',
      });

      // Return public URL (prefer webContentLink for images)
      return (
        fileDetails.data.webContentLink || fileDetails.data.webViewLink || ''
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload file to Google Drive: ${error.message}`,
      );
    }
  }

  /**
   * Delete file from Google Drive by URL or file ID
   */
  async deleteFile(fileUrlOrId: string): Promise<void> {
    this.checkInitialized();
    try {
      // Extract file ID from URL if it's a URL
      let fileId = fileUrlOrId;
      if (fileUrlOrId.includes('drive.google.com')) {
        const match = fileUrlOrId.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
          fileId = match[1];
        } else {
          throw new Error('Invalid Google Drive URL');
        }
      }

      await this.drive.files.delete({
        fileId: fileId,
      });
    } catch (error) {
      // Don't throw error if file doesn't exist
      if (error.code !== 404) {
        throw new InternalServerErrorException(
          `Failed to delete file from Google Drive: ${error.message}`,
        );
      }
    }
  }
}

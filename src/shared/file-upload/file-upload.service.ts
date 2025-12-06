import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleDriveService } from '../google-drive/google-drive.service';

@Injectable()
export class FileUploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly selfieDir = path.join(this.uploadDir, 'selfies');
  private readonly excelDir = path.join(this.uploadDir, 'excel');

  constructor(private googleDriveService: GoogleDriveService) {
    // Create upload directories if they don't exist (for Excel files)
    [this.uploadDir, this.selfieDir, this.excelDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async uploadSelfie(
    file: Express.Multer.File,
    userId: string,
    organizationName: string,
    employeeName: string,
    checkType: 'check-in' | 'check-out',
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('Selfie image is required');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG and PNG images are allowed.',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Generate filename with timestamp
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
    const extension = path.extname(file.originalname) || '.jpg';
    const fileName = `${checkType}_${dateStr}_${timeStr}${extension}`;

    // Create local directory structure (as temporary backup)
    const localDir = path.join(
      this.selfieDir,
      organizationName,
      dateStr,
      employeeName,
    );
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localFilePath = path.join(localDir, fileName);

    // Save file locally first (as temporary backup)
    fs.writeFileSync(localFilePath, file.buffer);

    let publicUrl: string;
    try {
      // Upload to Google Drive
      // Path: HRMS/{organizationName}/{currentDate}/{employeeName}/{fileName}
      publicUrl = await this.googleDriveService.uploadFile(
        file.buffer,
        fileName,
        file.mimetype,
        organizationName,
        dateStr,
        employeeName,
      );

      // Delete local file after successful Google Drive upload
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (error) {
      // If upload fails, keep local file and rethrow error
      // Local file will remain as backup
      throw error;
    }

    // Return public URL for storage in database
    return publicUrl;
  }

  async uploadExcel(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('Excel file is required');
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only Excel files (.xlsx, .xls) are allowed.',
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `excel_${timestamp}${extension}`;
    const filepath = path.join(this.excelDir, filename);

    // Save file
    fs.writeFileSync(filepath, file.buffer);

    // Return file path
    return filepath;
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}

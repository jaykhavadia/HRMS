import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly selfieDir = path.join(this.uploadDir, 'selfies');
  private readonly excelDir = path.join(this.uploadDir, 'excel');

  constructor() {
    // Create upload directories if they don't exist
    [this.uploadDir, this.selfieDir, this.excelDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async uploadSelfie(
    file: Express.Multer.File,
    userId: string,
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

    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `selfie_${userId}_${timestamp}${extension}`;
    const filepath = path.join(this.selfieDir, filename);

    // Save file
    fs.writeFileSync(filepath, file.buffer);

    // Return relative path for storage in database
    return `/uploads/selfies/${filename}`;
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

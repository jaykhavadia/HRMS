import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { GoogleDriveModule } from '../google-drive/google-drive.module';

@Module({
  imports: [GoogleDriveModule],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}

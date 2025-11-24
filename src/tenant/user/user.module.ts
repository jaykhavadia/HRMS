import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserSchema } from './schemas/user.schema';
import { DatabaseModule } from '../../core/database/database.module';
import { EmailModule } from '../../shared/email/email.module';
import { FileUploadModule } from '../../shared/file-upload/file-upload.module';
import { ConfigModule } from '../../config/config.module';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    EmailModule,
    FileUploadModule,
    ConfigModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

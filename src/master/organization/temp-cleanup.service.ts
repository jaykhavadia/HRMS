import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TempRegistration } from './schemas/temp-registration.schema';

@Injectable()
export class TempCleanupService {
  private readonly logger = new Logger(TempCleanupService.name);

  constructor(
    @InjectModel(TempRegistration.name)
    private tempRegistrationModel: Model<TempRegistration>,
  ) {}

  /**
   * Clean up temp registration data older than 3-5 hours
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleTempCleanup() {
    this.logger.log('Starting temp registration cleanup job...');

    try {
      // Delete temp registrations older than 3 hours that are not verified
      const threeHoursAgo = new Date();
      threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

      const result = await this.tempRegistrationModel.deleteMany({
        isVerified: false,
        createdAt: { $lt: threeHoursAgo },
      });

      this.logger.log(
        `Cleaned up ${result.deletedCount} expired temp registrations`,
      );

      // Also delete verified temp registrations older than 5 hours
      const fiveHoursAgo = new Date();
      fiveHoursAgo.setHours(fiveHoursAgo.getHours() - 5);

      const verifiedResult = await this.tempRegistrationModel.deleteMany({
        isVerified: true,
        createdAt: { $lt: fiveHoursAgo },
      });

      this.logger.log(
        `Cleaned up ${verifiedResult.deletedCount} old verified temp registrations`,
      );
    } catch (error) {
      this.logger.error('Error during temp cleanup:', error);
    }
  }
}


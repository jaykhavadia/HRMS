import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Module({
  providers: [SubscriptionService],
})
export class SubscriptionModule {}

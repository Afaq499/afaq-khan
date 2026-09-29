import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from '../users/domain/user.repository.js';
import { UsersModule } from '../users/users.module.js';
import { SubscriptionService } from './application/subscription.service.js';
import {
  PAYMENT_SERVICE,
  SUBSCRIPTION_REPOSITORY,
} from './domain/subscription.repository.js';
import { MockPaymentService } from './infrastructure/mock-payment.service.js';
import { PrismaSubscriptionRepository } from './infrastructure/prisma-subscription.repository.js';
import { SubscriptionsController } from './presentation/subscriptions.controller.js';

@Module({
  imports: [UsersModule],
  controllers: [SubscriptionsController],
  providers: [
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useClass: PrismaSubscriptionRepository,
    },
    {
      provide: PAYMENT_SERVICE,
      useClass: MockPaymentService,
    },
    {
      provide: SubscriptionService,
      useFactory: (
        subscriptions: PrismaSubscriptionRepository,
        users: unknown,
        payments: MockPaymentService,
      ) => new SubscriptionService(subscriptions, users as never, payments),
      inject: [SUBSCRIPTION_REPOSITORY, USER_REPOSITORY, PAYMENT_SERVICE],
    },
  ],
  exports: [SubscriptionService, SUBSCRIPTION_REPOSITORY],
})
export class SubscriptionsModule {}

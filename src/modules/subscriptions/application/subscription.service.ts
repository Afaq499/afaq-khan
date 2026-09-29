import { Inject, Injectable } from '@nestjs/common';
import { BillingCycle, SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { NotFoundError } from '../../../shared/domain/domain-error.js';
import { USER_REPOSITORY, type UserRepository } from '../../users/domain/user.repository.js';
import {
  PAYMENT_SERVICE,
  SUBSCRIPTION_REPOSITORY,
  type PaymentService,
  type SubscriptionEntity,
  type SubscriptionRepository,
} from '../domain/subscription.repository.js';
import {
  addBillingPeriod,
  resolveMaxMessages,
  resolvePlanPrice,
} from '../domain/subscription.rules.js';

export interface CreateSubscriptionInput {
  userId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  autoRenew?: boolean;
}

@Injectable()
export class SubscriptionService {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: SubscriptionRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PAYMENT_SERVICE) private readonly payments: PaymentService,
  ) {}

  async create(input: CreateSubscriptionInput): Promise<SubscriptionEntity> {
    const user = await this.users.findById(input.userId);
    if (!user) {
      throw new NotFoundError('User', input.userId);
    }

    const startDate = new Date();
    const endDate = addBillingPeriod(startDate, input.billingCycle);
    const maxMessages = resolveMaxMessages(input.tier);
    const price = resolvePlanPrice(input.tier, input.billingCycle);

    return this.subscriptions.create({
      userId: input.userId,
      tier: input.tier,
      billingCycle: input.billingCycle,
      maxMessages,
      remainingMessages: maxMessages,
      price,
      startDate,
      endDate,
      renewalDate: endDate,
      autoRenew: input.autoRenew ?? true,
    });
  }

  async listByUser(userId: string): Promise<SubscriptionEntity[]> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    return this.subscriptions.findByUserId(userId);
  }

  async setAutoRenew(id: string, autoRenew: boolean): Promise<SubscriptionEntity> {
    const existing = await this.subscriptions.findById(id);
    if (!existing) {
      throw new NotFoundError('Subscription', id);
    }
    return this.subscriptions.update(id, { autoRenew });
  }

  async cancel(id: string): Promise<SubscriptionEntity> {
    const existing = await this.subscriptions.findById(id);
    if (!existing) {
      throw new NotFoundError('Subscription', id);
    }
    return this.subscriptions.update(id, {
      status: SubscriptionStatus.CANCELLED,
      autoRenew: false,
    });
  }

  async runBilling(now = new Date()) {
    const due = await this.subscriptions.findDueForRenewal(now);
    const results: Array<{ subscriptionId: string; success: boolean; reason?: string }> = [];
    let renewed = 0;
    let failed = 0;

    for (const sub of due) {
      const payment = await this.payments.charge(sub.price, sub.id);
      if (!payment.success) {
        await this.subscriptions.update(sub.id, {
          status: SubscriptionStatus.PAYMENT_FAILED,
          autoRenew: false,
        });
        failed += 1;
        results.push({
          subscriptionId: sub.id,
          success: false,
          reason: payment.reason,
        });
        continue;
      }

      const newStart = sub.endDate > now ? sub.endDate : now;
      const newEnd = addBillingPeriod(newStart, sub.billingCycle);
      await this.subscriptions.update(sub.id, {
        startDate: newStart,
        endDate: newEnd,
        renewalDate: newEnd,
        remainingMessages: sub.maxMessages,
        status: SubscriptionStatus.ACTIVE,
      });
      renewed += 1;
      results.push({ subscriptionId: sub.id, success: true });
    }

    return { processed: due.length, renewed, failed, results };
  }
}

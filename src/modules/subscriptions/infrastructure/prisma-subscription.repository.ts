import { Injectable } from '@nestjs/common';
import {
  BillingCycle,
  SubscriptionStatus,
  SubscriptionTier,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service.js';
import type {
  CreateSubscriptionData,
  SubscriptionEntity,
  SubscriptionRepository,
} from '../domain/subscription.repository.js';

function mapSubscription(row: {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  maxMessages: number | null;
  remainingMessages: number | null;
  price: Prisma.Decimal;
  startDate: Date;
  endDate: Date;
  renewalDate: Date;
  autoRenew: boolean;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}): SubscriptionEntity {
  return {
    ...row,
    price: Number(row.price),
  };
}

@Injectable()
export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSubscriptionData): Promise<SubscriptionEntity> {
    const row = await this.prisma.subscription.create({
      data: {
        userId: data.userId,
        tier: data.tier,
        billingCycle: data.billingCycle,
        maxMessages: data.maxMessages,
        remainingMessages: data.remainingMessages,
        price: data.price,
        startDate: data.startDate,
        endDate: data.endDate,
        renewalDate: data.renewalDate,
        autoRenew: data.autoRenew,
        status: SubscriptionStatus.ACTIVE,
      },
    });
    return mapSubscription(row);
  }

  async findById(id: string): Promise<SubscriptionEntity | null> {
    const row = await this.prisma.subscription.findUnique({ where: { id } });
    return row ? mapSubscription(row) : null;
  }

  async findByUserId(userId: string): Promise<SubscriptionEntity[]> {
    const rows = await this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapSubscription);
  }

  async findActiveEligibleForUser(userId: string): Promise<SubscriptionEntity[]> {
    const now = new Date();
    const rows = await this.prisma.subscription.findMany({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { gt: now },
      },
    });
    return rows.map(mapSubscription);
  }

  async findDueForRenewal(now: Date): Promise<SubscriptionEntity[]> {
    const rows = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        renewalDate: { lte: now },
      },
    });
    return rows.map(mapSubscription);
  }

  async update(
    id: string,
    data: Partial<
      Pick<
        SubscriptionEntity,
        | 'remainingMessages'
        | 'autoRenew'
        | 'status'
        | 'startDate'
        | 'endDate'
        | 'renewalDate'
        | 'maxMessages'
      >
    >,
  ): Promise<SubscriptionEntity> {
    const row = await this.prisma.subscription.update({
      where: { id },
      data,
    });
    return mapSubscription(row);
  }
}

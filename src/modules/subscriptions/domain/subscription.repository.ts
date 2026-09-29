import type { BillingCycle, SubscriptionStatus, SubscriptionTier } from '@prisma/client';

export interface SubscriptionEntity {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  maxMessages: number | null;
  remainingMessages: number | null;
  price: number;
  startDate: Date;
  endDate: Date;
  renewalDate: Date;
  autoRenew: boolean;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionData {
  userId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  maxMessages: number | null;
  remainingMessages: number | null;
  price: number;
  startDate: Date;
  endDate: Date;
  renewalDate: Date;
  autoRenew: boolean;
}

export const SUBSCRIPTION_REPOSITORY = Symbol('SUBSCRIPTION_REPOSITORY');

export interface SubscriptionRepository {
  create(data: CreateSubscriptionData): Promise<SubscriptionEntity>;
  findById(id: string): Promise<SubscriptionEntity | null>;
  findByUserId(userId: string): Promise<SubscriptionEntity[]>;
  findActiveEligibleForUser(userId: string): Promise<SubscriptionEntity[]>;
  findDueForRenewal(now: Date): Promise<SubscriptionEntity[]>;
  update(
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
  ): Promise<SubscriptionEntity>;
}

export const PAYMENT_SERVICE = Symbol('PAYMENT_SERVICE');

export interface PaymentService {
  charge(amount: number, subscriptionId: string): Promise<{ success: boolean; reason?: string }>;
}

import { BillingCycle, SubscriptionTier } from '@prisma/client';
import { SUBSCRIPTION_PLANS } from './subscription-plans.js';

export function resolvePlanPrice(tier: SubscriptionTier, billingCycle: BillingCycle): number {
  const plan = SUBSCRIPTION_PLANS[tier];
  return billingCycle === BillingCycle.YEARLY ? plan.yearlyPrice : plan.monthlyPrice;
}

export function resolveMaxMessages(tier: SubscriptionTier): number | null {
  return SUBSCRIPTION_PLANS[tier].maxMessages;
}

export function addBillingPeriod(from: Date, billingCycle: BillingCycle): Date {
  const next = new Date(from);
  if (billingCycle === BillingCycle.YEARLY) {
    next.setUTCFullYear(next.getUTCFullYear() + 1);
  } else {
    next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return next;
}

export function remainingSortKey(remainingMessages: number | null): number {
  return remainingMessages === null ? Number.POSITIVE_INFINITY : remainingMessages;
}

/** Pick active bundle with highest remaining quota; newest wins ties. */
export function pickBundleWithLatestRemainingQuota<
  T extends { remainingMessages: number | null; maxMessages: number | null; createdAt: Date },
>(subscriptions: T[]): T | null {
  const eligible = subscriptions.filter((s) => {
    if (s.maxMessages === null) {
      return true;
    }
    return (s.remainingMessages ?? 0) > 0;
  });

  if (eligible.length === 0) {
    return null;
  }

  return [...eligible].sort((a, b) => {
    const remDiff = remainingSortKey(b.remainingMessages) - remainingSortKey(a.remainingMessages);
    if (remDiff !== 0) {
      return remDiff;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  })[0];
}

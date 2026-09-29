export const FREE_MESSAGES_PER_MONTH = 3;

export const SUBSCRIPTION_PLANS = {
  BASIC: {
    maxMessages: 10,
    monthlyPrice: 10,
    yearlyPrice: 100,
  },
  PRO: {
    maxMessages: 100,
    monthlyPrice: 50,
    yearlyPrice: 500,
  },
  ENTERPRISE: {
    maxMessages: null as number | null,
    monthlyPrice: 200,
    yearlyPrice: 2000,
  },
} as const;

export type SubscriptionPlanTier = keyof typeof SUBSCRIPTION_PLANS;

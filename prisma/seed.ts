import { BillingCycle, SubscriptionTier } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { SUBSCRIPTION_PLANS } from '../src/modules/subscriptions/domain/subscription-plans.js';
import { addBillingPeriod } from '../src/modules/subscriptions/domain/subscription.rules.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'demo@afaq-khan.dev';
  const user = await prisma.user.upsert({
    where: { email },
    create: { email },
    update: {},
  });

  const existing = await prisma.subscription.count({ where: { userId: user.id } });
  if (existing === 0) {
    const startDate = new Date();
    const endDate = addBillingPeriod(startDate, BillingCycle.MONTHLY);
    await prisma.subscription.create({
      data: {
        userId: user.id,
        tier: SubscriptionTier.BASIC,
        billingCycle: BillingCycle.MONTHLY,
        maxMessages: SUBSCRIPTION_PLANS.BASIC.maxMessages,
        remainingMessages: SUBSCRIPTION_PLANS.BASIC.maxMessages,
        price: SUBSCRIPTION_PLANS.BASIC.monthlyPrice,
        startDate,
        endDate,
        renewalDate: endDate,
        autoRenew: true,
      },
    });
  }

  console.log('Seeded user:', user.id, user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

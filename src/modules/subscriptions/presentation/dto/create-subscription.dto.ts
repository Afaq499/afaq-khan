import { BillingCycle, SubscriptionTier } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CreateSubscriptionDto {
  @IsUUID()
  userId!: string;

  @IsEnum(SubscriptionTier)
  tier!: SubscriptionTier;

  @IsEnum(BillingCycle)
  billingCycle!: BillingCycle;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}

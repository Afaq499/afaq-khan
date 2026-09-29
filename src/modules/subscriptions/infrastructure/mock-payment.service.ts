import { Injectable } from '@nestjs/common';
import type { PaymentService } from '../domain/subscription.repository.js';

/** Simulates billing: ~80% success, random failures mark subscriptions inactive. */
@Injectable()
export class MockPaymentService implements PaymentService {
  private readonly successRate = 0.8;

  async charge(
    amount: number,
    subscriptionId: string,
  ): Promise<{ success: boolean; reason?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const success = Math.random() < this.successRate;
    if (!success) {
      return {
        success: false,
        reason: `Simulated payment failure for subscription ${subscriptionId} (amount ${amount})`,
      };
    }
    return { success: true };
  }
}

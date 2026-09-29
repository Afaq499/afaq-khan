import { NotFoundError, QuotaExceededError } from '../../../shared/domain/domain-error.js';
import { FREE_MESSAGES_PER_MONTH } from '../../subscriptions/domain/subscription-plans.js';
import { pickBundleWithLatestRemainingQuota } from '../../subscriptions/domain/subscription.rules.js';
import type { SubscriptionRepository } from '../../subscriptions/domain/subscription.repository.js';
import type { UserRepository } from '../../users/domain/user.repository.js';
import type { ChatRepository, OpenAIClient } from '../domain/chat.repository.js';
import { startOfUtcMonth } from '../domain/month.util.js';

export class ChatService {
  constructor(
    private readonly chat: ChatRepository,
    private readonly users: UserRepository,
    private readonly subscriptions: SubscriptionRepository,
    private readonly openAI: OpenAIClient,
  ) {}

  async ask(userId: string, question: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const month = startOfUtcMonth();
    const usage = await this.chat.getOrCreateMonthlyUsage(userId, month);
    const freeRemaining = FREE_MESSAGES_PER_MONTH - usage.freeMessagesUsed;
    const useFree = freeRemaining > 0;

    let subscriptionId: string | null = null;

    if (!useFree) {
      const active = await this.subscriptions.findActiveEligibleForUser(userId);
      const picked = pickBundleWithLatestRemainingQuota(active);
      if (!picked) {
        throw new QuotaExceededError({
          freeMessagesUsed: usage.freeMessagesUsed,
          freeMessagesLimit: FREE_MESSAGES_PER_MONTH,
          activeSubscriptions: active.length,
        });
      }
      subscriptionId = picked.id;
    }

    const completion = await this.openAI.complete(question);

    const { message, freeMessagesUsed } = await this.chat.consumeQuotaAndSaveMessage({
      userId,
      month,
      useFree,
      subscriptionId,
      question,
      answer: completion.answer,
      inputTokens: completion.inputTokens,
      outputTokens: completion.outputTokens,
    });

    return {
      id: message.id,
      userId: message.userId,
      question: message.question,
      answer: message.answer,
      inputTokens: message.inputTokens,
      outputTokens: message.outputTokens,
      createdAt: message.createdAt,
      quota: {
        usedFreeSlot: useFree,
        freeMessagesUsed,
        freeMessagesLimit: FREE_MESSAGES_PER_MONTH,
        subscriptionId,
      },
    };
  }

  async history(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    return this.chat.listMessages(userId);
  }

  async usage(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const month = startOfUtcMonth();
    const usage = await this.chat.getOrCreateMonthlyUsage(userId, month);
    const active = await this.subscriptions.findActiveEligibleForUser(userId);

    return {
      month,
      freeMessagesUsed: usage.freeMessagesUsed,
      freeMessagesLimit: FREE_MESSAGES_PER_MONTH,
      freeMessagesRemaining: Math.max(0, FREE_MESSAGES_PER_MONTH - usage.freeMessagesUsed),
      activeBundles: active.map((s) => ({
        id: s.id,
        tier: s.tier,
        remainingMessages: s.remainingMessages,
        maxMessages: s.maxMessages,
        endDate: s.endDate,
        status: s.status,
      })),
    };
  }
}

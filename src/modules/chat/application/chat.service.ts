import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError, QuotaExceededError } from '../../../shared/domain/domain-error.js';
import { FREE_MESSAGES_PER_MONTH } from '../../subscriptions/domain/subscription-plans.js';
import { pickBundleWithLatestRemainingQuota } from '../../subscriptions/domain/subscription.rules.js';
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepository,
} from '../../subscriptions/domain/subscription.repository.js';
import { USER_REPOSITORY, type UserRepository } from '../../users/domain/user.repository.js';
import {
  CHAT_REPOSITORY,
  OPENAI_CLIENT,
  type ChatRepository,
  type OpenAIClient,
} from '../domain/chat.repository.js';

function startOfUtcMonth(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

@Injectable()
export class ChatService {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly chat: ChatRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: SubscriptionRepository,
    @Inject(OPENAI_CLIENT) private readonly openAI: OpenAIClient,
  ) {}

  async ask(userId: string, question: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const month = startOfUtcMonth();
    const usage = await this.chat.getOrCreateMonthlyUsage(userId, month);
    const useFree = usage.freeMessagesUsed < FREE_MESSAGES_PER_MONTH;

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
      ...message,
      quota: {
        usedFreeSlot: useFree,
        freeMessagesUsed,
        freeMessagesLimit: FREE_MESSAGES_PER_MONTH,
        subscriptionId,
      },
    };
  }

  async history(userId: string) {
    await this.ensureUser(userId);
    return this.chat.listMessages(userId);
  }

  async usage(userId: string) {
    await this.ensureUser(userId);

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

  private async ensureUser(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
  }
}

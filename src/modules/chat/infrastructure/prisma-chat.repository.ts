import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { DomainError } from '../../../shared/domain/domain-error.js';
import type {
  ChatMessageEntity,
  ChatRepository,
  MonthlyUsageEntity,
} from '../domain/chat.repository.js';

@Injectable()
export class PrismaChatRepository implements ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  createMessage(data: {
    userId: string;
    question: string;
    answer: string;
    inputTokens: number;
    outputTokens: number;
  }): Promise<ChatMessageEntity> {
    return this.prisma.chatMessage.create({ data });
  }

  listMessages(userId: string): Promise<ChatMessageEntity[]> {
    return this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrCreateMonthlyUsage(userId: string, month: Date): Promise<MonthlyUsageEntity> {
    return this.prisma.monthlyUsage.upsert({
      where: {
        userId_month: { userId, month },
      },
      create: {
        userId,
        month,
        freeMessagesUsed: 0,
      },
      update: {},
    });
  }

  async consumeQuotaAndSaveMessage(input: {
    userId: string;
    month: Date;
    useFree: boolean;
    subscriptionId: string | null;
    question: string;
    answer: string;
    inputTokens: number;
    outputTokens: number;
  }): Promise<{ message: ChatMessageEntity; freeMessagesUsed: number }> {
    return this.prisma.$transaction(async (tx) => {
      const usage = await tx.monthlyUsage.upsert({
        where: {
          userId_month: { userId: input.userId, month: input.month },
        },
        create: {
          userId: input.userId,
          month: input.month,
          freeMessagesUsed: 0,
        },
        update: {},
      });

      let freeMessagesUsed = usage.freeMessagesUsed;

      if (input.useFree) {
        const updated = await tx.monthlyUsage.updateMany({
          where: {
            id: usage.id,
            freeMessagesUsed: { lt: 3 },
          },
          data: {
            freeMessagesUsed: { increment: 1 },
          },
        });
        if (updated.count === 0) {
          throw new DomainError(
            'QUOTA_EXCEEDED',
            'Free quota was concurrently exhausted',
            { userId: input.userId },
            402,
          );
        }
        freeMessagesUsed = usage.freeMessagesUsed + 1;
      } else if (input.subscriptionId) {
        const sub = await tx.subscription.findUnique({
          where: { id: input.subscriptionId },
        });
        if (!sub) {
          throw new DomainError('NOT_FOUND', 'Subscription not found during deduction', {
            subscriptionId: input.subscriptionId,
          }, 404);
        }

        if (sub.maxMessages !== null) {
          const updated = await tx.subscription.updateMany({
            where: {
              id: input.subscriptionId,
              remainingMessages: { gt: 0 },
            },
            data: {
              remainingMessages: { decrement: 1 },
            },
          });
          if (updated.count === 0) {
            throw new DomainError(
              'QUOTA_EXCEEDED',
              'Subscription quota was concurrently exhausted',
              { subscriptionId: input.subscriptionId },
              402,
            );
          }
        }
      }

      const message = await tx.chatMessage.create({
        data: {
          userId: input.userId,
          question: input.question,
          answer: input.answer,
          inputTokens: input.inputTokens,
          outputTokens: input.outputTokens,
        },
      });

      return { message, freeMessagesUsed };
    });
  }
}

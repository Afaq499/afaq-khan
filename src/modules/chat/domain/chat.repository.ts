export interface ChatMessageEntity {
  id: string;
  userId: string;
  question: string;
  answer: string;
  inputTokens: number;
  outputTokens: number;
  createdAt: Date;
}

export interface MonthlyUsageEntity {
  id: string;
  userId: string;
  month: Date;
  freeMessagesUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export const CHAT_REPOSITORY = Symbol('CHAT_REPOSITORY');

export interface ChatRepository {
  listMessages(userId: string): Promise<ChatMessageEntity[]>;

  getOrCreateMonthlyUsage(userId: string, month: Date): Promise<MonthlyUsageEntity>;

  consumeQuotaAndSaveMessage(input: {
    userId: string;
    month: Date;
    useFree: boolean;
    subscriptionId: string | null;
    question: string;
    answer: string;
    inputTokens: number;
    outputTokens: number;
  }): Promise<{ message: ChatMessageEntity; freeMessagesUsed: number }>;
}

export const OPENAI_CLIENT = Symbol('OPENAI_CLIENT');

export interface OpenAIClient {
  complete(question: string): Promise<{
    answer: string;
    inputTokens: number;
    outputTokens: number;
  }>;
}

import { Module } from '@nestjs/common';
import { SUBSCRIPTION_REPOSITORY } from '../subscriptions/domain/subscription.repository.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { USER_REPOSITORY } from '../users/domain/user.repository.js';
import { UsersModule } from '../users/users.module.js';
import { ChatService } from './application/chat.service.js';
import { CHAT_REPOSITORY, OPENAI_CLIENT } from './domain/chat.repository.js';
import { MockOpenAIClient } from './infrastructure/mock-openai.client.js';
import { PrismaChatRepository } from './infrastructure/prisma-chat.repository.js';
import { ChatController } from './presentation/chat.controller.js';

@Module({
  imports: [UsersModule, SubscriptionsModule],
  controllers: [ChatController],
  providers: [
    {
      provide: CHAT_REPOSITORY,
      useClass: PrismaChatRepository,
    },
    {
      provide: OPENAI_CLIENT,
      useClass: MockOpenAIClient,
    },
    {
      provide: ChatService,
      useFactory: (
        chat: PrismaChatRepository,
        users: unknown,
        subscriptions: unknown,
        openAI: MockOpenAIClient,
      ) => new ChatService(chat, users as never, subscriptions as never, openAI),
      inject: [CHAT_REPOSITORY, USER_REPOSITORY, SUBSCRIPTION_REPOSITORY, OPENAI_CLIENT],
    },
  ],
})
export class ChatModule {}

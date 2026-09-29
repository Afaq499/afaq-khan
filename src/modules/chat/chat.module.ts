import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
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
    { provide: CHAT_REPOSITORY, useClass: PrismaChatRepository },
    { provide: OPENAI_CLIENT, useClass: MockOpenAIClient },
    ChatService,
  ],
})
export class ChatModule {}

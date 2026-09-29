import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [DatabaseModule, UsersModule, SubscriptionsModule, ChatModule],
})
export class AppModule {}

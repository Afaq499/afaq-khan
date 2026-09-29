import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { ChatService } from '../application/chat.service.js';
import { CreateChatMessageDto } from './dto/create-chat-message.dto.js';

class UserIdQueryDto {
  @IsUUID()
  userId!: string;
}

@Controller('chat')
export class ChatController {
  constructor(@Inject(ChatService) private readonly chatService: ChatService) {}

  @Post('messages')
  ask(@Body() dto: CreateChatMessageDto) {
    return this.chatService.ask(dto.userId, dto.question);
  }

  @Get('messages')
  history(@Query() query: UserIdQueryDto) {
    return this.chatService.history(query.userId);
  }

  @Get('usage')
  usage(@Query() query: UserIdQueryDto) {
    return this.chatService.usage(query.userId);
  }
}

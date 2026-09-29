import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UserIdQueryDto } from '../../../shared/presentation/dto/user-id-query.dto.js';
import { ChatService } from '../application/chat.service.js';
import { CreateChatMessageDto } from './dto/create-chat-message.dto.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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

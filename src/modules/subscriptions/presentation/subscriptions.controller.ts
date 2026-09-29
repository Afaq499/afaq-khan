import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { SubscriptionService } from '../application/subscription.service.js';
import { CreateSubscriptionDto } from './dto/create-subscription.dto.js';
import { ToggleAutoRenewDto } from './dto/toggle-auto-renew.dto.js';

class UserIdQueryDto {
  @IsUUID()
  userId!: string;
}

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    @Inject(SubscriptionService) private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post()
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.create(dto);
  }

  @Get()
  list(@Query() query: UserIdQueryDto) {
    return this.subscriptionService.listByUser(query.userId);
  }

  @Post('billing/run')
  runBilling() {
    return this.subscriptionService.runBilling();
  }

  @Patch(':id/auto-renew')
  toggleAutoRenew(@Param('id') id: string, @Body() dto: ToggleAutoRenewDto) {
    return this.subscriptionService.setAutoRenew(id, dto.autoRenew);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.subscriptionService.cancel(id);
  }
}

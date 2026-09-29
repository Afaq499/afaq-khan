import { Module } from '@nestjs/common';
import { UsersService } from './application/users.service.js';
import { USER_REPOSITORY } from './domain/user.repository.js';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository.js';
import { UsersController } from './presentation/users.controller.js';

@Module({
  controllers: [UsersController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    UsersService,
  ],
  exports: [UsersService, USER_REPOSITORY],
})
export class UsersModule {}

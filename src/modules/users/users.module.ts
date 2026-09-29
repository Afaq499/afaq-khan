import { Module } from '@nestjs/common';
import { UsersService } from './application/users.service.js';
import { USER_REPOSITORY } from './domain/user.repository.js';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository.js';
import { UsersController } from './presentation/users.controller.js';

@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: UsersService,
      useFactory: (repo: PrismaUserRepository) => new UsersService(repo),
      inject: [USER_REPOSITORY],
    },
  ],
  exports: [UsersService, USER_REPOSITORY],
})
export class UsersModule {}

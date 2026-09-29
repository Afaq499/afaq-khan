import { ConflictError, NotFoundError } from '../../../shared/domain/domain-error.js';
import type { UserEntity, UserRepository } from '../domain/user.repository.js';

export class UsersService {
  constructor(private readonly users: UserRepository) {}

  async create(email: string): Promise<UserEntity> {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email is already registered', { email });
    }
    return this.users.create(email.toLowerCase().trim());
  }

  async getById(id: string): Promise<UserEntity> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }
    return user;
  }
}

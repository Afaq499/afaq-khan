export interface UserEntity {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  create(email: string): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
}

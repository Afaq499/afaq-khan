import { IsUUID } from 'class-validator';

export class UserIdQueryDto {
  @IsUUID()
  userId!: string;
}

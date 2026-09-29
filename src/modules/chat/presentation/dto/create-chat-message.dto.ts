import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateChatMessageDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @MinLength(1)
  question!: string;
}

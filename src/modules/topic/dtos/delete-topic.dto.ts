import { IsString, IsUUID } from 'class-validator';

export class DeleteTopicQueryDto {
  @IsString()
  @IsUUID()
  id: string;
}

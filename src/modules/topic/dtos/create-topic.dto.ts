import { IsString, MinLength } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  @MinLength(3)
  topic: string;
}

export class CreateTopicResponseDto {
  id: string;
}

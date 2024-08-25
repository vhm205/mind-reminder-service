import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  blocks: string;

  @IsString()
  @MinLength(3)
  markdown: string;

  @IsString()
  @MinLength(3)
  html: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsString()
  topicId: string;

  @IsOptional()
  @IsString()
  channelId: string;

  @IsBoolean()
  pushNotification: boolean;
}

export class CreateNoteResponseDto {
  id: string;
}

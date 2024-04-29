import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @MinLength(3)
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsString()
  @IsOptional()
  channelId: string;
}

export class CreateNoteResponseDto {
  id: string;
}

import { ApiResponseProperty } from '@nestjs/swagger';
import { EChannelType, Topic } from '@schema';
import { PageOptionsDto } from '@common';

class Channel {
  name: string;
  type: EChannelType;
}

export class GetNotesQueryDto extends PageOptionsDto {
  topicId: string;
  keyword?: string;
}

export class GetNoteResponseDto {
  @ApiResponseProperty()
  id: string;

  @ApiResponseProperty()
  title: string;

  @ApiResponseProperty()
  blocks: string;

  @ApiResponseProperty()
  tags: string[];

  @ApiResponseProperty()
  status: string;

  @ApiResponseProperty()
  pushNotification: boolean;

  @ApiResponseProperty()
  topic: Topic;

  @ApiResponseProperty()
  channel?: Channel;

  @ApiResponseProperty()
  createdAt: Date;

  @ApiResponseProperty()
  updatedAt: Date | null;
}

/**
 * DEPRECATED
 */
export class GetNotionNotesQueryDto {
  databaseId: string;
}

export class GetNotionNoteQueryDto {
  pageId: string;
}

export class GetNotionNoteResponseDto {
  @ApiResponseProperty()
  id: string;

  @ApiResponseProperty()
  content: string;

  @ApiResponseProperty()
  createdAt: Date;

  @ApiResponseProperty()
  updatedAt: Date | null;
}

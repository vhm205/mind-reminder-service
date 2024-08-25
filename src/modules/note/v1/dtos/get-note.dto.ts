import { ApiResponseProperty } from '@nestjs/swagger';
import { EChannelType } from '@schema';
import { PageOptionsDto } from '@common';

class Channel {
  name: string;
  type: EChannelType;
}

export class GetNotesQueryDto extends PageOptionsDto {
  keyword?: string;
}

export class GetNoteResponseDto {
  @ApiResponseProperty()
  id: string;

  @ApiResponseProperty()
  content: string;

  @ApiResponseProperty()
  tags: string[];

  @ApiResponseProperty()
  channel?: Channel;

  @ApiResponseProperty()
  createdAt: Date;

  @ApiResponseProperty()
  updatedAt: Date | null;
}

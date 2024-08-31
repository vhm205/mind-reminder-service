import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateNoteDto } from './create-note.dto';

export class UpdateNoteDto extends PartialType(
  PickType(CreateNoteDto, [
    'title',
    'blocks',
    'markdown',
    'html',
    'pushNotification',
    'channelId',
    'tags',
  ] as const),
) {
  noteId: string;
  // blocks?: Block[];
}

export class UpdateNoteResponseDto {
  id: string;
  matchedCount: number;
  modifiedCount: number;
}

import { PartialType } from '@nestjs/mapped-types';
import { CreateNoteDto } from './create-note.dto';

export class UpdateNoteDto extends PartialType(CreateNoteDto) {}

export class UpdateNoteResponseDto {
  id: string;
  matchedCount: number;
  modifiedCount: number;
}

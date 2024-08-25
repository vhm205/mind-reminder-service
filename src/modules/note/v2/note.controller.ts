import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { NoteService } from './note.service';
import { CurrentUser, ResponseType } from '@common';
import {
  CreateNoteDto,
  CreateNoteResponseDto,
  DeleteNoteQuery,
  GetNotesQueryDto,
  UpdateNoteDto,
} from './dtos';

@Controller({
  path: 'notes',
  version: process.env.API_VERSION,
})
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createNote(
    @Body() body: CreateNoteDto,
    @CurrentUser('uid') userId: string,
  ): Promise<ResponseType<CreateNoteResponseDto>> {
    return this.noteService.createNote(body, userId);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  updateNote(@Body() body: UpdateNoteDto, @CurrentUser('uid') userId: string) {
    return this.noteService.updateNote(body, userId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNote(
    @Query() query: DeleteNoteQuery,
    @CurrentUser('uid') userId: string,
  ) {
    return this.noteService.deleteNote(query, userId);
  }

  @Get('/:nid')
  @HttpCode(HttpStatus.OK)
  getNote(@Param('nid') nid: string, @CurrentUser('uid') userId: string) {
    return this.noteService.getNote(nid, userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  getNotes(
    @Query() query: GetNotesQueryDto,
    @CurrentUser('uid') userId: string,
  ) {
    return this.noteService.getNotes(query, userId);
  }
}

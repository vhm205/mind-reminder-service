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
import { ResponseType, CurrentUser, PageDto } from '@common';
import {
  CreateNoteDto,
  CreateNoteResponseDto,
  DeleteNoteResponseDto,
  GetNoteResponseDto,
  GetNotesQueryDto,
  UpdateNoteDto,
  UpdateNoteResponseDto,
} from './dtos';
import { Note } from '@schema';
import { ApiOkResponse } from '@nestjs/swagger';

@Controller({
  path: 'notes',
  version: process.env.API_VERSION,
})
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post('')
  createNote(
    @Body() body: CreateNoteDto,
    @CurrentUser('uid') userId: string,
  ): Promise<ResponseType<CreateNoteResponseDto>> {
    return this.noteService.createNote(body, userId);
  }

  @Get('/:nid')
  getNote(
    @Param('nid') nid: string,
    @CurrentUser('uid') userId: string,
  ): Promise<ResponseType<GetNoteResponseDto>> {
    return this.noteService.getNote(nid, userId);
  }

  @Get('')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: PageDto<GetNoteResponseDto> })
  getNotes(
    @Query() query: GetNotesQueryDto,
    @CurrentUser('uid') userId: string,
  ): Promise<ResponseType<PageDto<Omit<Note, 'channel'>>>> {
    return this.noteService.getNotes(query, userId);
  }

  @Patch('/:nid')
  updateNote(
    @Param('nid') nid: string,
    @Body() body: UpdateNoteDto,
    @CurrentUser('uid') userId: string,
  ): Promise<ResponseType<UpdateNoteResponseDto>> {
    return this.noteService.updateNote(nid, userId, body);
  }

  @Delete('/:nid')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNote(
    @Param('nid') nid: string,
    @CurrentUser('uid') userId: string,
  ): Promise<ResponseType<DeleteNoteResponseDto>> {
    return this.noteService.deleteNote(nid, userId);
  }
}

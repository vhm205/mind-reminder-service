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
} from '@nestjs/common';
import { NoteService } from './note.service';
import { ResponseType, CurrentUser } from '@common';
import {
  CreateNoteDto,
  CreateNoteResponseDto,
  DeleteNoteResponseDto,
  GetNoteResponseDto,
  UpdateNoteDto,
  UpdateNoteResponseDto,
} from './dtos';

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

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import {
  NOTE_DELETED_EVENT,
  type NoteDeletedEvent,
} from '../events/note-deleted.event';
import { NotionService } from 'src/modules/notion/notion.service';

@Injectable()
export class NoteDeletedListener {
  private readonly logger = new Logger();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly notion: NotionService,
  ) {}

  @OnEvent(NOTE_DELETED_EVENT, { async: true })
  async handleNoteDeletedEvent(payload: NoteDeletedEvent) {
    try {
      const { pageId } = payload;
      this.notion.movePageToTrash({ pageId });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      this.logger.error('Retry to delete note...', payload.retry);

      if (payload.retry < 3) {
        this.eventEmitter.emit(NOTE_DELETED_EVENT, {
          ...payload,
          retry: payload.retry + 1,
        });
      }
    }
  }
}

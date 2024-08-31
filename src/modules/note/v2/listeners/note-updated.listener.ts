import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import {
  NOTE_UPDATED_EVENT,
  type NoteUpdatedEvent,
} from '../events/note-updated.event';
import { NotionService } from 'src/modules/notion/notion.service';

@Injectable()
export class NoteUpdatedListener {
  private readonly logger = new Logger();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly notion: NotionService,
  ) {}

  @OnEvent(NOTE_UPDATED_EVENT, { async: true })
  async handleNoteUpdatedEvent(payload: NoteUpdatedEvent) {
    try {
      const { blocks } = payload;
      if (blocks && Array.isArray(blocks)) {
        const asyncUpdateBlocks = blocks.map((block) => {
          return this.notion.updateBlock({
            blockId: block.id,
            payload: {
              paragraph: {
                rich_text: [
                  {
                    text: {
                      content: block.content,
                    },
                  },
                ],
              },
            },
          });
        });
        await Promise.all(asyncUpdateBlocks);
      }
    } catch (error) {
      this.logger.error(error.message, error.stack);
      this.logger.error('Retry to update note...', payload.retry);

      if (payload.retry < 3) {
        this.eventEmitter.emit(NOTE_UPDATED_EVENT, {
          ...payload,
          retry: payload.retry + 1,
        });
      }
    }
  }
}

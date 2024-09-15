import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from 'agenda-nest';
import Agenda from 'agenda';

import env from '@environments';
import { Note } from '@schema';
import {
  NOTE_UPDATED_EVENT,
  type NoteUpdatedEvent,
} from '../events/note-updated.event';
import { NotionService } from 'src/modules/notion/notion.service';
import { momentTZ, spacedRepetitionInterval } from '@helpers';

@Injectable()
export class NoteUpdatedListener {
  private readonly logger = new Logger();

  constructor(
    @InjectModel(Note.name) private noteModel: Model<Note>,
    @InjectQueue(env.QUEUE_REMINDER) private queue: Agenda,
    private readonly eventEmitter: EventEmitter2,
    private readonly notion: NotionService,
  ) {}

  @OnEvent(NOTE_UPDATED_EVENT, { async: true })
  async handleNoteUpdatedEvent(payload: NoteUpdatedEvent) {
    try {
      const { noteId, blocks } = payload;

      const note = await this.noteModel.findById(noteId).lean();
      if (!note) {
        throw new Error('Note is not found');
      }

      if (note.pushNotification) {
        const { _id, user, markdown } = note;

        this.createSchedulerRepeat({
          _id,
          user,
          markdown,
        });
      } else {
        await this.queue.cancel({
          'data._id': note._id,
        });
      }

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

  async createSchedulerRepeat(payload: any) {
    const array = Array.from({ length: 8 }, (_, i) => i + 1);
    const initialInterval = 1;
    const now = momentTZ();

    const asyncCreateJob = array.map(async (repetitionNumber: number) => {
      const spacedRepetition = spacedRepetitionInterval(
        initialInterval,
        repetitionNumber,
      );
      const nextReviewTime = now.add(spacedRepetition, 'day');

      const job = this.queue.create('reminder', payload);
      job.unique({ 'data.noteId': payload._id.toString() });
      job.priority('high');
      job.schedule(nextReviewTime.toDate());
      return job.save();
    });
    await Promise.all(asyncCreateJob);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from 'agenda-nest';
import { Agenda } from 'agenda';

import env from '@environments';
import { momentTZ, spacedRepetitionInterval } from '@helpers';
import { Note } from '@schema';
import {
  NOTE_CREATED_EVENT,
  type NoteCreatedEvent,
} from '../events/note-created.event';
import { NotionService } from 'src/modules/notion/notion.service';

@Injectable()
export class NoteCreatedListener {
  private readonly logger = new Logger();

  constructor(
    @InjectModel(Note.name) private noteModel: Model<Note>,
    @InjectQueue(env.QUEUE_REMINDER) private queue: Agenda,
    private readonly eventEmitter: EventEmitter2,
    private readonly notion: NotionService,
  ) {}

  @OnEvent(NOTE_CREATED_EVENT, { async: true })
  async handleNoteCreatedEvent(payload: NoteCreatedEvent) {
    try {
      const {
        noteId,
        // pageId,
        // title,
        // blocks,
        // html,
        // markdown,
        pushNotification,
      } = payload;

      if (pushNotification) {
        const note = await this.noteModel.findById(noteId).lean();
        this.createSchedulerRepeat(note);
      }

      // const {
      //   error,
      //   data: pageData,
      //   message,
      // }: any = await this.notion.insertPage(pageId, {
      //   title,
      // });
      // if (error) throw new Error(message);
      //
      // const block: any = await this.notion.insertBlock(pageData.id, {
      //   blocks,
      //   html,
      //   markdown,
      // });
      // if (block.error) throw new Error(block.message);
      //
      // const { type, database_id } = pageData.parent;
      // const metadata = {
      //   page: {
      //     id: pageData.id,
      //     url: pageData.url,
      //     parent: {
      //       id: database_id,
      //       type,
      //     },
      //   },
      // };
      //
      // await this.noteModel.findByIdAndUpdate(noteId, {
      //   $set: {
      //     metadata,
      //   },
      // });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      this.logger.error('Retry to create note...', payload.retry);

      if (payload.retry < 3) {
        this.eventEmitter.emit(NOTE_CREATED_EVENT, {
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
      const nextReviewTime = now.add(spacedRepetition, 'minutes');

      const job = this.queue.create('reminder', payload);
      job.unique({ 'data.noteId': payload._id.toString() });
      job.priority('high');
      job.schedule(nextReviewTime.toDate());
      return job.save();
    });
    await Promise.all(asyncCreateJob);
  }
}

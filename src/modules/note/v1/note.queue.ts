import { Logger, Injectable } from '@nestjs/common';
import {
  Define,
  InjectQueue,
  OnJobComplete,
  OnQueueError,
  Queue,
} from 'agenda-nest';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Channel, Note } from '@schema';
import env from '@environments';
import { momentTZ, spacedRepetitionInterval } from '@helpers';
import { TelegramService } from 'src/modules/telegram/telegram.service';

@Queue(env.QUEUE_REMINDER!)
export class NoteQueue {
  private readonly logger = new Logger();

  constructor(
    @InjectModel(Channel.name) private readonly channelModel: Model<Channel>,
    @InjectModel(Note.name) private readonly noteModel: Model<Note>,
    @InjectQueue(env.QUEUE_REMINDER) private queue: any,
    private readonly telegramService: TelegramService,
  ) {}

  @Define('reminder')
  async sendReminder(job: any, done: Function) {
    try {
      const { _id: noteId, content, repetitionNumber, user } = job.attrs.data;
      this.logger.log({ data: job.attrs.data });

      const [channel, note] = await Promise.all([
        this.channelModel.findOne({ user }).lean(),
        this.noteModel.findById(noteId).lean(),
      ]);
      if (!channel || !note) return;

      const { id } = channel.metadata;
      this.telegramService.sendMessage(id, content);

      const initialInterval = 1;
      const now = momentTZ();
      const spacedRepetition = spacedRepetitionInterval(
        initialInterval,
        repetitionNumber,
      );
      const nextReviewTime = now.add(spacedRepetition, 'days');
      const timestamp = nextReviewTime.valueOf();
      const formattedNextReviewTime = nextReviewTime.format(
        'YYYY-MM-DD HH:mm:ss',
      );

      this.queue.schedule(timestamp, 'reminder', {
        ...job.attrs.data,
        repetitionNumber: repetitionNumber + 1,
      });

      await this.noteModel.findByIdAndUpdate(noteId, {
        $set: {
          nextReviewTime: formattedNextReviewTime,
        },
        $inc: {
          repetitionNumber: 1,
        },
      });

      done();
    } catch (error: any) {
      console.error({ error });
    }
  }

  @OnJobComplete('reminder')
  onJobComplete(job: any) {
    job.remove();
  }

  @OnQueueError()
  onError(error: any) {
    this.logger.error('queue error: ', error);
  }
}

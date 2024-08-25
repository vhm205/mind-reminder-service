import { Injectable, Logger } from '@nestjs/common';
import {
  Define,
  OnJobComplete,
  OnJobFail,
  OnJobSuccess,
  OnQueueError,
  Queue,
} from 'agenda-nest';
import { Job } from 'agenda';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Channel, Note } from '@schema';
import env from '@environments';

import { TelegramService } from 'src/modules/telegram/telegram.service';

@Queue(env.QUEUE_REMINDER!)
@Injectable()
export class NoteQueue {
  private readonly logger = new Logger();

  constructor(
    @InjectModel(Channel.name) private readonly channelModel: Model<Channel>,
    @InjectModel(Note.name) private readonly noteModel: Model<Note>,
    private readonly telegramService: TelegramService,
  ) {}

  @Define('reminder')
  async sendReminder(job: Job, done: Function) {
    try {
      const { _id: noteId, markdown, user } = job.attrs.data;
      // this.logger.log({ job_attr: job.attrs });

      const [channel, note] = await Promise.all([
        this.channelModel.findOne({ user }).lean(),
        this.noteModel.findById(noteId).lean(),
      ]);
      if (!channel || !note) return;

      const { id } = channel.metadata;
      this.telegramService.sendMessage(id, markdown);

      await this.noteModel.findByIdAndUpdate(noteId, {
        $inc: {
          repetitionNumber: 1,
        },
      });

      // const initialInterval = 1;
      // const now = momentTZ();
      // const spacedRepetition = spacedRepetitionInterval(
      //   initialInterval,
      //   repetitionNumber,
      // );
      // const nextReviewTime = now.add(spacedRepetition, 'seconds');
      // const timestamp = nextReviewTime.valueOf();
      // const formattedNextReviewTime = nextReviewTime.format(
      //   'YYYY-MM-DD HH:mm:ss',
      // );

      // if (lastRunAt) {
      //   const currentDatetime = momentTZ();
      //   const runAt = momentTZ(lastRunAt).format();
      //   const diffHours = currentDatetime.diff(runAt, 'minutes');
      //   const isBefore = currentDatetime.isBefore(runAt, 'minutes');
      //   const isAfter = currentDatetime.isAfter(runAt, 'minutes');
      //   const isSame = currentDatetime.isSame(runAt, 'minutes');
      //   const isSameOrAfter = currentDatetime.isSameOrAfter(runAt, 'minutes');
      //   const isSameOrBefore = currentDatetime.isSameOrBefore(runAt, 'minutes');
      //   const isLocal = currentDatetime.isLocal();

      // await this.queue.every(timestamp.toString(), 'reminder', {
      //   ...job.attrs.data,
      //   repetitionNumber: repetitionNumber + 1,
      // });

      done();
    } catch (error: any) {
      this.logger.error('job error: ', error, job);
    }
  }

  @OnJobComplete('reminder')
  onJobComplete(job: Job) {
    job.remove();
  }

  @OnJobSuccess('reminder')
  onJobSuccess(job: Job) {
    this.logger.log('job_success', job);
  }

  @OnJobFail('reminder')
  onJobFail(job: Job) {
    this.logger.warn('job_fail', job);
  }

  @OnQueueError()
  onError(error: any) {
    this.logger.error('queue error: ', error);
  }
}

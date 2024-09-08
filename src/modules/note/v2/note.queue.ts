import { Injectable, Logger } from '@nestjs/common';
import {
  Define,
  InjectQueue,
  OnJobComplete,
  OnJobFail,
  OnJobSuccess,
  OnQueueError,
  OnQueueReady,
  Queue,
} from 'agenda-nest';
import Agenda, { Job } from 'agenda';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Channel, EChannelStatus, Note } from '@schema';
import env from '@environments';

import { TelegramService } from 'src/modules/telegram/telegram.service';
import { convertMarkdownToTelegramFormat } from 'src/helpers/telegram';

@Queue(env.QUEUE_REMINDER!)
@Injectable()
export class NoteQueue {
  private readonly logger = new Logger();

  constructor(
    @InjectModel(Channel.name) private readonly channelModel: Model<Channel>,
    @InjectModel(Note.name) private readonly noteModel: Model<Note>,
    @InjectQueue(env.QUEUE_REMINDER) private queue: Agenda,
    private readonly telegramService: TelegramService,
  ) {}

  @Define('reminder')
  async sendReminder(job: Job, done: Function) {
    try {
      const { _id: noteId, markdown, user } = job.attrs.data;
      // this.logger.log('define_job_reminder', { job_attr: job.attrs });

      const [channel, note] = await Promise.all([
        this.channelModel
          .findOne({ user, isDefault: true, status: EChannelStatus.ACTIVE })
          .lean(),
        this.noteModel.findById(noteId).lean(),
      ]);
      if (!channel || !note) {
        return this.logger.error('channel or note not found', job.attrs);
      }

      const { id } = channel.metadata;
      const message = convertMarkdownToTelegramFormat(markdown);

      this.telegramService.sendMessage(id, message, {
        parse_mode: 'HTML',
      });

      await this.noteModel.findByIdAndUpdate(noteId, {
        $inc: {
          repetitionNumber: 1,
        },
      });

      done();
    } catch (error) {
      this.logger.error('job error: ', error, job);
    }
  }

  @OnQueueReady()
  async onQueueReady() {
    const now = new Date();
    await this.queue.cancel({
      nextRunAt: { $lt: now },
    });
  }

  // called when a job finishes, regardless of if it succeeds or fails
  @OnJobComplete('reminder')
  onJobComplete(job: Job) {
    job.remove();
  }

  @OnJobSuccess('reminder')
  onJobSuccess(job: Job) {
    this.logger.log('JOB_SUCCESS', job.toJSON()._id);
  }

  @OnJobFail('reminder')
  onJobFail(job: Job) {
    this.logger.warn('JOB_FAIL', job.toJSON()._id);
  }

  @OnQueueError()
  onError(error: any) {
    this.logger.error('QUEUE_ERROR: ', { error });
  }
}

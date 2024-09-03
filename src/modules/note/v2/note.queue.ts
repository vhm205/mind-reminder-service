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
    private readonly telegramService: TelegramService,
  ) {}

  @Define('reminder')
  async sendReminder(job: Job, done: Function) {
    try {
      const { _id: noteId, markdown, user } = job.attrs.data;
      // this.logger.log({ job_attr: job.attrs });

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

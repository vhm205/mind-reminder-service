import { Define, OnQueueError, Queue } from 'agenda-nest';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Channel } from '@schema';
import { TelegramService } from '../telegram/telegram.service';
import env from '@environments';

@Queue(env.QUEUE_REMINDER!)
export class NoteQueue {
  constructor(
    @InjectModel(Channel.name) private readonly channelModel: Model<Channel>,
    private readonly telegramService: TelegramService,
  ) {}

  @Define('send reminder')
  async sendReminder(job: any) {
    const { content, user } = job.attrs.data;

    const channel = await this.channelModel.findOne({ user }).lean();
    if (!channel) return;

    const { id } = channel.metadata;
    this.telegramService.sendMessage(id, content);
  }

  @OnQueueError()
  onError(error: any) {
    console.error(error);
  }
}

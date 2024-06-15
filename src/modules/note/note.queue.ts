import { Define, InjectQueue, OnQueueError, Queue } from 'agenda-nest';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Channel, Note } from '@schema';
import { TelegramService } from '../telegram/telegram.service';
import env from '@environments';
import { momentTZ, spacedRepetitionInterval } from '@helpers';

@Queue(env.QUEUE_REMINDER!)
export class NoteQueue {
  constructor(
    @InjectModel(Channel.name) private readonly channelModel: Model<Channel>,
    @InjectModel(Note.name) private readonly noteModel: Model<Note>,
    @InjectQueue(env.QUEUE_REMINDER) private queue: any,
    private readonly telegramService: TelegramService,
  ) {}

  @Define('reminder')
  async sendReminder(job: any, done: Function) {
    const { id: noteId, content, repetitionNumber, user } = job.attrs.data;

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
    const formattedNextReviewTime = nextReviewTime.format(
      'YYYY-MM-DD HH:mm:ss',
    );
    console.log({ formattedNextReviewTime, unix: nextReviewTime.unix() });

    this.queue.schedule(nextReviewTime.unix(), 'reminder', {
      ...job.attrs.data,
      nextReviewTime: formattedNextReviewTime,
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
  }

  @OnQueueError()
  onError(error: any) {
    console.error(error);
  }
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgendaModule } from 'agenda-nest';
import { Channel, ChannelSchema, Note, NoteSchema } from '@schema';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import { NoteQueue } from './note.queue';
import { TelegramService } from '../telegram/telegram.service';
import env from '@environments';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Note.name, schema: NoteSchema },
      { name: Channel.name, schema: ChannelSchema },
    ]),
    AgendaModule.registerQueue(env.QUEUE_REMINDER!, {
      autoStart: true,
      collection: env.QUEUE_COLLECTION_REMINDER,
    }),
  ],
  providers: [NoteService, NoteQueue, TelegramService],
  controllers: [NoteController],
})
export class NoteModule {}

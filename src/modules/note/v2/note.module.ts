import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgendaModule } from 'agenda-nest';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import {
  Channel,
  ChannelSchema,
  Note,
  NoteSchema,
  Topic,
  TopicSchema,
} from '@schema';
import env from '@environments';
import { NoteQueue } from './note.queue';
import { NotionService } from 'src/modules/notion/notion.service';
import { TelegramService } from 'src/modules/telegram/telegram.service';
import { NoteCreatedListener } from './listeners/note-created.listener';
import { NoteDeletedListener } from './listeners/note-deleted.listener';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Topic.name, schema: TopicSchema },
      { name: Note.name, schema: NoteSchema },
      { name: Channel.name, schema: ChannelSchema },
    ]),
    AgendaModule.registerQueue(env.QUEUE_REMINDER!, {
      autoStart: true,
      collection: env.QUEUE_COLLECTION_REMINDER,
    }),
  ],
  providers: [
    NoteService,
    NoteQueue,
    NoteCreatedListener,
    NoteDeletedListener,
    NotionService,
    TelegramService,
  ],
  controllers: [NoteController],
})
export class NoteModule {}

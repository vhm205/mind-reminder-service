import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgendaModule } from 'agenda-nest';
import { Channel, ChannelSchema, Note, NoteSchema } from '@schema';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import env from '@environments';
import { TelegramService } from 'src/modules/telegram/telegram.service';
import { NotionService } from 'src/modules/notion/notion.service';

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
  providers: [NoteService, TelegramService, NotionService],
  controllers: [NoteController],
})
export class NoteModule {}

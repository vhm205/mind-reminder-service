import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Channel, ChannelSchema, Note, NoteSchema } from '@schema';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Note.name, schema: NoteSchema },
      { name: Channel.name, schema: ChannelSchema },
    ]),
  ],
  providers: [NoteService],
  controllers: [NoteController],
})
export class NoteModule {}

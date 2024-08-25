import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Topic, TopicSchema } from '@schema';
import { NotionService } from '../notion/notion.service';
import { TopicService } from './topic.service';
import { TopicController } from './topic.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Topic.name, schema: TopicSchema }]),
  ],
  controllers: [TopicController],
  providers: [TopicService, NotionService],
  exports: [TopicService],
})
export class TopicModule {}

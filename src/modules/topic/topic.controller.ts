import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, type ResponseType } from '@common';
import { TopicService } from './topic.service';
import type {
  CreateTopicDto,
  CreateTopicResponseDto,
  DeleteTopicQueryDto,
  GetTopicsQueryDto,
} from './dtos';
import env from '@environments';

@Controller({
  path: 'topics',
  version: env.API_VERSION,
})
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Post()
  createTopic(
    @Body() body: CreateTopicDto,
    @CurrentUser('uid') userId: string,
  ): Promise<ResponseType<CreateTopicResponseDto>> {
    return this.topicService.createTopic(body, userId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTopic(
    @Query() query: DeleteTopicQueryDto,
    @CurrentUser('uid') userId: string,
  ) {
    return this.topicService.deleteTopic(query, userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  getTopics(
    @Query() query: GetTopicsQueryDto,
    @CurrentUser('uid') userId: string,
  ) {
    return this.topicService.getTopics(query, userId);
  }
}

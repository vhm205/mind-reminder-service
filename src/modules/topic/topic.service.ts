import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageDto, PageMetaDto, ResponseType } from '@common';
import { Topic } from '@schema';
import { NotionService } from '../notion/notion.service';
import {
  CreateTopicDto,
  CreateTopicResponseDto,
  DeleteTopicQueryDto,
  GetTopicsQueryDto,
} from './dtos';

const PAGE_ID = 'e0df498fbdf54ccbb842c98f2117e3e6';

@Injectable()
export class TopicService {
  private readonly logger = new Logger();

  constructor(
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
    private readonly notion: NotionService,
  ) {}

  async createTopic(
    payload: CreateTopicDto,
    userId: string,
  ): Promise<ResponseType<CreateTopicResponseDto>> {
    try {
      const { topic } = payload;
      let metadata = {};

      const { data }: any = await this.notion.insertDatabase(PAGE_ID, {
        title: topic,
      });

      if (data) {
        metadata = {
          id: data.id,
          object: data.object,
          url: data.url,
        };
      }

      const newTopic = await this.topicModel.create({
        title: topic,
        user: userId,
        metadata,
      });

      return {
        data: { id: newTopic._id.toString() },
        statusCode: HttpStatus.CREATED,
      };
    } catch (error: any) {
      this.logger.error('create topic error: ', error.message);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteTopic(payload: DeleteTopicQueryDto, userId: string) {
    try {
      const { id: topicId } = payload;

      const topic = await this.topicModel
        .findOne({
          _id: topicId,
          user: userId,
        })
        .lean();

      if (!topic) {
        return {
          message: `Topic not found or you don't have permission`,
          statusCode: HttpStatus.BAD_REQUEST,
        };
      }
      const { id: blockId } = topic.metadata;

      await Promise.all([
        this.topicModel.findByIdAndDelete(topicId),
        this.notion.updateBlock({
          blockId,
          payload: { in_trash: true },
        }),
      ]);

      return { statusCode: HttpStatus.NO_CONTENT };
    } catch (error) {
      this.logger.error('delete topic error: ', error.message);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getTopics(query: GetTopicsQueryDto, userId: string) {
    try {
      const filters: Record<string, any> = {
        user: userId,
        deletedAt: null,
      };

      if (query.keyword) {
        filters['$text'] = { $search: query.keyword };
      }

      const [topics, totalRecord] = await Promise.all([
        this.topicModel
          .find(filters)
          .sort(query.sort)
          .skip(query.skip)
          .limit(query.limit)
          .lean(),
        this.topicModel.countDocuments({ user: userId }),
      ]);

      const pageMeta = new PageMetaDto({
        totalRecord,
        pageOptionsDto: query,
      });
      const pageData = new PageDto(topics, pageMeta);

      return {
        data: pageData,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error('get topics error: ', error.message);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getNotionTopics() {
    try {
      const { data, error }: any = await this.notion.getBlocks({
        pageId: PAGE_ID,
      });

      if (error) {
        throw error;
      }

      let result: any = [];

      if (data.results && data.results.length) {
        result = data.results.filter((r: any) => r.type === 'child_database');
      }

      return { data: result, statusCode: HttpStatus.OK };
    } catch (error) {
      this.logger.error('get notion topics error: ', error.message);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

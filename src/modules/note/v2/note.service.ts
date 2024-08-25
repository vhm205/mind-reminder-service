import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from 'agenda-nest';
import { Agenda } from 'agenda';

import env from '@environments';
import { Channel, EChannelStatus, Note, Topic } from '@schema';
import { PageDto, PageMetaDto, ResponseType } from '@common';
import type {
  CreateNoteDto,
  CreateNoteResponseDto,
  GetNotesQueryDto,
  GetNoteResponseDto,
  GetNotionNoteQueryDto,
  GetNotionNotesQueryDto,
  UpdateNoteDto,
  DeleteNoteQuery,
} from './dtos';
import { NotionService } from 'src/modules/notion/notion.service';
import { momentTZ, spacedRepetitionInterval } from '@helpers';

@Injectable()
export class NoteService {
  private readonly logger = new Logger();

  constructor(
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
    @InjectModel(Note.name) private noteModel: Model<Note>,
    @InjectModel(Channel.name) private channelModel: Model<Channel>,
    @InjectQueue(env.QUEUE_REMINDER) private queue: Agenda,
    private readonly notion: NotionService,
  ) {}

  async createNote(
    payload: CreateNoteDto,
    userId: string,
  ): Promise<ResponseType<CreateNoteResponseDto>> {
    try {
      let {
        topicId,
        title,
        blocks,
        markdown,
        html,
        tags,
        pushNotification,
        channelId,
      } = payload;

      let channel = null;

      const topic = await this.topicModel
        .findOne({
          _id: topicId,
          user: userId,
          deletedAt: null,
        })
        .lean();
      if (!topic) {
        return {
          message: 'Topic is not found',
          statusCode: HttpStatus.BAD_REQUEST,
        };
      }

      const { id: pageId } = topic.metadata;
      const {
        error,
        data: pageData,
        message,
      }: any = await this.notion.insertPage(pageId, {
        title,
      });
      if (error) throw new Error(message);

      const block: any = await this.notion.insertBlock(pageData.id, {
        blocks,
        html,
        markdown,
      });
      if (block.error) throw new Error(block.message);

      if (channelId) {
        const userChannel = await this.channelModel
          .findOne({
            _id: channelId,
            user: userId,
            status: EChannelStatus.ACTIVE,
            deletedAt: null,
          })
          .lean();

        if (!userChannel) {
          throw new HttpException('Channel Not Found', HttpStatus.BAD_REQUEST);
        }

        channel = userChannel._id;
      }

      const { type, database_id } = pageData.parent;
      const metadata = {
        page: {
          id: pageData.id,
          url: pageData.url,
          parent: {
            id: database_id,
            type,
          },
        },
      };

      const newNote = await this.noteModel.create({
        topic: topicId,
        title,
        blocks,
        markdown,
        tags,
        channel,
        pushNotification,
        repetitionNumber: 1,
        user: userId,
        metadata,
      });

      if (pushNotification) {
        this.createSchedulerRepeat(newNote);
      }

      return {
        data: { id: newNote._id.toString() },
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      this.logger.error('create note error: ', error.message);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createSchedulerRepeat(payload: any) {
    const array = Array.from({ length: 8 }, (_, i) => i + 1);
    const initialInterval = 1;
    const now = momentTZ();

    const asyncCreateJob = array.map(async (repetitionNumber: number) => {
      const spacedRepetition = spacedRepetitionInterval(
        initialInterval,
        repetitionNumber,
      );
      const nextReviewTime = now.add(spacedRepetition, 'minutes');

      const job = this.queue.create('reminder', payload);
      job.unique({ 'data.noteId': payload._id.toString() });
      job.priority('high');
      job.schedule(nextReviewTime.toDate());
      return job.save();
    });
    await Promise.all(asyncCreateJob);
  }

  async updateNote(payload: UpdateNoteDto, userId: string) {
    try {
      const { noteId, title, blocks, channelId, pushNotification, tags } =
        payload;
      const dataUpdate: Record<string, string | boolean | string[]> = {};

      title && (dataUpdate['title'] = title);
      blocks && (dataUpdate['blocks'] = blocks);
      channelId && (dataUpdate['channel'] = channelId);
      pushNotification && (dataUpdate['pushNotification'] = pushNotification);
      tags && (dataUpdate['tags'] = tags);

      const result = await this.noteModel.updateOne(
        { _id: noteId, user: userId },
        {
          $set: dataUpdate,
        },
      );

      if (blocks && Array.isArray(blocks)) {
        const asyncUpdateBlocks = blocks.map((block) => {
          return this.notion.updateBlock({
            blockId: block.id,
            payload: {
              paragraph: {
                rich_text: [
                  {
                    text: {
                      content: block.content,
                    },
                  },
                ],
              },
            },
          });
        });
        await Promise.all(asyncUpdateBlocks);
      }

      return {
        data: {
          id: noteId,
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
        },
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error('update note error: ', error.message);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteNote(payload: DeleteNoteQuery, userId: string) {
    try {
      const { id: noteId } = payload;
      const note = await this.noteModel
        .findOne({ _id: noteId, user: userId })
        .lean();

      if (!note) {
        throw new HttpException('Note is Not Found', HttpStatus.BAD_REQUEST);
      }

      const { page } = note.metadata;
      await Promise.all([
        this.noteModel.deleteOne({ _id: noteId, user: userId }),
        this.notion.movePageToTrash({ pageId: page.id }),
      ]);

      return {
        statusCode: HttpStatus.NO_CONTENT,
      };
    } catch (error) {
      this.logger.error('delete note error: ', error.message);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getNote(
    id: string,
    userId: string,
  ): Promise<ResponseType<GetNoteResponseDto>> {
    try {
      const note = await this.noteModel
        .findOne({ _id: id, user: userId })
        .populate({
          path: 'channel topic',
          select: '_id name title type',
        })
        .lean();

      if (!note) {
        throw new HttpException('Note is Not Found', HttpStatus.BAD_REQUEST);
      }

      const {
        _id,
        title,
        blocks,
        tags,
        status,
        topic,
        channel,
        createdAt,
        updatedAt,
      } = note;

      return {
        data: {
          id: _id.toString(),
          title,
          blocks,
          tags,
          status,
          topic: topic as Topic,
          channel: channel as Channel,
          createdAt,
          updatedAt,
        },
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error('get note error: ', error.message);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getNotes(query: GetNotesQueryDto, userId: string) {
    try {
      const { topicId, keyword } = query;
      const filters: Record<string, any> = {
        topic: topicId,
        user: userId,
        deletedAt: null,
      };

      if (keyword) {
        filters['$text'] = { $search: keyword };
      }

      const [notes, totalRecord] = await Promise.all([
        this.noteModel
          .find(filters)
          .sort(query.sort)
          .skip(query.skip)
          .limit(query.limit)
          .lean(),
        this.noteModel.countDocuments({ userId }),
      ]);

      const pageMeta = new PageMetaDto({
        totalRecord,
        pageOptionsDto: query,
      });
      const pageData = new PageDto<Omit<Note, 'channel'>>(notes, pageMeta);

      return {
        data: pageData,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error('get notes error: ', error.message);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getNotionNote(query: GetNotionNoteQueryDto) {
    try {
      const { pageId } = query;

      const { data, error }: any = await this.notion.getBlocks({
        pageId,
      });

      if (error) {
        throw error;
      }

      let results: any = [];

      if (data.results && data.results.length) {
        results = data.results.map((result: any) => {
          const { id, created_time, parent, paragraph } = result;
          const { rich_text } = paragraph;

          return {
            id,
            parent,
            content: rich_text[0]?.plain_text,
            createdAt: created_time,
          };
        });
      }

      return {
        data: results,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error('get note error: ', error.message);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getNotionNotes(query: GetNotionNotesQueryDto) {
    try {
      const { databaseId } = query;

      const { data, error }: any = await this.notion.getDatabases({
        databaseId,
      });

      if (error) {
        throw error;
      }

      let results: any = [];

      if (data.results && data.results.length) {
        results = data.results.map((result: any) => {
          const {
            id,
            created_time,
            parent,
            properties: { Title },
          } = result;
          const [{ plain_text }] = Title.title;

          return {
            id,
            parent,
            title: plain_text,
            createdAt: created_time,
          };
        });
      }

      return {
        data: results,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error('get notes error: ', error.message);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

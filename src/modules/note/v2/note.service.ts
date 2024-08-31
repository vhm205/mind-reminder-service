import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

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
import {
  NOTE_CREATED_EVENT,
  NoteCreatedEvent,
} from './events/note-created.event';
import {
  NOTE_DELETED_EVENT,
  NoteDeletedEvent,
} from './events/note-deleted.event';

@Injectable()
export class NoteService {
  private readonly logger = new Logger();

  constructor(
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
    @InjectModel(Note.name) private noteModel: Model<Note>,
    @InjectModel(Channel.name) private channelModel: Model<Channel>,
    private readonly eventEmitter: EventEmitter2,
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
      });
      const { id: pageId } = topic.metadata;
      const noteId = newNote._id.toString();

      const eventPayload = new NoteCreatedEvent({
        noteId,
        pageId,
        title,
        blocks,
        html,
        markdown,
        pushNotification,
        retry: 0,
      });
      this.eventEmitter.emit(NOTE_CREATED_EVENT, eventPayload);

      return {
        data: { id: noteId },
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      this.logger.error('create note error: ', error.message);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
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
      await this.noteModel.deleteOne({ _id: noteId, user: userId });

      const eventPayload = new NoteDeletedEvent({
        pageId: page.id,
        retry: 0,
      });
      this.eventEmitter.emit(NOTE_DELETED_EVENT, eventPayload);

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

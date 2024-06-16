import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from 'agenda-nest';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import { RedisCache } from '@tirke/node-cache-manager-ioredis';

import { Channel, EChannelStatus, Note } from '@schema';
import { PageDto, PageMetaDto, ResponseType } from '@common';
import {
  CreateNoteDto,
  CreateNoteResponseDto,
  DeleteNoteResponseDto,
  GetNoteResponseDto,
  GetNotesQueryDto,
  UpdateNoteDto,
  UpdateNoteResponseDto,
} from './dtos';
import env from '@environments';

@Injectable()
export class NoteService {
  private readonly logger = new Logger();

  constructor(
    @InjectModel(Note.name) private noteModel: Model<Note>,
    @InjectModel(Channel.name) private channelModel: Model<Channel>,
    @InjectQueue(env.QUEUE_REMINDER) private queue: any,
    // @Inject(CACHE_MANAGER) private redisCache: RedisCache,
  ) {}

  getRedisKey(params: string): string {
    return `note:${params}`;
  }

  async createNote(
    payload: CreateNoteDto,
    userId: string,
  ): Promise<ResponseType<CreateNoteResponseDto>> {
    try {
      let { channelId, content, tags, pushNotification } = payload;
      let channel = null;

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
          throw new HttpException('Channel Not Found', HttpStatus.NOT_FOUND);
        }

        channel = userChannel._id;
      }

      const newNote = await this.noteModel.create({
        content,
        tags,
        channel,
        pushNotification,
        repetitionNumber: 1,
        user: userId,
      });

      if (pushNotification) {
        this.queue.schedule('1 minutes', 'reminder', newNote);
      }

      return { data: { id: newNote.id }, statusCode: HttpStatus.CREATED };
    } catch (error) {
      this.logger.error('create note error: ', error.message);
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
        .select('*')
        .populate({
          path: 'channel',
          select: 'name type',
        })
        .lean();

      if (!note) {
        throw new HttpException('Note Not Found', HttpStatus.NOT_FOUND);
      }

      return {
        data: {
          id: note.id,
          content: note.content,
          tags: note.tags,
          channel: note.channel as Channel,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
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
      const filters: Record<string, any> = {
        user: userId,
        deletedAt: null,
      };

      if (query.keyword) {
        filters['$text'] = { $search: query.keyword };
      }

      const notes = await this.noteModel
        .find(filters)
        .select('_id content tags status createdAt updatedAt')
        .sort(query.sort)
        .skip(query.skip)
        .limit(query.limit)
        .lean();

      const totalRecord = await this.noteModel.countDocuments({ userId });

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

  async updateNote(
    id: string,
    userId: string,
    payload: UpdateNoteDto,
  ): Promise<ResponseType<UpdateNoteResponseDto>> {
    try {
      const result = await this.noteModel.updateOne(
        { _id: id, user: userId },
        {
          $set: payload,
        },
      );

      return {
        data: {
          id,
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

  async deleteNote(
    id: string,
    userId: string,
  ): Promise<ResponseType<DeleteNoteResponseDto>> {
    try {
      const note = await this.noteModel.findOne({ _id: id, user: userId });

      if (!note) {
        throw new HttpException('Note Not Found', HttpStatus.NOT_FOUND);
      }

      const [result] = await Promise.all([
        this.noteModel.deleteOne({ _id: id, user: userId }),
        this.channelModel.deleteOne({ _id: note.channel }),
      ]);

      return {
        statusCode: HttpStatus.NO_CONTENT,
        data: {
          id,
          deletedCount: result.deletedCount,
        },
      };
    } catch (error) {
      this.logger.error('delete note error: ', error.message);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

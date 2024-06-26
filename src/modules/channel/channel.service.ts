import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Channel, EChannelStatus } from '@schema';
import { PageDto, PageMetaDto, ResponseType } from '@common';
import {
  CreateChannelDto,
  CreateChannelResponseDto,
  DeleteChannelResponseDto,
  GetChannelResponseDto,
  GetListChannelDto,
  UpdateChannelDto,
  UpdateChannelResponseDto,
} from './dtos';

@Injectable()
export class ChannelService {
  constructor(
    @InjectModel(Channel.name) private channelModel: Model<Channel>,
  ) {}

  async createChannel(
    payload: CreateChannelDto,
    userId: string,
  ): Promise<ResponseType<CreateChannelResponseDto>> {
    try {
      const checkChannelDuplicate = await this.channelModel.findOne({
        type: payload.type,
        user: userId,
        deletedAt: null,
      });

      if (checkChannelDuplicate) {
        throw new HttpException('Duplicate Channel', HttpStatus.BAD_REQUEST);
      }

      const totalChannel = await this.channelModel.countDocuments({
        user: userId,
        status: EChannelStatus.ACTIVE,
        isDefault: true,
        deletedAt: null,
      });

      const newChannel = await this.channelModel.create({
        ...payload,
        isDefault: totalChannel === 0,
        user: userId,
      });
      return { data: { id: newChannel.id }, statusCode: HttpStatus.CREATED };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getChannel(
    id: string,
    userId: string,
  ): Promise<ResponseType<GetChannelResponseDto>> {
    try {
      const channel = await this.channelModel
        .findOne({ _id: id, user: userId, deletedAt: null })
        .select('-_id id name type status')
        .lean();

      if (!channel) {
        throw new HttpException('Channel Not Found', HttpStatus.NOT_FOUND);
      }

      return {
        data: channel,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getChannels(query: GetListChannelDto, userId: string) {
    try {
      const filters: Record<string, any> = {
        user: userId,
        deletedAt: null,
      };

      if (query.keyword) {
        filters['$text'] = { $search: query.keyword };
      }

      const channels = await this.channelModel
        .find(filters)
        .select('-_id id name type status')
        .sort(query.sort)
        .skip(query.skip)
        .limit(query.limit)
        .lean();

      const totalRecord = await this.channelModel.countDocuments();

      const pageMeta = new PageMetaDto({
        totalRecord,
        pageOptionsDto: query,
      });
      const pageData = new PageDto(channels, pageMeta);

      return {
        data: pageData,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateChannel(
    id: string,
    userId: string,
    payload: UpdateChannelDto,
  ): Promise<ResponseType<UpdateChannelResponseDto>> {
    try {
      const result = await this.channelModel.updateOne(
        { _id: id, user: userId, deletedAt: null },
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
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteChannel(
    id: string,
    userId: string,
  ): Promise<ResponseType<DeleteChannelResponseDto>> {
    try {
      const result = await this.channelModel.updateOne(
        { _id: id, user: userId },
        {
          $set: {
            status: EChannelStatus.INACTIVE,
            deletedAt: new Date(),
          },
        },
      );

      return {
        statusCode: HttpStatus.NO_CONTENT,
        data: {
          id,
          deletedCount: result.modifiedCount,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

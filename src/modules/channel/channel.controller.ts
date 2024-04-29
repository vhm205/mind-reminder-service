import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { ChannelService } from './channel.service';
import { Channel } from '@schema';
import { ResponseType, CurrentUser, PageDto } from '@common';
import {
  CreateChannelDto,
  CreateChannelResponseDto,
  DeleteChannelResponseDto,
  GetChannelResponseDto,
  GetListChannelDto,
  UpdateChannelDto,
  UpdateChannelResponseDto,
} from './dtos';
import env from '@environments';

@Controller({
  path: 'channels',
  version: env.API_VERSION,
})
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Post('')
  @HttpCode(HttpStatus.CREATED)
  createChannel(
    @Body() body: CreateChannelDto,
    @CurrentUser('uid') userId: string,
  ): Promise<ResponseType<CreateChannelResponseDto>> {
    return this.channelService.createChannel(body, userId);
  }

  @Get('/:cid')
  @HttpCode(HttpStatus.OK)
  getChannel(
    @Param('cid') cid: string,
    @CurrentUser('uid') userId: string,
  ): Promise<ResponseType<GetChannelResponseDto>> {
    return this.channelService.getChannel(cid, userId);
  }

  @Get('')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: PageDto<Channel> })
  getChannels(
    @Query() query: GetListChannelDto,
    @CurrentUser('uid') userId: string,
  ): Promise<ResponseType<PageDto<Channel>>> {
    return this.channelService.getChannels(query, userId);
  }

  @Patch('/:cid')
  @HttpCode(HttpStatus.OK)
  updateChannel(
    @Param('cid') cid: string,
    @Body() body: UpdateChannelDto,
    @CurrentUser('uid') userId: string,
  ): Promise<ResponseType<UpdateChannelResponseDto>> {
    return this.channelService.updateChannel(cid, userId, body);
  }

  @Delete('/:cid')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteChannel(
    @Param('cid') cid: string,
    @CurrentUser('uid') userId: string,
  ): Promise<ResponseType<DeleteChannelResponseDto>> {
    return this.channelService.deleteChannel(cid, userId);
  }
}

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
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ResponseType, CurrentUser } from '@common';
import {
  CreateChannelDto,
  CreateChannelResponseDto,
  DeleteChannelResponseDto,
  GetChannelResponseDto,
  UpdateChannelDto,
  UpdateChannelResponseDto,
} from './dtos';

@Controller({
  path: 'channels',
  version: process.env.API_VERSION,
})
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Post('')
  createChannel(
    @Body() body: CreateChannelDto,
    @CurrentUser('uid') userId: string,
  ): Promise<ResponseType<CreateChannelResponseDto>> {
    return this.channelService.createChannel(body, userId);
  }

  @Get('/:cid')
  getChannel(
    @Param('cid') cid: string,
    @CurrentUser('uid') userId: string,
  ): Promise<ResponseType<GetChannelResponseDto>> {
    return this.channelService.getChannel(cid, userId);
  }

  @Patch('/:cid')
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

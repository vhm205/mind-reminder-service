import { PartialType } from '@nestjs/mapped-types';
import { CreateChannelDto } from './create-channel.dto';

export class UpdateChannelDto extends PartialType(CreateChannelDto) {}

export class UpdateChannelResponseDto {
  id: string;
  matchedCount: number;
  modifiedCount: number;
}

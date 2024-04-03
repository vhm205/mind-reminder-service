import { EChannelType, IConnection } from '@schema';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @MinLength(3)
  @MaxLength(256)
  name: string;

  @IsOptional()
  @IsString()
  @IsEnum(EChannelType)
  type: string;

  @IsObject()
  metadata: IConnection;
}

export class CreateChannelResponseDto {
  id: string;
}

import { PageOptionsDto } from '@common';
import { ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';
import { EChannelType, EChannelStatus } from '@schema';
import { IsOptional, IsString } from 'class-validator';

export class GetChannelResponseDto {
  @ApiResponseProperty()
  id: string;

  @ApiResponseProperty()
  name: string;

  @ApiResponseProperty()
  type: EChannelType;

  @ApiResponseProperty()
  status: EChannelStatus;
}

export class GetListChannelDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;
}

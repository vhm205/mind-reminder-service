import { ApiResponseProperty } from '@nestjs/swagger';
import { EChannelType, EChannelStatus } from '@schema';

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

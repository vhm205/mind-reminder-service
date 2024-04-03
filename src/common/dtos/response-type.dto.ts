import { Expose } from 'class-transformer';
import { ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';

export class ResponseType<T> {
  @Expose()
  @ApiResponseProperty({ example: 200 })
  statusCode?: number;

  @Expose()
  @ApiResponseProperty()
  message?: string;

  @Expose()
  @ApiResponseProperty()
  data?: T;

  @Expose()
  @ApiPropertyOptional()
  metadata?: any;
}

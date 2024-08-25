import { PageOptionsDto } from '@common';
import { IsOptional } from 'class-validator';

export class GetTopicsQueryDto extends PageOptionsDto {
  @IsOptional()
  keyword?: string;
}

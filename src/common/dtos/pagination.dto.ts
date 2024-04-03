import { ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * Page Options
 */
export class PageOptionsDto {
  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  sort = 'createdAt';

  @ApiPropertyOptional({ enum: SortDirection, default: SortDirection.DESC })
  @IsEnum(SortDirection)
  @IsOptional()
  sortDirection = SortDirection.DESC;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit = 10;

  get skip(): number {
    return ((this.page || 1) - 1) * (this.limit || 10);
  }
}

/**
 * Page Meta
 */

export interface PageMetaDtoParameters {
  pageOptionsDto: PageOptionsDto;
  totalRecord: number;
}

export class PageMetaDto {
  constructor({ pageOptionsDto, totalRecord }: PageMetaDtoParameters) {
    this.page = pageOptionsDto.page || 1;
    this.limit = pageOptionsDto.limit || 10;
    this.totalRecord = totalRecord;
    this.totalPage = Math.ceil(this.totalRecord / this.limit);
    this.hasPrevPage = this.page > 1;
    this.hasNextPage = this.page < this.totalPage;
  }

  @Type(() => Number)
  page: number;

  @Type(() => Number)
  limit: number;

  @Type(() => Number)
  totalRecord: number;

  @Type(() => Number)
  totalPage: number;

  @Type(() => Boolean)
  hasPrevPage: boolean;

  @Type(() => Boolean)
  hasNextPage: boolean;
}

/**
 * Pagination
 */
export class PageDto<T> {
  constructor(data: T[], meta: PageMetaDto) {
    this.data = data;
    this.meta = meta;
  }

  @ApiResponseProperty()
  data: T[];

  @ApiResponseProperty({ type: () => PageMetaDto })
  @Type(() => PageMetaDto)
  meta: PageMetaDto;
}

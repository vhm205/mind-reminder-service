import { IsOptional, IsString, IsUrl } from 'class-validator';

export class TelegramQueryDto {
  @IsString()
  uid: string;

  @IsString()
  id: string;

  @IsString()
  username: string;

  @IsString()
  @IsOptional()
  first_name: string;

  @IsString()
  @IsUrl()
  photo_url: string;
}

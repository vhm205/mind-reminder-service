import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';

class EmailAddress {
  @IsEmail()
  value: string;
}

export class GoogleProfile {
  id: string;
  displayName: string;
  provider: string;
  photos: Array<{ value: string }>;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  emails: Array<EmailAddress>;
}

export class GooglePayload {
  @IsString()
  accessToken: string;

  @IsObject()
  profile: GoogleProfile;
}

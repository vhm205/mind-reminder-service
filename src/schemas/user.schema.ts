import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as SchemaType } from 'mongoose';
import { Exclude } from 'class-transformer';
import { BaseSchema } from './base.schema';

export const USER_COLLECTION_NAME = 'users';

export enum EUserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface IUserAgent {
  os?: string;
  device?: string;
  browser?: string;
}

export class OAuthProfile {
  @Prop({ type: String, required: true })
  provider: string;

  @Prop({ type: String })
  accessToken: string;

  @Prop({ type: SchemaType.Types.Mixed })
  metadata: Record<string, any>;
}

@Schema({
  collection: USER_COLLECTION_NAME,
  timestamps: true,
  versionKey: false,
})
export class User extends BaseSchema {
  id: string;

  @Prop({ type: String, unique: true, required: true })
  username: string;

  @Prop({ type: String, unique: true, required: true })
  email: string;

  @Exclude()
  @Prop({ type: String, select: false, nullable: true })
  password: string;

  @Prop({ type: String, enum: EUserStatus, default: EUserStatus.INACTIVE })
  status: EUserStatus;

  @Prop({ type: String, nullable: true })
  avatar: string;

  @Prop({ type: Array, default: [] })
  oauthProfile: OAuthProfile[];

  @Prop({ type: Date, nullable: true })
  lastLogin: Date;

  @Prop({ type: SchemaType.Types.Mixed, nullable: true })
  userAgent: IUserAgent;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('id').get(function (this) {
  return this._id.toString();
});

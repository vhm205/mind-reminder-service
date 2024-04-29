import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Schema as SchemaType } from 'mongoose';
import { BaseSchema } from './base.schema';
import { User } from './user.schema';

export const CHANNEL_COLLECTION_NAME = 'channels';

export enum EChannelStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum EChannelType {
  TELEGRAM = 'telegram',
  SLACK = 'slack',
  DISCORD = 'discord',
  MESSENGER = 'messenger',
  EMAIL = 'email',
}

export interface IConnection {
  [key: string]: any;
}

@Schema({
  collection: CHANNEL_COLLECTION_NAME,
  timestamps: true,
  versionKey: false,
})
export class Channel extends BaseSchema {
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: EChannelType, required: true })
  type: EChannelType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: User | string;

  @Prop({ enum: EChannelStatus, default: EChannelStatus.ACTIVE })
  status: EChannelStatus;

  @Prop({ type: SchemaType.Types.Mixed })
  metadata: IConnection;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);

ChannelSchema.index({ '$**': 'text' });

ChannelSchema.virtual('id').get(function (this) {
  return this._id.toString();
});

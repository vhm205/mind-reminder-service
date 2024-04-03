import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { BaseSchema } from './base.schema';
import { Channel } from './channel.schema';
import { User } from './user.schema';

export const NOTE_COLLECTION_NAME = 'notes';

export enum ENoteStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Schema({
  collection: NOTE_COLLECTION_NAME,
  timestamps: true,
  versionKey: false,
})
export class Note extends BaseSchema {
  id: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String], default: ['Unknown'] })
  tags: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Channel.name })
  channel: Channel | string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: User | string;

  @Prop({ enum: ENoteStatus, default: ENoteStatus.ACTIVE })
  status: ENoteStatus;
}

export const NoteSchema = SchemaFactory.createForClass(Note);

NoteSchema.virtual('id').get(function (this) {
  return this._id.toString();
});

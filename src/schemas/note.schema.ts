import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { BaseSchema } from './base.schema';
import { Channel } from './channel.schema';
import { User } from './user.schema';
import { Topic } from './topic.schema';

export const NOTE_COLLECTION_NAME = 'notes';

export enum ENoteStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface NoteMetadata {
  page: {
    id: string;
    url: string;
    parent: {
      id: string;
      type: string;
    };
  };
}

@Schema({
  collection: NOTE_COLLECTION_NAME,
  versionKey: false,
})
export class Note extends BaseSchema {
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  blocks: string;

  @Prop({ required: true })
  markdown: string;

  @Prop({ type: [String], default: ['Unknown'] })
  tags: string[];

  @Prop({ type: Boolean, default: true })
  pushNotification: boolean;

  @Prop({ type: Number, default: 1 })
  repetitionNumber: number;

  @Prop({ type: Date })
  nextReviewTime: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Channel.name })
  channel: Channel | string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Topic.name })
  topic: Topic | string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: User | string;

  @Prop({ enum: ENoteStatus, default: ENoteStatus.ACTIVE })
  status: ENoteStatus;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  metadata: NoteMetadata;
}

export const NoteSchema = SchemaFactory.createForClass(Note);

NoteSchema.index({ '$**': 'text' });

NoteSchema.virtual('id').get(function (this) {
  return this._id.toString();
});

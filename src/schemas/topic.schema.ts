import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { BaseSchema } from './base.schema';
import { User } from './user.schema';

export const TOPIC_COLLECTION_NAME = 'topics';

export interface TopicMetadata {
  id: string;
  object: string;
  url: string;
}

@Schema({
  collection: TOPIC_COLLECTION_NAME,
  versionKey: false,
})
export class Topic extends BaseSchema {
  id: string;

  @Prop({ type: String })
  title: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: User | string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  metadata: TopicMetadata;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);

TopicSchema.index({ '$**': 'text' });

TopicSchema.virtual('id').get(function (this) {
  return this._id.toString();
});

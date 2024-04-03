import { Prop } from '@nestjs/mongoose';

export abstract class BaseSchema {
  @Prop({ type: Date, default: Date.now() })
  createdAt: Date;

  @Prop({ type: Date, default: null })
  updatedAt: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

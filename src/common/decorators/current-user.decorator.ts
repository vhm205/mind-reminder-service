import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import mongoose from 'mongoose';

export const CurrentUser = createParamDecorator<string>(
  (prop: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request['user'];

    if (!user) {
      const _id = new mongoose.Types.ObjectId();
      return { uid: _id };
    }

    return prop ? user[prop] : user;
  },
);

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Schema } from 'mongoose';

export const CurrentUser = createParamDecorator<string>(
  (prop: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request['user'];

    if (!user) {
      return { uid: Schema.ObjectId.toString() };
    }

    return prop ? user[prop] : user;
  },
);

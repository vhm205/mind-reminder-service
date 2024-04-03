import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { ioRedisStore } from '@tirke/node-cache-manager-ioredis';

import { HttpExceptionFilter } from './common/filters';
import { LoggerMiddleware } from './common/middlewares';
import { ValidationPipe } from './common/pipes';
import { MongooseConfigService } from './configs/mongo.config';

import { HealthModule, NoteModule, ChannelModule } from '@modules';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),
    CacheModule.register({
      store: ioRedisStore,
      url: process.env.REDIS_URL,
      isGlobal: true,
    }),
    HealthModule,
    NoteModule,
    ChannelModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class MainModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

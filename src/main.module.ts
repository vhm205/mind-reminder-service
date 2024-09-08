import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { ioRedisStore } from '@tirke/node-cache-manager-ioredis';
import { AgendaModule } from 'agenda-nest';
import env from '@environments';

import { HttpExceptionFilter } from './common/filters';
import { LoggerMiddleware } from './common/middlewares';
import { ValidationPipe } from './common/pipes';
import { JWTAuthGuard } from './common/guards';
import { MongooseConfigService } from './configs/mongo.config';

import {
  HealthModule,
  AuthModule,
  NoteModule,
  ChannelModule,
  TopicModule,
} from '@modules';

@Module({
  imports: [
    CacheModule.register({
      store: ioRedisStore,
      url: process.env.REDIS_URL,
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),
    AgendaModule.forRootAsync({
      useFactory: () => ({
        db: {
          address: env.MONGODB_URI!,
        },
        defaultLockLimit: 1,
        defaultLockLifetime: 10000,
        catch(onrejected) {
          console.error({ onrejected });
        },
      }),
    }),
    EventEmitterModule.forRoot(),
    HealthModule,
    AuthModule,
    NoteModule,
    ChannelModule,
    TopicModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JWTAuthGuard,
    },
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

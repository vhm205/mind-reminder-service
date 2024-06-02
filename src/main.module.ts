import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
// import { CacheModule } from '@nestjs/cache-manager';
// import { ioRedisStore } from '@tirke/node-cache-manager-ioredis';
import { AgendaModule } from 'agenda-nest';
import env from '@environments';

import { HttpExceptionFilter } from './common/filters';
import { LoggerMiddleware } from './common/middlewares';
import { ValidationPipe } from './common/pipes';
import { JWTAuthGuard } from './common/guards';
import { MongooseConfigService } from './configs/mongo.config';

import { HealthModule, AuthModule, NoteModule, ChannelModule } from '@modules';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),
    // CacheModule.register({
    //   store: ioRedisStore,
    //   url: process.env.REDIS_URL,
    //   isGlobal: true,
    // }),
    AgendaModule.forRoot({
      db: {
        address: env.MONGODB_URI!,
      },
    }),
    HealthModule,
    AuthModule,
    NoteModule,
    ChannelModule,
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

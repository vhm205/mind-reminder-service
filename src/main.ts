import { NestFactory } from '@nestjs/core';
import {
  Logger,
  RequestMethod,
  VersioningType,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { MainModule } from './main.module';
import env from '@environments';

async function bootstrap() {
  const app = await NestFactory.create(MainModule);

  app.use(cookieParser([env.AUTH_SECRET, env.ACCESS_TOKEN_SECRET]));

  app.enableCors({
    origin: env.CORS_ORIGINS?.split('|'),
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  });

  app.setGlobalPrefix('api', {
    exclude: [
      {
        path: 'health/(.*)',
        method: RequestMethod.GET,
      },
      {
        path: 'auth/(.*)',
        method: RequestMethod.ALL,
      },
    ],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: VERSION_NEUTRAL,
  });

  await app.listen(env.PORT);

  Logger.log(`🚀  Server is listening on port ${env.PORT}`, 'Bootstrap');
}

bootstrap();

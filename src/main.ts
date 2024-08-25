import { NestFactory } from '@nestjs/core';
import {
  Logger,
  RequestMethod,
  VersioningType,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { MainModule } from './main.module';
import { setupSwagger } from './configs/swagger.config';
import env from '@environments';

async function bootstrap() {
  try {
    const app = await NestFactory.create(MainModule);

    app.use(cookieParser([env.AUTH_SECRET, env.ACCESS_TOKEN_SECRET]));

    app.enableCors({
      origin: env.CORS_ORIGINS?.split('|'),
      credentials: true,
      methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
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

    setupSwagger(app);

    await app.listen(+env.PORT);

    Logger.log(`🚀  Server is listening on port ${env.PORT}`, 'Bootstrap');
  } catch (error: any) {
    console.error({ error });
  }
}

bootstrap();

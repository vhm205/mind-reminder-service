import env from '@environments';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger();

  use(req: Request, _res: Response, next: NextFunction): void {
    if (env.REQ_LOGGING) {
      this.logger.log(
        `💬 ${req.httpVersion} ${req.method} ${req.originalUrl} ${
          req.headers['user-agent'] || req.headers
        })`,
      );
    }
    next();
  }
}

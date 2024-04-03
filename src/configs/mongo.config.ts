import { Injectable } from '@nestjs/common';
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';

@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
  createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: process.env.MONGODB_URI as string,
      dbName: process.env.MONGO_DB as string,
      maxConnecting: 10,
      maxPoolSize: 10,
      connectTimeoutMS: 5000,
    };
  }
}

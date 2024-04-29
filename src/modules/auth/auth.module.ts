import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { User, UserSchema } from '@schema';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies';
import { ChannelModule } from '../channel/channel.module';
import { TelegramModule } from '../telegram/telegram.module';
import env from '@environments';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({
      global: true,
      secret: env.ACCESS_TOKEN_SECRET,
      signOptions: {
        expiresIn: +env.ACCESS_TOKEN_EXPIRES_IN,
      },
    }),
    ChannelModule,
    TelegramModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy],
})
export class AuthModule {}

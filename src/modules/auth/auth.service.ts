import { AuthPayload, LoginInfoPayload, TokenResponse } from '@common';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UAParser } from 'ua-parser-js';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { isProd, momentTZ } from '@helpers';

import env from '@environments';
import {
  EChannelType,
  EUserStatus,
  IUserAgent,
  OAuthProfile,
  User,
} from '@schema';
import { GooglePayload, TelegramQueryDto } from './dtos';
import { ChannelService } from '../channel/channel.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
    private channelService: ChannelService,
    private telegramService: TelegramService,
  ) {}

  async validateGoogle(payload: GooglePayload): Promise<AuthPayload> {
    const { accessToken, profile } = payload;
    const { id: googleId, displayName, emails, photos, provider } = profile;

    const email = emails[0].value;
    const avatar = photos.length ? photos[0].value : '';
    const newOAuthProfile: OAuthProfile = {
      provider,
      accessToken,
      metadata: { id: googleId },
    };

    /**
     * Return user if exists
     */
    const user = await this.userModel
      .findOne({
        $or: [{ email }, { username: displayName }],
      })
      .lean();

    if (user) {
      const oauthProfile = user.oauthProfile.find((profile) => {
        return profile.provider === provider;
      });

      if (!oauthProfile) {
        await this.userModel.findByIdAndUpdate(user._id, {
          $push: {
            oauthProfile: newOAuthProfile,
          },
        });
      }

      return {
        uid: user._id.toString(),
      };
    }

    /**
     * Create new user & oauth profile
     */
    const newUser = await this.userModel.create({
      username: displayName,
      email,
      avatar,
      status: EUserStatus.ACTIVE,
      lastLogin: momentTZ().toDate(),
      oauthProfile: [newOAuthProfile],
    });

    return { uid: newUser.id };
  }

  async login(payload: AuthPayload, headers: any): Promise<TokenResponse> {
    try {
      const user = await this.userModel
        .findById(payload.uid)
        .select('_id')
        .lean();

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const userAgentHeader = headers['user-agent'];
      const uaParser = new UAParser(userAgentHeader);
      const { getOS, getDevice, getBrowser } = uaParser;

      const userAgent: IUserAgent = userAgentHeader
        ? {
            os: getOS().name,
            device: getDevice().model,
            browser: getBrowser().name,
          }
        : {};

      const { accessToken } = this.generateToken(payload);

      // Update user last login
      await this.setInfoLogin({
        id: payload.uid,
        lastLogin: momentTZ().toDate(),
        userAgent,
      });

      return { accessToken };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async logout(res: Response): Promise<void> {
    this.clearTokenCookies(res);
  }

  async setInfoLogin(payload: LoginInfoPayload): Promise<void> {
    const { id, ...info } = payload;
    await this.userModel.findByIdAndUpdate(id, info);
  }

  generateToken(payload: AuthPayload): TokenResponse {
    const accessToken = this.jwtService.sign(payload, {
      secret: env.AUTH_SECRET,
    });
    return { accessToken };
  }

  setAuthCookies(res: Response, accessToken: string): void {
    res.cookie(env.COOKIE_TOKEN_NAME, accessToken, {
      httpOnly: true,
      secure: isProd(),
      signed: true,
      maxAge: +env.ACCESS_TOKEN_EXPIRES_IN * 1000,
      sameSite: isProd() ? 'lax' : 'strict',
    });
    res.cookie('isAuthenticated', true, {
      httpOnly: false,
      secure: false,
      maxAge: +env.ACCESS_TOKEN_EXPIRES_IN * 1000,
      sameSite: isProd() ? 'lax' : 'strict',
    });
  }

  clearTokenCookies(res: Response): void {
    res.clearCookie(env.COOKIE_TOKEN_NAME, {
      httpOnly: true,
      secure: isProd(),
      signed: true,
      sameSite: isProd() ? 'lax' : 'strict',
    });
    res.clearCookie('isAuthenticated', {
      httpOnly: false,
      secure: false,
      sameSite: isProd() ? 'lax' : 'strict',
    });
  }

  async validateTelegram(query: TelegramQueryDto): Promise<boolean> {
    try {
      // TODO: https://gist.github.com/anonymous/6516521b1fb3b464534fbc30ea3573c2#file-login_example-php-L36

      this.telegramService.sendMessage(
        query.id,
        `Hi ${query.username}, I'm a bot, and I will remind you of your notes.`,
      );

      await this.channelService.createChannel(
        {
          type: EChannelType.TELEGRAM,
          name: `telegram-${query.username}`,
          metadata: {
            id: query.id,
            username: query.username,
            photo_url: query.photo_url,
          },
        },
        query.uid,
      );

      return true;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

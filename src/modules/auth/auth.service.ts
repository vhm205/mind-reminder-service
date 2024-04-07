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
import { EUserStatus, IUserAgent, OAuthProfile, User } from '@schema';
import { GooglePayload } from './dtos';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
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
        throw new BadRequestException('User is not found');
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
  }

  clearTokenCookies(res: Response): void {
    res.clearCookie(env.COOKIE_TOKEN_NAME, {
      httpOnly: true,
      secure: isProd(),
      signed: true,
      sameSite: isProd() ? 'lax' : 'strict',
    });
  }
}

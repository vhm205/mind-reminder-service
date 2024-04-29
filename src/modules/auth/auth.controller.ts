import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import {
  AuthRequestPayload,
  CurrentUser,
  GoogleOAuthGuard,
  Public,
} from '@common';
import env from '@environments';
import { TelegramQueryDto } from './dtos';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('check')
  @HttpCode(HttpStatus.OK)
  checkAuth() {}

  @Get('google')
  @Public()
  @UseGuards(GoogleOAuthGuard)
  google(): void {}

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleOAuthGuard)
  async googleCallback(
    @Req() { user, headers }: AuthRequestPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken } = await this.authService.login(user, headers);
    this.authService.setAuthCookies(res, accessToken);
    res.redirect(`${env.CLIENT_URL}/notes?redirected=true&uid=${user.uid}`);
  }

  @Get('telegram')
  @Public()
  async telegramCallback(
    @Query() query: TelegramQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.validateTelegram(query);
    res.redirect(`${env.CLIENT_URL}/channels`);
  }

  @Get('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }
}

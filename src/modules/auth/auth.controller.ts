import { AuthRequestPayload, GoogleOAuthGuard, Public } from '@common';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import env from '@environments';

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
    res.redirect(`${env.CLIENT_URL}/notes`);
  }
}

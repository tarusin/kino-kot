import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import express from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

const isProduction = process.env.NODE_ENV === 'production';

function setTokenCookies(
  res: express.Response,
  accessToken: string,
  refreshToken: string,
) {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(token, password);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(dto);
    setTokenCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post('refresh')
  async refresh(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const token = req.cookies?.refresh_token;
    const { accessToken, refreshToken } =
      await this.authService.refreshTokens(token);
    setTokenCookies(res, accessToken, refreshToken);
    return { success: true };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: express.Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
    return { success: true };
  }

  @Get('me')
  async me(@Req() req: express.Request) {
    const token = req.cookies?.access_token;
    if (!token) {
      return { user: null };
    }

    try {
      const payload = this.authService.verifyToken(token);
      const user = await this.authService.validateUser(payload.sub);
      return { user };
    } catch {
      return { user: null };
    }
  }
}

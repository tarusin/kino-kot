import {
  Controller,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import express from 'express';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(req.user.id, dto);

    return {
      user: {
        id: user!._id.toString(),
        name: user!.name,
        email: user!.email,
      },
    };
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    await this.usersService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );

    return { message: 'Пароль успешно изменён' };
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(
    @Req() req: any,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    await this.usersService.deleteAccount(req.user.id);

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });

    return { message: 'Аккаунт удалён' };
  }
}

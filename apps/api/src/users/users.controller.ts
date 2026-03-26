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

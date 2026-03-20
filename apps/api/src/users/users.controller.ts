import {
  Controller,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
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
}
